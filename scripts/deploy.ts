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

type ContractAddresses = {
  VerdictStorage: string
  AdjournmentTracking: string
  CourtroomParticipants: string
}

type NetworkDeployment = {
  network: string
  updatedAt: string
  deployer: string
  contracts: ContractAddresses
}

type DeploymentsFile = Record<string, NetworkDeployment>

/* -------------------------------------------------------------------------- */
/*                              Config / Paths                                */
/* -------------------------------------------------------------------------- */

const DEPLOYMENTS_PATH = path.join(
  __dirname,
  '..',
  'artifacts',
  'contracts.json'
)

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  console.log('Courtroom System - Deploying Contracts')
  console.log('======================================')

  const network = hre.network.name

  const [deployer] = await hre.ethers.getSigners()
  console.log(`Network: ${network}`)
  console.log(`Deploying with account: ${deployer.address}`)

  /* ------------------------------- Deployments ------------------------------ */

  const VerdictStorage = await hre.ethers.getContractFactory('VerdictStorage')
  const verdictStorage = await VerdictStorage.deploy()
  await verdictStorage.waitForDeployment()

  const AdjournmentTracking = await hre.ethers.getContractFactory(
    'AdjournmentTracking'
  )
  const adjournmentTracking = await AdjournmentTracking.deploy()
  await adjournmentTracking.waitForDeployment()

  const CourtroomParticipants = await hre.ethers.getContractFactory(
    'CourtroomParticipants'
  )
  const courtroomParticipants = await CourtroomParticipants.deploy()
  await courtroomParticipants.waitForDeployment()

  /* ----------------------------- Post-Deploy Setup ---------------------------- */

  await verdictStorage.addAuthorizedJudge(deployer.address)
  await adjournmentTracking.addAuthorizedJudge(deployer.address)

  /* --------------------------- Load Existing JSON ---------------------------- */

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

  /* ----------------------------- Save Deployment ----------------------------- */

  deployments['contract'] = {
    network,
    updatedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      VerdictStorage: await verdictStorage.getAddress(),
      AdjournmentTracking: await adjournmentTracking.getAddress(),
      CourtroomParticipants: await courtroomParticipants.getAddress(),
    },
  }

  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2))

  /* --------------------------------- Summary -------------------------------- */

  console.log('\nDeployment Summary')
  console.log('==================')
  console.log(deployments['contract'].contracts)
  console.log(`\nSaved to ${DEPLOYMENTS_PATH}`)

  console.log('\nNext steps:')
  console.log('1. Update frontend to read deployments/contracts.json')
  console.log('2. Run tests: npx hardhat test')
  console.log('3. Verify contracts if deploying to public networks')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
