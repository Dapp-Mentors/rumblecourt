'use client';

import React, { useState } from 'react';
import { Scale, Gavel, Sparkles, ChevronLeft, ChevronRight, Maximize2, Minimize2, Info } from 'lucide-react';
import CourtroomSimulation from '../../components/CourtroomSimulation';
import CaseHistorySidebar from '../../components/CaseHistorySidebar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { CourtroomProvider, useCourtroom } from '../../context/CourtroomContext';
import { useWallet } from '../../context/WalletContext';

// Client-only particle component to avoid hydration mismatch
type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

const Particles = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  React.useEffect(() => {
    setMounted(true);
    const newParticles = Array.from({ length: 15 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    }));
    setParticles(newParticles);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-50"
          style={{
            left: p.left,
            top: p.top,
            animation: p.animation,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

// Compact header component
const CompactHeader = ({ onToggleTheaterMode, isTheaterMode }: { onToggleTheaterMode: () => void, isTheaterMode: boolean }) => {
  const { isConnected, address } = useWallet();
  const { processCommand, isProcessing } = useCourtroom();
  const [showQuickCommands, setShowQuickCommands] = useState(false);

  const quickCommands = [
    { label: '📝 File My First Case', command: 'File a new case for breach of contract with evidence of signed agreement' },
    { label: '📋 View My Cases', command: 'Show me all the cases I have filed' },
    { label: '⚖️ How It Works', command: 'Explain how RumbleCourt works and what I can do' },
    { label: '🏛️ System Demo', command: 'Show me an example of a complete case from filing to verdict' },
  ];

  return (
    <div className="flex-shrink-0 space-y-3 mt-5">
      {/* Compact Title Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Commands Toggle */}
          <div
            onClick={() => setShowQuickCommands(!showQuickCommands)}
            className="group relative px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-purple-500/50 rounded-lg text-slate-400 hover:text-purple-300 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Quick Actions
            {showQuickCommands && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl shadow-purple-500/20 p-2 space-y-1 z-50">
                {quickCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      processCommand(cmd.command);
                      setShowQuickCommands(false);
                    }}
                    disabled={isProcessing || !isConnected}
                    className="w-full text-left px-3 py-2 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/50 rounded text-slate-300 hover:text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theater Mode Toggle */}
          <button
            onClick={onToggleTheaterMode}
            className="group relative px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-slate-400 hover:text-cyan-300 transition-all"
            title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
          >
            {isTheaterMode ? (
              <Minimize2 className="w-3 h-3 inline mr-1" />
            ) : (
              <Maximize2 className="w-3 h-3 inline mr-1" />
            )}
            {isTheaterMode ? 'Exit' : 'Theater'}
          </button>
        </div>
      </div>

      {/* Mobile Connection Status */}
      <div className="md:hidden flex items-center justify-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Wallet Not Connected'}
        </span>
      </div>
    </div>
  );
};

// Onboarding overlay for first-time users
const OnboardingOverlay = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="max-w-2xl bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Gavel className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Welcome to RumbleCourt!
          </h2>
          <p className="text-slate-400">
            Your AI-powered blockchain courtroom
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <span className="text-cyan-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">File a Case</h3>
              <p className="text-sm text-slate-400">Use the command terminal to file a legal case with your evidence</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Watch AI Debate</h3>
              <p className="text-sm text-slate-400">AI lawyers argue your case - prosecution vs defense</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <span className="text-pink-400 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Get Verdict</h3>
              <p className="text-sm text-slate-400">AI judge delivers verdict stored permanently on blockchain</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-bold hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 transition-all transform hover:scale-105"
          >
            Get Started
          </button>
        </div>

        <p className="text-xs text-center text-slate-500">
          💡 Tip: Use "Quick Actions" button for common tasks
        </p>
      </div>
    </div>
  );
};

// Main content with improved layout
const CourtroomContent = () => {
  const { cases, currentCase, setCurrentCase } = useCourtroom();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user is new (can be stored in localStorage)
  React.useEffect(() => {
    const hasVisited = localStorage.getItem('rumblecourt_visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('rumblecourt_visited', 'true');
    }
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {showOnboarding && <OnboardingOverlay onDismiss={() => setShowOnboarding(false)} />}

      {/* Compact Header */}
      {!theaterMode && (
        <CompactHeader
          onToggleTheaterMode={() => setTheaterMode(!theaterMode)}
          isTheaterMode={theaterMode}
        />
      )}

      {/* Theater Mode Controls */}
      {theaterMode && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-slate-400">Theater Mode Active</span>
          </div>
          <button
            onClick={() => setTheaterMode(false)}
            className="text-xs px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 rounded text-slate-400 hover:text-cyan-300 transition-all"
          >
            <Minimize2 className="w-3 h-3 inline mr-1" />
            Exit Theater
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-3 min-h-0 mt-3">
        {/* Terminal Section - Takes maximum space */}
        <div className={`flex-1 transition-all duration-300 ${theaterMode ? 'mr-0' : ''}`}>
          <CourtroomSimulation />
        </div>

        {/* Collapsible Sidebar */}
        {!theaterMode && (
          <div
            className={`transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-12' : 'w-72'
              }`}
          >
            {sidebarCollapsed ? (
              /* Collapsed Sidebar */
              <div className="h-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex flex-col items-center py-4">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-all group"
                  title="Expand Case History"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                <div className="flex-1 flex items-center justify-center">
                  <div className="writing-mode-vertical text-xs text-slate-500 tracking-wider">
                    CASES ({cases.length})
                  </div>
                </div>

                {/* Mini case indicators */}
                <div className="space-y-2 mt-4">
                  {cases.slice(0, 3).map((case_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentCase(case_.caseId.toString());
                        setSidebarCollapsed(false);
                      }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${currentCase?.caseId === case_.caseId
                          ? 'border-cyan-500 bg-cyan-500/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      title={case_.caseTitle}
                    >
                      <span className="text-xs text-slate-400">{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Expanded Sidebar */
              <div className="h-full relative">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="absolute -left-3 top-4 z-10 p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-cyan-500/50 transition-all"
                  title="Collapse Case History"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <CaseHistorySidebar
                  cases={cases}
                  currentCase={currentCase}
                  onSelectCase={setCurrentCase}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Footer - Only show when not in theater mode */}
      {!theaterMode && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 mt-3 text-xs text-slate-500 border-t border-slate-800/50">
          <div className="flex items-center gap-4">
            <span>🏛️ Blockchain Court</span>
            <span>🤖 AI Agents</span>
            <span>⚖️ On-Chain Verdicts</span>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Help</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Wrapper with background effects
const CourtroomPage = () => {
  return (
    <ProtectedRoute>
      <main className="relative min-h-screen bg-slate-950 overflow-hidden">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-20px) translateX(10px); }
          }
          @keyframes gridScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
          .writing-mode-vertical {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }
        `}</style>

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139,92,246,.1) 1px,transparent 1px),
                linear-gradient(90deg,rgba(139,92,246,.1) 1px,transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'gridScroll 20s linear infinite',
            }}
          />
        </div>

        <Particles />

        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />

        <div className="relative z-10 h-screen pt-20 pb-4">
          <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6">
            <CourtroomProvider>
              <CourtroomContent />
            </CourtroomProvider>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default CourtroomPage;