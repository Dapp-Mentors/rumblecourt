import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { rumbleCourtMcpTools, setWalletContext } from '../lib/courtroom-mcp-tools';
// import { config } from '../lib/wagmi';
import { getOwner } from '../services/blockchain';
import { CourtroomTracerClient, createCourtroomTracer } from '@/lib/opik-client'
import { callLLMAgent, generateAgentPrompt, AGENT_PROFILES, DEBATE_STRUCTURE } from '@/lib/llm-agents'
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
  role: 'user' | 'assistant' | 'system' | 'prosecution' | 'defense' | 'judge';
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
  isSimulating: boolean;
  simulationProgress: string;

  // MCP Tools
  courtroomTools: typeof rumbleCourtMcpTools;

  // Actions
  setCurrentCase: (caseId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setSelectedTool: (tool: string | null) => void;
  processCommand: (command: string) => Promise<void>;
  simulateTrial: (caseTitle: string, evidenceHash: string) => Promise<void>;
  abortSimulation: () => void;

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
  const { isConnected, address } = useWallet();

  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCase, setCurrentCaseState] = useState<Case | null>(null);
  const [messages, setMessagesState] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `👋 Welcome to RumbleCourt AI - Your Minimal Blockchain Courtroom! 🏛️⚖️

I'm your friendly AI legal assistant, here to guide you through the complete courtroom experience powered by blockchain technology.

**🚀 Get Started in Seconds:**

Here's how you can begin using RumbleCourt right away:

1. **📝 File Your First Case** - Click the "File My First Case" button to start
2. **📋 View Your Cases** - Check existing cases in the sidebar or use the quick command
3. **⚖️ Learn How It Works** - Get a complete explanation of the RumbleCourt process

**🎯 What You Can Do:**
• File legal cases with evidence
• Track case status in real-time
• View detailed verdicts and reasoning
• Appeal decisions if you disagree

**💡 Quick Tip:** The purple sidebar on the right shows your active cases - click on any case to view details!

Let's begin your blockchain legal journey!`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    }
  ]);
  const [opikTracer, setOpikTracer] = useState<CourtroomTracerClient | null>(null);
  const [isProcessing, setIsProcessingState] = useState(false);
  const [selectedTool, setSelectedToolState] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSimulating, setIsSimulatingState] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<string>('');

  const abortSimulation = (): void => {
    setIsSimulatingState(false);
    setSimulationProgress('');
  };

  useEffect(() => {
    if (currentCase && !opikTracer) {
      const tracer = createCourtroomTracer(
        currentCase.caseId.toString(),
        currentCase.caseTitle,
        currentCase.evidenceHash,
        true // Enable debug mode
      );
      tracer.startTrace();
      setOpikTracer(tracer);

      console.log('[CourtroomContext] 📊 Opik tracer initialized for case:', currentCase.caseId.toString());
    }
  }, [currentCase]);

  // Simulation logic with real LLM agents

  const simulateTrial = async (caseTitle: string, evidenceHash: string): Promise<void> => {
    setIsSimulatingState(true);
    const debateHistory: Array<{ agent: string, message: string }> = [];

    // Initialize Opik tracer with debug logging enabled
    const caseId = currentCase?.caseId.toString() || `case-${Date.now()}`;
    const tracer = createCourtroomTracer(
      caseId,
      caseTitle,
      evidenceHash,
      true // Enable debug mode to see logs
    );

    // Start the trace (fire-and-forget)
    tracer.startTrace();

    // [Keep all existing validation code - lines 176-213]
    if (cases.length === 0) {
      addMessage({
        id: `trial-${Date.now()}-no-cases`,
        role: 'system',
        content: '⚠️ **NO CASES FOUND**\n\nYou need to file a case first before you can simulate a courtroom trial. Please file a case and try again.',
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });
      setIsSimulatingState(false);
      return;
    }

    if (!currentCase) {
      addMessage({
        id: `trial-${Date.now()}-no-case`,
        role: 'system',
        content: '⚠️ **NO CASE SELECTED**\n\nPlease select a case from the sidebar before starting a trial simulation.',
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });
      setIsSimulatingState(false);
      return;
    }

    if (currentCase.status === 'COMPLETED') {
      addMessage({
        id: `trial-${Date.now()}-already-completed`,
        role: 'system',
        content: '⚠️ **CASE ALREADY COMPLETED**\n\nThis case has already been completed with a final verdict.',
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });
      setIsSimulatingState(false);
      return;
    }

    // [Keep existing start trial blockchain code - lines 215-243]
    if (isOwner && currentCase) {
      try {
        addMessage({
          id: `trial-${Date.now()}-starting`,
          role: 'system',
          content: '⚙️ **STARTING TRIAL ON BLOCKCHAIN...**',
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const startTrialTool = courtroomTools.start_trial;
        if (startTrialTool && typeof startTrialTool.execute === 'function') {
          await startTrialTool.execute(
            { caseId: currentCase.caseId },
            { toolCallId: 'auto-start-trial', messages: [] }
          );

          addMessage({
            id: `trial-${Date.now()}-started`,
            role: 'system',
            content: '✅ **TRIAL STARTED ON BLOCKCHAIN**',
            timestamp: new Date(),
            timestampString: new Date().toLocaleTimeString()
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Failed to start trial:', error);
      }
    }

    // ============================================================================
    // 3. ENHANCED TRIAL LOOP WITH OPIK LOGGING
    // ============================================================================

    try {
      for (let i = 0; i < DEBATE_STRUCTURE.length; i++) {
        const turn = DEBATE_STRUCTURE[i];
        const agentProfile = AGENT_PROFILES[turn.agent];

        setSimulationProgress(
          `${turn.role} - ${turn.messageType} (${i + 1}/${DEBATE_STRUCTURE.length})`
        );

        addMessage({
          id: `turn-${i}-thinking`,
          role: 'system',
          content: `🤔 **${agentProfile.name}** is preparing ${turn.messageType.toLowerCase()}...`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate the prompt for this agent
        const prompt = generateAgentPrompt(
          agentProfile,
          caseTitle,
          evidenceHash,
          debateHistory
        );

        // 🔥 CRITICAL: Call LLM with Opik tracer passed in
        // The tracer.logLLMInteraction will be called inside callLLMAgent
        // This is fire-and-forget and won't block the UI!
        const response = await callLLMAgent(
          turn.agent,
          prompt,
          agentProfile.systemPrompt,
          tracer, // Pass the tracer to enable logging
          turn.messageType // Pass the phase/message type
        );

        // Add to debate history
        debateHistory.push({
          agent: turn.agent,
          message: response
        });

        // Display the response in the UI
        addMessage({
          id: `turn-${i}`,
          role: turn.agent,
          content: `**${agentProfile.name}** - *${turn.messageType}*\n\n${response}`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // ============================================================================
      // 4. RECORD VERDICT AND END TRACE
      // ============================================================================

      // Extract verdict from the last message
      const verdictMessage = debateHistory[debateHistory.length - 1]?.message || '';
      const isGuilty = verdictMessage.toLowerCase().includes('guilty') &&
        !verdictMessage.toLowerCase().includes('not guilty');
      const verdict = isGuilty ? 'GUILTY' : 'NOT_GUILTY';

      // Log the verdict (fire-and-forget)
      tracer.recordVerdict(verdict, verdictMessage, 0.85);

      addMessage({
        id: `trial-complete`,
        role: 'system',
        content: `⚖️ **TRIAL COMPLETED**\n\nThe courtroom proceedings have concluded. Verdict: ${verdict}`,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });

      // End the trace (fire-and-forget)
      tracer.endTrace({
        verdict,
        totalTurns: debateHistory.length,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Trial simulation error:', error);
      addMessage({
        id: `trial-error`,
        role: 'system',
        content: `❌ **TRIAL ERROR**\n\n${(error as Error).message}`,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });

      // End trace even on error
      tracer.endTrace({ error: (error as Error).message });
    } finally {
      setIsSimulatingState(false);
      setSimulationProgress('');
      tracer.cleanup();
    }
  };

  // Update wallet context and check owner status when wallet changes
  useEffect(() => {
    const checkOwnerStatus = async (): Promise<void> => {
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
    const loadUserCases = async (): Promise<void> => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // MCP Tools
  const courtroomTools = rumbleCourtMcpTools;

  const setCurrentCase = (caseId: string | null): void => {
    if (caseId) {
      // Cases have both an 'id' field (string) and 'caseId' field (bigint)
      // Try matching against both for flexibility
      const selected = cases.find(c =>
        c.id === caseId || c.caseId.toString() === caseId
      );
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
          // Handle BigInt serialization
          const serializedValue = JSON.stringify(value, (key, val) => {
            if (typeof val === 'bigint') {
              return val.toString();
            }
            return val;
          });
          lines.push(`- **${key}**: \`${serializedValue}\``);
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
    content: `You are an AI legal assistant for RumbleCourt - a blockchain-based courtroom system.

═══════════════════════════════════════════════════════════════
🎯 CRITICAL: TOOL CALLING BEHAVIOR
═══════════════════════════════════════════════════════════════

**YOU MUST CALL TOOLS IMMEDIATELY - DO NOT ASK FOR PERMISSION**

When user says things like:
- "file a case about X" → IMMEDIATELY call file_case
- "file a case" or "file case" → IMMEDIATELY call file_case
- "start trial" or "begin trial" → IMMEDIATELY call start_trial
- "record verdict" → IMMEDIATELY call record_verdict
- "view my cases" → IMMEDIATELY call get_user_cases
- "show case details" → IMMEDIATELY call get_case_details

**NEVER say "I can help you file a case" - JUST DO IT!**
**NEVER ask "would you like me to..." - EXECUTE THE ACTION!**

═══════════════════════════════════════════════════════════════
📋 FILE CASE WORKFLOW - AUTO-EXECUTE
═══════════════════════════════════════════════════════════════

When user mentions filing a case:

**Step 1: Extract Information**
If user provides case details (like "file case about Open borders vs Closed borders"):
→ Extract title from their message
→ Use their description as evidence
→ IMMEDIATELY call file_case with extracted info

If user just says "file a case" with no details:
→ IMMEDIATELY call file_case with:
   - caseTitle: "New Legal Case"
   - evidenceHash: "Case details to be provided"
→ Then ask them to provide more details

**Step 2: NO PERMISSION ASKING**
❌ WRONG: "I can help you file a case. First, I need..."
❌ WRONG: "Would you like me to file this case?"
✅ RIGHT: [Immediately calls file_case tool]

**Step 3: After Execution**
→ Show the transaction result
→ Explain what happened
→ Suggest next steps

═══════════════════════════════════════════════════════════════
🔧 AVAILABLE TOOLS & WHEN TO USE THEM
═══════════════════════════════════════════════════════════════

**file_case**: When user wants to create a new case
- Trigger words: "file", "create case", "new case", "submit"
- Required: caseTitle, evidenceHash
- Example: "file a case about X" → extract X as title and description

**get_user_cases**: When user wants to see their cases
- Trigger words: "my cases", "view cases", "list cases", "show cases"
- Auto-use current wallet address

**get_case_details**: When user asks about a specific case
- Trigger words: "case details", "show case", "case info"
- Use caseId from context or ask

**start_trial**: When user wants to begin trial (owner only)
- Trigger words: "start trial", "begin trial", "start the trial"
- Use current case caseId

**record_verdict**: When verdict is mentioned (owner only)
- Trigger words: "guilty", "not guilty", "verdict"
- Extract verdict and reasoning from context

**appeal_case**: When user wants to appeal
- Trigger words: "appeal", "challenge verdict"

**get_contract_info**: When user asks about the system
- Trigger words: "contract address", "system info", "how it works"

═══════════════════════════════════════════════════════════════
🚨 EXAMPLE INTERACTIONS - LEARN FROM THESE
═══════════════════════════════════════════════════════════════

USER: "Can you file a case about Open borders vs Closed borders"

❌ WRONG RESPONSE:
"I can help you file a case. First, I need the case title and evidence..."

✅ CORRECT RESPONSE:
[Calls file_case with caseTitle: "Open Borders vs Closed Borders Debate", evidenceHash: "Analysis of immigration policies"]
Then: "✅ Case filed successfully! [shows results]"

---

USER: "Show me my cases"

❌ WRONG RESPONSE:
"Would you like me to fetch your cases from the blockchain?"

✅ CORRECT RESPONSE:
[Calls get_user_cases immediately]
Then: "Here are your cases: [shows results]"

---

USER: "file case"

✅ CORRECT RESPONSE:
[Calls file_case with placeholder title/evidence]
Then: "I've created a case placeholder. What details would you like to add?"

═══════════════════════════════════════════════════════════════
💡 RESPONSE STYLE
═══════════════════════════════════════════════════════════════

1. **Tool-first** - Call tools BEFORE speaking
2. **Action-oriented** - Execute, don't ask permission
3. **Concise** - Short explanations after action
4. **Helpful** - Guide user to next steps
5. **Professional** - Maintain legal assistant demeanor

**Current Connection:** ${isConnected ? 'Connected (${address})' : 'Not connected'}
**User Role:** ${isOwner ? 'System Owner (can manage trials)' : 'User (can file cases)'}

Remember: EXECUTE ACTIONS IMMEDIATELY - Don't ask for permission! 🏛️⚖️`,
  });

  const processCommandWithOpenRouter = async (userInput: string): Promise<string> => {
    const activeApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!activeApiKey) {
      return 'OpenRouter API key not configured. Please set NEXT_PUBLIC_OPENROUTER_API_KEY environment variable.';
    }

    const startTime = Date.now();

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
            tool_choice: 'auto', // Let the model decide
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
        const endTime = Date.now();
        const latency = endTime - startTime;

        // 🔥 LOG TO OPIK: Main assistant interaction
        if (opikTracer && message.content) {
          opikTracer.logLLMInteraction(
            'judge', // Using 'judge' role for main chat assistant
            'chat_interaction',
            userInput,
            message.content,
            {
              model: "arcee-ai/trinity-large-preview:free",
              iteration: iterations,
              latency_ms: latency,
              had_tool_calls: !!(message.tool_calls && message.tool_calls.length > 0),
              tool_count: message.tool_calls?.length || 0
            }
          );
        }

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

      // Log error to Opik
      if (opikTracer) {
        opikTracer.logLLMInteraction(
          'judge',
          'chat_interaction_error',
          userInput,
          `Error: ${(error as Error).message}`,
          {
            error: true,
            error_message: (error as Error).message
          }
        );
      }

      return `Sorry, something went wrong with the AI service: ${(error as Error).message}`;
    }
  };

  const handleToolCall = async (toolCall: ToolCall, conversationMessages: OpenAIMessage[]): Promise<string> => {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;
    const toolStartTime = Date.now();

    // Log tool call start
    console.log(`[Tool Call] 🔧 Executing: ${toolName}`, toolArgs);

    // Convert string numbers to BigInt for caseId parameters
    if ('caseId' in toolArgs && typeof toolArgs.caseId === 'string') {
      toolArgs.caseId = BigInt(toolArgs.caseId);
    } else if ('caseId' in toolArgs && typeof toolArgs.caseId === 'number') {
      toolArgs.caseId = BigInt(toolArgs.caseId);
    }

    let toolOutput: unknown;
    let toolError: Error | null = null;

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

      console.log(`[Tool Call] ✅ Completed: ${toolName}`);

      // Reload cases after operations that modify case state
      const caseModifyingTools = ['file_case', 'start_trial', 'record_verdict', 'appeal_case'];
      if (caseModifyingTools.includes(toolName) && isConnected && address) {
        setTimeout(async () => {
          try {
            const userCasesTool = courtroomTools.get_user_cases;
            if (userCasesTool && typeof userCasesTool.execute === 'function') {
              const userCases = await userCasesTool.execute(
                { userAddress: address },
                { toolCallId: 'reload-cases', messages: [] }
              );
              if (userCases && typeof userCases === 'object' && 'cases' in userCases) {
                const casesArray = userCases.cases as Case[];
                setCases(casesArray);
              }
            }
          } catch (error) {
            console.error('Failed to reload cases after operation:', error);
          }
        }, 1500);
      }
    } catch (error) {
      console.error(`[Tool Call] ❌ Error in ${toolName}:`, error);
      toolError = error as Error;
      toolOutput = { error: (error as Error).message };
    }

    const toolEndTime = Date.now();
    const toolLatency = toolEndTime - toolStartTime;

    // 🔥 LOG TOOL EXECUTION TO OPIK
    if (opikTracer) {
      const toolOutputStr = typeof toolOutput === 'string'
        ? toolOutput
        : JSON.stringify(toolOutput);

      opikTracer.logLLMInteraction(
        'judge', // Using judge for tool executions
        `tool_${toolName}`,
        JSON.stringify(toolArgs, (key, val) => typeof val === 'bigint' ? val.toString() : val),
        toolOutputStr,
        {
          tool_name: toolName,
          latency_ms: toolLatency,
          success: !toolError,
          error: toolError?.message,
          has_output: !!toolOutput
        }
      );
    }

    const formattedOutput = formatToolResponse(toolName, toolArgs, toolOutput);

    const toolContent = typeof toolOutput === 'string'
      ? toolOutput
      : JSON.stringify(toolOutput, (key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        return val;
      }, 2);

    conversationMessages.push({
      role: 'tool',
      content: toolContent,
      tool_call_id: toolCall.id,
    });

    return formattedOutput;
  };

  useEffect(() => {
    return () => {
      if (opikTracer) {
        console.log('[CourtroomContext] 🧹 Cleaning up Opik tracer');
        opikTracer.cleanup();
      }
    };
  }, [opikTracer]);

  const value: CourtroomContextType = {
    // State
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,
    isSimulating,
    simulationProgress,

    // MCP Tools
    courtroomTools,

    // Actions
    setCurrentCase,
    addMessage,
    setMessages,
    setIsProcessing,
    setSelectedTool,
    processCommand,
    simulateTrial,
    abortSimulation,

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