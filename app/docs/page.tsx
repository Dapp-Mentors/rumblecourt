'use client';

import React, { useState } from 'react';
import { BookOpen, Code, Shield, Zap, Brain, Users, Sparkles } from 'lucide-react';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

export default function DocsPage(): React.ReactNode {
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  React.useEffect(() => {
    const generateRandomParticle = (): Particle => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    });

    setParticles(Array.from({ length: 15 }, generateRandomParticle));
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background Grid */}
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

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-50"
            style={{
              left: particle.left,
              top: particle.top,
              animation: particle.animation,
              animationDelay: particle.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto w-full mt-26">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h1
                className="text-6xl sm:text-7xl font-black tracking-tight mb-4"
                style={{
                  background:
                    'linear-gradient(135deg,#06b6d4 0%,#8b5cf6 50%,#ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 80px rgba(139,92,246,.5)',
                  filter: 'drop-shadow(0 0 20px rgba(6,182,212,.7))',
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
            <p className="text-xl sm:text-2xl text-cyan-300 font-medium tracking-wide">
              Developer guides, API references, and technical documentation
            </p>
          </div>

          {/* Documentation Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Getting Started",
                description: "Quick start guides and setup instructions",
                icon: BookOpen,
                gradient: "from-cyan-500 to-blue-500",
                glowColor: "rgba(34,211,238,0.5)",
                items: ["Installation Guide", "Wallet Integration", "First Simulation"],
                buttonText: "Read Guide",
                buttonGradient: "from-cyan-400 to-blue-400",
              },
              {
                title: "API Reference",
                description: "Complete API documentation and endpoints",
                icon: Code,
                gradient: "from-purple-500 to-pink-500",
                glowColor: "rgba(168,85,247,0.5)",
                items: ["Courtroom API", "Blockchain Integration", "AI Agent Endpoints"],
                buttonText: "View API",
                buttonGradient: "from-purple-400 to-pink-400",
              },
              {
                title: "Smart Contracts",
                description: "Contract addresses and ABI documentation",
                icon: Shield,
                gradient: "from-green-500 to-emerald-500",
                glowColor: "rgba(34,197,94,0.5)",
                items: ["Court System Contract", "Verdict Storage", "Adjournment Tracking"],
                buttonText: "View Contracts",
                buttonGradient: "from-green-400 to-emerald-400",
              },
            ].map((category, index) => (
              <div
                key={index}
                onMouseEnter={() => setIsHovering(index)}
                onMouseLeave={() => setIsHovering(null)}
                className="
                  group relative bg-slate-900/50 backdrop-blur-sm
                  border border-slate-700/50 rounded-xl p-8
                  hover:border-cyan-500/50 transition-all duration-300 cursor-pointer
                "
                style={{
                  boxShadow:
                    isHovering === index ? `0 0 40px ${category.glowColor}` : 'none',
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`
                      w-12 h-12 bg-gradient-to-br ${category.gradient}
                      rounded-lg flex items-center justify-center
                      group-hover:scale-110 transition-transform
                    `}
                  >
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.title}</h3>
                    <p className="text-slate-400 text-sm">{category.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2 text-slate-300 mb-6">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button className={`group/button w-full py-3 px-4 bg-gradient-to-r ${category.buttonGradient} text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all`}>
                  {category.buttonText}
                </button>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div
                    className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-br ${category.gradient}
                      opacity-20 blur-xl
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Key Features */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl mb-16">
            {/* Animated Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Zap className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Key Features
                </h2>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {[
                    {
                      title: "AI-Powered Litigation",
                      description: "LLM-driven opposing lawyers engage in real-time courtroom debates with advanced legal reasoning.",
                      icon: Brain,
                      gradient: "from-cyan-500 to-blue-500",
                    },
                    {
                      title: "Blockchain Transparency",
                      description: "All proceedings and verdicts are immutably recorded on-chain for complete transparency and auditability.",
                      icon: Shield,
                      gradient: "from-purple-500 to-pink-500",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="
                        group relative bg-slate-800/50 border border-slate-600/50
                        rounded-lg p-6 hover:border-cyan-500/50 transition-all
                      "
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                            w-10 h-10 bg-gradient-to-br ${feature.gradient}
                            rounded-lg flex items-center justify-center
                            group-hover:scale-110 transition-transform
                          `}
                        >
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  {[
                    {
                      title: "Multi-Chain Support",
                      description: "Compatible with Ethereum, Polygon, and other EVM-compatible chains for maximum accessibility.",
                      icon: Users,
                      gradient: "from-green-500 to-emerald-500",
                    },
                    {
                      title: "Real-time Simulation",
                      description: "Experience dynamic courtroom proceedings with live AI agent interactions and immediate verdicts.",
                      icon: Zap,
                      gradient: "from-orange-500 to-red-500",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="
                        group relative bg-slate-800/50 border border-slate-600/50
                        rounded-lg p-6 hover:border-cyan-500/50 transition-all
                      "
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                            w-10 h-10 bg-gradient-to-br ${feature.gradient}
                            rounded-lg flex items-center justify-center
                            group-hover:scale-110 transition-transform
                          `}
                        >
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl">
            {/* Animated Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Code className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Quick Start
                </h2>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

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
                <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white
                transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    View Full Documentation
                    <Sparkles className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
