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
  blockNumber?: number
  gasUsed?: string
}

type DeploymentsFile = {
  contract: DeploymentInfo
}

/* -------------------------------------------------------------------------- */
/*                              Config / Paths                                */
/* -------------------------------------------------------------------------- */

const DEPLOYMENTS_PATH = path.join(
  __dirname,
  '..',
  'artifacts',
  'RumbleCourt.json',
)

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  console.log('🚀 RumbleCourt - Enhanced Deployment Script')
  console.log('============================================\n')

  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  const balance = await hre.ethers.provider.getBalance(deployer.address)

  console.log('📋 Deployment Configuration:')
  console.log(`   Network: ${network}`)
  console.log(`   Deployer: ${deployer.address}`)
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`)
  console.log('')

  /* ------------------------------- Deploy Contract ------------------------------ */

  console.log('⚙️  Deploying RumbleCourt contract...')
  const RumbleCourtFactory = await hre.ethers.getContractFactory('RumbleCourt')
  const rumbleCourt = await RumbleCourtFactory.deploy()
  await rumbleCourt.waitForDeployment()

  const contractAddress = await rumbleCourt.getAddress()
  const deploymentTx = rumbleCourt.deploymentTransaction()

  if (!deploymentTx) {
    throw new Error('❌ No deployment transaction found')
  }

  const receipt = await deploymentTx.wait()

  if (!receipt) {
    throw new Error('❌ Transaction receipt not available')
  }

  console.log('✅ RumbleCourt deployed successfully!\n')

  console.log('📦 Deployment Details:')
  console.log(`   Contract Address: ${contractAddress}`)
  console.log(`   Transaction Hash: ${deploymentTx.hash}`)
  console.log(`   Block Number: ${receipt.blockNumber}`)
  console.log(`   Gas Used: ${receipt.gasUsed.toString()}`)
  console.log('')

  /* ----------------------------- Verify Deployment ---------------------------- */

  console.log('🔍 Verifying contract deployment...')

  // Check contract code exists
  const code = await hre.ethers.provider.getCode(contractAddress)
  if (code === '0x' || code === '0x0') {
    throw new Error('❌ Contract deployment failed - no code at address!')
  }
  console.log('✅ Contract code verified at address')

  // Test contract interaction
  const owner = await rumbleCourt.owner()
  const totalCases = await rumbleCourt.getTotalCases()

  console.log('✅ Contract is responsive')
  console.log(`   Owner: ${owner}`)
  console.log(`   Total Cases: ${totalCases.toString()}`)
  console.log('')

  /* ----------------------------- Save Deployment ----------------------------- */

  const deploymentsDir = path.dirname(DEPLOYMENTS_PATH)
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  const deploymentInfo: DeploymentsFile = {
    contract: {
      network,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contractAddress,
      transactionHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    },
  }

  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deploymentInfo, null, 2))
  console.log('💾 Deployment info saved to:')
  console.log(`   ${DEPLOYMENTS_PATH}`)
  console.log('')

  // Also save to src/artifacts if it exists (for frontend)
  const srcArtifactsDir = path.join(__dirname, '..', '..', 'src', 'artifacts')
  if (fs.existsSync(path.join(__dirname, '..', '..', 'src'))) {
    if (!fs.existsSync(srcArtifactsDir)) {
      fs.mkdirSync(srcArtifactsDir, { recursive: true })
    }
    const srcDeploymentPath = path.join(srcArtifactsDir, 'RumbleCourt.json')
    fs.writeFileSync(srcDeploymentPath, JSON.stringify(deploymentInfo, null, 2))
    console.log('💾 Also saved to frontend:')
    console.log(`   ${srcDeploymentPath}`)
    console.log('')
  }

  /* --------------------------------- Summary -------------------------------- */

  console.log('✨ Deployment Complete!\n')
  console.log('📋 Summary:')
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Network:          ${network}`)
  console.log(`   Contract:         ${contractAddress}`)
  console.log(`   Owner:            ${deployer.address}`)
  console.log(`   Transaction:      ${deploymentTx.hash}`)
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  console.log('🎯 Next Steps:')
  console.log('   1. ✅ Contract deployed and verified')
  console.log('   2. 🌐 Ensure your .env has:')
  console.log('      NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545')
  console.log('   3. 🦊 Connect MetaMask to localhost:8545')
  console.log('   4. 🔑 Import the first Hardhat account:')
  console.log(
    '      Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )
  console.log('   5. 🚀 Start your app and file a case!')
  console.log('')

  if (network === 'localhost' || network === 'hardhat') {
    console.log('⚠️  IMPORTANT FOR LOCAL DEVELOPMENT:')
    console.log('   • Hardhat node resets when restarted')
    console.log('   • You must REDEPLOY after every "npx hardhat node" restart')
    console.log(
      '   • Run: npx hardhat run scripts/deploy.ts --network localhost',
    )
    console.log('')
  }

  if (network !== 'hardhat' && network !== 'localhost') {
    console.log('📝 For public networks, verify contract:')
    console.log(`   npx hardhat verify --network ${network} ${contractAddress}`)
    console.log('')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed!')
    console.error(error)
    process.exit(1)
  })
