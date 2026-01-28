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

// Helper to get wallet from context (you'll need to implement this based on your app structure)
// This assumes you have access to the connected wallet
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
  // VERDICT STORAGE TOOLS
  // ============================================

  add_authorized_judge: tool({
    description: 'Add an authorized judge to the verdict storage contract (only owner can call)',
    inputSchema: z.object({
      judgeAddress: z.string().describe('Ethereum address of the judge to authorize'),
    }),
    execute: async ({ judgeAddress }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await addAuthorizedJudge(judgeAddress)
        return {
          success: true,
          message: `Judge ${judgeAddress} has been authorized successfully`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to add authorized judge: ${errorMessage}`,
        }
      }
    },
  }),

  record_verdict: tool({
    description: 'Record a verdict for a case',
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier for the case'),
      verdictType: z.enum(['GUILTY', 'NOT_GUILTY', 'ACQUITTED', 'CONVICTED', 'DISMISSED'])
        .describe('Type of verdict'),
      verdictDetails: z.string().describe('Detailed description of the verdict'),
      reasoning: z.string().describe('Reasoning behind the verdict'),
      supportingDocumentsText: z.array(z.string()).describe('List of supporting document descriptions'),
      isFinal: z.boolean().default(false).describe('Whether this verdict is final'),
    }),
    execute: async ({ caseId, verdictType, verdictDetails, reasoning, supportingDocumentsText, isFinal }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
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
          message: `Verdict recorded successfully for case ${caseId}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to record verdict: ${errorMessage}`,
        }
      }
    },
  }),

  finalize_verdict: tool({
    description: 'Finalize a verdict (mark as final and immutable)',
    inputSchema: z.object({
      verdictId: z.bigint().describe('Unique identifier for the verdict'),
    }),
    execute: async ({ verdictId }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await finalizeVerdict(verdictId)
        return {
          success: true,
          message: `Verdict ${verdictId} has been finalized and is now immutable`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to finalize verdict: ${errorMessage}`,
        }
      }
    },
  }),

  file_appeal: tool({
    description: 'File an appeal against a verdict',
    inputSchema: z.object({
      originalVerdictId: z.bigint().describe('ID of the original verdict to appeal'),
      appealReason: z.string().describe('Reason for filing the appeal'),
      appealDocumentsText: z.array(z.string()).describe('List of appeal document descriptions'),
    }),
    execute: async ({ originalVerdictId, appealReason, appealDocumentsText }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await fileAppeal(originalVerdictId, appealReason, appealDocumentsText)
        return {
          success: true,
          message: `Appeal filed successfully against verdict ${originalVerdictId}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to file appeal: ${errorMessage}`,
        }
      }
    },
  }),

  update_appeal_status: tool({
    description: 'Update appeal status and decision',
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier for the appeal'),
      status: z.enum(['FILED', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'])
        .describe('New status of the appeal'),
      decisionDetails: z.string().describe('Details of the decision'),
    }),
    execute: async ({ appealId, status, decisionDetails }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await updateAppealStatus(appealId, status, decisionDetails)
        return {
          success: true,
          message: `Appeal ${appealId} status updated to ${status}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to update appeal status: ${errorMessage}`,
        }
      }
    },
  }),

  schedule_appeal_hearing: tool({
    description: 'Schedule a hearing date for an appeal',
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier for the appeal'),
      hearingDate: z.bigint().describe('Unix timestamp for the hearing date'),
    }),
    execute: async ({ appealId, hearingDate }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await scheduleAppealHearing(appealId, hearingDate)
        return {
          success: true,
          message: `Hearing scheduled for appeal ${appealId} on ${new Date(Number(hearingDate) * 1000).toLocaleString()}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to schedule appeal hearing: ${errorMessage}`,
        }
      }
    },
  }),

  get_verdict: tool({
    description: 'Get verdict details by ID',
    inputSchema: z.object({
      verdictId: z.bigint().describe('Unique identifier for the verdict'),
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
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get verdict: ${errorMessage}`,
        }
      }
    },
  }),

  get_verdicts_by_case: tool({
    description: 'Get all verdicts for a specific case',
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier for the case'),
    }),
    execute: async ({ caseId }) => {
      try {
        const verdictIds = await getVerdictsByCase(caseId)
        return {
          success: true,
          caseId: caseId.toString(),
          verdictCount: verdictIds.length,
          verdictIds: verdictIds.map(id => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get verdicts for case: ${errorMessage}`,
        }
      }
    },
  }),

  get_appeal: tool({
    description: 'Get appeal details by ID',
    inputSchema: z.object({
      appealId: z.bigint().describe('Unique identifier for the appeal'),
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
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get appeal: ${errorMessage}`,
        }
      }
    },
  }),

  get_appeals_by_verdict: tool({
    description: 'Get all appeals for a specific verdict',
    inputSchema: z.object({
      verdictId: z.bigint().describe('Unique identifier for the verdict'),
    }),
    execute: async ({ verdictId }) => {
      try {
        const appealIds = await getAppealsByVerdict(verdictId)
        return {
          success: true,
          verdictId: verdictId.toString(),
          appealCount: appealIds.length,
          appealIds: appealIds.map(id => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get appeals for verdict: ${errorMessage}`,
        }
      }
    },
  }),

  is_verdict_final: tool({
    description: 'Check if a verdict is final',
    inputSchema: z.object({
      verdictId: z.bigint().describe('Unique identifier for the verdict'),
    }),
    execute: async ({ verdictId }) => {
      try {
        const isFinal = await isVerdictFinal(verdictId)
        return {
          success: true,
          verdictId: verdictId.toString(),
          isFinal,
          message: isFinal ? 'This verdict is final and immutable' : 'This verdict is not final and can be modified',
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to check verdict status: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_verdicts: tool({
    description: 'Get the total number of verdicts recorded',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalVerdicts()
        return {
          success: true,
          totalVerdicts: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get total verdicts: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_appeals: tool({
    description: 'Get the total number of appeals filed',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalAppeals()
        return {
          success: true,
          totalAppeals: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get total appeals: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // ADJOURNMENT TRACKING TOOLS
  // ============================================

  request_adjournment: tool({
    description: 'Request an adjournment for a case hearing',
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier for the case'),
      reason: z.enum(['MEDICAL', 'LEGAL', 'PERSONAL', 'TECHNICAL', 'OTHER'])
        .describe('Reason for requesting adjournment'),
      reasonDetails: z.string().describe('Detailed explanation of the reason'),
      requestedNewDate: z.bigint().describe('Requested new hearing date (Unix timestamp)'),
      supportingDocumentsText: z.array(z.string()).describe('List of supporting document descriptions'),
    }),
    execute: async ({ caseId, reason, reasonDetails, requestedNewDate, supportingDocumentsText }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
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
          message: `Adjournment requested for case ${caseId}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to request adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  approve_adjournment: tool({
    description: 'Approve an adjournment request',
    inputSchema: z.object({
      adjournmentId: z.bigint().describe('Unique identifier for the adjournment request'),
      approvedNewDate: z.bigint().describe('Approved new hearing date (Unix timestamp)'),
      approvalNotes: z.string().describe('Notes explaining the approval'),
    }),
    execute: async ({ adjournmentId, approvedNewDate, approvalNotes }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await approveAdjournment(adjournmentId, approvedNewDate, approvalNotes)
        return {
          success: true,
          message: `Adjournment ${adjournmentId} approved with new date ${new Date(Number(approvedNewDate) * 1000).toLocaleString()}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to approve adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  emergency_reschedule: tool({
    description: 'Emergency reschedule a hearing',
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier for the case'),
      newHearingDate: z.bigint().describe('New hearing date (Unix timestamp)'),
      reason: z.string().describe('Reason for emergency rescheduling'),
    }),
    execute: async ({ caseId, newHearingDate, reason }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await emergencyReschedule(caseId, newHearingDate, reason)
        return {
          success: true,
          message: `Emergency rescheduling completed for case ${caseId}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to emergency reschedule: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournment: tool({
    description: 'Get adjournment details by ID',
    inputSchema: z.object({
      adjournmentId: z.bigint().describe('Unique identifier for the adjournment'),
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
            supportingDocumentsCount: adjournment.supportingDocumentsText.length,
            supportingDocuments: adjournment.supportingDocumentsText,
          },
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get adjournment: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournments_by_case: tool({
    description: 'Get all adjournments for a specific case',
    inputSchema: z.object({
      caseId: z.bigint().describe('Unique identifier for the case'),
    }),
    execute: async ({ caseId }) => {
      try {
        const adjournmentIds = await getAdjournmentsByCase(caseId)
        return {
          success: true,
          caseId: caseId.toString(),
          adjournmentCount: adjournmentIds.length,
          adjournmentIds: adjournmentIds.map(id => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get adjournments for case: ${errorMessage}`,
        }
      }
    },
  }),

  get_total_adjournment_requests: tool({
    description: 'Get the total number of adjournment requests',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalAdjournmentRequests()
        return {
          success: true,
          totalAdjournmentRequests: total.toString(),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get total adjournment requests: ${errorMessage}`,
        }
      }
    },
  }),

  get_adjournment_statistics: tool({
    description: 'Get adjournment statistics',
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
          summary: `Total: ${Number(stats.pending) + Number(stats.approved) + Number(stats.denied)}, Pending: ${stats.pending}, Approved: ${stats.approved}, Denied: ${stats.denied}`,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get adjournment statistics: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // COURTROOM PARTICIPANTS TOOLS
  // ============================================

  create_participant_profile: tool({
    description: 'Create a participant profile',
    inputSchema: z.object({
      participantAddress: z.string().describe('Ethereum address of the participant'),
      participantType: z.enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe('Type of participant'),
      llmProvider: z.string().describe('LLM provider name'),
      llmModel: z.string().describe('LLM model identifier'),
      llmModelName: z.string().describe('LLM model display name'),
      expertiseLevel: z.number().int().min(1).max(10).describe('Expertise level (1-10)'),
      eloquenceScore: z.number().int().min(1).max(10).describe('Eloquence score (1-10)'),
      analyticalScore: z.number().int().min(1).max(10).describe('Analytical score (1-10)'),
      emotionalIntelligence: z.number().int().min(1).max(10).describe('Emotional intelligence score (1-10)'),
      traits: z.string().describe('JSON string describing participant traits'),
    }),
    execute: async ({ participantAddress, participantType, llmProvider, llmModel, llmModelName, expertiseLevel, eloquenceScore, analyticalScore, emotionalIntelligence, traits }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
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
          message: `Participant profile created for ${participantAddress}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to create participant profile: ${errorMessage}`,
        }
      }
    },
  }),

  create_court: tool({
    description: 'Create a court',
    inputSchema: z.object({
      courtName: z.string().describe('Name of the court'),
      description: z.string().describe('Description of the court'),
    }),
    execute: async ({ courtName, description }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await createCourt(courtName, description)
        return {
          success: true,
          message: `Court "${courtName}" created successfully`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to create court: ${errorMessage}`,
        }
      }
    },
  }),

  assign_participant_to_court: tool({
    description: 'Assign a participant to a court',
    inputSchema: z.object({
      courtId: z.bigint().describe('Unique identifier for the court'),
      profileId: z.bigint().describe('Unique identifier for the participant profile'),
      participantType: z.enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe('Type of participant being assigned'),
    }),
    execute: async ({ courtId, profileId, participantType }) => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          error: 'Wallet not connected. Please connect your wallet first.',
        }
      }

      try {
        const tx = await assignParticipantToCourt(courtId, profileId, participantType)
        return {
          success: true,
          message: `Participant ${profileId} assigned to court ${courtId} as ${participantType}`,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to assign participant to court: ${errorMessage}`,
        }
      }
    },
  }),

  is_court_complete: tool({
    description: 'Check if a court is complete (has all required participants)',
    inputSchema: z.object({
      courtId: z.bigint().describe('Unique identifier for the court'),
    }),
    execute: async ({ courtId }) => {
      try {
        const isComplete = await isCourtComplete(courtId)
        return {
          success: true,
          courtId: courtId.toString(),
          isComplete,
          message: isComplete ? 'Court is complete and ready for proceedings' : 'Court is incomplete - missing required participants',
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to check court completion status: ${errorMessage}`,
        }
      }
    },
  }),

  get_court_participants_by_role: tool({
    description: 'Get court participants by role',
    inputSchema: z.object({
      courtId: z.bigint().describe('Unique identifier for the court'),
      participantType: z.enum(['JUDGE', 'PROSECUTOR', 'DEFENSE_ATTORNEY', 'CLERK'])
        .describe('Type of participant to retrieve'),
    }),
    execute: async ({ courtId, participantType }) => {
      try {
        const profileIds = await getCourtParticipantsByRole(courtId, participantType)
        return {
          success: true,
          courtId: courtId.toString(),
          participantType,
          participantCount: profileIds.length,
          profileIds: profileIds.map(id => id.toString()),
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          error: `Failed to get court participants: ${errorMessage}`,
        }
      }
    },
  }),

  // ============================================
  // UTILITY TOOLS
  // ============================================

  get_connected_wallet: tool({
    description: 'Get information about the currently connected wallet',
    inputSchema: z.object({}),
    execute: async () => {
      if (!walletContext.connected || !walletContext.address) {
        return {
          connected: false,
          message: 'No wallet connected',
        }
      }

      return {
        connected: true,
        address: walletContext.address,
        message: 'Wallet is connected',
      }
    },
  }),
}