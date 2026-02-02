import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Loader2, Gavel, Brain } from 'lucide-react';
import { useCourtroom } from '../context/CourtroomContext';
import { useWallet } from '../context/WalletContext';
import TerminalMessage from './TerminalMessage';

const CourtroomSimulation: React.FC = () => {
  const {
    messages,
    isProcessing,
    processCommand,
    isSimulating,
    simulateTrial,
    currentCase,
    cases
  } = useCourtroom();

  const { isConnected } = useWallet();
  const [inputValue, setInputValue] = useState('');

  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Ref to track if user has intentionally scrolled up
  const isUserScrolledUp = useRef(false);

  // Helper to determine case data
  const getCaseForSimulation = () => {
    if (currentCase) return { caseTitle: currentCase.caseTitle, evidenceHash: currentCase.evidenceHash };
    if (cases.length > 0) return { caseTitle: cases[0].caseTitle, evidenceHash: cases[0].evidenceHash };
    return { caseTitle: 'Contract Dispute', evidenceHash: 'QmEvidenceHash123' };
  };

  // --- SCROLL LOGIC FIX ---

  // 1. Detect Scroll Position
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user is more than 50px from bottom, they have scrolled up
    isUserScrolledUp.current = distanceFromBottom > 50;
  };

  // 2. Auto-scroll Effect
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Only auto-scroll if the user hasn't manually scrolled up to read history
    if (!isUserScrolledUp.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isProcessing]); // Run when messages change or processing starts/stops


  // --- HANDLERS ---

  const handleSubmit = (): void => {
    if (!inputValue.trim() || isProcessing) return;

    // Force scroll to bottom when user sends a message
    isUserScrolledUp.current = false;

    processCommand(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSimulate = async (): Promise<void> => {
    const caseToSimulate = getCaseForSimulation();
    if (!caseToSimulate.caseTitle.trim() || !caseToSimulate.evidenceHash.trim()) return;

    // Force scroll to bottom when simulation starts
    isUserScrolledUp.current = false;

    await simulateTrial(caseToSimulate.caseTitle, caseToSimulate.evidenceHash);
  };

  return (
    // LAYOUT FIX: h-full ensures it fits the parent container from page.tsx
    // flex-col allows us to separate Header, Messages (flex-1), and Input
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">

      {/* 1. Fixed Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Command Terminal</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-sm text-slate-400">
              {isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Message Area */}
      {/* flex-1: takes available space */}
      {/* min-h-0: allows shrinking for scroll */}
      {/* overflow-y-auto: enables the scrollbar */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 scroll-smooth custom-scrollbar"
      >
        {messages.map((message) => (
          <TerminalMessage key={message.id} message={message} />
        ))}

        {isProcessing && (
          <div className="flex gap-4 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border-2 border-purple-500/50">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-white">AI Processing</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to target scroll bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Fixed Controls Area (Simulation status + Inputs) */}
      <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md">

        {/* Simulation Banner */}
        {isSimulating && (
          <div className="px-6 py-2 border-t border-slate-700/50 bg-purple-900/20">
            <div className="flex items-center gap-3 text-slate-300">
              <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-sm font-medium">AI Courtroom Simulation in Progress...</span>
            </div>
          </div>
        )}

        {/* Input Controls */}
        <div className="px-6 py-4 border-t border-slate-700/50">
          <div className="mb-3">
            <button
              onClick={handleSimulate}
              disabled={isSimulating || isProcessing}
              className="
                group relative px-4 py-2 mr-2
                bg-gradient-to-r from-purple-500 to-pink-600
                rounded-lg font-medium text-white overflow-hidden
                transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                Simulate Courtroom
              </span>
            </button>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (Watch AI lawyers debate)
            </span>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your legal request..." : "Connect wallet to start..."}
              disabled={isProcessing || !isConnected}
              className="
                flex-1 px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-lg
                text-white placeholder-slate-500
                focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !inputValue.trim() || !isConnected}
              className="
                group relative px-6 py-3
                bg-gradient-to-r from-cyan-500 to-blue-600
                rounded-lg font-bold text-white overflow-hidden
                transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send
              </span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Powered by AI Agents</span>
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtroomSimulation;