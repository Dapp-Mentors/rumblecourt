import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { courtroomMcpTools, setWalletContext } from '../lib/courtroom-mcp-tools';
import { config } from '../lib/wagmi';
import {
  Case,
  ChatMessage,
  OpenAIMessage,
  OpenAIResponse,
  VerdictData,
  AppealData,
  AdjournmentData,
  ParticipantData,
  CourtData
} from '../components/types';

// Define proper types for tool-related parameters
interface ToolExecutionContext {
  toolCallId: string;
  messages: ChatMessage[];
}

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface ZodTypeDef {
  typeName: string;
  description?: string;
  values?: string[] | Set<string>;
  innerType?: { _def: ZodTypeDef };
  shape?: Record<string, unknown> | (() => Record<string, unknown>);
}

interface ZodType {
  _def: ZodTypeDef;
}

interface ToolSchema {
  _def: ZodTypeDef;
}

interface CourtroomContextType {
  // State
  cases: Case[];
  currentCase: Case | null;
  messages: ChatMessage[];
  isProcessing: boolean;
  selectedTool: string | null;

  // MCP Tools
  courtroomTools: typeof courtroomMcpTools;

  // Actions
  setCurrentCase: (caseId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setSelectedTool: (tool: string | null) => void;
  processCommand: (command: string) => Promise<void>;

  // Tool execution helpers
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
  formatToolResponse: (toolName: string, toolArgs: Record<string, unknown>, toolOutput: unknown) => string;
}

const CourtroomContext = createContext<CourtroomContextType | undefined>(undefined);

export const useCourtroom = (): CourtroomContextType => {
  const context = useContext(CourtroomContext);
  if (context === undefined) {
    throw new Error('useCourtroom must be used within a CourtroomProvider');
  }
  return context;
};

interface CourtroomProviderProps {
  children: ReactNode;
}

export const CourtroomProvider: React.FC<CourtroomProviderProps> = ({ children }) => {
  const { isConnected, address, chainId } = useWallet();

  // State
  const [cases] = useState<Case[]>([
    {
      id: 'case-001',
      title: 'Contract Breach Dispute',
      description: 'Dispute over alleged breach of service contract terms and payment obligations.',
      plaintiff: 'TechCorp Solutions',
      defendant: 'Global Services Inc.',
      evidence: [
        {
          id: 'ev-001',
          type: 'document',
          content: 'Contract signed on 2024-01-15 with 6-month term',
          description: 'Original service agreement',
          submittedBy: 'plaintiff'
        }
      ],
      status: 'completed',
      createdAt: new Date('2024-01-15'),
      verdict: 'Plaintiff awarded $50,000 in damages'
    },
    {
      id: 'case-002',
      title: 'IP Infringement Claim',
      description: 'Alleged copyright violation in software development',
      plaintiff: 'InnovateSoft Inc.',
      defendant: 'CodeMasters LLC',
      evidence: [],
      status: 'active',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'case-003',
      title: 'Employment Contract Dispute',
      description: 'Breach of non-compete agreement',
      plaintiff: 'Sarah Johnson',
      defendant: 'TechStart Corp',
      evidence: [],
      status: 'draft',
      createdAt: new Date('2024-01-18')
    }
  ]);

  const [currentCase, setCurrentCaseState] = useState<Case | null>(cases[0]);
  const [messages, setMessagesState] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Welcome to RumbleCourt AI - Your Blockchain-Powered Legal Companion! 🏛️

I'm here to help you navigate the complete courtroom workflow. To get started, you'll need to:

**📋 FOUNDATIONAL SETUP (Do these first):**
1. **Connect Your Wallet** - Essential for all blockchain operations
2. **Create Participant Profiles** - Define judges, prosecutors, defense attorneys, and clerks
3. **Establish a Court** - Set up your courtroom with proper participants

**⚖️ COURTROOM OPERATIONS (After setup):**
4. Record verdicts and decisions
5. File appeals if needed
6. Request adjournments
7. Manage ongoing cases

**💡 Quick Start Examples:**
- "Help me set up my first court"
- "Create a participant profile"
- "Show me the courtroom workflow"
- "What do I need before recording a verdict?"

Let's build your blockchain courtroom together!`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    }
  ]);
  const [isProcessing, setIsProcessingState] = useState(false);
  const [selectedTool, setSelectedToolState] = useState<string | null>(null);

  // Update wallet context when wallet changes
  useEffect(() => {
    setWalletContext(isConnected, address || null);
  }, [isConnected, address]);

  // MCP Tools
  const courtroomTools = courtroomMcpTools;

  const setCurrentCase = (caseId: string | null): void => {
    if (caseId) {
      const selected = cases.find(c => c.id === caseId);
      setCurrentCaseState(selected || null);
    } else {
      setCurrentCaseState(null);
    }
  };

  const addMessage = (message: ChatMessage): void => {
    setMessagesState(prev => [...prev, message]);
  };

  const setMessages = (newMessages: ChatMessage[]): void => {
    setMessagesState(newMessages);
  };

  const setIsProcessing = (processing: boolean): void => {
    setIsProcessingState(processing);
  };

  const setSelectedTool = (tool: string | null): void => {
    setSelectedToolState(tool);
  };

  const getOpenAITools = (): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, unknown>;
        required: string[];
      };
    };
  }> => {
    return Object.entries(courtroomTools).map(([name, tool]) => {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      try {
        const schema = (tool.inputSchema as unknown) as ToolSchema | undefined;

        if (schema && typeof schema === 'object' && '_def' in schema) {
          const def = schema._def;

          if (def.typeName === 'ZodObject' && def.shape) {
            const shape = typeof def.shape === 'function' ? def.shape() : def.shape;

            Object.entries(shape).forEach(([key, zodType]) => {
              if (!zodType || typeof zodType !== 'object' || !('_def' in zodType)) {
                return;
              }

              const zodTypeObj = zodType as ZodType;
              const innerDef = zodTypeObj._def;
              let actualDef = innerDef;
              let isOptional = false;

              if (innerDef.typeName === 'ZodOptional') {
                isOptional = true;
                actualDef = innerDef.innerType?._def || innerDef;
              }

              let type: 'string' | 'number' | 'boolean' | 'object' | 'array' = 'string';
              if (actualDef.typeName === 'ZodString') type = 'string';
              else if (actualDef.typeName === 'ZodNumber') type = 'number';
              else if (actualDef.typeName === 'ZodBoolean') type = 'boolean';
              else if (actualDef.typeName === 'ZodObject') type = 'object';
              else if (actualDef.typeName === 'ZodArray') type = 'array';

              properties[key] = {
                type,
                description: actualDef.description || innerDef.description || `${key} parameter`,
              };

              if (actualDef.typeName === 'ZodEnum' && actualDef.values) {
                (properties[key] as Record<string, unknown>).enum = Array.isArray(actualDef.values)
                  ? actualDef.values
                  : Array.from(actualDef.values);
              }

              if (!isOptional) {
                required.push(key);
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing schema for ${name}:`, error);
      }

      return {
        type: 'function' as const,
        function: {
          name,
          description: tool.description || 'No description provided.',
          parameters: {
            type: 'object',
            properties,
            required,
          },
        },
      };
    });
  };

  const formatVerdictSection = (lines: string[], verdict: VerdictData): void => {
    lines.push('### ⚖️ Verdict Details');
    lines.push('');
    lines.push(`**Case ID**: ${verdict.caseId}`);
    lines.push(`**Verdict Type**: ${verdict.verdictType}`);
    lines.push(`**Judge**: ${verdict.judge}`);
    lines.push(`**Final**: ${verdict.isFinal ? 'Yes' : 'No'}`);
    lines.push(`**Timestamp**: ${new Date(Number(verdict.timestamp) * 1000).toLocaleString()}`);
    lines.push('');
    lines.push('**Details**:');
    lines.push(verdict.verdictDetails);
    lines.push('');
    lines.push('**Reasoning**:');
    lines.push(verdict.reasoning);
    lines.push('');
  };

  const formatAppealSection = (lines: string[], appeal: AppealData): void => {
    lines.push('### 📋 Appeal Details');
    lines.push('');
    lines.push(`**Appeal ID**: ${appeal.appealId}`);
    lines.push(`**Original Verdict ID**: ${appeal.originalVerdictId}`);
    lines.push(`**Appellant**: ${appeal.appellant}`);
    lines.push(`**Status**: ${appeal.status}`);
    lines.push(`**Filing Date**: ${new Date(Number(appeal.filingDate) * 1000).toLocaleString()}`);
    lines.push('');
    lines.push('**Reason**:');
    lines.push(appeal.appealReason);
    lines.push('');
  };

  const formatAdjournmentSection = (lines: string[], adjournment: AdjournmentData): void => {
    lines.push('### 📅 Adjournment Details');
    lines.push('');
    lines.push(`**Adjournment ID**: ${adjournment.adjournmentId}`);
    lines.push(`**Case ID**: ${adjournment.caseId}`);
    lines.push(`**Requested By**: ${adjournment.requestedBy}`);
    lines.push(`**Reason**: ${adjournment.reason}`);
    lines.push(`**Status**: ${adjournment.status}`);
    lines.push(`**Original Date**: ${new Date(Number(adjournment.originalHearingDate) * 1000).toLocaleString()}`);
    lines.push(`**New Date**: ${new Date(Number(adjournment.newHearingDate) * 1000).toLocaleString()}`);
    lines.push('');
  };

  const formatParticipantSection = (lines: string[], participant: ParticipantData): void => {
    lines.push('### 👥 Participant Details');
    lines.push('');
    lines.push(`**Address**: ${participant.participantAddress}`);
    lines.push(`**Type**: ${participant.participantType}`);
    lines.push(`**LLM Provider**: ${participant.llmProvider}`);
    lines.push(`**Model**: ${participant.llmModel}`);
    lines.push(`**Expertise Level**: ${participant.expertiseLevel}/10`);
    lines.push(`**Eloquence Score**: ${participant.eloquenceScore}/10`);
    lines.push(`**Analytical Score**: ${participant.analyticalScore}/10`);
    lines.push(`**Emotional Intelligence**: ${participant.emotionalIntelligence}/10`);
    lines.push('');
  };

  const formatCourtSection = (lines: string[], court: CourtData): void => {
    lines.push('### 🏛️ Court Details');
    lines.push('');
    lines.push(`**Court ID**: ${court.courtId}`);
    lines.push(`**Name**: ${court.courtName}`);
    lines.push(`**Description**: ${court.description}`);
    lines.push(`**Complete**: ${court.isComplete ? '✅ Yes - Ready for proceedings' : '❌ No - Missing required participants'}`);
    lines.push(`**Participants**: ${court.participants.length}`);
    lines.push('');
  };

  const formatAdditionalDetails = (lines: string[], outputData: Record<string, unknown>): void => {
    const displayedKeys = ['success', 'message', 'transactionHash', 'verdictId', 'appealId', 'adjournmentId', 'verdict', 'appeal', 'adjournment', 'participant', 'court', 'error'];
    const remainingKeys = Object.keys(outputData).filter(key => !displayedKeys.includes(key));

    if (remainingKeys.length > 0) {
      lines.push('### 📊 Additional Details');
      lines.push('');
      remainingKeys.forEach(key => {
        const value = outputData[key];
        if (typeof value === 'object' && value !== null) {
          lines.push(`- **${key}**: \`${JSON.stringify(value)}\``);
        } else {
          lines.push(`- **${key}**: ${value}`);
        }
      });
      lines.push('');
    }
  };

  const formatToolResponse = (toolName: string, toolArgs: Record<string, unknown>, toolOutput: unknown): string => {
    const lines: string[] = [];

    let outputData: Record<string, unknown> = {};
    if (typeof toolOutput === 'string') {
      try {
        outputData = JSON.parse(toolOutput);
      } catch {
        outputData = { result: toolOutput };
      }
    } else if (typeof toolOutput === 'object' && toolOutput !== null) {
      outputData = toolOutput as Record<string, unknown>;
    }

    if ('error' in outputData) {
      lines.push('');
      lines.push(`### ❌ Error`);
      lines.push('');
      lines.push(`${outputData.error}`);
      lines.push('');
      return lines.join('\n');
    }

    if ('success' in outputData && !outputData.success) {
      lines.push('');
      lines.push(`### ⚠️ Operation Failed`);
      lines.push('');
      if ('message' in outputData) {
        lines.push(`${outputData.message}`);
      }
      lines.push('');
      return lines.join('\n');
    }

    lines.push('');
    lines.push('### ✅ Operation Successful');
    lines.push('');

    if ('message' in outputData && outputData.message) {
      lines.push(`📝 ${outputData.message}`);
      lines.push('');
    }

    if ('transactionHash' in outputData && outputData.transactionHash) {
      lines.push(`🔗 **Transaction ID**: \`${outputData.transactionHash}\``);
    }

    if ('verdictId' in outputData && outputData.verdictId) {
      lines.push(`⚖️ **Verdict ID**: \`${outputData.verdictId}\``);
    }

    if ('appealId' in outputData && outputData.appealId) {
      lines.push(`📋 **Appeal ID**: \`${outputData.appealId}\``);
    }

    if ('adjournmentId' in outputData && outputData.adjournmentId) {
      lines.push(`📅 **Adjournment ID**: \`${outputData.adjournmentId}\``);
    }

    if ('transactionHash' in outputData || 'verdictId' in outputData || 'appealId' in outputData || 'adjournmentId' in outputData) {
      lines.push('');
    }

    if ('verdict' in outputData && typeof outputData.verdict === 'object') {
      formatVerdictSection(lines, outputData.verdict as VerdictData);
    }

    if ('appeal' in outputData && typeof outputData.appeal === 'object') {
      formatAppealSection(lines, outputData.appeal as AppealData);
    }

    if ('adjournment' in outputData && typeof outputData.adjournment === 'object') {
      formatAdjournmentSection(lines, outputData.adjournment as AdjournmentData);
    }

    if ('participant' in outputData && typeof outputData.participant === 'object') {
      formatParticipantSection(lines, outputData.participant as ParticipantData);
    }

    if ('court' in outputData && typeof outputData.court === 'object') {
      formatCourtSection(lines, outputData.court as CourtData);
    }

    formatAdditionalDetails(lines, outputData);

    return lines.join('\n');
  };

  const executeTool = async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    try {
      const tool = courtroomTools[toolName as keyof typeof courtroomTools];
      if (!tool || !tool.execute) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const context: ToolExecutionContext = {
        toolCallId: `tool-${Date.now()}`,
        messages: []
      };

      // Cast execute to a typed function to satisfy differing tool input types at call sites
      type ToolExecuteFn = (args: Record<string, unknown>, ctx: ToolExecutionContext) => Promise<unknown> | AsyncIterable<unknown> | unknown;
      const exec = tool.execute as unknown as ToolExecuteFn;
      const result = await exec(args, context);

      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        let str = '';
        for await (const chunk of result as AsyncIterable<unknown>) {
          if (typeof chunk === 'string') str += chunk;
        }
        return str;
      }

      return result;
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      return { error: (error as Error).message };
    }
  };

  const processCommand = async (command: string): Promise<void> => {
    setIsProcessingState(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: command,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    };
    setMessagesState(prev => [...prev, userMessage]);

    try {
      // Check if user wants to use a specific tool
      const toolMatch = command.match(/use\s+(.+?)\s+tool/i);
      if (toolMatch) {
        const toolName = toolMatch[1].toLowerCase().replace(/\s+/g, '_');
        setSelectedToolState(toolName);
        addMessage({
          id: `msg-${Date.now()}-tool`,
          role: 'system',
          content: `Selected tool: ${toolName}. Please provide the required parameters.`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });
        return;
      }

      // Check if user is providing tool parameters
      if (selectedTool && command.includes(':')) {
        const tool = courtroomTools[selectedTool as keyof typeof courtroomTools];
        if (tool) {
          // Parse parameters from command
          const params: Record<string, unknown> = {};
          const paramMatches = command.match(/(\w+)\s*:\s*([^,]+)/g);

          if (paramMatches) {
            paramMatches.forEach(match => {
              const [key, value] = match.split(':').map(s => s.trim());
              params[key] = isNaN(Number(value)) ? value : Number(value);
            });
          }

          const result = await executeTool(selectedTool, params);
          const formattedResponse = formatToolResponse(selectedTool, params, result);

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-a`,
            role: 'assistant',
            content: formattedResponse,
            timestamp: new Date(),
            timestampString: new Date().toLocaleTimeString()
          };
          setMessagesState(prev => [...prev, assistantMessage]);
          setSelectedToolState(null);
          return;
        }
      }

      // Use OpenRouter API for command processing
      const response = await processCommandWithOpenRouter(command);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      };

      setMessagesState(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${(error as Error).message}`,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      };
      setMessagesState(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingState(false);
    }
  };

  const getSystemPrompt = (): OpenAIMessage => ({
    role: 'system',
    content: `You are an expert blockchain courtroom assistant helping users navigate the complete legal workflow on-chain.

═══════════════════════════════════════════════════════════════
🏛️ COURTROOM WORKFLOW - FOUNDATIONAL ORDER IS CRITICAL
═══════════════════════════════════════════════════════════════

**PHASE 1: FOUNDATIONAL SETUP** (Must complete BEFORE any courtroom operations)
────────────────────────────────────────────────────────────────
1️⃣ **WALLET CONNECTION** (Prerequisite for everything)
   - User MUST have wallet connected
   - Check with: get_connected_wallet
   - If not connected: Guide them to connect their wallet first

2️⃣ **PARTICIPANT PROFILES** (Required before court creation)
   - Create profiles for: Judge, Prosecutor, Defense Attorney, Clerk
   - Each profile needs: address, type, LLM provider/model, scores
   - Tool: create_participant_profile
   - Best practice: Create all 4 participant types for complete court

3️⃣ **COURT ESTABLISHMENT** (Required before ANY proceedings)
   - Create court with: create_court (name, description)
   - Assign participants: assign_participant_to_court (courtId, profileId, type)
   - Verify completion: is_court_complete
   - Court MUST be complete before verdicts, appeals, or adjournments

**PHASE 2: AUTHORIZATION SETUP** (For special roles)
────────────────────────────────────────────────────────────────
4️⃣ **JUDGE AUTHORIZATION**
   - Add authorized judges: add_authorized_judge
   - Only authorized judges can record verdicts

**PHASE 3: COURTROOM OPERATIONS** (Only after Phases 1 & 2)
────────────────────────────────────────────────────────────────
5️⃣ **VERDICT RECORDING**
   - Prerequisites: Complete court exists, judge is authorized
   - Record verdict: record_verdict (requires: caseId, verdictType, details, reasoning)
   - Finalize if needed: finalize_verdict (makes verdict immutable)

6️⃣ **APPEALS PROCESS**
   - Prerequisites: Verdict must exist first
   - File appeal: file_appeal (originalVerdictId, reason, documents)
   - Update status: update_appeal_status
   - Schedule hearing: schedule_appeal_hearing

7️⃣ **ADJOURNMENTS**
   - Prerequisites: Case exists
   - Request: request_adjournment (caseId, reason, newDate)
   - Approve: approve_adjournment (judge only)
   - Emergency: emergency_reschedule (judge only)

═══════════════════════════════════════════════════════════════
🚨 CRITICAL ENFORCEMENT RULES
═══════════════════════════════════════════════════════════════

**BEFORE Recording Verdict:**
→ Verify: Is wallet connected?
→ Verify: Does a complete court exist? (use is_court_complete)
→ Verify: Is the judge authorized?
→ If ANY check fails: Guide user through missing steps FIRST

**BEFORE Filing Appeal:**
→ Verify: Does the verdict exist? (use get_verdict)
→ If verdict doesn't exist: Cannot file appeal

**BEFORE Any Operation:**
→ ALWAYS check wallet connection first
→ Suggest: "Let me check your courtroom setup..."

**User Guidance Strategy:**
→ When user tries advanced operation without setup: "I notice you haven't set up your courtroom yet. Let me help you establish the foundations first."
→ Offer step-by-step: "Here's what we need to do: 1) Create participant profiles, 2) Establish court, 3) Then we can proceed with verdicts."
→ Be proactive: "Before we record this verdict, let's verify your court is properly set up."

═══════════════════════════════════════════════════════════════
📋 AVAILABLE TOOLS BY CATEGORY
═══════════════════════════════════════════════════════════════

**Setup Tools:**
- get_connected_wallet: Check wallet status
- create_participant_profile: Create judge/prosecutor/defense/clerk profiles
- create_court: Establish courtroom
- assign_participant_to_court: Add participants to court
- is_court_complete: Verify court readiness
- add_authorized_judge: Authorize judges

**Verdict Tools:**
- record_verdict: Record case verdict
- finalize_verdict: Make verdict immutable
- get_verdict: Retrieve verdict details
- get_verdicts_by_case: Get all verdicts for case
- is_verdict_final: Check if verdict is final
- get_total_verdicts: Count all verdicts

**Appeal Tools:**
- file_appeal: Challenge a verdict
- update_appeal_status: Update appeal progress
- schedule_appeal_hearing: Set hearing date
- get_appeal: Retrieve appeal details
- get_appeals_by_verdict: Get all appeals for verdict
- get_total_appeals: Count all appeals

**Adjournment Tools:**
- request_adjournment: Request hearing postponement
- approve_adjournment: Approve adjournment request
- emergency_reschedule: Emergency date change
- get_adjournment: Retrieve adjournment details
- get_adjournments_by_case: Get all adjournments for case
- get_total_adjournment_requests: Count requests
- get_adjournment_statistics: View statistics

**Query Tools:**
- get_court_participants_by_role: List participants by role

═══════════════════════════════════════════════════════════════
🎯 RESPONSE GUIDELINES
═══════════════════════════════════════════════════════════════

1. **Always validate prerequisites** before executing operations
2. **Guide users proactively** through proper workflow
3. **Be conversational and helpful** - explain WHY order matters
4. **Provide blockchain context** - transaction hashes, explorer links
5. **Summarize tool results briefly** - the formatted output is already detailed
6. **If user skips steps** - politely redirect to foundational setup
7. **Use emojis judiciously** - for clarity, not excess

**Current Cases:**
${cases.map(c => `- ${c.title} (ID: ${c.id}, Status: ${c.status})`).join('\n')}

**Current Network:** ${isConnected ? (() => {
      const chain = config.chains.find(c => c.id === chainId);
      return chain?.name || 'Unknown';
    })() : 'Not connected - Please connect wallet!'}

**Explorer Links Format:**
- Transaction: https://explorer.openrouter.ai/tx/[HASH]?network=[NETWORK]
- Address: https://explorer.openrouter.ai/address/[ADDRESS]?network=[NETWORK]

Remember: A well-ordered courtroom ensures justice. Guide users through the proper foundation before advanced operations! 🏛️`,
  });

  const processCommandWithOpenRouter = async (userInput: string): Promise<string> => {
    const activeApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!activeApiKey) {
      return 'OpenRouter API key not configured. Please set NEXT_PUBLIC_OPENROUTER_API_KEY environment variable.';
    }

    try {
      const conversationMessages: OpenAIMessage[] = [
        getSystemPrompt(),
        ...messages.map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content,
        })),
        {
          role: 'user',
          content: userInput,
        }
      ];

      const tools = getOpenAITools();
      let fullResponse = '';
      let iterations = 0;
      const maxIterations = 5;

      while (iterations < maxIterations) {
        iterations++;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://rumblecourt.ai',
            'X-Title': 'RumbleCourt AI',
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: conversationMessages,
            tools,
            tool_choice: 'auto',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenRouter API failed (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const data: OpenAIResponse = await response.json();
        const choice = data.choices[0];

        if (!choice || !choice.message) {
          throw new Error('Invalid OpenRouter response structure');
        }

        const message = choice.message;

        conversationMessages.push({
          role: 'assistant',
          content: message.content || '',
          tool_calls: message.tool_calls,
        });

        if (message.content) {
          fullResponse += message.content + '\n';
        }

        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            fullResponse += await handleToolCall(toolCall, conversationMessages);
          }
          continue;
        }

        if (choice.finish_reason === 'stop') {
          break;
        }
      }

      if (!fullResponse.trim()) {
        fullResponse = 'I received your message but couldn\'t generate a response. Please try again.';
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('Error with OpenRouter API:', error);
      return `Sorry, something went wrong with the AI service: ${(error as Error).message}`;
    }
  };

  const handleToolCall = async (toolCall: ToolCall, conversationMessages: OpenAIMessage[]): Promise<string> => {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

    let toolOutput: unknown;
    try {
      const tool = courtroomTools[toolName as keyof typeof courtroomTools];
      if (!tool || !tool.execute) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const context: ToolExecutionContext = {
        toolCallId: toolCall.id,
        messages: []
      };

      // Cast execute to a typed function to satisfy differing tool input types at call sites
      type ToolExecuteFn = (args: Record<string, unknown>, ctx: ToolExecutionContext) => Promise<unknown> | AsyncIterable<unknown> | unknown;
      const exec = tool.execute as unknown as ToolExecuteFn;
      toolOutput = await exec(toolArgs, context);

      if (toolOutput && typeof toolOutput === 'object' && Symbol.asyncIterator in toolOutput) {
        let str = '';
        for await (const chunk of toolOutput as AsyncIterable<unknown>) {
          if (typeof chunk === 'string') str += chunk;
        }
        toolOutput = str;
      }
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      toolOutput = { error: (error as Error).message };
    }

    const formattedOutput = formatToolResponse(toolName, toolArgs, toolOutput);

    const toolContent = typeof toolOutput === 'string'
      ? toolOutput
      : JSON.stringify(toolOutput, null, 2);

    conversationMessages.push({
      role: 'tool',
      content: toolContent,
      tool_call_id: toolCall.id,
    });

    return formattedOutput;
  };

  const value: CourtroomContextType = {
    // State
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,

    // MCP Tools
    courtroomTools,

    // Actions
    setCurrentCase,
    addMessage,
    setMessages,
    setIsProcessing,
    setSelectedTool,
    processCommand,

    // Tool execution helpers
    executeTool,
    formatToolResponse,
  };

  return (
    <CourtroomContext.Provider value={value}>
      {children}
    </CourtroomContext.Provider>
  );
};

export default CourtroomProvider;