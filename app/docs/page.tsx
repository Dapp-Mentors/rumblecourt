'use client';

import React from 'react';
import { BookOpen, Code, Shield, Zap, Brain, Users } from 'lucide-react';

export default function DocsPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20">
      {/* Animated Background Grid */}
      <div className="absolute inset-0">
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

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h1
              className="text-5xl sm:text-6xl font-black tracking-tight mb-4"
              style={{
                background:
                  'linear-gradient(135deg,#06b6d4 0%,#8b5cf6 50%,#ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(139,92,246,.5)',
              }}
            >
              Documentation
            </h1>
            <div
              className="
                absolute -inset-4
                bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20
                blur-3xl -z-10
              "
            />
          </div>
          <p className="text-xl text-cyan-300 font-medium">
            Developer guides, API references, and technical documentation
          </p>
        </div>

        {/* Documentation Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Getting Started */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Getting Started</h3>
                <p className="text-slate-400 text-sm">Quick start guides and setup instructions</p>
              </div>
            </div>
            
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                Installation Guide
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                Wallet Integration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                First Simulation
              </li>
            </ul>

            <button className="mt-6 w-full py-2 px-4 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors">
              Read Guide
            </button>
          </div>

          {/* API Reference */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">API Reference</h3>
                <p className="text-slate-400 text-sm">Complete API documentation and endpoints</p>
              </div>
            </div>
            
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Courtroom API
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Blockchain Integration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                AI Agent Endpoints
              </li>
            </ul>

            <button className="mt-6 w-full py-2 px-4 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors">
              View API
            </button>
          </div>

          {/* Smart Contracts */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:border-green-500/50 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Smart Contracts</h3>
                <p className="text-slate-400 text-sm">Contract addresses and ABI documentation</p>
              </div>
            </div>
            
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Court System Contract
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Verdict Storage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Adjournment Tracking
              </li>
            </ul>

            <button className="mt-6 w-full py-2 px-4 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors">
              View Contracts
            </button>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI-Powered Litigation</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    LLM-driven opposing lawyers engage in real-time courtroom debates with advanced legal reasoning.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Blockchain Transparency</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    All proceedings and verdicts are immutably recorded on-chain for complete transparency and auditability.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Multi-Chain Support</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Compatible with Ethereum, Polygon, and other EVM-compatible chains for maximum accessibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-time Simulation</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Experience dynamic courtroom proceedings with live AI agent interactions and immediate verdicts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Code className="w-6 h-6 text-cyan-400" />
            Quick Start
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Installation</h3>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                <pre className="text-sm text-slate-300 overflow-x-auto">
{`npm install rumblecourt-sdk
# or
yarn add rumblecourt-sdk
# or
pnpm add rumblecourt-sdk`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Usage</h3>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                <pre className="text-sm text-slate-300 overflow-x-auto">
{`import { RumbleCourt } from 'rumblecourt-sdk';

const court = new RumbleCourt({
  chainId: 137, // Polygon
  wallet: userWallet
});

const result = await court.simulateCase({
  plaintiff: 'Your case details',
  defendant: 'Opposing arguments',
  evidence: ['document1.pdf', 'document2.pdf']
});`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold text-white transition-all hover:scale-105">
              View Full Documentation
              <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}