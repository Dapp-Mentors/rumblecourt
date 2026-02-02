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
    simulateTrial
  } = useCourtroom();

  const { isConnected } = useWallet();

  const [inputValue, setInputValue] = useState('');
  const [caseTitle] = useState('Contract Dispute');
  const [evidenceHash] = useState('QmEvidenceHash123');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (): void => {
    if (!inputValue.trim() || isProcessing) return;
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
    if (!caseTitle.trim() || !evidenceHash.trim()) return;
    await simulateTrial(caseTitle, evidenceHash);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden min-h-0">
      {/* Terminal Header */}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
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

        <div ref={messagesEndRef} />
      </div>

      {/* Simulation Controls */}
      {isSimulating && (
        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
          <div className="flex items-center gap-3 text-slate-400">
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm font-medium">AI Courtroom Simulation in Progress...</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
        {/* Simulation Trigger */}
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
          <span className="text-xs text-slate-500">
            (Watch AI lawyers debate and get a verdict)
          </span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isConnected
                ? "Type your legal request here (e.g., 'file a case', 'view my cases', 'how does this work?')..."
                : "Connect wallet to start using RumbleCourt..."
            }
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
          <span>Powered by AI MCP agents + blockchain</span>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </div>
  );
};

export default CourtroomSimulation;