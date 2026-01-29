// Types for the courtroom page
export interface Case {
  id: string;
  title: string;
  description: string;
  plaintiff: string;
  defendant: string;
  evidence: Evidence[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  verdict?: string;
}

export interface Evidence {
  id: string;
  type: 'text' | 'document';
  content: string;
  description: string;
  submittedBy: 'plaintiff' | 'defendant';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'plaintiff' | 'defendant' | 'judge' | 'system';
  content: string;
  timestamp: Date;
  timestampString: string;
  evidence?: Evidence;
}

// MCP Tool Types
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content?: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
}

export interface VerdictData {
  caseId: string;
  verdictId: string;
  judge: string;
  verdictType: string;
  verdictDetails: string;
  reasoning: string;
  timestamp: string;
  isFinal: boolean;
  supportingDocumentsCount: number;
  supportingDocuments: string[];
}

export interface AppealData {
  appealId: string;
  originalVerdictId: string;
  appellant: string;
  appealReason: string;
  status: string;
  filingDate: string;
  hearingDate: string;
  appealDocumentsCount: number;
  appealDocuments: string[];
}

export interface AdjournmentData {
  adjournmentId: string;
  caseId: string;
  requestedBy: string;
  reason: string;
  reasonDetails: string;
  originalHearingDate: string;
  newHearingDate: string;
  status: string;
  requestDate: string;
  approvalDate: string;
  approvedBy: string;
  supportingDocumentsCount: number;
  supportingDocuments: string[];
}

export interface ParticipantData {
  participantAddress: string;
  participantType: string;
  llmProvider: string;
  llmModel: string;
  llmModelName: string;
  expertiseLevel: number;
  eloquenceScore: number;
  analyticalScore: number;
  emotionalIntelligence: number;
  traits: string;
}

export interface CourtData {
  courtId: string;
  courtName: string;
  description: string;
  participants: ParticipantData[];
  isComplete: boolean;
}
