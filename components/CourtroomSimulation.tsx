import React, { useState, useEffect, useRef } from 'react';
import { Scale, Gavel, Send, Terminal, Loader2 } from 'lucide-react';
import { useCourtroom } from '../context/CourtroomContext';
import CaseHistorySidebar from './CaseHistorySidebar';
import TerminalMessage from './TerminalMessage';

const CourtroomSimulation: React.FC = () => {
  const {
    cases,
    currentCase,
    messages,
    isProcessing,
    setCurrentCase,
    processCommand
  } = useCourtroom();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectCase = (caseId: string): void => {
    setCurrentCase(caseId);
  };

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

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)] max-w-7xl mx-auto px-4 sm:px-6">
      {/* Main Terminal Area - Now on the left */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Scale className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Courtroom Terminal
            </h1>
            <Gavel className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-400">
            Command-driven AI legal simulation powered by MCP agents
          </p>
        </div>

        {/* Case Status Bar */}
        {/* {currentCase && (
          <div className="mb-4 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{currentCase.title}</h3>
                <p className="text-sm text-slate-400">
                  {currentCase.plaintiff} vs {currentCase.defendant}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full ${currentCase.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                    currentCase.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/50'
                  }`}>
                  {currentCase.status}
                </span>
                <span className="text-xs text-slate-500">
                  {currentCase.evidence.length} evidence items
                </span>
              </div>
            </div>
          </div>
        )} */}

        {/* Terminal Interface */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          {/* Terminal Header */}
          <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter command (e.g., 'create new case', 'start trial')..."
                disabled={isProcessing}
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
                disabled={isProcessing || !inputValue.trim()}
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
              <span>Powered by MCP agent tool calling</span>
              <span>{messages.length} messages</span>
            </div>
          </div>
        </div>

        {/* Quick Commands */}
        {/* <div className="mt-4 bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Quick Commands</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              'create new case',
              'start trial',
              'add evidence',
              'show case details',
              'list cases',
              'render verdict'
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => setInputValue(cmd)}
                className="
                  px-3 py-2 bg-slate-800/50 hover:bg-slate-800
                  border border-slate-700/50 hover:border-cyan-500/50
                  rounded-lg text-xs text-slate-400 hover:text-cyan-300
                  transition-all text-left
                "
              >
                {cmd}
              </button>
            ))}
          </div>
        </div> */}
      </div>

      {/* Right Sidebar - Case History */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <CaseHistorySidebar
          cases={cases}
          currentCase={currentCase}
          onSelectCase={handleSelectCase}
        />
      </div>
    </div>
  );
};

export default CourtroomSimulation;