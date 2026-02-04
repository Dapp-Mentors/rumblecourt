'use client';

import React, { useState } from 'react';
import { Scale, Zap, ChevronRight, Sparkles, Brain, Lock } from 'lucide-react';
import Footer from '@/components/Footer';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

export default function Home(): React.ReactNode {
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  React.useEffect(() => {
    const generateRandomParticle = (): Particle => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    });

    setParticles(Array.from({ length: 20 }, generateRandomParticle));
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI Agent Litigation",
      description:
        "LLM-powered opposing lawyers engage in fierce, real-time courtroom debates.",
      gradient: "from-red-500 to-orange-500",
      glowColor: "rgba(239,68,68,0.5)",
    },
    {
      icon: Lock,
      title: "Blockchain Transparency",
      description:
        "All proceedings and verdicts immutably recorded on-chain for complete transparency.",
      gradient: "from-cyan-400 to-blue-500",
      glowColor: "rgba(34,211,238,0.5)",
    },
    {
      icon: Sparkles,
      title: "Pre-Litigation Preview",
      description:
        "Simulate trial outcomes before real-world litigation to save time and resources.",
      gradient: "from-purple-500 to-pink-500",
      glowColor: "rgba(168,85,247,0.5)",
    },
  ];

  const coreFeatures = [
    "Real-time AI lawyer debates on user-submitted evidence",
    "Neutral judge LLM delivers binding verdicts",
    "On-chain recording of trials and outcomes",
    "Adjournment tracking and case history reference",
    "Productivity enhancement for legal professionals",
    "Opik-powered evaluation and observability",
  ];

  return (
    <>
      <main className="relative min-h-screen bg-slate-950 overflow-hidden">
        {/* Animated Background Grid */}
        <div
          className="
          absolute inset-0
          bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20
        "
        >
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

        {/* Content Container */}
        <div
          className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-8"
        >
          <div className="max-w-7xl mx-auto w-full mt-26">
            {/* Header Section */}
            <div className="text-center mb-16 space-y-6">
              {/* Logo/Title with Neon Effect */}
              <div className="relative inline-block">
                <h1
                  className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight mb-4"
                  style={{
                    background:
                      'linear-gradient(135deg,#06b6d4 0%,#8b5cf6 50%,#ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 80px rgba(139,92,246,.5)',
                    filter: 'drop-shadow(0 0 20px rgba(6,182,212,.7))',
                  }}
                >
                  RUMBLECOURT
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
                AI-Driven Courtroom Simulator
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <button
                  className="
                  group relative px-8 py-4
                  bg-gradient-to-r from-cyan-500 to-blue-600
                  rounded-lg font-bold text-white overflow-hidden
                  transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50
                "
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400
                  to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="relative flex items-center gap-2">
                    Launch Trial Simulation
                    <ChevronRight
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </button>

                <button
                  className="
                  group px-8 py-4 bg-slate-800/50 backdrop-blur-sm
                  border-2 border-purple-500/50 rounded-lg font-bold text-purple-300
                  hover:bg-slate-800 hover:border-purple-400
                  transition-all hover:scale-105
                "
                >
                  Connect Wallet
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setIsHovering(index)}
                  onMouseLeave={() => setIsHovering(null)}
                  className="
                  group relative bg-slate-900/50 backdrop-blur-sm
                  border border-slate-700/50 rounded-xl p-6
                  hover:border-cyan-500/50 transition-all duration-300 cursor-pointer
                "
                  style={{
                    boxShadow:
                      isHovering === index ? `0 0 40px ${feature.glowColor}` : 'none',
                  }}
                >
                  {/* Icon with Gradient */}
                  <div
                    className={`
                    inline-flex p-3 rounded-lg
                    bg-gradient-to-br ${feature.gradient}
                    mb-4
                  `}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Animated Border Glow */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div
                      className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-br ${feature.gradient}
                      opacity-20 blur-xl
                    `}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Core Features Panel */}
            <div
              className="
              relative
              bg-gradient-to-br from-slate-900/80 to-slate-800/80
              backdrop-blur-xl border border-slate-700/50
              rounded-2xl p-8 sm:p-12 shadow-2xl
            "
            >
              {/* Animated Corner Accents */}
              <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Scale className="w-8 h-8 text-cyan-400" />
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    Core Features
                  </h2>
                  <Zap className="w-8 h-8 text-purple-400" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {coreFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="
                      group flex items-start gap-3 p-4 rounded-lg
                      bg-slate-800/30 hover:bg-slate-800/60 transition-all
                      border border-slate-700/30 hover:border-cyan-500/50
                    "
                    >
                      <div
                        className="
                        shrink-0 w-6 h-6 rounded-full
                        bg-gradient-to-br from-cyan-400 to-purple-500
                        flex items-center justify-center mt-0.5
                      "
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <p className="text-slate-300 group-hover:text-white transition-colors">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
