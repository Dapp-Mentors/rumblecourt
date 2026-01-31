import { tool } from 'ai'
import { z } from 'zod'
import {
  fileCase,
  getCase,
  getUserCases,
  getTotalCases,
  startTrial,
  recordVerdict,
  getVerdict,
  hasVerdict,
  appealCase,
  getOwner,
  getContractAddressExport,
} from '../services/blockchain'

// Wallet context to track connection status
let walletContext: {
  isConnected: boolean
  address: string | null
  isOwner: boolean
} = {
  isConnected: false,
  address: null,
  isOwner: false,
}

/**
 * Set wallet context for MCP tools
 * This should be called whenever wallet connection state changes
 */
export const setWalletContext = (
  isConnected: boolean,
  address: string | null,
  isOwner: boolean,
): void => {
  walletContext = { isConnected, address, isOwner }
}

/**
 * Helper to check wallet connection before write operations
 */
const requireWallet = (): { error?: string } => {
  if (!walletContext.isConnected || !walletContext.address) {
    return {
      error:
        'Wallet not connected. Please connect your wallet to perform this action.',
    }
  }
  return {}
}

/**
 * Helper to check owner status for privileged operations
 */
const requireOwner = (): { error?: string } => {
  const walletCheck = requireWallet()
  if (walletCheck.error) return walletCheck

  if (!walletContext.isOwner) {
    return {
      error:
        'This operation requires system owner privileges. Only the contract owner can perform this action.',
    }
  }
  return {}
}

/**
 * Format transaction response
 */
const formatTxResponse = (
  tx: { hash: string; blockNumber?: number | null },
  message: string,
  additionalData?: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    success: true,
    message,
    transactionHash: tx.hash,
    blockNumber: tx.blockNumber ?? undefined,
    ...additionalData,
  }
}

/**
 * Format error response
 */
const formatError = (
  error: unknown,
  context: string,
): Record<string, unknown> => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return {
    success: false,
    error: `${context}: ${errorMessage}`,
  }
}

// ============================================
// MCP TOOLS DEFINITION
// ============================================

export const rumbleCourtMcpTools = {
  // ============================================
  // WALLET TOOLS
  // ============================================

  get_connected_wallet: tool({
    description:
      'Get information about the currently connected wallet and its connection status',
    inputSchema: z.object({}),
    execute: async () => {
      if (!walletContext.isConnected || !walletContext.address) {
        return {
          connected: false,
          message:
            'No wallet connected. Please connect your wallet to use RumbleCourt.',
        }
      }

      return {
        connected: true,
        address: walletContext.address,
        isOwner: walletContext.isOwner,
        message: 'Wallet is connected and ready',
        contractAddress: getContractAddressExport(),
      }
    },
  }),

  // ============================================
  // CASE FILING TOOLS (WRITE OPERATIONS)
  // ============================================

  file_case: tool({
    description:
      'File a new case on the blockchain. Requires wallet connection. Provide a case title and evidence hash/description.',
    inputSchema: z.object({
      caseTitle: z.string().describe('Title or summary of the legal case'),
      evidenceHash: z.string().describe('IPFS hash or description of evidence'),
    }),
    execute: async ({ caseTitle, evidenceHash }) => {
      const walletCheck = requireWallet()
      if (walletCheck.error) return walletCheck

      try {
        const tx = await fileCase(caseTitle, evidenceHash)

        return formatTxResponse(tx, `Case "${caseTitle}" filed successfully`, {
          caseTitle,
          evidenceHash,
          plaintiff: walletContext.address,
          nextSteps:
            'Your case has been filed and is now PENDING. The system owner will start the trial, and AI agents will debate your case.',
        })
      } catch (error) {
        return formatError(error, 'Failed to file case')
      }
    },
  }),

  // ============================================
  // CASE QUERY TOOLS (READ OPERATIONS)
  // ============================================

  get_case: tool({
    description: 'Get detailed information about a specific case by its ID',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID to query'),
    }),
    execute: async ({ caseId }) => {
      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)
        const caseData = await getCase(id)

        return {
          success: true,
          case: {
            caseId: caseData.caseId.toString(),
            plaintiff: caseData.plaintiff,
            caseTitle: caseData.caseTitle,
            evidenceHash: caseData.evidenceHash,
            filedAt: new Date(Number(caseData.filedAt) * 1000).toLocaleString(),
            status: caseData.status,
          },
        }
      } catch (error) {
        return formatError(error, 'Failed to get case')
      }
    },
  }),

  get_user_cases: tool({
    description: 'Get all cases filed by a specific user address',
    inputSchema: z.object({
      userAddress: z
        .string()
        .optional()
        .describe('User address (defaults to connected wallet)'),
    }),
    execute: async ({ userAddress }) => {
      const address = userAddress || walletContext.address

      if (!address) {
        return {
          error: 'No user address provided and no wallet connected',
        }
      }

      try {
        const caseIds = await getUserCases(address)

        return {
          success: true,
          count: caseIds.length,
          caseIds: caseIds.map((id) => id.toString()),
          message: `Found ${caseIds.length} case(s) filed by ${address}`,
        }
      } catch (error) {
        return formatError(error, 'Failed to get user cases')
      }
    },
  }),

  get_total_cases: tool({
    description: 'Get the total number of cases filed in the system',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const total = await getTotalCases()

        return {
          success: true,
          totalCases: total.toString(),
          message: `Total cases in the system: ${total}`,
        }
      } catch (error) {
        return formatError(error, 'Failed to get total cases')
      }
    },
  }),

  // ============================================
  // TRIAL MANAGEMENT TOOLS (WRITE OPERATIONS - OWNER ONLY)
  // ============================================

  start_trial: tool({
    description:
      'Start a trial for a pending case. Only the system owner can perform this action.',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID to start trial for'),
    }),
    execute: async ({ caseId }) => {
      const ownerCheck = requireOwner()
      if (ownerCheck.error) return ownerCheck

      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)
        const tx = await startTrial(id)

        return formatTxResponse(tx, `Trial started for case ${caseId}`, {
          caseId: caseId.toString(),
          nextSteps:
            'The trial has begun. AI lawyers will now debate this case off-chain, and a verdict will be recorded once complete.',
        })
      } catch (error) {
        return formatError(error, 'Failed to start trial')
      }
    },
  }),

  record_verdict: tool({
    description:
      'Record an AI-generated verdict for a case in trial. Only the system owner can perform this action.',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID'),
      verdictType: z
        .number()
        .min(0)
        .max(3)
        .describe(
          'Verdict type: 0=GUILTY, 1=NOT_GUILTY, 2=SETTLEMENT, 3=DISMISSED',
        ),
      reasoning: z.string().describe('AI judge reasoning for the verdict'),
      isFinal: z
        .boolean()
        .describe('Whether this verdict is final (if true, can be appealed)'),
    }),
    execute: async ({ caseId, verdictType, reasoning, isFinal }) => {
      const ownerCheck = requireOwner()
      if (ownerCheck.error) return ownerCheck

      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)
        const tx = await recordVerdict(id, verdictType, reasoning, isFinal)

        const verdictTypeNames = [
          'GUILTY',
          'NOT_GUILTY',
          'SETTLEMENT',
          'DISMISSED',
        ]

        return formatTxResponse(tx, `Verdict recorded for case ${caseId}`, {
          caseId: caseId.toString(),
          verdict: {
            type: verdictTypeNames[verdictType],
            reasoning,
            isFinal,
          },
          nextSteps: isFinal
            ? 'This verdict is final and can be appealed by the plaintiff if desired.'
            : 'This verdict is not final. Additional proceedings may be needed.',
        })
      } catch (error) {
        return formatError(error, 'Failed to record verdict')
      }
    },
  }),

  // ============================================
  // VERDICT QUERY TOOLS (READ OPERATIONS)
  // ============================================

  get_verdict: tool({
    description: 'Get the verdict details for a case',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID'),
    }),
    execute: async ({ caseId }) => {
      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)
        const verdict = await getVerdict(id)

        return {
          success: true,
          verdict: {
            caseId: verdict.caseId.toString(),
            verdictType: verdict.verdictType,
            reasoning: verdict.reasoning,
            timestamp: new Date(
              Number(verdict.timestamp) * 1000,
            ).toLocaleString(),
            isFinal: verdict.isFinal,
          },
        }
      } catch (error) {
        return formatError(error, 'Failed to get verdict')
      }
    },
  }),

  has_verdict: tool({
    description: 'Check if a case has a verdict recorded',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID'),
    }),
    execute: async ({ caseId }) => {
      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)
        const hasVerdictResult = await hasVerdict(id)

        return {
          success: true,
          caseId: caseId.toString(),
          hasVerdict: hasVerdictResult,
          message: hasVerdictResult
            ? 'This case has a verdict recorded'
            : 'No verdict has been recorded for this case yet',
        }
      } catch (error) {
        return formatError(error, 'Failed to check verdict status')
      }
    },
  }),

  // ============================================
  // APPEAL TOOLS (WRITE OPERATIONS)
  // ============================================

  appeal_case: tool({
    description:
      'Appeal a completed case with a final verdict. Only the plaintiff can appeal their case.',
    inputSchema: z.object({
      caseId: z
        .union([z.string(), z.number(), z.bigint()])
        .describe('The case ID to appeal'),
    }),
    execute: async ({ caseId }) => {
      const walletCheck = requireWallet()
      if (walletCheck.error) return walletCheck

      try {
        const id = typeof caseId === 'bigint' ? caseId : BigInt(caseId)

        // Verify case is completed and has final verdict
        const caseData = await getCase(id)

        if (caseData.status !== 'COMPLETED') {
          return {
            error: `Cannot appeal case ${caseId}. Case status is ${caseData.status}, but must be COMPLETED to appeal.`,
          }
        }

        if (
          caseData.plaintiff.toLowerCase() !==
          walletContext.address?.toLowerCase()
        ) {
          return {
            error: 'Only the plaintiff can appeal their case.',
          }
        }

        const tx = await appealCase(id)

        return formatTxResponse(tx, `Appeal filed for case ${caseId}`, {
          caseId: caseId.toString(),
          nextSteps:
            'Your appeal has been filed. The case status is now APPEALED and will be reviewed.',
        })
      } catch (error) {
        return formatError(error, 'Failed to appeal case')
      }
    },
  }),

  // ============================================
  // SYSTEM INFO TOOLS (READ OPERATIONS)
  // ============================================

  get_system_owner: tool({
    description: 'Get the address of the system owner (contract owner)',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const owner = await getOwner()

        return {
          success: true,
          owner,
          message: `System owner address: ${owner}`,
        }
      } catch (error) {
        return formatError(error, 'Failed to get system owner')
      }
    },
  }),
}
