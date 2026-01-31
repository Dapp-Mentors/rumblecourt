// Simplified types for the minimal RumbleCourt contract

// Case Status Enum
export enum CaseStatus {
  PENDING = 0,
  IN_TRIAL = 1,
  COMPLETED = 2,
  APPEALED = 3,
}

// Verdict Type Enum
export enum VerdictType {
  GUILTY = 0,
  NOT_GUILTY = 1,
  SETTLEMENT = 2,
  DISMISSED = 3,
}

// Case interface
export interface Case {
  caseId: bigint
  plaintiff: string
  caseTitle: string
  evidenceHash: string
  filedAt: bigint
  status: CaseStatus
}

// Verdict interface
export interface Verdict {
  caseId: bigint
  verdictType: VerdictType
  reasoning: string
  timestamp: bigint
  isFinal: boolean
}

// Transaction receipt
export interface TransactionReceipt {
  hash: string
  blockNumber: number
  from: string
  to: string
  gasUsed: bigint
  status: 'success' | 'reverted'
}

// Evidence interface for chat messages
export interface Evidence {
  description: string
  content: string
}

// Chat message for UI
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  timestampString: string
  evidence?: Evidence
}

// Tool execution result
export interface ToolResult {
  success: boolean
  message?: string
  error?: string
  data?: unknown
  transactionHash?: string
  blockNumber?: number
}

// Wallet context
export interface WalletContextType {
  isConnected: boolean
  address: string | null
  chainId: number | undefined
  isOwner: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

// Case display for UI
export interface CaseDisplay {
  id: string
  caseId: bigint
  title: string
  plaintiff: string
  evidenceHash: string
  filedAt: Date
  status: 'PENDING' | 'IN_TRIAL' | 'COMPLETED' | 'APPEALED'
  verdict?: {
    verdictType: 'GUILTY' | 'NOT_GUILTY' | 'SETTLEMENT' | 'DISMISSED'
    reasoning: string
    timestamp: Date
    isFinal: boolean
  }
}

// MCP Tool parameter types
export interface FileCaseParams {
  caseTitle: string
  evidenceHash: string
}

export interface GetCaseParams {
  caseId: bigint
}

export interface StartTrialParams {
  caseId: bigint
}

export interface RecordVerdictParams {
  caseId: bigint
  verdictType: '0' | '1' | '2' | '3'
  reasoning: string
  isFinal: boolean
}

export interface AppealCaseParams {
  caseId: bigint
}

export interface GetUserCasesParams {
  userAddress: string
}

// OpenRouter API types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      tool_calls?: ToolCall[]
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Contract event types
export interface CaseFiledEvent {
  caseId: bigint
  plaintiff: string
  caseTitle: string
  filedAt: bigint
}

export interface TrialStartedEvent {
  caseId: bigint
  startedAt: bigint
}

export interface VerdictRecordedEvent {
  caseId: bigint
  verdictType: VerdictType
  isFinal: boolean
  timestamp: bigint
}

export interface CaseAppealedEvent {
  caseId: bigint
  plaintiff: string
  appealedAt: bigint
}

// Helper type for blockchain service responses
export interface BlockchainResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  transactionHash?: string
  blockNumber?: number
}

// Statistics types
export interface SystemStatistics {
  totalCases: bigint
  pendingCases: number
  activeCases: number
  completedCases: number
  appealedCases: number
}

// Error types
export class ContractError extends Error {
  constructor(
    message: string,
    public code?: string,
    public transactionHash?: string,
  ) {
    super(message)
    this.name = 'ContractError'
  }
}

export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'WalletError'
  }
}
