import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useWallet } from './WalletContext';
import { rumbleCourtMcpTools, setWalletContext } from '../lib/courtroom-mcp-tools';
// import { config } from '../lib/wagmi';
import { getOwner } from '../services/blockchain';
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

// Helper function to serialize BigInt values for JSON
const bigIntReplacer = (key: string, value: unknown): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

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
  const [isProcessing, setIsProcessingState] = useState(false);
  const [selectedTool, setSelectedToolState] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSimulating, setIsSimulatingState] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<string>('');

  // Use ref for immediate abort flag access
  const isSimulationAbortedRef = useRef(false);

  const abortSimulation = (): void => {
    isSimulationAbortedRef.current = true;
    setIsSimulatingState(false);
    setSimulationProgress('');
    addMessage({
      id: `abort-${Date.now()}`,
      role: 'system',
      content: '🛑 **SIMULATION ABORTED**',
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    });

    // Clear any pending messages that might be in the queue
    setMessagesState(prev => {
      const lastAbortIndex = prev.findIndex(msg => msg.content.includes('SIMULATION ABORTED'));
      if (lastAbortIndex !== -1) {
        return prev.slice(0, lastAbortIndex + 1);
      }
      return prev;
    });
  };

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
    isSimulationAbortedRef.current = false; // Reset abort flag when simulation starts
    const debateHistory: Array<{ agent: string, message: string }> = [];

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
    if (currentCase.status !== 'IN_TRIAL' && currentCase.status !== 'PENDING' && currentCase.status !== 'APPEALED') {
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
        // Check if simulation has been aborted before each step
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted');
          return;
        }

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

        // Check abort flag again before calling LLM (in case it was set during the prompt generation)
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted before LLM call');
          return;
        }

        // Call LLM
        const response = await callLLMAgent(
          agent,
          prompt,
          agentProfile.systemPrompt,
          turn.messageType
        );

        // Check abort flag immediately after LLM call
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted after LLM call');
          return;
        }

        debateHistory.push({ agent, message: response });

        // Check abort flag before adding message to state
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted before adding message');
          return;
        }

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

        // Check abort flag before delay
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted before delay');
          return;
        }

        // Delay with abort checking
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (isSimulationAbortedRef.current) {
              clearInterval(checkInterval);
              resolve(null);
            }
          }, 100); // Check every 100ms during delay

          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
          }, 1000);
        });

        // Check abort flag after delay
        if (isSimulationAbortedRef.current) {
          console.log('[Simulation] 🔴 Simulation aborted after delay');
          return;
        }
      }

      // Check if simulation was aborted during the last turn
      if (isSimulationAbortedRef.current) {
        console.log('[Simulation] 🔴 Simulation aborted');
        return;
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

      // Reload cases
      if (isConnected && address) {
        setTimeout(async () => {
          loadUserCases(address);
        }, 2000);
      }

    } catch (error) {
      console.error('[Simulation] Fatal error:', error);
      addMessage({ id: `trial-${Date.now()}-fatal`, role: 'system', content: `❌ SIMULATION FAILED: ${String(error)}`, timestamp: new Date(), timestampString: new Date().toLocaleTimeString() });
    } finally {
      setIsSimulatingState(false);
      setSimulationProgress('');
    }
  };

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
    // Check abort flag before adding any message
    if (isSimulationAbortedRef.current && message.role !== 'system' && !message.content.includes('SIMULATION ABORTED')) {
      console.log('[addMessage] 🔴 Blocking message due to abort flag:', message.role);
      return;
    }
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

  const formatToolResponse = (
    toolName: string,
    toolArgs: Record<string, unknown>,
    toolOutput: unknown
  ): string => {
    // Helper functions
    const formatCaseStatus = (status: string): string => {
      const statusMap: Record<string, string> = {
        'PENDING': '⏳ Pending',
        'IN_TRIAL': '⚖️ In Trial',
        'COMPLETED': '✅ Completed',
        'APPEALED': '📝 Appealed',
      };
      return statusMap[status] || status;
    };

    const formatVerdictType = (type: string | number): string => {
      const verdictMap: Record<string, string> = {
        '0': '❌ GUILTY',
        '1': '✅ NOT GUILTY',
        '2': '🤝 SETTLEMENT',
        '3': '🚫 DISMISSED',
        'GUILTY': '❌ GUILTY',
        'NOT_GUILTY': '✅ NOT GUILTY',
        'SETTLEMENT': '🤝 SETTLEMENT',
        'DISMISSED': '🚫 DISMISSED',
      };
      return verdictMap[String(type)] || String(type);
    };

    const formatAddress = (address: string): string => {
      if (address.length > 10) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      }
      return address;
    };

    // Handle errors
    if (toolOutput && typeof toolOutput === 'object' && 'error' in toolOutput) {
      return `❌ **Error**: ${(toolOutput as { error: string }).error}`;
    }

    // Format based on tool type
    switch (toolName) {
      case 'get_connected_wallet': {
        const output = toolOutput as {
          connected: boolean;
          address?: string;
          isOwner?: boolean;
          contractAddress?: string;
        };

        if (!output.connected) {
          return '🔌 **Wallet Not Connected**\n\nPlease connect your wallet to use RumbleCourt features.';
        }

        return `✅ **Wallet Connected**

        **Address**: \`${output.address}\`
        **Role**: ${output.isOwner ? '👑 System Owner' : '👤 User'}
        **Contract**: \`${output.contractAddress}\``;
      }

      case 'file_case': {
        const output = toolOutput as {
          success?: boolean;
          message?: string;
          caseTitle?: string;
          transactionHash?: string;
          nextSteps?: string;
        };

        if (!output.success) {
          return `❌ **Failed to file case**\n\n${output.message || 'Unknown error occurred'}`;
        }

        return `✅ **Case "${output.caseTitle}" filed successfully**

        **Transaction**: \`${output.transactionHash}\`

        ${output.nextSteps || 'Your case is now pending trial.'}`;
      }

      case 'get_case': {
        const output = toolOutput as {
          success?: boolean;
          case?: {
            caseId: string;
            plaintiff: string;
            caseTitle: string;
            evidenceHash: string;
            filedAt: string;
            status: string;
          };
        };

        if (!output.success || !output.case) {
          return '❌ **Case not found**';
        }

        const c = output.case;
        return `📋 **Case #${c.caseId}: ${c.caseTitle}**

        **Status**: ${formatCaseStatus(c.status)}
        **Filed**: ${c.filedAt}
        **Plaintiff**: \`${formatAddress(c.plaintiff)}\`

        **Evidence**: ${c.evidenceHash}`;
      }

      case 'get_user_cases': {
        const output = toolOutput as {
          success?: boolean;
          count?: number;
          cases?: Array<{
            caseId: bigint | string;
            caseTitle: string;
            status: string;
          }>;
        };

        if (!output.success || !output.cases) {
          return '❌ **Failed to retrieve cases**';
        }

        if (output.count === 0) {
          return '📋 **No cases found**\n\nYou haven\'t filed any cases yet. File your first case to get started!';
        }

        // Group cases by status
        const pending = output.cases.filter(c => c.status === 'PENDING');
        const inTrial = output.cases.filter(c => c.status === 'IN_TRIAL');
        const completed = output.cases.filter(c => c.status === 'COMPLETED');
        const appealed = output.cases.filter(c => c.status === 'APPEALED');

        let formatted = `✅ **Found ${output.count} case(s) filed by you**\n\n`;

        if (completed.length > 0) {
          formatted += `**✅ COMPLETED (${completed.length})**\n`;
          completed.forEach(c => {
            formatted += `- **Case ${c.caseId}**: ${c.caseTitle}\n`;
          });
          formatted += '\n';
        }

        if (inTrial.length > 0) {
          formatted += `**⚖️ IN TRIAL (${inTrial.length})**\n`;
          inTrial.forEach(c => {
            formatted += `- **Case ${c.caseId}**: ${c.caseTitle}\n`;
          });
          formatted += '\n';
        }

        if (appealed.length > 0) {
          formatted += `**📝 APPEALED (${appealed.length})**\n`;
          appealed.forEach(c => {
            formatted += `- **Case ${c.caseId}**: ${c.caseTitle}\n`;
          });
          formatted += '\n';
        }

        if (pending.length > 0) {
          formatted += `**⏳ PENDING (${pending.length})**\n`;
          pending.forEach(c => {
            formatted += `- **Case ${c.caseId}**: ${c.caseTitle}\n`;
          });
        }

        return formatted.trim();
      }

      case 'get_total_cases': {
        const output = toolOutput as {
          totalCases?: string;
        };

        return `📊 **Total Cases in System**: ${output.totalCases || '0'}`;
      }

      case 'start_trial': {
        const output = toolOutput as {
          success?: boolean;
          message?: string;
          transactionHash?: string;
          caseId?: string;
          nextSteps?: string;
        };

        if (!output.success) {
          return `❌ **Failed to start trial**\n\n${output.message || 'Unknown error'}`;
        }

        return `⚖️ **Trial Started for Case ${output.caseId}**

        **Transaction**: \`${output.transactionHash}\`

        ${output.nextSteps || 'AI lawyers will now debate this case.'}`;
      }

      case 'record_verdict': {
        const output = toolOutput as {
          success?: boolean;
          verdict?: {
            type: string;
            reasoning: string;
            isFinal: boolean;
          };
          transactionHash?: string;
          nextSteps?: string;
        };

        if (!output.success || !output.verdict) {
          return `❌ **Failed to record verdict**`;
        }

        return `📝 **Verdict Recorded**

        **Decision**: ${formatVerdictType(output.verdict.type)}
        **Final**: ${output.verdict.isFinal ? '✅ Yes' : '❌ No'}
        **Transaction**: \`${output.transactionHash}\`

        **Reasoning**: ${output.verdict.reasoning}

        ${output.nextSteps || ''}`;
      }

      case 'get_verdict': {
        const output = toolOutput as {
          success?: boolean;
          verdict?: {
            caseId: string;
            verdictType: string | number;
            reasoning: string;
            timestamp: string;
            isFinal: boolean;
          };
        };

        if (!output.success || !output.verdict) {
          return '❌ **No verdict found for this case**';
        }

        const v = output.verdict;
        return `⚖️ **Verdict for Case #${v.caseId}**

        **Decision**: ${formatVerdictType(v.verdictType)}
        **Recorded**: ${v.timestamp}
        **Final**: ${v.isFinal ? '✅ Yes (Can be appealed)' : '❌ No'}

        **Reasoning**:
        ${v.reasoning}`;
      }

      case 'has_verdict': {
        const output = toolOutput as {
          hasVerdict?: boolean;
          caseId?: string;
          message?: string;
        };

        const icon = output.hasVerdict ? '✅' : '⏳';
        return `${icon} ${output.message || 'Status unknown'}`;
      }

      case 'appeal_case': {
        const output = toolOutput as {
          success?: boolean;
          message?: string;
          transactionHash?: string;
          caseId?: string;
          nextSteps?: string;
        };

        if (!output.success) {
          return `❌ **Appeal Failed**\n\n${output.message || 'Unknown error'}`;
        }

        return `📝 **Appeal Filed for Case ${output.caseId}**

        **Transaction**: \`${output.transactionHash}\`

        ${output.nextSteps || 'Your appeal is now under review.'}`;
      }

      case 'get_system_owner': {
        const output = toolOutput as {
          owner?: string;
        };

        return `👑 **System Owner**: \`${output.owner}\``;
      }

      default: {
        // For unknown tools, check if it has success property
        if (toolOutput && typeof toolOutput === 'object' && 'success' in toolOutput) {
          const output = toolOutput as { success: boolean; message?: string };
          const icon = output.success ? '✅' : '❌';
          return `${icon} ${output.message || JSON.stringify(toolOutput, null, 2)}`;
        }

        // Last resort: pretty print
        return `\`\`\`json\n${JSON.stringify(toolOutput, null, 2)}\n\`\`\``;
      }
    }
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

    const systemPrompt = `You are an AI legal assistant for RumbleCourt. Your PRIMARY job is to call tools, NOT to chat.

**🚨 CRITICAL INSTRUCTION 🚨**
YOU MUST CALL TOOLS IMMEDIATELY. DO NOT ASK QUESTIONS. DO NOT REQUEST CLARIFICATION.

**MANDATORY TOOL CALLING:**

1. User mentions "file" or "case" → CALL file_case NOW
   Example: "File a case about X" → Call file_case(caseTitle="X Dispute", evidenceHash="Relevant evidence regarding X")
   Example: "Can you file me a case about Israel vs Palestine" → Call file_case(caseTitle="Historical Land Rights: Israel vs Palestine Territorial Dispute", evidenceHash="Historical records, UN documents, archaeological evidence, and international legal precedents")
   
2. User mentions "show" or "view" or "get" + "cases" → CALL get_user_cases NOW
   Example: "Show my cases" → Call get_user_cases()
   Example: "What cases do I have" → Call get_user_cases()
   
3. User mentions "case" + number → CALL get_case NOW
   Example: "Show case 5" → Call get_case(caseId="5")

4. User says "start trial" → CALL start_trial NOW (owner only)

5. User says "proceed" or "go ahead" or "do it" → Analyze previous context and call the MOST RELEVANT tool

**PARAMETER INFERENCE RULES:**
- If case title is vague → Create a professional title from context
- If evidence is missing → Generate reasonable evidence description  
- NEVER say "I need more information"
- NEVER ask "What would you like to call it?"
- ACT FIRST, explain later (in 1 sentence)

**State:**
- Wallet: ${isConnected ? `✅ CONNECTED (${address})` : '❌ NOT CONNECTED'}
- Cases: ${cases.length}
- Current: ${currentCase ? `"${currentCase.caseTitle}" (${currentCase.status})` : 'None'}
- Role: ${isOwner ? '👑 OWNER' : '👤 USER'}

**CRITICAL:** If wallet is NOT connected and user tries to file → Say "Please connect your wallet first" (1 sentence only)

**YOUR BEHAVIOR:**
❌ WRONG: "I can help you file a case! What would you like to name it?"
✅ CORRECT: [Calls file_case immediately] "Filing your case now..."

❌ WRONG: "To file a case, I need the title and evidence. What details can you provide?"
✅ CORRECT: [Calls file_case with inferred parameters] "Case filed!"

## RESPONSE FORMATTING RULES

1. **Be Clear and Concise**
   - Start with direct answers
   - Use structured markdown for complex information
   - Keep responses scannable

2. **Use Appropriate Formatting**
   - Headers (##, ###) for sections
   - Bullet points for lists
   - Inline code (\`) for technical details (addresses, hashes, IDs)
   - **Bold** for emphasis on key points

3. **Never Show Raw JSON**
   - Tool outputs are already formatted for you
   - Present information in natural language
   - Extract and explain key details

REMEMBER: Tools first, talk later. Be a DOER, not a questioner.`;

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

        const activeApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

        if (!activeApiKey) {
          return 'Sorry, the AI service is not configured. Please check your API key settings.';
        }

        // Determine if we should force tool usage based on user input
        const inputLower = userInput.toLowerCase();
        const shouldForceToolUse =
          inputLower.includes('file') ||
          inputLower.includes('create') ||
          inputLower.includes('show') ||
          inputLower.includes('view') ||
          inputLower.includes('get') ||
          inputLower.includes('start') ||
          inputLower.includes('record') ||
          inputLower.includes('appeal') ||
          inputLower.includes('case');

        // Build the request with intelligent tool_choice
        // NOTE: Free models don't support 'required', only 'auto' or 'none'

        // Try using a better model first, fallback to free if API key issues
        const modelToUse = process.env.NEXT_PUBLIC_LLM_MODEL || "arcee-ai/trinity-large-preview:free";

        // Uncomment to use a better model (requires credits on OpenRouter):
        // modelToUse = "anthropic/claude-3.5-sonnet";
        // modelToUse = "openai/gpt-4-turbo";

        const requestBody: Record<string, unknown> = {
          model: modelToUse,
          messages: conversationMessages,
          tools,
          // Always use 'auto' - free models don't support 'required'
          tool_choice: 'auto',
        };

        console.log('[AI Request]', {
          iteration: iterations,
          model: modelToUse,
          messageCount: conversationMessages.length,
          toolChoice: requestBody.tool_choice,
          shouldForceToolUse,
          userInputHints: {
            hasFile: inputLower.includes('file'),
            hasShow: inputLower.includes('show'),
            hasCase: inputLower.includes('case'),
          }
        });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://rumblecourt.ai',
            'X-Title': 'RumbleCourt AI',
          },
          body: JSON.stringify(requestBody),
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

        // Log what the AI is doing for debugging
        console.log('[AI Response]', {
          iteration: iterations,
          hasContent: !!message.content,
          hasToolCalls: !!message.tool_calls,
          toolCount: message.tool_calls?.length || 0,
          toolNames: message.tool_calls?.map(tc => tc.function.name) || [],
          finishReason: choice.finish_reason,
        });

        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log('[AI Tool Calls]', message.tool_calls.map(tc => ({
            name: tc.function.name,
            args: tc.function.arguments
          })));
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
      return `Sorry, something went wrong with the AI service: ${(error as Error).message}`;
    }
  };

  const handleToolCall = async (toolCall: ToolCall, conversationMessages: OpenAIMessage[]): Promise<string> => {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

    console.log(`[Tool Call] 🔧 Executing: ${toolName}`, JSON.parse(JSON.stringify(toolArgs, bigIntReplacer)));

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
      toolOutput = { error: (error as Error).message };
    }

    const formattedOutput = formatToolResponse(toolName, toolArgs, toolOutput);

    const toolContent = typeof toolOutput === 'string'
      ? toolOutput
      : JSON.stringify(toolOutput, bigIntReplacer, 2);

    conversationMessages.push({
      role: 'tool',
      content: toolContent,
      tool_call_id: toolCall.id,
    });

    return formattedOutput;
  };

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