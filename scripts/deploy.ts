import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

/* -------------------------------------------------------------------------- */
/*                               ESM Utilities                                */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type DeploymentInfo = {
  network: string
  deployedAt: string
  deployer: string
  contractAddress: string
  transactionHash: string
}

type DeploymentsFile = {
  [network: string]: DeploymentInfo
}

/* -------------------------------------------------------------------------- */
/*                              Config / Paths                                */
/* -------------------------------------------------------------------------- */

const DEPLOYMENTS_PATH = path.join(
  __dirname,
  '..',
  'deployments',
  'RumbleCourt.json'
)

const ENVIRONMENT = process.env.ENVIRONMENT || 'local'

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  console.log('RumbleCourt - Deployment Script')
  console.log('================================')

  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()

  console.log(`Network: ${network}`)
  console.log(`Deploying with account: ${deployer.address}`)
  console.log(`Account balance: ${await hre.ethers.provider.getBalance(deployer.address)}`)
  console.log('')

  /* ------------------------------- Deploy Contract ------------------------------ */

  console.log('Deploying RumbleCourt contract...')
  const RumbleCourtFactory = await hre.ethers.getContractFactory('RumbleCourt')
  const rumbleCourt = await RumbleCourtFactory.deploy()
  await rumbleCourt.waitForDeployment()

  const contractAddress = await rumbleCourt.getAddress()
  const deploymentTx = rumbleCourt.deploymentTransaction()

  console.log('✅ RumbleCourt deployed successfully!')
  console.log(`Contract address: ${contractAddress}`)
  console.log(`Transaction hash: ${deploymentTx?.hash}`)
  console.log('')

  /* ----------------------------- Save Deployment ----------------------------- */

  const deploymentsDir = path.dirname(DEPLOYMENTS_PATH)
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  let deployments: DeploymentsFile = {}
  if (fs.existsSync(DEPLOYMENTS_PATH)) {
    deployments = JSON.parse(
      fs.readFileSync(DEPLOYMENTS_PATH, 'utf-8')
    ) as DeploymentsFile
  }

  // Determine deployment key based on environment
  const deploymentKey = ENVIRONMENT === 'local' ? 'local' : 'production'
  
  deployments[deploymentKey] = {
    network,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contractAddress,
    transactionHash: deploymentTx?.hash || 'unknown',
  }

  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2))
  console.log(`Deployment info saved to: ${DEPLOYMENTS_PATH}`)
  console.log('')

  /* --------------------------------- Summary -------------------------------- */

  console.log('Deployment Summary')
  console.log('==================')
  console.log('Network:', network)
  console.log('Contract:', contractAddress)
  console.log('Owner:', deployer.address)
  console.log('')

  console.log('Next Steps:')
  console.log('1. Update your frontend with the contract address')
  console.log('2. Run tests: npx hardhat test')
  console.log('3. Verify contract (for public networks):')
  console.log(`   npx hardhat verify --network ${network} ${contractAddress}`)
  console.log('')

  if (network !== 'hardhat' && network !== 'localhost') {
    console.log('⚠️  IMPORTANT: Save the contract address for your frontend!')
    console.log(`Contract Address: ${contractAddress}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed!')
    console.error(error)
    process.exit(1)
  })