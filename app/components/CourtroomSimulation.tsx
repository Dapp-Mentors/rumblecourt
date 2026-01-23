import React, { useState, useEffect, useRef } from 'react';
import { Scale, Gavel, Send, Terminal, Loader2 } from 'lucide-react';
import { Case, ChatMessage } from './types';
import CaseHistorySidebar from './CaseHistorySidebar';
import TerminalMessage from './TerminalMessage';

const CourtroomSimulation: React.FC = () => {
  // Mock cases data (replace with actual data from MCP)
  const [cases,] = useState<Case[]>([
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

  const [currentCase, setCurrentCase] = useState<Case | null>(cases[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to RumbleCourt AI. I can help you manage cases, start trials, and facilitate AI-powered legal debates. Try commands like "create new case" or "list my cases".',
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectCase = (caseId: string) => {
    const selected = cases.find(c => c.id === caseId);
    setCurrentCase(selected || null);

    // Add system message about case selection
    const systemMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Loaded case: ${selected?.title}\nPlaintiff: ${selected?.plaintiff} vs Defendant: ${selected?.defendant}`,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: command,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    let response = '';

    if (command.toLowerCase().includes('create') && command.toLowerCase().includes('case')) {
      response = `I'll create a new case for you. Please provide the case details:

• Case title
• Plaintiff name
• Defendant name
• Brief description

You can also paste evidence as text or upload a document.`;
    } else if (command.toLowerCase().includes('start trial')) {
      if (currentCase) {
        response = `Starting trial for "${currentCase.title}"...\n\nInitializing AI attorneys for both sides.`;
        setTimeout(() => {
          const plaintiffArg: ChatMessage = {
            id: `msg-${Date.now()}-p`,
            role: 'plaintiff',
            content: `Your Honor, my client ${currentCase.plaintiff} has a strong case. The evidence clearly shows...`,
            timestamp: new Date(),
            timestampString: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, plaintiffArg]);
        }, 2000);
      } else {
        response = 'No active case found. Please create or load a case first using "create new case" or select one from the sidebar.';
      }
    } else if (command.toLowerCase().includes('add evidence')) {
      response = 'Please paste the evidence text below, or describe the document you\'d like to add. I\'ll store it and associate it with the current case.';
    } else if (command.toLowerCase().includes('show case') || command.toLowerCase().includes('case details')) {
      if (currentCase) {
        response = [
          '**Current Case Details**',
          '',
          `• ID: ${currentCase.id}`,
          `• Title: ${currentCase.title}`,
          `• Plaintiff: ${currentCase.plaintiff}`,
          `• Defendant: ${currentCase.defendant}`,
          `• Status: ${currentCase.status}`,
          `• Evidence count: ${currentCase.evidence.length}`,
        ].join('\n');
      } else {
        response = 'No active case. Create one with "create new case" or select from sidebar.';
      }
    } else if (command.toLowerCase().includes('list cases')) {
      response = `You have ${cases.length} cases:\n\n` +
        cases.map((c, i) => `${i + 1}. ${c.title} (${c.status})`).join('\n');
    } else {
      response = [
        'I can help you with:',
        '',
        '• "create new case" - Start a new legal case',
        '• "start trial" - Begin AI attorney debate',
        '• "add evidence [text]" - Add evidence to case',
        '• "show case details" - View current case',
        '• "list cases" - See all your cases',
        '• "render verdict" - Get AI judge decision',
      ].join('\n');
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      timestampString: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || isProcessing) return;
    processCommand(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        {currentCase && (
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
        )}

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
        <div className="mt-4 bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
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
        </div>
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