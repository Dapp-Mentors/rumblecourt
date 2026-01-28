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
