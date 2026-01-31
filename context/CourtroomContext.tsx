import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { rumbleCourtMcpTools, setWalletContext } from '../lib/courtroom-mcp-tools';
import { config } from '../lib/wagmi';
import { getOwner } from '../services/blockchain';

// Simplified types for the new minimal contract
import { CaseStatus } from '../components/types';

interface Case {
  id: string;
  caseId: bigint;
  caseTitle: string;
  plaintiff: string;
  evidenceHash: string;
  filedAt: bigint;
  status: CaseStatus;
  verdict?: {
    verdictType: 'GUILTY' | 'NOT_GUILTY' | 'SETTLEMENT' | 'DISMISSED';
    reasoning: string;
    timestamp: bigint;
    isFinal: boolean;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  timestampString: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolExecutionContext {
  toolCallId: string;
  messages: ChatMessage[];
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
  courtroomTools: typeof rumbleCourtMcpTools;

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
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCase, setCurrentCaseState] = useState<Case | null>(null);
  const [messages, setMessagesState] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Welcome to RumbleCourt AI - Your Minimal Blockchain Courtroom! 🏛️⚖️

I'm your AI legal companion, powered by the streamlined RumbleCourt smart contract.

**🎯 The RumbleCourt Flow:**
File Case → System Starts Trial → AI Lawyers Debate (off-chain) → 
AI Judge Decides (off-chain) → Verdict Recorded (on-chain) → Appeal if Needed

Let's get started with your blockchain legal journey!`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    }
  ]);
  const [isProcessing, setIsProcessingState] = useState(false);
  const [selectedTool, setSelectedToolState] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Update wallet context and check owner status when wallet changes
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (isConnected && address) {
        try {
          const ownerAddress = await getOwner();
          const ownerStatus = address.toLowerCase() === ownerAddress.toLowerCase();
          setIsOwner(ownerStatus);
          setWalletContext(isConnected, address, ownerStatus);
        } catch (error) {
          console.error('Failed to check owner status:', error);
          setWalletContext(isConnected, address, false);
        }
      } else {
        setWalletContext(false, null, false);
      }
    };

    checkOwnerStatus();
  }, [isConnected, address]);

  // Load user cases when wallet connects
  useEffect(() => {
    const loadUserCases = async () => {
      if (isConnected && address) {
        try {
          const tool = courtroomTools.get_user_cases;
          if (tool && typeof tool.execute === 'function') {
            const userCases = await tool.execute({ userAddress: address }, { toolCallId: 'load-cases', messages: [] });
            if (userCases && typeof userCases === 'object' && 'cases' in userCases) {
              const casesArray = userCases.cases as Case[];
              setCases(casesArray);
            }
          }
        } catch (error) {
          console.error('Failed to load user cases:', error);
        }
      } else {
        setCases([]);
      }
    };

    loadUserCases();
  }, [isConnected, address]);

  // MCP Tools
  const courtroomTools = rumbleCourtMcpTools;

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
              else if (actualDef.typeName === 'ZodNumber' || actualDef.typeName === 'ZodBigInt') type = 'number';
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

    // Handle errors
    if ('error' in outputData) {
      lines.push('');
      lines.push(`### ❌ Error`);
      lines.push('');
      lines.push(`${outputData.error}`);
      lines.push('');
      return lines.join('\n');
    }

    // Handle unsuccessful operations
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

    // Success message
    lines.push('');
    lines.push('### ✅ Operation Successful');
    lines.push('');

    if ('message' in outputData && outputData.message) {
      lines.push(`📝 ${outputData.message}`);
      lines.push('');
    }

    // Transaction details
    if ('transactionHash' in outputData && outputData.transactionHash) {
      lines.push(`🔗 **Transaction Hash**: \`${outputData.transactionHash}\``);
    }

    if ('blockNumber' in outputData && outputData.blockNumber) {
      lines.push(`📦 **Block Number**: ${outputData.blockNumber}`);
    }

    if ('caseId' in outputData && outputData.caseId) {
      lines.push(`📋 **Case ID**: \`${outputData.caseId}\``);
    }

    // Case details
    if ('case' in outputData && typeof outputData.case === 'object') {
      const caseData = outputData.case as Record<string, unknown>;
      lines.push('');
      lines.push('### 📋 Case Details');
      lines.push('');
      Object.entries(caseData).forEach(([key, value]) => {
        lines.push(`- **${key}**: ${value}`);
      });
    }

    // Verdict details
    if ('verdict' in outputData && typeof outputData.verdict === 'object') {
      const verdict = outputData.verdict as Record<string, unknown>;
      lines.push('');
      lines.push('### ⚖️ Verdict Details');
      lines.push('');
      Object.entries(verdict).forEach(([key, value]) => {
        lines.push(`- **${key}**: ${value}`);
      });
    }

    // Next steps
    if ('nextSteps' in outputData && outputData.nextSteps) {
      lines.push('');
      lines.push('### 🎯 Next Steps');
      lines.push('');
      lines.push(`${outputData.nextSteps}`);
    }

    // Additional details
    const displayedKeys = ['success', 'message', 'transactionHash', 'blockNumber', 'caseId', 'case', 'verdict', 'nextSteps', 'error'];
    const remainingKeys = Object.keys(outputData).filter(key => !displayedKeys.includes(key));

    if (remainingKeys.length > 0) {
      lines.push('');
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
    }

    lines.push('');
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
    content: `You are RumbleCourt AI Assistant - an expert blockchain legal companion helping users navigate the minimal, streamlined RumbleCourt smart contract system.

═══════════════════════════════════════════════════════════════
🏛️ RUMBLECOURT WORKFLOW - SIMPLE & EFFICIENT
═══════════════════════════════════════════════════════════════

**THE COMPLETE FLOW:**
1. User files case (with title and evidence)
2. System starts trial (owner only)
3. AI lawyers debate (off-chain)
4. AI judge decides (off-chain)
5. Verdict recorded on-chain (owner only)
6. User can appeal if final verdict

**KEY CONCEPTS:**
- **User Actions**: File cases, view cases, appeal verdicts
- **System Actions** (Owner only): Start trials, record verdicts
- **Off-chain AI**: Lawyer debates and judge reasoning happen off-chain
- **On-chain Storage**: Only immutable results stored on blockchain

═══════════════════════════════════════════════════════════════
📋 AVAILABLE TOOLS - ORGANIZED BY FUNCTION
═══════════════════════════════════════════════════════════════

**1. WALLET & SETUP TOOLS:**
   - get_connected_wallet: Check wallet connection status
   
**2. CASE FILING TOOLS (User Actions):**
   - file_case: File a new case with title and evidence
   - get_case: Retrieve case details by ID
   - get_user_cases: Get all cases for a user address
   - get_total_cases: Get total system case count

**3. TRIAL MANAGEMENT TOOLS (System Owner Only):**
   - start_trial: Start AI trial for pending case
   - record_verdict: Record AI judge's decision on-chain
   
**4. VERDICT TOOLS:**
   - get_verdict: Get verdict details for a case
   - has_verdict: Check if case has a verdict

**5. APPEAL TOOLS (User Actions):**
   - appeal_case: Appeal a completed case with final verdict

**6. SYSTEM INFO:**
   - get_system_owner: Get the system owner address

═══════════════════════════════════════════════════════════════
🎯 USER GUIDANCE STRATEGY
═══════════════════════════════════════════════════════════════

**For New Users:**
→ Start with: "Let's file your first case!"
→ Explain: "The AI will debate your case off-chain, then record the verdict on-chain"
→ Show: "Here's what happens next after filing..."

**For Case Status Questions:**
→ Check: get_case to see current status
→ Explain: "PENDING → IN_TRIAL → COMPLETED → APPEALED"

**For System Operations:**
→ If user tries owner actions: "Only the system owner can start trials and record verdicts"
→ Suggest: "You can file cases and appeal verdicts as a user"

**For Appeals:**
→ Verify: Case must be COMPLETED with final verdict
→ Check: Only plaintiff can appeal
→ Guide: "Let's check if your case is ready for appeal"

═══════════════════════════════════════════════════════════════
🚨 CRITICAL RULES
═══════════════════════════════════════════════════════════════

**BEFORE Filing Case:**
→ Verify: Wallet connected
→ Collect: Case title and evidence hash/description

**BEFORE Starting Trial:**
→ Verify: User is system owner
→ Verify: Case status is PENDING

**BEFORE Recording Verdict:**
→ Verify: User is system owner
→ Verify: Case status is IN_TRIAL
→ Require: Verdict type (0-3), reasoning, finality

**BEFORE Appeal:**
→ Verify: Wallet connected
→ Verify: Case is COMPLETED
→ Verify: Verdict is final
→ Verify: User is plaintiff

═══════════════════════════════════════════════════════════════
💡 RESPONSE GUIDELINES
═══════════════════════════════════════════════════════════════

1. **Be conversational and friendly** - Explain blockchain concepts simply
2. **Guide proactively** - Anticipate next steps and suggest them
3. **Validate before acting** - Always check prerequisites
4. **Provide context** - Explain why operations succeed or fail
5. **Use tool responses** - The formatted output is detailed, summarize briefly
6. **Be encouraging** - Make blockchain legal tech accessible
7. **Handle errors gracefully** - Suggest solutions, not just problems

**Current Connection Status:** ${isConnected ? `Connected (${address})` : 'Not connected - Please connect wallet!'}
**User Role:** ${isOwner ? 'System Owner (can manage trials)' : 'User (can file cases and appeals)'}
**Current Network:** ${isConnected ? (() => {
        const chain = config.chains.find(c => c.id === chainId);
        return chain?.name || 'Unknown';
      })() : 'Not connected'}

═══════════════════════════════════════════════════════════════
🎪 PERSONALITY & TONE
═══════════════════════════════════════════════════════════════

- **Professional yet approachable** - Legal expert who speaks plainly
- **Enthusiastic about innovation** - Excited about AI + blockchain
- **Patient educator** - Explains complex concepts simply
- **Proactive helper** - Anticipates needs and suggests next steps
- **Transparent about limitations** - Clear about what can/can't be done

Remember: RumbleCourt makes blockchain legal tech simple, accessible, and powerful! 🏛️⚖️`,
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
            model: "arcee-ai/trinity-large-preview:free",
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

    // Convert string numbers to BigInt for caseId parameters
    if ('caseId' in toolArgs && typeof toolArgs.caseId === 'string') {
      toolArgs.caseId = BigInt(toolArgs.caseId);
    } else if ('caseId' in toolArgs && typeof toolArgs.caseId === 'number') {
      toolArgs.caseId = BigInt(toolArgs.caseId);
    }

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