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

  // Initialize tracer when component mounts OR when currentCase changes
  useEffect(() => {
    // Create a general tracer for chat if no case is selected
    if (!currentCase && !opikTracer) {
      const generalTracer = createCourtroomTracer(
        'general-chat',
        'General Chat Session',
        'no-case-selected',
        true // Enable debug mode
      );
      generalTracer.startTrace();
      setOpikTracer(generalTracer);

      console.log('[CourtroomContext] 📊 Opik tracer initialized for general chat');
      return;
    }

    // Create case-specific tracer when case is selected
    if (currentCase) {
      // Cleanup old tracer if exists
      if (opikTracer) {
        console.log('[CourtroomContext] 🧹 Cleaning up old tracer');
        opikTracer.cleanup();
      }

      const caseTracer = createCourtroomTracer(
        currentCase.caseId.toString(),
        currentCase.caseTitle,
        currentCase.evidenceHash,
        true // Enable debug mode
      );
      caseTracer.startTrace();
      setOpikTracer(caseTracer);

      console.log('[CourtroomContext] 📊 Opik tracer initialized for case:', currentCase.caseId.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCase]); // Only depend on currentCase, not opikTracer

  // ============================================
  const extractVerdictFromResponse = (judgeResponse: string): {
    verdict: 'GUILTY' | 'NOT_GUILTY' | null;
    reasoning: string;
  } => {
    const upperResponse = judgeResponse.toUpperCase();
    let verdict: 'GUILTY' | 'NOT_GUILTY' | null = null;

    // 1. Check for NOT GUILTY first (Priority)
    // We check this first because "NOT GUILTY" contains the word "GUILTY"
    if (upperResponse.includes('NOT GUILTY') ||
      upperResponse.includes('NOT-GUILTY') ||
      upperResponse.includes('VERDICT: NOT GUILTY') ||
      upperResponse.includes('ACQUITTED')) {
      verdict = 'NOT_GUILTY';
    }
    // 2. Check for GUILTY
    else if (upperResponse.includes('GUILTY') ||
      upperResponse.includes('VERDICT: GUILTY') ||
      upperResponse.includes('CONVICTED') ||
      upperResponse.includes('FINDS THE DEFENDANT GUILTY')) {
      verdict = 'GUILTY';
    }

    return {
      verdict,
      reasoning: judgeResponse
    };
  };

  // Simulation logic with real LLM agents

  const simulateTrial = async (caseTitle: string, evidenceHash: string): Promise<void> => {
    setIsSimulatingState(true);
    const debateHistory: Array<{ agent: string, message: string }> = [];

    // Initialize Opik tracer
    const caseId = currentCase?.caseId.toString() || `case-${Date.now()}`;
    const tracer = createCourtroomTracer(
      caseId,
      caseTitle,
      evidenceHash,
      true
    );

    tracer.startTrace();

    // --- Validation Checks ---
    if (cases.length === 0) {
      addMessage({ id: `trial-${Date.now()}`, role: 'system', content: '⚠️ **NO CASES FOUND**', timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      setIsSimulatingState(false);
      return;
    }
    if (!currentCase) {
      addMessage({ id: `trial-${Date.now()}`, role: 'system', content: '⚠️ **NO CASE SELECTED**', timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      setIsSimulatingState(false);
      return;
    }
    if (currentCase.status === 'COMPLETED') {
      addMessage({ id: `trial-${Date.now()}`, role: 'system', content: '⚠️ **CASE ALREADY COMPLETED**', timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      setIsSimulatingState(false);
      return;
    }
    if (currentCase.status !== 'IN_TRIAL' && currentCase.status !== 'PENDING') {
      addMessage({ id: `trial-${Date.now()}`, role: 'system', content: '⚠️ **INVALID CASE STATUS**', timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      setIsSimulatingState(false);
      return;
    }

    try {
      // --- Blockchain Initialization ---
      if (currentCase.status === 'PENDING') {
        addMessage({ id: `trial-${Date.now()}-start`, role: 'system', content: `⚙️ STARTING TRIAL ON BLOCKCHAIN...`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
        setSimulationProgress('Starting trial on blockchain...');

        try {
          const startTrialTool = courtroomTools.start_trial;
          if (startTrialTool?.execute) {
            // @ts-ignore
            await startTrialTool.execute({ caseId: currentCase.caseId }, { toolCallId: 'sim-start', messages: [] });
            addMessage({ id: `trial-${Date.now()}-started`, role: 'system', content: `✅ TRIAL STARTED ON BLOCKCHAIN`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
          }
        } catch (trialError) {
          const errorMsg = String(trialError);
          if (errorMsg.includes('already') || errorMsg.includes('pending') || errorMsg.includes('IN_TRIAL')) {
            addMessage({ id: `trial-${Date.now()}-skip`, role: 'system', content: `ℹ️ Blockchain trial activation skipped (Ready).`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
          } else {
            throw trialError;
          }
        }
      } else {
        addMessage({ id: `trial-${Date.now()}-active`, role: 'system', content: `ℹ️ Case is already in trial. Proceeding...`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      }

      // --- AI Simulation Loop ---
      let finalVerdict: { verdict: 'GUILTY' | 'NOT_GUILTY' | null; reasoning: string } | null = null;

      for (let i = 0; i < DEBATE_STRUCTURE.length; i++) {
        const turn = DEBATE_STRUCTURE[i];
        const agent = turn.agent;
        const agentProfile = AGENT_PROFILES[agent];

        setSimulationProgress(`${turn.role} is preparing ${turn.messageType.toLowerCase()}...`);

        addMessage({
          id: `trial-${Date.now()}-thinking-${i}`,
          role: 'system',
          content: `🤔 ${agentProfile.name} is preparing ${turn.messageType.toLowerCase()}...`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        // Generate base prompt
        let prompt = generateAgentPrompt(
          agentProfile,
          caseTitle,
          evidenceHash,
          debateHistory
        );

        // 🔥 FIX: INJECT STRICT INSTRUCTIONS FOR THE VERDICT TURN
        // This ensures the Judge knows the trial is OVER and must decide NOW.
        if (agent === 'judge' && turn.messageType === 'Verdict') {
          prompt += `\n\n🛑 SYSTEM OVERRIDE - FINAL PHASE:
          The trial has concluded. All evidence has been presented.
          You must now act as the Judge and issue the FINAL VERDICT.
          
          INSTRUCTIONS:
          1. Do NOT ask for more witnesses.
          2. Do NOT delay the decision.
          3. You MUST include one of these exact phrases in your response:
             - "VERDICT: GUILTY"
             - "VERDICT: NOT GUILTY"
          4. Provide a brief summary of your reasoning (2-3 sentences).`;
        }

        // Call LLM
        const response = await callLLMAgent(
          agent,
          prompt,
          agentProfile.systemPrompt,
          tracer,
          turn.messageType
        );

        debateHistory.push({ agent, message: response });

        addMessage({
          id: `trial-${Date.now()}-${agent}-${i}`,
          role: agent,
          content: `**${agentProfile.name} - ${turn.messageType}**\n\n${response}`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        // Extract verdict
        if (agent === 'judge' && turn.messageType === 'Verdict') {
          finalVerdict = extractVerdictFromResponse(response);
          console.log('[Simulation] 📊 Extracted verdict:', finalVerdict);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // --- Verdict Recording ---
      addMessage({ id: `trial-${Date.now()}-complete`, role: 'system', content: '⚖️ TRIAL COMPLETED', timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });

      if (finalVerdict && finalVerdict.verdict) {
        setSimulationProgress('Recording verdict on blockchain...');
        addMessage({ id: `trial-${Date.now()}-rec`, role: 'system', content: `📝 RECORDING VERDICT: ${finalVerdict.verdict}`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });

        try {
          const verdictTypeMap = { 'GUILTY': 0, 'NOT_GUILTY': 1 };
          const recordVerdictTool = courtroomTools.record_verdict;

          if (recordVerdictTool?.execute) {
            await recordVerdictTool.execute(
              {
                caseId: currentCase.caseId,
                verdictType: verdictTypeMap[finalVerdict.verdict],
                reasoning: finalVerdict.reasoning,
                isFinal: true
              },
              { toolCallId: 'sim-verdict', messages: [] }
            );

            addMessage({
              id: `trial-${Date.now()}-done`,
              role: 'system',
              content: `✅ VERDICT RECORDED: **${finalVerdict.verdict}**`,
              timestamp: new Date(),
              timestampString: new Date().toLocaleTimeString()
            });

            tracer.recordVerdict(finalVerdict.verdict, finalVerdict.reasoning, 1.0);
          }
        } catch (verdictError) {
          console.error('[Simulation] Verdict Error:', verdictError);
          addMessage({ id: `trial-${Date.now()}-err`, role: 'system', content: `⚠️ Failed to record verdict: ${String(verdictError)}`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
        }
      } else {
        addMessage({
          id: `trial-${Date.now()}-fail`,
          role: 'system',
          content: `⚠️ NO CLEAR VERDICT DETECTED\n\nThe judge did not issue a clear "GUILTY" or "NOT GUILTY" decision. Check the logs.`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });
      }

      tracer.endTrace({
        status: 'completed',
        verdict: finalVerdict?.verdict || 'UNKNOWN',
        debateTurns: debateHistory.length,
        caseId: currentCase.caseId.toString()
      });

      // Reload cases
      if (isConnected && address) {
        setTimeout(async () => {
          loadUserCases(address);
        }, 2000);
      }

    } catch (error) {
      console.error('[Simulation] Fatal error:', error);
      addMessage({ id: `trial-${Date.now()}-fatal`, role: 'system', content: `❌ SIMULATION FAILED: ${String(error)}`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
      tracer.endTrace({ status: 'error', error: String(error) });
    } finally {
      setIsSimulatingState(false);
      setSimulationProgress('');
    }
  };

  // [REST OF THE FILE REMAINS THE SAME - keeping all other functions identical]
  // Including: setCurrentCase, addMessage, setMessages, setIsProcessing, setSelectedTool,
  // loadUserCases, checkOwnership, processCommand, callAIAssistant, handleToolCall, etc.

  // Helper functions
  const setCurrentCase = (caseId: string | null): void => {
    if (caseId === null) {
      setCurrentCaseState(null);
      return;
    }

    const foundCase = cases.find(c => c.id === caseId);
    if (foundCase) {
      setCurrentCaseState(foundCase);
    }
  };

  const addMessage = (message: ChatMessage): void => {
    setMessagesState(prev => [...prev, message]);
  };

  const setMessages = (msgs: ChatMessage[]): void => {
    setMessagesState(msgs);
  };

  const setIsProcessing = (processing: boolean): void => {
    setIsProcessingState(processing);
  };

  const setSelectedTool = (tool: string | null): void => {
    setSelectedToolState(tool);
  };

  const loadUserCases = async (userAddress: string): Promise<void> => {
    try {
      const userCasesTool = courtroomTools.get_user_cases;
      if (userCasesTool && typeof userCasesTool.execute === 'function') {
        const result = await userCasesTool.execute(
          { userAddress },
          { toolCallId: 'load-user-cases', messages: [] }
        );

        if (result && typeof result === 'object' && 'cases' in result) {
          const casesArray = result.cases as Case[];
          setCases(casesArray);
          console.log(`[CourtroomContext] Loaded ${casesArray.length} cases for ${userAddress}`);
        }
      }
    } catch (error) {
      console.error('[CourtroomContext] Failed to load user cases:', error);
    }
  };

  const checkOwnership = async (userAddress: string): Promise<void> => {
    try {
      const owner = await getOwner();
      const isUserOwner = owner.toLowerCase() === userAddress.toLowerCase();
      setIsOwner(isUserOwner);
      console.log(`[CourtroomContext] User ${userAddress} is ${isUserOwner ? 'OWNER' : 'NOT OWNER'}`);
    } catch (error) {
      console.error('[CourtroomContext] Failed to check ownership:', error);
      setIsOwner(false);
    }
  };

  useEffect(() => {
    setWalletContext(isConnected, address || null, isOwner);
  }, [isConnected, address, isOwner]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserCases(address);
      checkOwnership(address);
    } else {
      setCases([]);
      setIsOwner(false);
    }
  }, [isConnected, address]);

  const courtroomTools = rumbleCourtMcpTools;

  const executeTool = async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    const tool = courtroomTools[toolName as keyof typeof courtroomTools];
    if (!tool || !tool.execute) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const context: ToolExecutionContext = {
      toolCallId: `exec-${Date.now()}`,
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
  };

  const formatToolResponse = (toolName: string, toolArgs: Record<string, unknown>, toolOutput: unknown): string => {
    if (typeof toolOutput === 'string') {
      return toolOutput;
    }

    if (toolOutput && typeof toolOutput === 'object' && 'success' in toolOutput) {
      const output = toolOutput as { success: boolean; message?: string; error?: string };
      if (!output.success && output.error) {
        return `❌ Error: ${output.error}`;
      }
      if (output.message) {
        return `✅ ${output.message}`;
      }
    }

    return JSON.stringify(toolOutput, (key, val) => {
      if (typeof val === 'bigint') {
        return val.toString();
      }
      return val;
    }, 2);
  };

  const processCommand = async (userInput: string): Promise<void> => {
    if (!userInput.trim()) return;

    setIsProcessingState(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    };

    addMessage(userMessage);

    try {
      const response = await callAIAssistant(userInput);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      };
      addMessage(errorMessage);
    } finally {
      setIsProcessingState(false);
    }
  };

  const generateToolDefinitions = () => {
    const tools = [];

    for (const [toolName, toolDef] of Object.entries(courtroomTools)) {
      if (!toolDef.inputSchema || !toolDef.description) {
        console.warn(`[Tool Definition] Skipping ${toolName} - missing schema or description`);
        continue;
      }

      const schema = toolDef.inputSchema as unknown as ToolSchema;

      if (!schema || !schema._def) {
        console.warn(`[Tool Definition] Skipping ${toolName} - invalid schema structure`);
        continue;
      }

      const zodDef = schema._def;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      if (zodDef.typeName === 'ZodObject') {
        const shape = typeof zodDef.shape === 'function' ? zodDef.shape() : zodDef.shape;

        if (shape && typeof shape === 'object') {
          for (const [key, value] of Object.entries(shape)) {
            const fieldDef = (value as ZodType)._def;
            let fieldType = 'string';
            let fieldDescription = fieldDef.description || '';

            if (fieldDef.typeName === 'ZodString') {
              fieldType = 'string';
            } else if (fieldDef.typeName === 'ZodNumber') {
              fieldType = 'number';
            } else if (fieldDef.typeName === 'ZodBoolean') {
              fieldType = 'boolean';
            } else if (fieldDef.typeName === 'ZodBigInt') {
              fieldType = 'string';
              fieldDescription += ' (BigInt as string)';
            } else if (fieldDef.typeName === 'ZodEnum') {
              fieldType = 'string';
              if (fieldDef.values) {
                const enumValues = Array.isArray(fieldDef.values)
                  ? fieldDef.values
                  : Array.from(fieldDef.values as Set<string>);
                fieldDescription += ` (Enum: ${enumValues.join(', ')})`;
              }
            } else if (fieldDef.typeName === 'ZodUnion') {
              fieldType = 'string';
            } else if (fieldDef.typeName === 'ZodOptional') {
              const innerDef = fieldDef.innerType?._def;
              if (innerDef?.typeName === 'ZodString') {
                fieldType = 'string';
              }
            }

            properties[key] = {
              type: fieldType,
              description: fieldDescription
            };

            if (fieldDef.typeName !== 'ZodOptional') {
              required.push(key);
            }
          }
        }
      }

      tools.push({
        type: 'function',
        function: {
          name: toolName,
          description: toolDef.description,
          parameters: {
            type: 'object',
            properties,
            required,
          },
        },
      });
    }

    return tools;
  };

  const detectAndRecordVerdict = async (messageContent: string): Promise<void> => {
    if (!currentCase || currentCase.status !== 'IN_TRIAL') {
      return;
    }

    const upperContent = messageContent.toUpperCase();

    const isVerdictMessage =
      upperContent.includes('VERDICT') ||
      upperContent.includes('FIND THE DEFENDANT') ||
      upperContent.includes('FINDS THE DEFENDANT');

    if (!isVerdictMessage) {
      return;
    }

    let verdictType: number | null = null;
    if (upperContent.includes('GUILTY') && !upperContent.includes('NOT GUILTY')) {
      verdictType = 0;
    } else if (upperContent.includes('NOT GUILTY')) {
      verdictType = 1;
    }

    if (verdictType === null) {
      return;
    }

    console.log('[CourtroomContext] 🎯 Verdict detected in message, recording to blockchain...', {
      verdictType,
      caseId: currentCase.caseId.toString()
    });

    try {
      const recordVerdictTool = courtroomTools.record_verdict;
      if (!recordVerdictTool || !recordVerdictTool.execute) {
        throw new Error('record_verdict tool is not available');
      }

      const recordResult = await recordVerdictTool.execute(
        {
          caseId: currentCase.caseId,
          verdictType,
          reasoning: messageContent,
          isFinal: true
        },
        { toolCallId: 'auto-record-verdict', messages: [] }
      );

      console.log('[CourtroomContext] ✅ Verdict auto-recorded:', recordResult);

      if (isConnected && address) {
        setTimeout(async () => {
          await loadUserCases(address);
        }, 2000);
      }
    } catch (error) {
      console.error('[CourtroomContext] ❌ Failed to auto-record verdict:', error);
    }
  };

  const callAIAssistant = async (userInput: string): Promise<string> => {
    const tools = generateToolDefinitions();

    const systemPrompt = `You are a friendly and helpful AI legal assistant for RumbleCourt, a blockchain-based courtroom simulation platform.

**CRITICAL RULES:**
1. ALWAYS be concise - use 2-4 sentences maximum for most responses
2. Break complex information into digestible chunks
3. Use natural, conversational language - avoid overly formal legal jargon
4. Be encouraging and supportive, especially for first-time users
5. When providing instructions, use clear numbered steps
6. Avoid overwhelming users with too much information at once

**Your role:**
- Guide users through filing cases, viewing verdicts, and understanding the RumbleCourt process
- Explain legal concepts in simple, accessible terms
- Help users navigate the blockchain aspects of the platform
- Call the appropriate MCP tools when users want to perform actions

**Current context:**
- User is ${isConnected ? 'connected' : 'not connected'} to a wallet
- User has ${cases.length} case(s) filed
- Current selected case: ${currentCase ? `"${currentCase.caseTitle}" (Status: ${currentCase.status})` : 'None'}
- User ${isOwner ? 'IS' : 'IS NOT'} the system owner

**Available MCP tools you can call:**
${tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}

**Response guidelines:**
1. If the user asks to file a case → call file_case tool
2. If the user asks about their cases → call get_user_cases tool
3. If the user asks about a specific case → call get_case tool
4. If the user wants to start a trial (and is owner) → call start_trial tool
5. For general questions → provide a brief, helpful answer without calling tools
6. When suggesting next steps, be specific and actionable

**Tone:** Friendly, encouraging, and clear. Think of yourself as a helpful guide, not a formal legal advisor.

Keep responses SHORT and CONVERSATIONAL. Users can always ask follow-up questions if they need more detail.`;

    try {
      const conversationMessages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ];

      let fullResponse = '';
      let iterations = 0;
      const MAX_ITERATIONS = 5;

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const startTime = Date.now();

        const activeApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

        if (!activeApiKey) {
          return 'Sorry, the AI service is not configured. Please check your API key settings.';
        }

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
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (opikTracer && message.content) {
          opikTracer.logLLMInteraction(
            'judge',
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

          await detectAndRecordVerdict(message.content);
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

    console.log(`[Tool Call] 🔧 Executing: ${toolName}`, toolArgs);

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

    if (opikTracer) {
      const toolOutputStr = typeof toolOutput === 'string'
        ? toolOutput
        : JSON.stringify(toolOutput);

      opikTracer.logLLMInteraction(
        'judge',
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
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,
    isSimulating,
    simulationProgress,
    courtroomTools,
    setCurrentCase,
    addMessage,
    setMessages,
    setIsProcessing,
    setSelectedTool,
    processCommand,
    simulateTrial,
    abortSimulation,
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