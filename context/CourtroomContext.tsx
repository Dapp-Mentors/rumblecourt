import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { useWallet } from './WalletContext';
import { CaseStatus, ChatMessage, VerdictType, CaseWithVerdict } from '../components/types';

interface CourtroomContextType {
  // State
  cases: CaseWithVerdict[];
  currentCase: CaseWithVerdict | null;
  messages: ChatMessage[];
  isProcessing: boolean;
  selectedTool: string | null;
  isSimulating: boolean;
  simulationProgress: string;

  // Actions
  setCurrentCase: (caseId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setSelectedTool: (tool: string | null) => void;
  processCommand: (command: string) => Promise<void>;
  simulateTrial: (caseTitle: string, evidenceHash: string) => Promise<void>;
  abortSimulation: () => void;
  refreshCases: () => void;

  // Dummy tool execution helpers
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
  formatToolResponse: (toolName: string, toolArgs: Record<string, unknown>, toolOutput: unknown) => string;
  courtroomTools: Record<string, unknown>;
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

// Dummy data - matches proper Case interface
const DUMMY_CASES: CaseWithVerdict[] = [
  {
    caseId: BigInt(1),
    caseTitle: 'Smith vs. Johnson - Contract Dispute',
    plaintiff: '0x1234567890123456789012345678901234567890',
    evidenceHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    filedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 2),
    status: 'COMPLETED',
    verdict: {
      caseId: BigInt(1),
      verdictType: VerdictType.GUILTY,
      reasoning: 'The defendant failed to fulfill contractual obligations as evidenced by the signed agreement.',
      timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
      isFinal: true
    }
  },
  {
    caseId: BigInt(2),
    caseTitle: 'Tech Corp vs. Startup Inc - IP Infringement',
    plaintiff: '0x1234567890123456789012345678901234567890',
    evidenceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    filedAt: BigInt(Math.floor(Date.now() / 1000) - 86400),
    status: 'IN_TRIAL',
  },
  {
    caseId: BigInt(3),
    caseTitle: 'Brown vs. Green - Property Dispute',
    plaintiff: '0x1234567890123456789012345678901234567890',
    evidenceHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    filedAt: BigInt(Math.floor(Date.now() / 1000) - 3600),
    status: 'PENDING',
  }
];

export const CourtroomProvider: React.FC<CourtroomProviderProps> = ({ children }) => {
  const { address } = useWallet();

  // State
  const [cases, setCases] = useState<CaseWithVerdict[]>(DUMMY_CASES);
  const [currentCase, setCurrentCaseState] = useState<CaseWithVerdict | null>(null);
  const [messages, setMessagesState] = useState<ChatMessage[]>(() => {
    const now = new Date();
    return [
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

**💡 Quick Tip:** The sidebar on the right shows your active cases - click on any case to view details!

**Note:** This is a demo version with simulated data for teaching purposes.

Let's begin your blockchain legal journey!`,
        timestamp: now,
        timestampString: now.toLocaleTimeString()
      }
    ];
  });
  const [isProcessing, setIsProcessingState] = useState(false);
  const [selectedTool, setSelectedToolState] = useState<string | null>(null);
  const [isSimulating, setIsSimulatingState] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<string>('');

  // Use ref for immediate abort flag access
  const isSimulationAbortedRef = useRef(false);

  const abortSimulation = (): void => {
    isSimulationAbortedRef.current = true;
    setIsSimulatingState(false);
    setSimulationProgress('');
    const now = new Date();
    addMessage({
      id: `abort-${now.getTime()}`,
      role: 'system',
      content: '🛑 **SIMULATION ABORTED**',
      timestamp: now,
      timestampString: now.toLocaleTimeString()
    });
  };

  // Helper functions
  const addMessage = (message: ChatMessage): void => {
    setMessagesState((prev) => [...prev, message]);
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

  const setCurrentCase = (caseId: string | null): void => {
    if (caseId === null) {
      setCurrentCaseState(null);
      return;
    }
    const case_ = cases.find((c) => c.caseId.toString() === caseId);
    setCurrentCaseState(case_ || null);
  };

  const refreshCases = (): void => {
    console.log('Refreshing cases (dummy function)');
  };

  // Dummy tool execution
  const executeTool = async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    console.log(`[DUMMY] Executing tool: ${toolName}`, args);
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (toolName) {
      case 'get_user_cases':
        return { cases: DUMMY_CASES };
      case 'file_case':
        return { success: true, caseId: BigInt(cases.length + 1) };
      case 'get_case_details':
        return currentCase || { error: 'No case found' };
      default:
        return { success: true, message: `Tool ${toolName} executed` };
    }
  };

  const formatToolResponse = (
    toolName: string,
    toolArgs: Record<string, unknown>,
    toolOutput: unknown
  ): string => {
    return `✅ Tool executed: ${toolName}\nArgs: ${JSON.stringify(toolArgs)}\nResult: ${JSON.stringify(toolOutput)}`;
  };

  // Dummy command processor
  const processCommand = async (command: string): Promise<void> => {
    if (!command.trim()) return;

    const userNow = new Date();
    addMessage({
      id: `user-${userNow.getTime()}`,
      role: 'user',
      content: command,
      timestamp: userNow,
      timestampString: userNow.toLocaleTimeString()
    });

    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    let response = '';
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('file') && lowerCommand.includes('case')) {
      const unixNow = Math.floor(new Date().getTime() / 1000);
      const newCaseId = BigInt(cases.length + 1);
      const newCase: CaseWithVerdict = {
        caseId: newCaseId,
        caseTitle: 'New Case - ' + command.substring(0, 50),
        plaintiff: address || '0x0000000000000000000000000000000000000000',
        evidenceHash: '0x' + Math.random().toString(16).substring(2, 66),
        filedAt: BigInt(unixNow),
        status: 'PENDING' as CaseStatus,
      };

      setCases(prev => [...prev, newCase]);
      setCurrentCaseState(newCase);

      response = `✅ **Case Filed Successfully!**

📋 **Case Details:**
- **Case ID:** ${newCaseId}
- **Title:** ${newCase.caseTitle}
- **Status:** PENDING
- **Evidence Hash:** ${newCase.evidenceHash}

Your case has been recorded on the blockchain. You can now simulate a trial or wait for processing.`;
    } else if (lowerCommand.includes('show') || lowerCommand.includes('view') || lowerCommand.includes('list')) {
      response = `📋 **Your Cases:**

${cases.map((c, i) => `
${i + 1}. **${c.caseTitle}**
   - ID: ${c.caseId}
   - Status: ${c.status}
   - Filed: ${new Date(Number(c.filedAt) * 1000).toLocaleDateString()}
   ${c.verdict ? `- Verdict: ${VerdictType[c.verdict.verdictType]}` : ''}
`).join('\n')}

Total cases: ${cases.length}`;
    } else if (lowerCommand.includes('how') || lowerCommand.includes('works') || lowerCommand.includes('explain')) {
      response = `⚖️ **How RumbleCourt Works:**

**1. File a Case** 📝
Submit your legal dispute with evidence. Each case is recorded on the blockchain for transparency.

**2. AI Simulation** 🤖
Our AI lawyers (prosecution & defense) debate your case. An AI judge presides over the proceedings.

**3. Verdict** ⚡
The AI judge delivers a verdict based on evidence and arguments, stored permanently on-chain.

**4. Appeal** 🔄
If you disagree with the verdict, you can appeal for a new trial.

**Features:**
✨ Blockchain transparency
✨ AI-powered legal analysis
✨ Immutable verdicts
✨ Appeal system

This demo uses simulated data for teaching purposes!`;
    } else if (lowerCommand.includes('demo') || lowerCommand.includes('example')) {
      response = `🏛️ **System Demo:**

Here's an example case from filing to verdict:

**Step 1 - Filing:**
"Smith vs. Johnson - Contract Dispute"
Evidence submitted and hashed on blockchain.

**Step 2 - Trial Simulation:**
🔵 Prosecution argues breach of contract
🟣 Defense claims force majeure
⚖️ Judge reviews evidence

**Step 3 - Verdict:**
"GUILTY - The defendant failed to fulfill contractual obligations."

All data is stored on-chain for permanent record!

Try filing your own case or simulating a trial on existing cases.`;
    } else {
      response = `I understand you said: "${command}"

I'm a demo AI assistant. Try these commands:
- "File a new case for breach of contract"
- "Show me my cases"
- "Explain how RumbleCourt works"
- "Show me a system demo"

Or click the Quick Actions button for preset commands!`;
    }

    const assistantNow = new Date();
    addMessage({
      id: `assistant-${assistantNow.getTime()}`,
      role: 'assistant',
      content: response,
      timestamp: assistantNow,
      timestampString: assistantNow.toLocaleTimeString()
    });

    setIsProcessing(false);
  };

  // Dummy trial simulation
  const simulateTrial = async (caseTitle: string, evidenceHash: string): Promise<void> => {
    console.log('Starting trial simulation for case:', caseTitle, evidenceHash);

    if (cases.length === 0) {
      const now = new Date();
      addMessage({
        id: `error-${now.getTime()}`,
        role: 'system',
        content: '❌ **No Cases Found**\n\nPlease file a case first before simulating a trial.',
        timestamp: now,
        timestampString: now.toLocaleTimeString()
      });
      return;
    }

    if (!currentCase) {
      const now = new Date();
      addMessage({
        id: `error-${now.getTime()}`,
        role: 'system',
        content: '❌ **No Case Selected**\n\nPlease select a case from the sidebar before simulating a trial.',
        timestamp: now,
        timestampString: now.toLocaleTimeString()
      });
      return;
    }

    if (currentCase.status === 'COMPLETED') {
      const now = new Date();
      addMessage({
        id: `error-${now.getTime()}`,
        role: 'system',
        content: '❌ **Case Already Completed**\n\nThis case already has a verdict. You can appeal it if you disagree with the outcome.',
        timestamp: now,
        timestampString: now.toLocaleTimeString()
      });
      return;
    }

    isSimulationAbortedRef.current = false;
    setIsSimulatingState(true);

    const startNow = new Date();
    addMessage({
      id: `sim-start-${startNow.getTime()}`,
      role: 'system',
      content: `⚖️ **TRIAL SIMULATION STARTING**\n\nCase: ${currentCase.caseTitle}\nEvidence Hash: ${currentCase.evidenceHash}`,
      timestamp: startNow,
      timestampString: startNow.toLocaleTimeString()
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    if (isSimulationAbortedRef.current) return;

    setSimulationProgress('Prosecution presenting arguments...');
    const prosecutionNow = new Date();
    addMessage({
      id: `prosecution-${prosecutionNow.getTime()}`,
      role: 'prosecution',
      content: `🔵 **PROSECUTION ARGUMENTS**

Your Honor, the evidence clearly demonstrates that the defendant has violated the terms of the agreement. 

The blockchain-verified evidence hash (${currentCase.evidenceHash.substring(0, 20)}...) contains irrefutable proof of the defendant's obligations and their failure to meet them.

We request that the court find the defendant guilty and award appropriate damages to the plaintiff.`,
      timestamp: prosecutionNow,
      timestampString: prosecutionNow.toLocaleTimeString()
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    if (isSimulationAbortedRef.current) return;

    setSimulationProgress('Defense presenting counter-arguments...');
    const defenseNow = new Date();
    addMessage({
      id: `defense-${defenseNow.getTime()}`,
      role: 'defense',
      content: `🟣 **DEFENSE ARGUMENTS**

Your Honor, while the prosecution presents these claims, we must consider the full context of the situation.

The defendant acted in good faith and any perceived breach was due to circumstances beyond their control. The evidence, when examined thoroughly, shows reasonable attempts to fulfill obligations.

We ask the court to find the defendant not guilty and dismiss these charges.`,
      timestamp: defenseNow,
      timestampString: defenseNow.toLocaleTimeString()
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    if (isSimulationAbortedRef.current) return;

    setSimulationProgress('Judge deliberating...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (isSimulationAbortedRef.current) return;

    setSimulationProgress('Delivering verdict...');
    const verdictNow = new Date();
    const verdictUnix = Math.floor(verdictNow.getTime() / 1000);
    const verdictType = Math.random() > 0.5 ? VerdictType.GUILTY : VerdictType.NOT_GUILTY;
    const verdictLabel = VerdictType[verdictType];
    const reasoning = verdictType === VerdictType.GUILTY
      ? 'After careful review of the evidence and arguments presented, this court finds that the defendant failed to meet their contractual obligations. The blockchain-verified evidence clearly demonstrates a breach of the agreement terms.'
      : 'After careful review of the evidence and arguments presented, this court finds that the prosecution has not met the burden of proof. The defendant has demonstrated reasonable efforts to fulfill their obligations under difficult circumstances.';

    addMessage({
      id: `verdict-${verdictNow.getTime()}`,
      role: 'judge',
      content: `⚖️ **VERDICT DELIVERED**

**Finding:** ${verdictLabel}

**Reasoning:**
${reasoning}

**Court Order:**
${verdictType === VerdictType.GUILTY ? 'The defendant is hereby ordered to fulfill their obligations and compensate the plaintiff for damages.' : 'All charges against the defendant are dismissed. The defendant is free to go.'}

This verdict has been recorded on the blockchain and is now final.

*The court is adjourned.*`,
      timestamp: verdictNow,
      timestampString: verdictNow.toLocaleTimeString()
    });

    const updatedCase: CaseWithVerdict = {
      ...currentCase,
      status: 'COMPLETED' as CaseStatus,
      verdict: {
        caseId: currentCase.caseId,
        verdictType: verdictType,
        reasoning: reasoning,
        timestamp: BigInt(verdictUnix),
        isFinal: true
      }
    };

    setCases(prev => prev.map(c => c.caseId === currentCase.caseId ? updatedCase : c));
    setCurrentCaseState(updatedCase);

    setIsSimulatingState(false);
    setSimulationProgress('');
  };

  const value: CourtroomContextType = {
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,
    isSimulating,
    simulationProgress,
    courtroomTools: {},
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
    refreshCases,
  };

  return (
    <CourtroomContext.Provider value={value}>
      {children}
    </CourtroomContext.Provider>
  );
};

export default CourtroomProvider;