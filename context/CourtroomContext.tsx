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
      content: 'Welcome to RumbleCourt AI. I can help you manage cases, start trials, and facilitate AI-powered legal debates. Try commands like "create new case" or "list my cases".',
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
    lines.push(`**Complete**: ${court.isComplete ? 'Yes' : 'No'}`);
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
    content: `You are a helpful courtroom management assistant on the blockchain. 

    Your available cases:
    ${cases.map(c => `- ${c.title} (ID: ${c.id}, Status: ${c.status})`).join('\n')}

    When users ask to:
    - "Show cases" or "list my cases" → use get_cases (no parameters needed)
    - "Show details for [CASE_NAME]" → use get_case_details with caseId from the list above
    - "Create case [NAME]" → use create_case with the name parameter
    - "Record verdict" → use record_verdict with caseId, verdictType, verdictDetails, reasoning, isFinal
    - "File appeal" → use file_appeal with originalVerdictId, appealReason, appealDocumentsText
    - "Request adjournment" → use request_adjournment with caseId, reason, reasonDetails, requestedNewDate
    - "Create participant" → use create_participant_profile with participantAddress, participantType, llmProvider, llmModel, etc.
    - "Create court" → use create_court with courtName, description
    - "Assign participant" → use assign_participant_to_court with courtId, profileId, participantType

    CRITICAL RULES:
    1. When a user mentions a case by name (like "Contract Breach"), look it up in the list above to get its caseId
    2. Always extract ALL required parameters from user requests
    3. For get_case_details, you MUST provide the caseId parameter - use the ID from the cases list
    4. If a parameter is missing, ask the user for it
    5. Be conversational and friendly in your responses
    6. After tools execute, provide a brief, natural summary - the tool results are already formatted nicely

    Available tools: ${Object.keys(courtroomTools).join(', ')}

    BLOCKCHAIN INTEGRATION:
    - All verdicts, appeals, and adjournments are stored on-chain
    - Transactions are signed by the connected wallet
    - Provide transaction hashes and blockchain explorer links
    - Support Ethereum, Polygon, Polygon Amoy, and Hardhat networks

    When displaying transaction hashes or addresses, ALWAYS provide clickable blockchain explorer links:
    - Transaction format: https://explorer.openrouter.ai/tx/[HASH]?network=[NETWORK]
    - Address format: https://explorer.openrouter.ai/address/[ADDRESS]?network=[NETWORK]

    Current network: ${isConnected ? (() => {
      const chain = config.chains.find(c => c.id === chainId);
      return chain?.name || 'Unknown';
    })() : 'Not connected'}
    `,
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