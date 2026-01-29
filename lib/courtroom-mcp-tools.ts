import { tool } from 'ai'
import { z } from 'zod'
import {
  addAuthorizedJudge,
  recordVerdict,
  finalizeVerdict,
  fileAppeal,
  updateAppealStatus,
  scheduleAppealHearing,
  getVerdict,
  getVerdictsByCase,
  getAppeal,
  getAppealsByVerdict,
  isVerdictFinal,
  requestAdjournment,
  approveAdjournment,
  emergencyReschedule,
  getAdjournment,
  getAdjournmentsByCase,
  getTotalAdjournmentRequests,
  getAdjournmentStatistics,
  createParticipantProfile,
  createCourt,
  assignParticipantToCourt,
  isCourtComplete,
  getCourtParticipantsByRole,
  getTotalVerdicts,
  getTotalAppeals,
} from '../services/blockchain'

// Helper to get wallet from context
let walletContext: {
  connected: boolean
  address: string | null
} = {
  connected: false,
  address: null,
}

export const setWalletContext = (
  connected: boolean,
  address: string | null
) => {
  walletContext = { connected, address }
}

export const courtroomMcpTools = {
  // ============================================
  // UTILITY & SETUP TOOLS (Start Here)
  // ============================================

  get_connected_wallet: tool({
    description: `[FOUNDATIONAL - Check First] Verify wallet connection status. MUST be connected before any blockchain operations. This is the first prerequisite for all courtroom activities.`,
    inputSchema: z.object({}),
    execute: async () => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          connected: false,
          message:
            '⚠️ No wallet connected. Please connect your wallet to begin courtroom operations.',
        }
      }

      return {
        connected: true,
        address: walletContext.address,
        message: '✅ Wallet is connected and ready for blockchain operations.',
      }
    },
  }),

  // ============================================
  // PARTICIPANT MANAGEMENT TOOLS (Phase 1)
  // ============================================

  create_participant_profile: tool({
    description: `[FOUNDATIONAL - Phase 1] Create a participant profile for courtroom personnel (Judge, Prosecutor, Defense Attorney, or Clerk).
    MUST create participant profiles BEFORE establishing a court. Each profile defines the AI characteristics and role of a courtroom participant.
    Best practice: Create all 4 participant types for a complete court.`,
    inputSchema: z.object({
      participantAddress: z
        .string()
        .describe('Ethereum wallet address of the participant'),
      participantType: z
        .enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe(
          'Role in the courtroom: JUDGE (presides), PROSECUTOR (argues for conviction), DEFENSE_ATTORNEY (argues for acquittal), CLERK (administrative support)'
        ),
      llmProvider: z
        .string()
        .describe(
          'AI provider powering this participant (e.g., "openrouter", "anthropic", "google")'
        ),
      llmModel: z
        .string()
        .describe(
          'Specific AI model identifier (e.g., "gpt-4", "claude-3-sonnet", "gemini-pro")'
        ),
      llmModelName: z
        .string()
        .describe(
          'Human-readable model name for display (e.g., "GPT-4", "Claude 3 Sonnet")'
        ),
      expertiseLevel: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe(
          'Legal expertise rating (1-10): 1=novice, 10=expert legal scholar'
        ),
      eloquenceScore: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe('Speaking/writing quality (1-10): 1=basic, 10=master orator'),
      analyticalScore: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe(
          'Analytical reasoning ability (1-10): 1=surface-level, 10=deeply analytical'
        ),
      emotionalIntelligence: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe(
          'Emotional awareness and empathy (1-10): 1=robotic, 10=highly empathetic'
        ),
      traits: z
        .string()
        .describe(
          'JSON string describing personality traits (e.g., \'{"traits": "impartial, fair, experienced"}\')'
        ),
    }),
    execute: async ({
      participantAddress,
      participantType,
      llmProvider,
      llmModel,
      llmModelName,
      expertiseLevel,
      eloquenceScore,
      analyticalScore,
      emotionalIntelligence,
      traits,
    }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error:
            '⚠️ Wallet not connected. Please connect your wallet first to create participant profiles.',
        }
      }

      try {
        const tx = await createParticipantProfile(
          participantAddress,
          participantType,
          llmProvider,
          llmModel,
          llmModelName,
          expertiseLevel,
          eloquenceScore,
          analyticalScore,
          emotionalIntelligence,
          traits
        )
        return {
          success: true,
          message: `✅ ${participantType} profile created successfully for ${participantAddress}. Next step: Create more participants or establish a court.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to create participant profile: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // COURT ESTABLISHMENT TOOLS (Phase 2)
  // ============================================

  create_court: tool({
    description: `[FOUNDATIONAL - Phase 2] Establish a new courtroom on the blockchain. REQUIRES: Participant profiles must exist first.
    After creating court, you must assign participants before any proceedings can begin.
    This is the foundation for all verdict, appeal, and adjournment operations.`,
    inputSchema: z.object({
      courtName: z
        .string()
        .describe(
          'Official name of the court (e.g., "Supreme Court of Blockchain Justice")'
        ),
      description: z
        .string()
        .describe("Detailed description of court's jurisdiction and purpose"),
    }),
    execute: async ({ courtName, description }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await createCourt(courtName, description)
        return {
          success: true,
          message: `🏛️ Court "${courtName}" established successfully! Next step: Assign participants using assign_participant_to_court.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to create court: ${errorMessage}`,
        }
      }
    },
  }),

  assign_participant_to_court: tool({
    description: `[FOUNDATIONAL - Phase 2] Assign a participant profile to a specific court. REQUIRES: Court must exist AND participant profile must exist.
    Must assign at least one participant of each type (JUDGE, PROSECUTOR, DEFENSE_ATTORNEY, CLERK) for court to be complete. Use is_court_complete to verify court readiness.`,
    inputSchema: z.object({
      courtId: z
        .bigint()
        .describe('Unique identifier of the court to assign to'),
      profileId: z
        .bigint()
        .describe(
          'Unique identifier of the participant profile being assigned'
        ),
      participantType: z
        .enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe('Role this participant will serve in this court'),
    }),
    execute: async ({ courtId, profileId, participantType }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await assignParticipantToCourt(
          courtId,
          profileId,
          participantType
        )
        return {
          success: true,
          message: `👥 Participant ${profileId} assigned to court ${courtId} as ${participantType}. Use is_court_complete to check if court has all required participants.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to assign participant: ${errorMessage}`,
        }
      }
    },
  }),

  is_court_complete: tool({
    description: `[VERIFICATION] Check if a court has all required participants and is ready for proceedings.
    A complete court must have at least one: JUDGE, PROSECUTOR, DEFENSE_ATTORNEY, and CLERK.
    Use this to verify court readiness BEFORE attempting to record verdicts or handle cases.`,
    inputSchema: z.object({
      courtId: z.bigint().describe('Unique identifier of the court to check'),
    }),
    execute: async ({ courtId }) => {
      try {
        const isComplete = await isCourtComplete(courtId)
        return {
          success: true,
          courtId: courtId.toString(),
          isComplete,
          message: isComplete
            ? '✅ Court is complete and ready for proceedings! You can now record verdicts, file appeals, and manage adjournments.'
            : '⚠️ Court is incomplete. Please assign all required participant types (JUDGE, PROSECUTOR, DEFENSE_ATTORNEY, CLERK) before proceeding.',
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to check court completion: ${errorMessage}`,
        }
      }
    },
  }),

  get_court_participants_by_role: tool({
    description: `[QUERY] Retrieve all participants assigned to a specific role in a court. Useful for viewing court composition and identifying which participants are available for specific roles.`,
    inputSchema: z.object({
      courtId: z.bigint().describe('Unique identifier of the court'),
      participantType: z
        .enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe('Type of participant to retrieve'),
    }),
    execute: async ({ courtId, participantType }) => {
      try {
        const profileIds = await getCourtParticipantsByRole(
          courtId,
          participantType
        )
        return {
          success: true,
          courtId: courtId.toString(),
          participantType,
          participantCount: profileIds.length,
          profileIds: profileIds.map((id) => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get court participants: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // AUTHORIZATION TOOLS (Phase 3)
  // ============================================

  add_authorized_judge: tool({
    description: `[AUTHORIZATION - Phase 3] Grant a judge authority to record verdicts in the verdict storage system.
    REQUIRES: Wallet owner must be contract owner. Only authorized judges can record, finalize, or modify verdicts.
    Should be done AFTER creating participant profiles and BEFORE recording verdicts.`,
    inputSchema: z.object({
      judgeAddress: z
        .string()
        .describe(
          'Ethereum address of the judge to authorize for verdict recording'
        ),
    }),
    execute: async ({ judgeAddress }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await addAuthorizedJudge(judgeAddress)
        return {
          success: true,
          message: `⚖️ Judge ${judgeAddress} has been authorized to record and manage verdicts. They can now use record_verdict and finalize_verdict tools.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to authorize judge: ${errorMessage}. Note: Only contract owner can authorize judges.`,
        }
      }
    },
  }),

  // ============================================
  // VERDICT MANAGEMENT TOOLS (Phase 4 - Operations)
  // ============================================

  record_verdict: tool({
    description: `[OPERATION] Record an official verdict for a case.
    REQUIRES: (1) Complete court exists (verified with is_court_complete), (2) Connected wallet is an authorized judge (added via add_authorized_judge), (3) Case ID exists.
    This creates an immutable blockchain record of the judicial decision. Can be marked final immediately or finalized later with finalize_verdict.`,
    inputSchema: z.object({
      caseId: z
        .bigint()
        .describe('Unique identifier for the case being decided'),
      verdictType: z
        .enum(['GUILTY', 'NOT_GUILTY', 'ACQUITTED', 'CONVICTED', 'DISMISSED'])
        .describe(
          'Type of verdict: GUILTY (criminal conviction), NOT_GUILTY (criminal acquittal), ACQUITTED (criminal acquittal after trial), CONVICTED (criminal conviction), DISMISSED (case thrown out)'
        ),
      verdictDetails: z
        .string()
        .describe(
          'Detailed description of the verdict and any penalties, damages, or remedies ordered'
        ),
      reasoning: z
        .string()
        .describe("Judge's detailed legal reasoning and basis for the verdict"),
      supportingDocumentsText: z
        .array(z.string())
        .describe(
          'Array of supporting document descriptions (e.g., ["Evidence Report A", "Witness Testimony B"])'
        ),
      isFinal: z
        .boolean()
        .default(false)
        .describe(
          'Whether this verdict is immediately final and immutable (true) or can be modified before finalization (false)'
        ),
    }),
    execute: async ({
      caseId,
      verdictType,
      verdictDetails,
      reasoning,
      supportingDocumentsText,
      isFinal,
    }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await recordVerdict(
          caseId,
          verdictType,
          verdictDetails,
          reasoning,
          supportingDocumentsText,
          isFinal
        )
        return {
          success: true,
          message: `⚖️ Verdict recorded successfully for case ${caseId}. ${
            isFinal
              ? 'Verdict is final and immutable.'
              : 'Verdict can be finalized later with finalize_verdict.'
          }`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to record verdict: ${errorMessage}. Verify: (1) Court is complete, (2) You are an authorized judge, (3) Case ID is valid.`,
        }
      }
    },
  }),

  finalize_verdict: tool({
    description: `[OPERATION] Make a verdict final and immutable on the blockchain.
    REQUIRES: (1) Verdict must exist, (2) Connected wallet must be the judge who recorded it, (3) Verdict must not already be final.
    Once finalized, verdict cannot be modified - only appealed via file_appeal.`,
    inputSchema: z.object({
      verdictId: z
        .bigint()
        .describe('Unique identifier of the verdict to finalize'),
    }),
    execute: async ({ verdictId }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await finalizeVerdict(verdictId)
        return {
          success: true,
          message: `🔒 Verdict ${verdictId} has been finalized and is now permanently immutable. The only recourse is filing an appeal via file_appeal.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to finalize verdict: ${errorMessage}`,
        }
      }
    },
  }),

  get_verdict: tool({
    description: `[QUERY] Retrieve complete details of a specific verdict by its ID.
    Returns all information including case ID, judge, verdict type, reasoning, timestamps, supporting documents, and finalization status.`,
    inputSchema: z.object({
      verdictId: z
        .bigint()
        .describe('Unique identifier of the verdict to retrieve'),
    }),
    execute: async ({ verdictId }) => {
      try {
        const verdict = await getVerdict(verdictId)
        return {
          success: true,
          verdict: {
            caseId: verdict.caseId.toString(),
            verdictId: verdict.verdictId.toString(),
            judge: verdict.judge,
            verdictType: verdict.verdictType,
            verdictDetails: verdict.verdictDetails,
            reasoning: verdict.reasoning,
            timestamp: verdict.timestamp.toString(),
            isFinal: verdict.isFinal,
            supportingDocumentsCount: verdict.supportingDocumentsText.length,
            supportingDocuments: verdict.supportingDocumentsText,
          },
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to retrieve verdict: ${errorMessage}`,
        }
      }
    },
  }),

  get_verdicts_by_case: tool({
    description: `[QUERY] Get all verdict IDs associated with a specific case. Useful for viewing case history and all judicial decisions made for a particular case.`,
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier of the case'),
    }),
    execute: async ({ caseId }) => {
      try {
        const verdictIds = await getVerdictsByCase(caseId)
        return {
          success: true,
          caseId: caseId.toString(),
          verdictCount: verdictIds.length,
          verdictIds: verdictIds.map((id) => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get verdicts for case: ${errorMessage}`,
        }
      }
    },
  }),

  is_verdict_final: tool({
    description: `[VERIFICATION] Check whether a verdict is final and immutable. Final verdicts cannot be modified - only appealed. Use before attempting to modify a verdict.`,
    inputSchema: z.object({
      verdictId: z
        .bigint()
        .describe('Unique identifier of the verdict to check'),
    }),
    execute: async ({ verdictId }) => {
      try {
        const isFinal = await isVerdictFinal(verdictId)
        return {
          success: true,
          verdictId: verdictId.toString(),
          isFinal,
          message: isFinal
            ? '🔒 This verdict is final and immutable. It can only be challenged via appeal (file_appeal).'
            : '📝 This verdict is not final and can still be modified or finalized by the judge.',
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to check verdict status: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_verdicts: tool({
    description: `[STATISTICS] Get the total number of verdicts recorded across all cases in the system. Useful for system statistics and analytics.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalVerdicts()
        return {
          success: true,
          totalVerdicts: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get total verdicts: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // APPEALS PROCESS TOOLS (Phase 5 - Post-Verdict)
  // ============================================

  file_appeal: tool({
    description: `[OPERATION] File an appeal challenging a verdict. REQUIRES: Original verdict must exist (verify with get_verdict).
    Appeals initiate a review process of the original decision. After filing, use update_appeal_status to track progress and schedule_appeal_hearing to set hearing dates.`,
    inputSchema: z.object({
      originalVerdictId: z
        .bigint()
        .describe('ID of the verdict being appealed'),
      appealReason: z
        .string()
        .describe(
          'Legal grounds for the appeal (e.g., "insufficient evidence", "procedural errors", "misapplication of law")'
        ),
      appealDocumentsText: z
        .array(z.string())
        .describe(
          'Array of appeal document descriptions supporting the appeal'
        ),
    }),
    execute: async ({
      originalVerdictId,
      appealReason,
      appealDocumentsText,
    }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await fileAppeal(
          originalVerdictId,
          appealReason,
          appealDocumentsText
        )
        return {
          success: true,
          message: `📋 Appeal filed successfully against verdict ${originalVerdictId}. Next steps: Use update_appeal_status to track progress and schedule_appeal_hearing to set hearing date.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to file appeal: ${errorMessage}. Verify that verdict ${originalVerdictId} exists.`,
        }
      }
    },
  }),

  update_appeal_status: tool({
    description: `[OPERATION] Update the status and decision of an appeal. REQUIRES: Appeal must exist, connected wallet must be authorized judge.
    Use to track appeal progress through stages: FILED → SCHEDULED → IN_PROGRESS → RESOLVED/DISMISSED.`,
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier of the appeal'),
      status: z
        .enum(['FILED', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'])
        .describe(
          'New status: FILED (initially submitted), SCHEDULED (hearing scheduled), IN_PROGRESS (under review), RESOLVED (decision made), DISMISSED (appeal rejected)'
        ),
      decisionDetails: z
        .string()
        .describe('Details of the status update or decision'),
    }),
    execute: async ({ appealId, status, decisionDetails }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await updateAppealStatus(appealId, status, decisionDetails)
        return {
          success: true,
          message: `📋 Appeal ${appealId} status updated to ${status}. ${decisionDetails}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to update appeal status: ${errorMessage}`,
        }
      }
    },
  }),

  schedule_appeal_hearing: tool({
    description: `[OPERATION] Schedule a hearing date for an appeal. REQUIRES: Appeal must exist, connected wallet must be authorized judge. Sets official hearing date for appellate review.`,
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier of the appeal'),
      hearingDate: z
        .bigint()
        .describe(
          'Unix timestamp for the hearing date (use Math.floor(new Date("2024-02-15").getTime() / 1000) to convert from date)'
        ),
    }),
    execute: async ({ appealId, hearingDate }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await scheduleAppealHearing(appealId, hearingDate)
        return {
          success: true,
          message: `📅 Hearing scheduled for appeal ${appealId} on ${new Date(
            Number(hearingDate) * 1000
          ).toLocaleString()}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to schedule appeal hearing: ${errorMessage}`,
        }
      }
    },
  }),

  get_appeal: tool({
    description: `[QUERY] Retrieve complete details of a specific appeal by its ID. Returns appellant info, original verdict, appeal reason, status, hearing dates, and supporting documents.`,
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier of the appeal'),
    }),
    execute: async ({ appealId }) => {
      try {
        const appeal = await getAppeal(appealId)
        return {
          success: true,
          appeal: {
            appealId: appeal.appealId.toString(),
            originalVerdictId: appeal.originalVerdictId.toString(),
            appellant: appeal.appellant,
            appealReason: appeal.appealReason,
            status: appeal.status,
            filingDate: appeal.filingDate.toString(),
            hearingDate: appeal.hearingDate.toString(),
            appealDocumentsCount: appeal.appealDocumentsText.length,
            appealDocuments: appeal.appealDocumentsText,
          },
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to retrieve appeal: ${errorMessage}`,
        }
      }
    },
  }),

  get_appeals_by_verdict: tool({
    description: `[QUERY] Get all appeal IDs for a specific verdict. Shows appeal history and challenges to a particular judicial decision.`,
    inputSchema: z.object({
      verdictId: z.bigint().describe('Unique identifier of the verdict'),
    }),
    execute: async ({ verdictId }) => {
      try {
        const appealIds = await getAppealsByVerdict(verdictId)
        return {
          success: true,
          verdictId: verdictId.toString(),
          appealCount: appealIds.length,
          appealIds: appealIds.map((id) => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get appeals for verdict: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_appeals: tool({
    description: `[STATISTICS] Get the total number of appeals filed across all verdicts in the system. Useful for system statistics and analytics.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalAppeals()
        return {
          success: true,
          totalAppeals: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get total appeals: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // ADJOURNMENT MANAGEMENT TOOLS (Phase 6 - Scheduling)
  // ============================================

  request_adjournment: tool({
    description: `[OPERATION] Request to postpone a case hearing. REQUIRES: Case must exist. Creates a formal request for rescheduling with supporting documentation.
    After requesting, a judge must approve with approve_adjournment. Common reasons: medical issues, legal conflicts, personal emergencies, technical problems.`,
    inputSchema: z.object({
      caseId: z
        .bigint()
        .describe('Unique identifier of the case requiring adjournment'),
      reason: z
        .enum(['MEDICAL', 'LEGAL', 'PERSONAL', 'TECHNICAL', 'OTHER'])
        .describe(
          `Category of adjournment reason: MEDICAL (health issues), LEGAL (legal conflicts/preparation needed),
          PERSONAL (personal emergencies), TECHNICAL (technical difficulties), OTHER (other valid reasons)`
        ),
      reasonDetails: z
        .string()
        .describe('Detailed explanation of why adjournment is needed'),
      requestedNewDate: z
        .bigint()
        .describe('Requested new hearing date as Unix timestamp'),
      supportingDocumentsText: z
        .array(z.string())
        .describe(
          'Array of supporting document descriptions justifying the adjournment'
        ),
    }),
    execute: async ({
      caseId,
      reason,
      reasonDetails,
      requestedNewDate,
      supportingDocumentsText,
    }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await requestAdjournment(
          caseId,
          reason,
          reasonDetails,
          requestedNewDate,
          supportingDocumentsText
        )
        return {
          success: true,
          message: `📅 Adjournment requested for case ${caseId}. Requested new date: ${new Date(
            Number(requestedNewDate) * 1000
          ).toLocaleString()}. Awaiting judge approval via approve_adjournment.`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to request adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  approve_adjournment: tool({
    description: `[OPERATION] Approve an adjournment request as a judge. REQUIRES: Adjournment request must exist, connected wallet must be authorized judge.
    Grants the postponement and sets official new hearing date.`,
    inputSchema: z.object({
      adjournmentId: z
        .bigint()
        .describe('Unique identifier of the adjournment request'),
      approvedNewDate: z
        .bigint()
        .describe(
          'Approved new hearing date as Unix timestamp (may differ from requested date)'
        ),
      approvalNotes: z
        .string()
        .describe(
          "Judge's notes explaining the approval decision and any conditions"
        ),
    }),
    execute: async ({ adjournmentId, approvedNewDate, approvalNotes }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await approveAdjournment(
          adjournmentId,
          approvedNewDate,
          approvalNotes
        )
        return {
          success: true,
          message: `✅ Adjournment ${adjournmentId} approved. New hearing date: ${new Date(
            Number(approvedNewDate) * 1000
          ).toLocaleString()}. ${approvalNotes}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to approve adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  emergency_reschedule: tool({
    description: `[OPERATION - EMERGENCY] Emergency rescheduling of a hearing by judge authority. REQUIRES: Connected wallet must be authorized judge.
    Bypasses normal adjournment request process for urgent situations (e.g., court building emergencies, judge illness, natural disasters). Use sparingly.`,
    inputSchema: z.object({
      caseId: z
        .bigint()
        .describe(
          'Unique identifier of the case requiring emergency rescheduling'
        ),
      newHearingDate: z
        .bigint()
        .describe('Emergency new hearing date as Unix timestamp'),
      reason: z
        .string()
        .describe('Emergency reason requiring immediate rescheduling'),
    }),
    execute: async ({ caseId, newHearingDate, reason }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: '⚠️ Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await emergencyReschedule(caseId, newHearingDate, reason)
        return {
          success: true,
          message: `🚨 Emergency rescheduling completed for case ${caseId}. New date: ${new Date(
            Number(newHearingDate) * 1000
          ).toLocaleString()}. Reason: ${reason}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to emergency reschedule: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournment: tool({
    description: `[QUERY] Retrieve complete details of a specific adjournment request. Shows requester, reason, dates, status, and supporting documentation.`,
    inputSchema: z.object({
      adjournmentId: z
        .bigint()
        .describe('Unique identifier of the adjournment'),
    }),
    execute: async ({ adjournmentId }) => {
      try {
        const adjournment = await getAdjournment(adjournmentId)
        return {
          success: true,
          adjournment: {
            adjournmentId: adjournment.adjournmentId.toString(),
            caseId: adjournment.caseId.toString(),
            requestedBy: adjournment.requestedBy,
            reason: adjournment.reason,
            reasonDetails: adjournment.reasonDetails,
            originalHearingDate: adjournment.originalHearingDate.toString(),
            newHearingDate: adjournment.newHearingDate.toString(),
            status: adjournment.status,
            requestDate: adjournment.requestDate.toString(),
            approvalDate: adjournment.approvalDate.toString(),
            approvedBy: adjournment.approvedBy,
            supportingDocumentsCount:
              adjournment.supportingDocumentsText.length,
            supportingDocuments: adjournment.supportingDocumentsText,
          },
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to retrieve adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournments_by_case: tool({
    description: `[QUERY] Get all adjournment IDs for a specific case. Shows complete rescheduling history for a case.`,
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier of the case'),
    }),
    execute: async ({ caseId }) => {
      try {
        const adjournmentIds = await getAdjournmentsByCase(caseId)
        return {
          success: true,
          caseId: caseId.toString(),
          adjournmentCount: adjournmentIds.length,
          adjournmentIds: adjournmentIds.map((id) => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get adjournments for case: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_adjournment_requests: tool({
    description: `[STATISTICS] Get the total number of adjournment requests across all cases. Useful for system statistics and analytics.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalAdjournmentRequests()
        return {
          success: true,
          totalAdjournmentRequests: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get total adjournment requests: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournment_statistics: tool({
    description: `[STATISTICS] Get comprehensive adjournment statistics showing pending, approved, and denied requests. Useful for understanding court scheduling patterns and bottlenecks.`,
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const stats = await getAdjournmentStatistics()
        return {
          success: true,
          statistics: {
            pending: stats.pending.toString(),
            approved: stats.approved.toString(),
            denied: stats.denied.toString(),
          },
          summary: `📊 Adjournment Statistics - Total: ${
            Number(stats.pending) +
            Number(stats.approved) +
            Number(stats.denied)
          } | ⏳ Pending: ${stats.pending} | ✅ Approved: ${
            stats.approved
          } | ❌ Denied: ${stats.denied}`,
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return {
          error: `❌ Failed to get adjournment statistics: ${errorMessage}`,
        }
      }
    },
  }),
}
