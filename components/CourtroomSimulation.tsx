import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Loader2, Gavel, Brain, XCircle } from 'lucide-react';
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
    simulationProgress,
    abortSimulation,
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
    // Check if there are any cases
    if (cases.length === 0) {
      // This will be caught by the simulateTrial function, but we can provide immediate UI feedback
      await simulateTrial('', '');
      return;
    }

    // Check if a case is selected
    if (!currentCase) {
      // This will be caught by the simulateTrial function
      await simulateTrial('', '');
      return;
    }

    // Check if case is already completed
    if (currentCase.status === 'COMPLETED') {
      // This will be caught by the simulateTrial function
      await simulateTrial(currentCase.caseTitle, currentCase.evidenceHash);
      return;
    }

    // All checks passed, proceed with simulation
    await simulateTrial(currentCase.caseTitle, currentCase.evidenceHash);
  };

  const handleAbortSimulation = (): void => {
    if (window.confirm('Are you sure you want to cancel the ongoing courtroom simulation?')) {
      abortSimulation();
    }
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
            <div className={`w-3 h-3 rounded-full ${isProcessing || isSimulating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-sm text-slate-400">
              {isProcessing || isSimulating ? 'Processing...' : 'Ready'}
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

        {isProcessing && !isSimulating && (
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

        {/* Simulation Progress Banner */}
        {isSimulating && (
          <div className="px-6 py-3 border-t border-slate-700/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Brain className="w-5 h-5 text-purple-400 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-1">
                    AI Courtroom Simulation in Progress
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{simulationProgress || 'Processing...'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAbortSimulation}
                className="
                  flex items-center gap-2 px-3 py-2
                  bg-red-500/20 hover:bg-red-500/30
                  border border-red-500/50 hover:border-red-500
                  rounded-lg text-red-300 hover:text-red-200
                  transition-all text-sm font-medium
                  flex-shrink-0 ml-4
                "
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-2 w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: '100%' }} />
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