'use client';

import React, { useState } from 'react';
import { Scale, Gavel, Sparkles } from 'lucide-react';
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

// Header component with quick commands
const CourtroomHeader = () => {
  const { isConnected, address } = useWallet();
  const { processCommand, isProcessing } = useCourtroom();

  const quickCommands = [
    { label: 'File Case', command: 'File a new case for contract breach with evidence of signed agreement' },
    { label: 'My Cases', command: 'Show me all my filed cases' },
    { label: 'Check Status', command: 'Check the status of case 1' },
    { label: 'Get Verdict', command: 'Get the verdict for case 1' },
  ];

  return (
    <div className="flex-shrink-0 space-y-4">
      {/* Title and Status */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Scale className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            RumbleCourt AI Terminal
          </h1>
          <Gavel className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-slate-400 mb-2">
          Minimal blockchain courtroom powered by AI agents
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Wallet Not Connected'}
          </span>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => processCommand(cmd.command)}
            disabled={isProcessing || !isConnected}
            className="
              px-4 py-2 text-sm
              bg-slate-800/50 hover:bg-slate-700/50
              border border-slate-600/50 hover:border-cyan-500/50
              rounded-lg text-slate-300 hover:text-cyan-400
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            {cmd.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main content with terminal and sidebar
const CourtroomContent = () => {
  const { cases, currentCase, setCurrentCase } = useCourtroom();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Shared Header */}
      <CourtroomHeader />

      {/* Main Content Area - Terminal + Sidebar */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Terminal Section */}
        <CourtroomSimulation />

        {/* Case History Sidebar */}
        <CaseHistorySidebar
          cases={cases}
          currentCase={currentCase}
          onSelectCase={setCurrentCase}
        />
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-center text-sm text-slate-500">
        <p>
          🏛️ Minimal smart contract • 🤖 AI-powered debates • ⚖️ On-chain verdicts • 📋 Appeal system
        </p>
      </div>
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

        <div className="relative z-10 h-screen pt-24 pb-8">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6">
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