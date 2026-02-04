// Courtroom Simulation Script
// This script demonstrates how courtroom records will be documented on-chain
// It simulates the complete workflow that the frontend will use during integration

import hre from 'hardhat'
import chalk from 'chalk'

async function main(): Promise<void> {
  console.log(chalk.bgBlue.white.bold('🏛️  COURTROOM BLOCKCHAIN SIMULATION'))
  console.log(chalk.blue('==========================================='))
  console.log('Simulating how courtroom records are documented on-chain')
  console.log('This demonstrates the frontend integration workflow')
  console.log('')

  // Get test accounts
  const [owner, plaintiff1, plaintiff2, plaintiff3] =
    await hre.ethers.getSigners()

  console.log(chalk.yellow('👥  Participants:'))
  console.log(`- Court System (Owner): ${owner.address}`)
  console.log(`- Plaintiff 1: ${plaintiff1.address}`)
  console.log(`- Plaintiff 2: ${plaintiff2.address}`)
  console.log(`- Plaintiff 3: ${plaintiff3.address}`)
  console.log('')

  // Deploy RumbleCourt contract
  console.log(chalk.cyan('🏗️  Deploying RumbleCourt contract...'))
  const RumbleCourtFactory = await hre.ethers.getContractFactory('RumbleCourt')
  const rumbleCourt = await RumbleCourtFactory.deploy()
  await rumbleCourt.waitForDeployment()

  const contractAddress = await rumbleCourt.getAddress()
  console.log(`✅ RumbleCourt deployed to: ${contractAddress}`)
  console.log('')

  // =============================================
  // CASE 1: Employment Dispute - Civil Case
  // =============================================
  console.log(chalk.bgMagenta.white.bold('📜  CASE 1: Employment Dispute'))
  console.log(chalk.magenta('===================================='))

  console.log(chalk.yellow('📝  Plaintiff 1 files case...'))
  const case1Tx = await rumbleCourt.connect(plaintiff1).fileCase(
    'Wrongful Termination - Tech Corp',
    'QmEmploymentEvidence123', // IPFS hash
  )
  await case1Tx.wait()
  console.log('✅ Case filed successfully')

  const case1 = await rumbleCourt.getCase(1)
  console.log(chalk.green('📋  Case Details:'))
  console.log(`- Case ID: ${case1.caseId}`)
  console.log(`- Title: ${case1.caseTitle}`)
  console.log(`- Plaintiff: ${case1.plaintiff}`)
  console.log(`- Evidence Hash: ${case1.evidenceHash}`)
  console.log(`- Status: ${getCaseStatusName(Number(case1.status))}`)
  console.log(
    `- Filed At: ${new Date(Number(case1.filedAt) * 1000).toLocaleString()}`,
  )
  console.log('')

  // Start trial
  console.log(chalk.cyan('⚖️  Case creator or court system starting trial...'))
  const startTrial1Tx = await rumbleCourt.connect(plaintiff1).startTrial(1) // Case creator starts their own trial
  await startTrial1Tx.wait()
  console.log('✅ Trial started - AI lawyers are now debating!')
  console.log('   (Prosecution AI vs Defense AI - Live debate simulation)')
  console.log('')

  // Simulate AI deliberation time
  console.log(chalk.yellow('🤖  AI Judge analyzing arguments...'))
  console.log(
    '   - Prosecution AI: "Evidence shows clear violation of employment contract"',
  )
  console.log(
    '   - Defense AI: "Termination was justified based on performance metrics"',
  )
  console.log('   - Judge AI: "Evaluating credibility and legal precedents..."')
  console.log('')

  // Record verdict
  console.log(chalk.cyan('⚖️  Recording AI Judge verdict (by case creator)...'))
  const verdict1Tx = await rumbleCourt.connect(plaintiff1).recordVerdict(
    // Case creator records verdict for their own case
    1,
    0, // GUILTY (in favor of plaintiff)
    'Based on the preponderance of evidence, the termination violated employment contract terms. The defendant failed to follow proper termination procedures as outlined in the employment agreement. Plaintiff is entitled to compensation.',
    true, // Final verdict
  )
  await verdict1Tx.wait()
  console.log('✅ Verdict recorded on-chain')

  const verdict1 = await rumbleCourt.getVerdict(1)
  console.log(chalk.green('📋  Verdict Details:'))
  console.log(`- Case ID: ${verdict1.caseId}`)
  console.log(
    `- Verdict Type: ${getVerdictTypeName(Number(verdict1.verdictType))}`,
  )
  console.log(`- Reasoning: ${verdict1.reasoning}`)
  console.log(`- Final: ${verdict1.isFinal ? 'Yes ✅' : 'No ⏳'}`)
  console.log(
    `- Timestamp: ${new Date(
      Number(verdict1.timestamp) * 1000,
    ).toLocaleString()}`,
  )
  console.log('')

  // =============================================
  // CASE 2: Contract Breach - Commercial Dispute
  // =============================================
  console.log(chalk.bgCyan.white.bold('📜  CASE 2: Contract Breach'))
  console.log(chalk.cyan('==============================='))

  console.log(chalk.yellow('📝  Plaintiff 2 files case...'))
  const case2Tx = await rumbleCourt
    .connect(plaintiff2)
    .fileCase(
      'Breach of Service Agreement - Vendor Dispute',
      'QmContractEvidence456',
    )
  await case2Tx.wait()
  console.log('✅ Case filed')

  console.log(chalk.cyan('⚖️  Starting trial (by case creator)...'))
  await rumbleCourt.connect(plaintiff2).startTrial(2) // Case creator starts their own trial
  console.log('✅ Trial in progress')
  console.log('')

  // Record preliminary verdict (not final)
  console.log(
    chalk.cyan('⚖️  Recording preliminary verdict (by case creator)...'),
  )
  const verdict2Tx = await rumbleCourt.connect(plaintiff2).recordVerdict(
    // Case creator records verdict
    2,
    2, // SETTLEMENT
    'Parties have reached a mutual settlement agreement. Terms confidential per settlement agreement. Case resolved amicably without full trial.',
    false, // Not final yet - awaiting final paperwork
  )
  await verdict2Tx.wait()
  console.log('✅ Preliminary verdict recorded (awaiting finalization)')
  console.log('')

  // =============================================
  // CASE 3: Intellectual Property Dispute
  // =============================================
  console.log(chalk.bgYellow.black.bold('📜  CASE 3: IP Infringement'))
  console.log(chalk.yellow('================================'))

  const case3Tx = await rumbleCourt
    .connect(plaintiff3)
    .fileCase('Patent Infringement - Software Technology', 'QmIPEvidence789')
  await case3Tx.wait()
  console.log('✅ Case filed')

  await rumbleCourt.connect(owner).startTrial(3) // Owner starts this one to show both options work
  console.log('✅ Trial started')

  const verdict3Tx = await rumbleCourt.connect(plaintiff3).recordVerdict(
    // Case creator records their own verdict
    3,
    1, // NOT_GUILTY (defendant wins)
    "The accused technology does not infringe on the plaintiff's patents. Analysis shows substantial differences in implementation and methodology. Defendant's innovation falls outside the scope of plaintiff's patent claims.",
    true, // Final
  )
  await verdict3Tx.wait()
  console.log('✅ Verdict: NOT GUILTY - Defendant prevails')
  console.log('')

  // =============================================
  // APPEAL PROCESS
  // =============================================
  console.log(chalk.bgRed.white.bold('⚖️  APPEAL PROCESS'))
  console.log(chalk.red('===================='))

  console.log(chalk.yellow('📋  Plaintiff 3 filing appeal...'))
  console.log('   Grounds: "Errors in patent claim interpretation"')

  const appealTx = await rumbleCourt.connect(plaintiff3).appealCase(3)
  await appealTx.wait()
  console.log('✅ Appeal filed - Case status updated to APPEALED')

  const case3After = await rumbleCourt.getCase(3)
  console.log(
    chalk.green(
      `📋  Case 3 Status: ${getCaseStatusName(Number(case3After.status))}`,
    ),
  )
  console.log('')

  // =============================================
  // STATISTICS & SUMMARY
  // =============================================
  console.log(chalk.bgGreen.white.bold('📊  COURTROOM STATISTICS'))
  console.log(chalk.green('=========================='))

  const totalCases = await rumbleCourt.getTotalCases()
  console.log(`Total Cases Filed: ${totalCases}`)

  // Get user cases
  const plaintiff1Cases = await rumbleCourt.getUserCases(plaintiff1.address)
  const plaintiff2Cases = await rumbleCourt.getUserCases(plaintiff2.address)
  const plaintiff3Cases = await rumbleCourt.getUserCases(plaintiff3.address)

  console.log('')
  console.log(chalk.cyan('Cases by Plaintiff:'))
  console.log(`- Plaintiff 1: ${plaintiff1Cases.length} case(s)`)
  console.log(`- Plaintiff 2: ${plaintiff2Cases.length} case(s)`)
  console.log(`- Plaintiff 3: ${plaintiff3Cases.length} case(s)`)
  console.log('')

  // Check verdict status
  console.log(chalk.cyan('Verdict Status:'))
  console.log(
    `- Case 1: ${
      (await rumbleCourt.hasVerdict(1)) ? '✅ Has Verdict' : '⏳ No Verdict'
    }`,
  )
  console.log(
    `- Case 2: ${
      (await rumbleCourt.hasVerdict(2)) ? '✅ Has Verdict' : '⏳ No Verdict'
    }`,
  )
  console.log(
    `- Case 3: ${
      (await rumbleCourt.hasVerdict(3)) ? '✅ Has Verdict' : '⏳ No Verdict'
    }`,
  )
  console.log('')

  // =============================================
  // SIMULATION COMPLETE
  // =============================================
  console.log(chalk.bgBlue.white.bold('✅  SIMULATION COMPLETE'))
  console.log(chalk.blue('========================='))
  console.log('🔗  Contract Address:', contractAddress)
  console.log('📋  Summary:')
  console.log(`   - ${totalCases} cases filed`)
  console.log('   - 3 trials conducted')
  console.log('   - 3 verdicts recorded')
  console.log('   - 1 appeal filed')
  console.log('')
  console.log('🔒  All records permanently stored on blockchain')
  console.log('⚖️  Transparent, immutable justice system')
  console.log('🤖  AI-powered legal proceedings')
  console.log('')
  console.log(
    chalk.green('This demonstrates the complete RumbleCourt workflow:'),
  )
  console.log('1. Users file cases with evidence')
  console.log('2. Case creators or system owner can start trials')
  console.log('3. AI lawyers debate in real-time (off-chain)')
  console.log(
    '4. Case creators or system owner record AI judge verdict (on-chain)',
  )
  console.log('5. Parties can appeal decisions')
  console.log('6. All proceedings immutably recorded')
  console.log('')
}

// Helper functions
function getCaseStatusName(status: number): string {
  const statuses = ['PENDING', 'IN_TRIAL', 'COMPLETED', 'APPEALED']
  return statuses[status] || 'UNKNOWN'
}

function getVerdictTypeName(type: number): string {
  const types = ['GUILTY', 'NOT_GUILTY', 'SETTLEMENT', 'DISMISSED']
  return types[type] || 'UNKNOWN'
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
