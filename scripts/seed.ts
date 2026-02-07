import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load deployment artifacts from JSON file
const deploymentArtifacts = JSON.parse(
  readFileSync(join(__dirname, '../deployments/RumbleCourt.json'), 'utf8')
)

async function main(): Promise<void> {
  console.log('RumbleCourt - Seeding Script')
  console.log('=============================')

  const [deployer] = await hre.ethers.getSigners()
  console.log(`Deploying with account: ${deployer.address}`)
  console.log(
    `Account balance: ${await hre.ethers.provider.getBalance(
      deployer.address,
    )}`,
  )
  console.log('')

  // Get the deployed contract
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'local'
  const deploymentKey = environment === 'local' ? 'local' : 'production'

  // Type-safe access to deployment artifacts
  const deployment =
    deploymentArtifacts[deploymentKey as keyof typeof deploymentArtifacts]
  const contractAddress = deployment?.contractAddress
  if (!contractAddress) {
    console.error('❌ CONTRACT_ADDRESS environment variable is required')
    console.error('Set it to the deployed RumbleCourt contract address')
    process.exit(1)
  }

  const RumbleCourt = await hre.ethers.getContractAt(
    'RumbleCourt',
    contractAddress,
  )
  console.log(`Connected to RumbleCourt at: ${contractAddress}`)
  console.log('')

  // Sample cases to seed
  const cases = [
    {
      title: 'Breach of Contract - Software Development',
      evidence:
        'QmEvidenceHash1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      description: 'Developer failed to deliver software as per contract terms',
    },
    {
      title: 'Intellectual Property Infringement',
      evidence:
        'QmEvidenceHashabcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
      description:
        'Unauthorized use of copyrighted material in commercial product',
    },
    {
      title: 'Employment Dispute - Wrongful Termination',
      evidence:
        'QmEvidenceHash9876543210abcdef9876543210abcdef9876543210abcdef9876543210',
      description: 'Employee terminated without proper notice or cause',
    },
    {
      title: 'Real Estate - Property Damage',
      evidence:
        'QmEvidenceHashfedcba09876543210fedcba09876543210fedcba09876543210fedcba09876',
      description: 'Property owner claims damages from tenant negligence',
    },
  ]

  console.log('Seeding cases...')
  console.log('================')

  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i]
    console.log(`\n${i + 1}. Filing case: ${caseData.title}`)

    try {
      const tx = await RumbleCourt.fileCase(caseData.title, caseData.evidence)
      await tx.wait()
      const caseId = i + 1 // Use sequential numbering for simplicity

      console.log(`   ✅ Case ${caseId} filed successfully`)
      console.log(`   📋 Evidence hash: ${caseData.evidence}`)

      // Start trial
      console.log(`   ⚖️  Starting trial...`)
      const startTx = await RumbleCourt.startTrial(caseId)
      await startTx.wait()
      console.log(`   ✅ Trial started`)

      // Record verdict
      const verdictTypes = [
        {
          type: 0,
          name: 'GUILTY',
          reason: 'Evidence strongly supports plaintiff claim',
        },
        {
          type: 1,
          name: 'NOT_GUILTY',
          reason: 'Insufficient evidence to prove claim',
        },
        {
          type: 2,
          name: 'SETTLEMENT',
          reason: 'Parties reached out-of-court settlement',
        },
        {
          type: 3,
          name: 'DISMISSED',
          reason: 'Case dismissed due to procedural issues',
        },
      ]

      const verdict = verdictTypes[i % verdictTypes.length]
      console.log(`   🏛️  Recording verdict: ${verdict.name}`)

      const verdictTx = await RumbleCourt.recordVerdict(
        caseId,
        verdict.type,
        `AI Judge Verdict: ${
          verdict.reason
        }. The court finds that based on the presented evidence and legal arguments, ${verdict.reason.toLowerCase()}. This decision is final and binding.`,
        true,
      )
      await verdictTx.wait()
      console.log(`   ✅ Verdict recorded successfully`)
    } catch (error) {
      console.error(`   ❌ Error processing case:`, error)
    }
  }

  console.log('\n🎉 Seeding completed!')
  console.log('\nNext Steps:')
  console.log('1. Verify cases on your frontend')
  console.log('2. Test the courtroom simulation with these cases')
  console.log('3. Run tests: npx hardhat test')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed!')
    console.error(error)
    process.exit(1)
  })
