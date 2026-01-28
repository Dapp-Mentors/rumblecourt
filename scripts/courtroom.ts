import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import chalk from 'chalk'

// Courtroom Simulation Script
// This script demonstrates how courtroom records will be documented on-chain
// It simulates the complete workflow that the frontend will use during integration

async function main(): Promise<void> {
  console.log(chalk.bgBlue.white.bold('🏛️  COURTROOM BLOCKCHAIN SIMULATION'))
  console.log(chalk.blue('==========================================='))
  console.log('Simulating how courtroom records are documented on-chain')
  console.log('This demonstrates the frontend integration workflow')
  console.log('')

  // Get test accounts
  const [
    deployer,
    judge1,
    judge2,
    prosecutor,
    defendant,
    appellant,
    courtClerk,
  ] = await hre.ethers.getSigners()

  console.log(chalk.yellow('👨‍⚖️  Courtroom Participants:'))
  console.log(`- Chief Justice (Deployer): ${deployer.address}`)
  console.log(`- Presiding Judge 1: ${judge1.address}`)
  console.log(`- Presiding Judge 2: ${judge2.address}`)
  console.log(`- Prosecutor: ${prosecutor.address}`)
  console.log(`- Defendant: ${defendant.address}`)
  console.log(`- Appellant: ${appellant.address}`)
  console.log(`- Court Clerk: ${courtClerk.address}`)
  console.log('')

  // Deploy contracts for this simulation
  console.log(chalk.cyan('🏗️  Deploying courtroom system contracts...'))
  const VerdictStorageFactory = await hre.ethers.getContractFactory(
    'VerdictStorage'
  )
  const AdjournmentTrackingFactory = await hre.ethers.getContractFactory(
    'AdjournmentTracking'
  )
  const CourtroomParticipantsFactory = await hre.ethers.getContractFactory(
    'CourtroomParticipants'
  )

  const verdictStorage = await VerdictStorageFactory.deploy()
  const adjournmentTracking = await AdjournmentTrackingFactory.deploy()
  const courtroomParticipants = await CourtroomParticipantsFactory.deploy()

  await verdictStorage.waitForDeployment()
  await adjournmentTracking.waitForDeployment()
  await courtroomParticipants.waitForDeployment()

  console.log(`✅ VerdictStorage deployed to: ${await verdictStorage.getAddress()}`)
  console.log(`✅ AdjournmentTracking deployed to: ${await adjournmentTracking.getAddress()}`)
  console.log(`✅ CourtroomParticipants deployed to: ${await courtroomParticipants.getAddress()}`)

  // Setup authorized judges
  console.log(chalk.cyan('🔐  Setting up courtroom authorization...'))
  await verdictStorage.connect(deployer).addAuthorizedJudge(judge1.address)
  await verdictStorage.connect(deployer).addAuthorizedJudge(judge2.address)
  await adjournmentTracking.connect(deployer).addAuthorizedJudge(judge1.address)
  await adjournmentTracking.connect(deployer).addAuthorizedJudge(judge2.address)
  console.log('✅ Authorized judges configured')
  console.log('')

  // =============================================
  // COURTROOM PARTICIPANTS MANAGEMENT
  // =============================================
  console.log(
    chalk.bgCyan.white.bold('👥  COURTROOM PARTICIPANTS MANAGEMENT')
  )
  console.log(chalk.cyan('======================================'))

  // Create participant profiles
  console.log(chalk.yellow('📝  Creating participant profiles...'))
  
  // Create judge profile
  const judgeProfileTx = await courtroomParticipants
    .connect(deployer)
    .createParticipantProfile(
      judge1.address,
      0, // JUDGE
      'openrouter',
      'gpt-4',
      'GPT-4',
      9, // expertiseLevel
      8, // eloquenceScore
      9, // analyticalScore
      7, // emotionalIntelligence
      '{"traits": "impartial, fair, experienced"}'
    )
  await judgeProfileTx.wait()
  console.log('✅ Judge profile created')

  // Create prosecutor profile
  const prosecutorProfileTx = await courtroomParticipants
    .connect(deployer)
    .createParticipantProfile(
      prosecutor.address,
      1, // PROSECUTOR
      'anthropic',
      'claude-3-sonnet',
      'Claude 3 Sonnet',
      8, // expertiseLevel
      9, // eloquenceScore
      8, // analyticalScore
      6, // emotionalIntelligence
      '{"traits": "persuasive, determined, strategic"}'
    )
  await prosecutorProfileTx.wait()
  console.log('✅ Prosecutor profile created')

  // Create defense attorney profile
  const defenseProfileTx = await courtroomParticipants
    .connect(deployer)
    .createParticipantProfile(
      defendant.address,
      2, // DEFENSE_ATTORNEY
      'google',
      'gemini-pro',
      'Gemini Pro',
      8, // expertiseLevel
      8, // eloquenceScore
      9, // analyticalScore
      8, // emotionalIntelligence
      '{"traits": "protective, analytical, empathetic"}'
    )
  await defenseProfileTx.wait()
  console.log('✅ Defense attorney profile created')

  // Create court clerk profile
  const clerkProfileTx = await courtroomParticipants
    .connect(deployer)
    .createParticipantProfile(
      courtClerk.address,
      3, // CLERK
      'openrouter',
      'llama-3',
      'Llama 3',
      7, // expertiseLevel
      7, // eloquenceScore
      7, // analyticalScore
      8, // emotionalIntelligence
      '{"traits": "organized, efficient, detail-oriented"}'
    )
  await clerkProfileTx.wait()
  console.log('✅ Court clerk profile created')
  console.log('')

  // Create a court
  console.log(chalk.cyan('🏛️  Creating court...'))
  const courtTx = await courtroomParticipants
    .connect(judge1)
    .createCourt(
      'Supreme Court of Blockchain Justice',
      'Highest court for blockchain-based legal proceedings'
    )
  await courtTx.wait()
  
  const courtId = 1
  console.log(`✅ Court created - ID: ${courtId}`)
  console.log('')

  // Assign participants to court
  console.log(chalk.cyan('👥  Assigning participants to court...'))
  await courtroomParticipants
    .connect(judge1)
    .assignParticipantToCourt(courtId, 1, 0) // Judge
  await courtroomParticipants
    .connect(judge1)
    .assignParticipantToCourt(courtId, 2, 1) // Prosecutor
  await courtroomParticipants
    .connect(judge1)
    .assignParticipantToCourt(courtId, 3, 2) // Defense Attorney
  await courtroomParticipants
    .connect(judge1)
    .assignParticipantToCourt(courtId, 4, 3) // Clerk
  console.log('✅ Participants assigned to court')
  console.log('')

  // Check court completion
  const isComplete = await courtroomParticipants.isCourtComplete(courtId)
  console.log(chalk.green(`📋  Court completion status: ${isComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`))
  console.log('')

  // Get court participants by role
  const judges = await courtroomParticipants.getCourtParticipantsByRole(courtId, 0)
  const prosecutors = await courtroomParticipants.getCourtParticipantsByRole(courtId, 1)
  const defenseAttorneys = await courtroomParticipants.getCourtParticipantsByRole(courtId, 2)
  const clerks = await courtroomParticipants.getCourtParticipantsByRole(courtId, 3)

  console.log(chalk.yellow('👥  Court Participants by Role:'))
  console.log(`- Judges: ${judges.length} (Profile IDs: ${judges.join(', ')})`)
  console.log(`- Prosecutors: ${prosecutors.length} (Profile IDs: ${prosecutors.join(', ')})`)
  console.log(`- Defense Attorneys: ${defenseAttorneys.length} (Profile IDs: ${defenseAttorneys.join(', ')})`)
  console.log(`- Clerks: ${clerks.length} (Profile IDs: ${clerks.join(', ')})`)
  console.log('')

  // =============================================
  // CASE 1: People v. Smith - Criminal Trial
  // =============================================
  console.log(
    chalk.bgMagenta.white.bold('📜  CASE 1: People v. Smith - Criminal Trial')
  )
  console.log(
    chalk.magenta('=====================================================')
  )

  const case1Id = 2001
  const case1Title = 'People v. Smith - Theft Case'
  const case1StartTime = Math.floor(Date.now() / 1000)

  // Simulate courtroom proceedings
  console.log(chalk.yellow('📅  Courtroom Proceedings:'))
  console.log(`- Case ID: ${case1Id}`)
  console.log(`- Title: ${case1Title}`)
  console.log(`- Presiding Judge: ${judge1.address}`)
  console.log(`- Prosecutor: ${prosecutor.address}`)
  console.log(`- Defendant: ${defendant.address}`)
  console.log(
    `- Start Time: ${new Date(case1StartTime * 1000).toLocaleString()}`
  )
  console.log('')

  // Record initial verdict (not final yet)
  console.log(chalk.cyan('⚖️  Judge recording initial verdict...'))
  const verdict1Tx = await verdictStorage.connect(judge1).recordVerdict(
    case1Id,
    0, // GUILTY
    'Defendant found guilty of theft in the first degree',
    'Based on overwhelming evidence including CCTV footage, witness testimony, and recovered stolen property',
    [
      'CCTV Footage Analysis Report',
      'Witness Testimony Transcript',
      'Police Investigation Report',
      'Stolen Property Inventory',
    ],
    false // Not final yet
  )

  await verdict1Tx.wait()
  // Get the actual verdict ID by checking the total verdicts
  const totalVerdictsBefore = await verdictStorage.getTotalVerdicts()
  const verdict1Id = totalVerdictsBefore

  console.log(`✅ Verdict recorded - ID: ${verdict1Id}`)
  console.log('')

  // Get and display the recorded verdict
  const verdict1 = await verdictStorage.getVerdict(verdict1Id)
  console.log(chalk.green('📋  Recorded Verdict Details:'))
  console.log(`- Verdict ID: ${verdict1.verdictId}`)
  console.log(`- Case ID: ${verdict1.caseId}`)
  console.log(`- Judge: ${verdict1.judge}`)
  console.log(
    `- Verdict Type: ${getVerdictTypeName(Number(verdict1.verdictType))}`
  )
  console.log(`- Verdict Details: ${verdict1.verdictDetails}`)
  console.log(`- Reasoning: ${verdict1.reasoning}`)
  console.log(`- Is Final: ${verdict1.isFinal}`)
  console.log(
    `- Supporting Documents: ${verdict1.supportingDocumentsText.length} files`
  )
  console.log(
    `- Timestamp: ${new Date(
      Number(verdict1.timestamp) * 1000
    ).toLocaleString()}`
  )
  console.log('')

  // Finalize the verdict
  console.log(chalk.cyan('🔒  Judge finalizing verdict...'))
  const finalizeTx = await verdictStorage
    .connect(judge1)
    .finalizeVerdict(verdict1Id)
  await finalizeTx.wait()

  const isFinal = await verdictStorage.isVerdictFinal(verdict1Id)
  console.log(`✅ Verdict finalized: ${isFinal}`)
  console.log('')

  // =============================================
  // APPEAL PROCESS: Smith v. People
  // =============================================
  console.log(chalk.bgCyan.white.bold('⚖️  APPEAL PROCESS: Smith v. People'))
  console.log(chalk.cyan('============================================='))

  // File an appeal
  console.log(chalk.yellow('📝  Defendant filing appeal...'))
  const appeal1Tx = await verdictStorage
    .connect(defendant)
    .fileAppeal(
      verdict1Id,
      'Defendant appeals the guilty verdict on grounds of insufficient evidence and procedural errors',
      [
        'Appeal Brief - Insufficient Evidence',
        'Motion to Suppress Evidence',
        'Witness Credibility Analysis',
      ]
    )

  await appeal1Tx.wait()

  // Get the actual appeal ID by checking total appeals
  const totalAppealsAfterFiling = await verdictStorage.getTotalAppeals()
  const appeal1Id = totalAppealsAfterFiling

  console.log(`✅ Appeal filed - ID: ${appeal1Id}`)
  console.log('')

  // Get and display the appeal
  const appeal1 = await verdictStorage.getAppeal(appeal1Id)
  console.log(chalk.green('📋  Appeal Details:'))
  console.log(`- Appeal ID: ${appeal1.appealId}`)
  console.log(`- Original Verdict ID: ${appeal1.originalVerdictId}`)
  console.log(`- Appellant: ${appeal1.appellant}`)
  console.log(`- Appeal Reason: ${appeal1.appealReason}`)
  console.log(`- Status: ${getAppealStatusName(Number(appeal1.status))}`)
  console.log(
    `- Filing Date: ${new Date(
      Number(appeal1.filingDate) * 1000
    ).toLocaleString()}`
  )
  console.log(`- Appeal Documents: ${appeal1.appealDocumentsText.length} files`)
  console.log('')

  // Schedule appeal hearing
  const appealHearingTime = Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days from now
  console.log(chalk.cyan('📅  Scheduling appeal hearing...'))
  const scheduleTx = await verdictStorage
    .connect(judge2)
    .scheduleAppealHearing(appeal1Id, appealHearingTime)

  await scheduleTx.wait()
  console.log(
    `✅ Appeal hearing scheduled for: ${new Date(
      appealHearingTime * 1000
    ).toLocaleString()}`
  )
  console.log('')

  // Update appeal status
  console.log(chalk.cyan('🔄  Updating appeal status...'))
  const updateStatusTx = await verdictStorage
    .connect(judge2)
    .updateAppealStatus(
      appeal1Id,
      2, // SCHEDULED
      'Appeal hearing scheduled and notice served to all parties'
    )

  await updateStatusTx.wait()
  console.log('✅ Appeal status updated to SCHEDULED')
  console.log('')

  // =============================================
  // ADJOURNMENT PROCESS: Case Continuance
  // =============================================
  console.log(
    chalk.bgYellow.white.bold('🕒  ADJOURNMENT PROCESS: Case Continuance')
  )
  console.log(chalk.yellow('================================================='))

  const adjournmentCaseId = case1Id
  const requestedNewTime = Math.floor(Date.now() / 1000) + 86400 * 14 // 14 days from now

  // Request adjournment
  console.log(chalk.cyan('📅  Requesting case adjournment...'))
  const adjournmentTx = await adjournmentTracking
    .connect(prosecutor)
    .requestAdjournment(
      adjournmentCaseId,
      0, // MEDICAL (using first enum value - you may need to adjust based on your contract)
      'Lead prosecutor has a scheduling conflict with another high-profile case',
      requestedNewTime,
      [
        "Prosecutor's Schedule Conflict Affidavit",
        'Court Calendar Conflict Notice',
      ]
    )

  await adjournmentTx.wait()
  // Get the actual adjournment ID by checking the total adjournments
  const totalAdjournmentsBefore =
    await adjournmentTracking.getTotalAdjournmentRequests()
  const adjournmentId = totalAdjournmentsBefore

  console.log(`✅ Adjournment requested - ID: ${adjournmentId}`)
  console.log('')

  // Get and display the adjournment request
  const adjournment = await adjournmentTracking.getAdjournment(adjournmentId)
  console.log(chalk.green('📋  Adjournment Request Details:'))
  console.log(`- Adjournment ID: ${adjournment.adjournmentId}`)
  console.log(`- Case ID: ${adjournment.caseId}`)
  console.log(`- Requested By: ${adjournment.requestedBy}`)
  console.log(
    `- Reason: ${getAdjournmentReasonName(Number(adjournment.reason))}`
  )
  console.log(`- Reason Details: ${adjournment.reasonDetails}`)
  console.log(
    `- Requested New Date: ${new Date(
      Number(adjournment.newHearingDate) * 1000
    ).toLocaleString()}`
  )
  console.log(
    `- Status: ${getAdjournmentStatusName(Number(adjournment.status))}`
  )
  console.log(
    `- Request Date: ${new Date(
      Number(adjournment.requestDate) * 1000
    ).toLocaleString()}`
  )
  console.log(
    `- Supporting Documents: ${adjournment.supportingDocumentsText.length} files`
  )
  console.log('')

  // Approve adjournment
  const approvedNewTime = Math.floor(Date.now() / 1000) + 86400 * 10 // 10 days from now
  console.log(chalk.cyan('✅  Judge approving adjournment request...'))
  const approveTx = await adjournmentTracking
    .connect(judge1)
    .approveAdjournment(
      adjournmentId,
      approvedNewTime,
      'Adjournment approved due to valid scheduling conflict'
    )

  await approveTx.wait()
  console.log(
    `✅ Adjournment approved - New hearing date: ${new Date(
      approvedNewTime * 1000
    ).toLocaleString()}`
  )
  console.log('')

  // =============================================
  // EMERGENCY RESCHEDULING
  // =============================================
  console.log(chalk.bgRed.white.bold('🚨  EMERGENCY RESCHEDULING'))
  console.log(chalk.red('================================='))

  const emergencyCaseId = 2002
  const emergencyNewTime = Math.floor(Date.now() / 1000) + 86400 * 5 // 5 days from now

  console.log(chalk.cyan('🔥  Emergency situation - rescheduling hearing...'))
  const emergencyTx = await adjournmentTracking
    .connect(judge1)
    .emergencyReschedule(
      emergencyCaseId,
      emergencyNewTime,
      'Emergency rescheduling due to court building maintenance issues'
    )

  await emergencyTx.wait()
  console.log(
    `✅ Emergency rescheduling completed - New date: ${new Date(
      emergencyNewTime * 1000
    ).toLocaleString()}`
  )
  console.log('')

  // =============================================
  // CASE SUMMARY AND STATISTICS
  // =============================================
  console.log(chalk.bgGreen.white.bold('📊  COURTROOM STATISTICS & SUMMARY'))
  console.log(chalk.green('========================================='))

  // Get all verdicts for case 1
  const case1Verdicts = await verdictStorage.getVerdictsByCase(case1Id)
  console.log(
    chalk.yellow(`📜  Case ${case1Id} Verdicts: ${case1Verdicts.length}`)
  )

  // Get all appeals for verdict 1
  const verdict1Appeals = await verdictStorage.getAppealsByVerdict(verdict1Id)
  console.log(
    chalk.yellow(`⚖️  Verdict ${verdict1Id} Appeals: ${verdict1Appeals.length}`)
  )

  // Get all adjournments for case 1
  const case1Adjournments = await adjournmentTracking.getAdjournamentsByCase(
    adjournmentCaseId
  )
  console.log(
    chalk.yellow(
      `🕒  Case ${adjournmentCaseId} Adjournments: ${case1Adjournments.length}`
    )
  )

  // Get total statistics
  const totalVerdicts = await verdictStorage.getTotalVerdicts()
  const totalAppeals = await verdictStorage.getTotalAppeals()
  const adjournmentStats = await adjournmentTracking.getAdjournmentStatistics()

  console.log(chalk.cyan('📊  Overall Courtroom Statistics:'))
  console.log(`- Total Verdicts Recorded: ${totalVerdicts}`)
  console.log(`- Total Appeals Filed: ${totalAppeals}`)
  console.log(
    `- Adjournment Requests: ${
      Number(adjournmentStats.pending) +
      Number(adjournmentStats.approved) +
      Number(adjournmentStats.denied)
    }`
  )
  console.log(`  - Pending: ${adjournmentStats.pending}`)
  console.log(`  - Approved: ${adjournmentStats.approved}`)
  console.log(`  - Denied: ${adjournmentStats.denied}`)
  console.log('')

  // =============================================
  // SIMULATION COMPLETE
  // =============================================
  console.log(chalk.bgBlue.white.bold('✅  COURTROOM SIMULATION COMPLETE'))
  console.log(chalk.blue('======================================='))
  console.log('📋  Summary of On-Chain Records Created:')
  console.log(`   - ${totalVerdicts} Verdicts recorded`)
  console.log(`   - ${totalAppeals} Appeals filed`)
  console.log(
    `   - ${
      Number(adjournmentStats.pending) +
      Number(adjournmentStats.approved) +
      Number(adjournmentStats.denied)
    } Adjournment requests`
  )
  console.log('')
  console.log('🔗  All records are now permanently stored on the blockchain')
  console.log('🔒  Records are immutable and transparent')
  console.log('⚖️  Justice system integrity preserved through decentralization')
  console.log('')
  console.log(
    'This simulation demonstrates how the frontend will interact with'
  )
  console.log('the blockchain contracts during live courtroom operations.')
  console.log('')
}

// Helper functions for display formatting
function getVerdictTypeName(type: number): string {
  const types = ['GUILTY', 'NOT_GUILTY', 'ACQUITTED', 'CONVICTED', 'DISMISSED']
  return types[type] || 'UNKNOWN'
}

function getAppealStatusName(status: number): string {
  const statuses = [
    'FILED',
    'SCHEDULED',
    'IN_PROGRESS',
    'RESOLVED',
    'DISMISSED',
  ]
  return statuses[status] || 'UNKNOWN'
}

function getAdjournmentReasonName(reason: number): string {
  const reasons = ['MEDICAL', 'LEGAL', 'PERSONAL', 'TECHNICAL', 'OTHER']
  return reasons[reason] || 'UNKNOWN'
}

function getAdjournmentStatusName(status: number): string {
  const statuses = [
    'REQUESTED',
    'UNDER_REVIEW',
    'APPROVED',
    'DENIED',
    'CANCELLED',
    'COMPLETED',
  ]
  return statuses[status] || 'UNKNOWN'
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
