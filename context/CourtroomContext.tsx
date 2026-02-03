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

  // Simulation logic with real LLM agents
  const simulateTrial = async (caseTitle: string, evidenceHash: string): Promise<void> => {
    setIsSimulatingState(true);
    const debateHistory: Array<{ agent: string, message: string }> = [];

    // Import agent library dynamically to avoid circular dependencies
    const {
      AGENT_PROFILES,
      DEBATE_STRUCTURE,
      generateAgentPrompt,
      callLLMAgent,
      formatDebateHistory
    } = await import('../lib/llm-agents');

    // Courtroom opening
    const judgeProfile = AGENT_PROFILES['judge'];
    const openingPrompt = generateAgentPrompt(
      judgeProfile,
      caseTitle,
      evidenceHash,
      debateHistory
    );
    const openingMessage = await callLLMAgent('judge', openingPrompt, judgeProfile.systemPrompt);

    addMessage({
      id: `trial-${Date.now()}-opening`,
      role: 'judge',
      content: `📢 **COURTROOM SESSION BEGINNING**

Case: ${caseTitle}
Evidence Hash: ${evidenceHash}

${openingMessage}`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    });
    debateHistory.push({ agent: 'judge', message: openingMessage });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 3000

    // Main debate
    for (let i = 1; i < DEBATE_STRUCTURE.length - 2; i++) { // Skip judge opening, deliberation, and verdict
      const turn = DEBATE_STRUCTURE[i];
      const profile = AGENT_PROFILES[turn.agent];

      const prompt = generateAgentPrompt(
        profile,
        caseTitle,
        evidenceHash,
        debateHistory
      ) + "\n\n**CRITICAL: Keep your argument CONCISE - maximum 150 words. Be direct and focused.**";

      const response = await callLLMAgent(turn.agent, prompt, profile.systemPrompt);

      addMessage({
        id: `trial-${Date.now()}-${turn.agent}-${i}`,
        role: turn.agent,
        content: `${response}`,
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });

      debateHistory.push({ agent: turn.agent, message: response });

      // Add turn delay for realistic pacing - Reduced from 2500-4000ms to 1000-2000ms
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    // Judge deliberation
    const deliberationPrompt = generateAgentPrompt(
      judgeProfile,
      caseTitle,
      evidenceHash,
      debateHistory
    ) + "\n\n**CRITICAL: Keep your deliberation CONCISE - maximum 150 words. Focus on key points only.**";
    const deliberationMessage = await callLLMAgent('judge', deliberationPrompt, judgeProfile.systemPrompt);

    addMessage({
      id: `trial-${Date.now()}-judge-deliberation`,
      role: 'judge',
      content: `**DELIBERATION**\n\n${deliberationMessage}`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    });
    debateHistory.push({ agent: 'judge', message: deliberationMessage });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced from 4000

    // Verdict
    const verdictPrompt = `Please deliver a final verdict based on the complete trial proceedings:

${formatDebateHistory(debateHistory)}

Your verdict should include:
1. A clear verdict: GUILTY or NOT GUILTY
2. Brief reasoning (maximum 200 words)
3. Key evidence analysis
4. Legal reasoning

**CRITICAL: Be CONCISE and DIRECT. Maximum 200 words total.**

Make sure your verdict is impartial and based solely on the evidence and arguments presented during the trial.`;

    const verdictMessage = await callLLMAgent('judge', verdictPrompt, judgeProfile.systemPrompt);

    addMessage({
      id: `trial-${Date.now()}-verdict`,
      role: 'judge',
      content: `⚖️ **VERDICT**\n\n${verdictMessage}`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    });
    debateHistory.push({ agent: 'judge', message: verdictMessage });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 3000

    // Closing
    const closingPrompt = generateAgentPrompt(
      judgeProfile,
      caseTitle,
      evidenceHash,
      debateHistory
    ) + "\n\n**CRITICAL: Keep your closing statement BRIEF - maximum 100 words.**";
    const closingMessage = await callLLMAgent('judge', closingPrompt, judgeProfile.systemPrompt);

    addMessage({
      id: `trial-${Date.now()}-closing`,
      role: 'judge',
      content: `📢 **COURTROOM SESSION CONCLUDED**\n\n${closingMessage}`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    });
    debateHistory.push({ agent: 'judge', message: closingMessage });

    // Extract verdict type from the verdict message
    const verdictType = verdictMessage.toUpperCase().includes('GUILTY') && !verdictMessage.toUpperCase().includes('NOT GUILTY') ? 0 : 1; // 0 = GUILTY, 1 = NOT_GUILTY

    // Record verdict on blockchain automatically (only if user is owner)
    if (isOwner && currentCase) {
      try {
        addMessage({
          id: `trial-${Date.now()}-recording`,
          role: 'system',
          content: '⚙️ **RECORDING VERDICT ON BLOCKCHAIN...**\n\nPlease wait while we save the verdict permanently on the blockchain.',
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Call the record_verdict tool
        const recordVerdictTool = courtroomTools.record_verdict;
        if (recordVerdictTool && typeof recordVerdictTool.execute === 'function') {
          await recordVerdictTool.execute(
            {
              caseId: currentCase.caseId,
              verdictType: verdictType,
              reasoning: verdictMessage.substring(0, 500), // Truncate to reasonable length
              isFinal: true
            },
            { toolCallId: 'auto-verdict-recording', messages: [] }
          );

          addMessage({
            id: `trial-${Date.now()}-recorded`,
            role: 'system',
            content: `✅ **VERDICT RECORDED ON BLOCKCHAIN**\n\nThe verdict has been permanently recorded on the blockchain and is now immutable.\n\n**Case ID:** ${currentCase.caseId}\n**Verdict:** ${verdictType === 0 ? 'GUILTY' : 'NOT GUILTY'}\n**Status:** COMPLETED`,
            timestamp: new Date(),
            timestampString: new Date().toLocaleTimeString()
          });

          // Reload cases to show updated status
          setTimeout(async () => {
            try {
              const userCasesTool = courtroomTools.get_user_cases;
              if (userCasesTool && typeof userCasesTool.execute === 'function' && address) {
                const userCases = await userCasesTool.execute(
                  { userAddress: address },
                  { toolCallId: 'reload-after-verdict', messages: [] }
                );
                if (userCases && typeof userCases === 'object' && 'cases' in userCases) {
                  const casesArray = userCases.cases as Case[];
                  setCases(casesArray);
                }
              }
            } catch (error) {
              console.error('Failed to reload cases after verdict:', error);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Failed to record verdict on blockchain:', error);
        addMessage({
          id: `trial-${Date.now()}-error`,
          role: 'system',
          content: `⚠️ **VERDICT RECORDING FAILED**\n\nThe verdict could not be recorded on the blockchain. Error: ${(error as Error).message}\n\nYou can manually record the verdict using the record_verdict tool.`,
          timestamp: new Date(),
          timestampString: new Date().toLocaleTimeString()
        });
      }
    } else if (!isOwner) {
      addMessage({
        id: `trial-${Date.now()}-no-record`,
        role: 'system',
        content: '⚠️ **VERDICT NOT RECORDED**\n\nOnly the system owner can record verdicts on the blockchain. The trial has concluded, but the verdict has not been saved on-chain.',
        timestamp: new Date(),
        timestampString: new Date().toLocaleTimeString()
      });
    }

    setIsSimulatingState(false);
  };

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
    content: `You are RumbleCourt AI Assistant - an expert blockchain legal companion helping users navigate the minimal, streamlined RumbleCourt smart contract system.

═══════════════════════════════════════════════════════════════
🚨 CRITICAL: ENFORCED AUTOMATIC TOOL CALLING 🚨
═══════════════════════════════════════════════════════════════

**MANDATORY RULE: CALL TOOLS IMMEDIATELY WHEN USER INTENT IS CLEAR**

YOU MUST NOT:
❌ Say "I'll help you file..." without calling \`file_case\`
❌ Say "Let me check..." without calling \`get_user_cases\` or \`get_case\`
❌ Ask "Would you like me to..." for READ operations
❌ Explain what you WOULD do - JUST DO IT by calling the tool
❌ Wait for explicit permission to call tools
❌ Describe the tool's function instead of using it

**CORRECT BEHAVIOR:**
User: "file a case about X with evidence Y"
You: [IMMEDIATELY call file_case tool] → [Show result]

User: "show my cases"
You: [IMMEDIATELY call get_user_cases tool] → [Show result]

**WRONG BEHAVIOR:**
User: "file a case about X"
You: "I'll help you file a case. Let me guide you..." ❌ NO TOOL CALL

═══════════════════════════════════════════════════════════════
🎯 AUTOMATIC TOOL TRIGGERS
═══════════════════════════════════════════════════════════════

**CASE FILING - IMMEDIATE TOOL CALL:**
User says: "file", "create case", "new case", "I want to file"
→ If has title + evidence: CALL \`file_case\` NOW
→ If missing info: Ask ONCE, then call tool when provided

User says: "use these", "use this information", "with these details"
→ Extract title/evidence from conversation context
→ CALL \`file_case\` IMMEDIATELY

**VIEWING CASES - IMMEDIATE TOOL CALL:**
User says: "show my cases", "list my cases", "my cases"
→ CALL \`get_user_cases\` IMMEDIATELY

User says: "case #1", "view case 2", "show case X"
→ CALL \`get_case\` IMMEDIATELY

**CONNECTION CHECK - IMMEDIATE TOOL CALL:**
User says: "check connection", "am I connected", "wallet status"
→ CALL \`get_connected_wallet\` IMMEDIATELY

**TRIAL OPERATIONS - IMMEDIATE TOOL CALL (after verifying owner):**
User says: "start trial", "begin trial" 
→ CALL \`start_trial\` IMMEDIATELY

**APPEALS - IMMEDIATE TOOL CALL (after verification):**
User says: "appeal", "file appeal", "I want to appeal"
→ CALL \`appeal_case\` IMMEDIATELY

═══════════════════════════════════════════════════════════════
🏛️ RUMBLECOURT WORKFLOW
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
📋 AVAILABLE TOOLS
═══════════════════════════════════════════════════════════════

**1. WALLET TOOLS:**
   - get_connected_wallet: Check wallet connection

**2. CASE TOOLS (User Actions):**
   - file_case: File new case (requires: caseTitle, evidenceHash)
   - get_case: Get case by ID (requires: caseId)
   - get_user_cases: Get all user's cases (requires: userAddress)
   - get_total_cases: Get total case count

**3. TRIAL TOOLS (Owner Only):**
   - start_trial: Start trial (requires: caseId)
   - record_verdict: Record verdict (requires: caseId, verdictType, reasoning, isFinal)

**4. VERDICT TOOLS:**
   - get_verdict: Get verdict details
   - has_verdict: Check if verdict exists

**5. APPEAL TOOLS (User Actions):**
   - appeal_case: Appeal case (requires: caseId)

**6. SYSTEM INFO:**
   - get_system_owner: Get owner address

═══════════════════════════════════════════════════════════════
📝 SMART FILING LOGIC
═══════════════════════════════════════════════════════════════

When user wants to file a case:

**Step 1: Check prerequisites**
- Wallet connected? (call get_connected_wallet if unsure)
- Has title? Has evidence?

**Step 2: Execute**
- If YES to both → CALL file_case IMMEDIATELY
- If NO → Ask for missing piece ONCE

**Step 3: After filing**
- Show transaction hash
- Explain next step (owner starts trial)
- Suggest viewing the case

**Special Case: "use these" or "use this"**
When user says "use these scriptures" or "use this information":
→ They're referencing earlier conversation
→ Extract title and evidence from context
→ CALL file_case IMMEDIATELY
→ DO NOT ask for confirmation

═══════════════════════════════════════════════════════════════
🚨 VALIDATION RULES
═══════════════════════════════════════════════════════════════

**BEFORE Filing:**
→ Wallet connected
→ Title + evidence provided

**BEFORE Starting Trial:**
→ User is system owner
→ Case is PENDING

**BEFORE Recording Verdict:**
→ User is system owner
→ Case is IN_TRIAL

**BEFORE Appeal:**
→ Wallet connected
→ Case is COMPLETED with final verdict
→ User is plaintiff

═══════════════════════════════════════════════════════════════
💡 RESPONSE STYLE
═══════════════════════════════════════════════════════════════

1. **Action-first** - Execute tools, then explain
2. **Conversational** - Be friendly after showing results
3. **Proactive** - Suggest next steps
4. **Confident** - Trust your tool calls
5. **Helpful** - Make blockchain accessible

**Current Connection:** ${isConnected ? `Connected (${address})` : 'Not connected'}
**User Role:** ${isOwner ? 'System Owner (can manage trials)' : 'User (can file cases)'}
**Network:** ${isConnected ? (() => {
        const chain = config.chains.find(c => c.id === chainId);
        return chain?.name || 'Unknown';
      })() : 'Not connected'}

═══════════════════════════════════════════════════════════════
🎪 PERSONALITY
═══════════════════════════════════════════════════════════════

- **Action-oriented** - Do things, don't just talk about them
- **Professional** - Legal expert who speaks plainly
- **Enthusiastic** - Excited about AI + blockchain
- **Helpful** - Anticipate user needs
- **Transparent** - Clear about capabilities and limitations

**Remember: Your job is to EXECUTE actions via tools, not describe them!** 🏛️⚖️`,
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

      // Reload cases after operations that modify case state
      const caseModifyingTools = ['file_case', 'start_trial', 'record_verdict', 'appeal_case'];
      if (caseModifyingTools.includes(toolName) && isConnected && address) {
        // Small delay to ensure blockchain state is updated
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
      console.error(`Tool execution error for ${toolName}:`, error);
      toolOutput = { error: (error as Error).message };
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

  const value: CourtroomContextType = {
    // State
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,
    isSimulating,

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