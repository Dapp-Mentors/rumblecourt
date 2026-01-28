'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, Shield, Users, FileText, Sparkles } from 'lucide-react';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

export default function HistoryPage(): React.ReactNode {
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
                Case History
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
              Review past courtroom simulations and verdicts
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              {
                title: "Total Cases",
                value: "1,234",
                icon: FileText,
                gradient: "from-cyan-500 to-blue-500",
                glowColor: "rgba(34,211,238,0.5)",
              },
              {
                title: "Win Rate",
                value: "78%",
                icon: Shield,
                gradient: "from-green-500 to-emerald-500",
                glowColor: "rgba(34,197,94,0.5)",
              },
              {
                title: "Avg. Duration",
                value: "4.2 min",
                icon: Clock,
                gradient: "from-purple-500 to-pink-500",
                glowColor: "rgba(168,85,247,0.5)",
              },
              {
                title: "Active Users",
                value: "156",
                icon: Users,
                gradient: "from-orange-500 to-red-500",
                glowColor: "rgba(251,113,90,0.5)",
              },
            ].map((stat, index) => (
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
                    isHovering === index ? `0 0 40px ${stat.glowColor}` : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Cases</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`
                      w-12 h-12 bg-gradient-to-br ${stat.gradient}
                      rounded-lg flex items-center justify-center
                      group-hover:scale-110 transition-transform
                    `}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div
                    className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-br ${stat.gradient}
                      opacity-20 blur-xl
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Cases */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl">
            {/* Animated Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8">
                <BookOpen className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Recent Simulations
                </h2>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: 'CASE-001',
                    title: 'Contract Dispute: Software Development',
                    date: '2 hours ago',
                    outcome: 'Plaintiff Win',
                    duration: '3 min 45 sec',
                    parties: ['TechCorp Inc.', 'DevStudio LLC'],
                  },
                  {
                    id: 'CASE-002',
                    title: 'Intellectual Property: Patent Infringement',
                    date: '6 hours ago',
                    outcome: 'Defendant Win',
                    duration: '5 min 12 sec',
                    parties: ['Innovate Labs', 'CopyRight Corp'],
                  },
                  {
                    id: 'CASE-003',
                    title: 'Employment Law: Wrongful Termination',
                    date: '1 day ago',
                    outcome: 'Settlement',
                    duration: '4 min 8 sec',
                    parties: ['Employee A', 'Company B'],
                  },
                ].map((caseItem, index) => (
                  <div
                    key={index}
                    className="
                      group relative bg-slate-800/50 border border-slate-600/50
                      rounded-lg p-6 hover:border-cyan-500/50 transition-all cursor-pointer
                    "
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm font-medium rounded-full group-hover:bg-cyan-500/30 transition-colors">
                            {caseItem.id}
                          </span>
                          <span className="text-slate-400 text-sm">{caseItem.date}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {caseItem.title}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {caseItem.parties.join(' vs. ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            caseItem.outcome === 'Plaintiff Win'
                              ? 'bg-green-500/20 text-green-300'
                              : caseItem.outcome === 'Defendant Win'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {caseItem.outcome}
                        </span>
                        <span className="text-slate-400 text-sm">{caseItem.duration}</span>
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white
                transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    View All Cases
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
