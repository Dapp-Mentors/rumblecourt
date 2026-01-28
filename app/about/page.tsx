'use client';

import React from 'react';
import { Users, Target, Rocket, Brain, Shield, Sparkles } from 'lucide-react';

export default function AboutPage(): React.ReactNode {
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
        {/* Hero Section */}
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
              About RumbleCourt
            </h1>
            <div
              className="
                absolute -inset-4
                bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20
                blur-3xl -z-10
              "
            />
          </div>
          <p className="text-xl text-cyan-300 font-medium max-w-3xl mx-auto">
            Revolutionizing legal preparation through AI-powered courtroom simulation and blockchain transparency
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                <p className="text-slate-400">Empowering legal professionals</p>
              </div>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              We're on a mission to transform the legal industry by providing cutting-edge AI technology 
              that allows lawyers and legal teams to preview courtroom outcomes before stepping into 
              real litigation. Our platform combines advanced language models with blockchain transparency 
              to deliver unprecedented insights and preparation tools.
            </p>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-3 text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI-driven legal strategy optimization</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Blockchain-secured case records</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Brain className="w-4 h-4 text-pink-400" />
                <span>Advanced legal reasoning algorithms</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Our Vision</h2>
                <p className="text-slate-400">Shaping the future of law</p>
              </div>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              We envision a future where every legal professional has access to powerful AI tools that 
              enhance their capabilities, reduce uncertainty, and improve case outcomes. By leveraging 
              the transparency of blockchain and the intelligence of AI, we're building the foundation 
              for a more efficient and equitable legal system.
            </p>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span>Democratizing access to legal technology</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                <span>Reducing litigation costs and risks</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
                <span>Enhancing legal decision-making</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            The DappMentors Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Darlington Gospel',
                role: 'Lead Developer',
                expertise: 'Blockchain & Smart Contracts',
                icon: Shield,
              },
              {
                name: 'AI Integration Specialist',
                role: 'LLM Architecture',
                expertise: 'AI Agents & Legal Reasoning',
                icon: Brain,
              },
              {
                name: 'Frontend Engineer',
                role: 'UI/UX Design',
                expertise: 'React & User Experience',
                icon: Sparkles,
              },
            ].map((member, index) => (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                    <member.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                    <p className="text-cyan-300 text-sm">{member.role}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">{member.expertise}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              Built for the Encode Club Comet Resolution v2 Hackathon with passion and innovation
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              AI & Machine Learning
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                LLM-powered opposing lawyers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                Real-time legal reasoning
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                Case outcome prediction
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                Evidence analysis algorithms
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Blockchain & Security
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Immutable case records
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Multi-chain compatibility
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Smart contract integration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                Transparent verdict storage
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              User Experience
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
                Intuitive courtroom interface
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
                Real-time simulation updates
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
                Mobile-responsive design
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full" />
                Seamless wallet integration
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Join the Legal Revolution
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Experience the future of legal preparation. Whether you're a seasoned attorney or 
              just starting your legal journey, RumbleCourt provides the tools you need to succeed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold text-white transition-all hover:scale-105">
                Start Your Free Trial
                <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity" />
              </button>
              <button className="px-8 py-3 bg-slate-800/50 backdrop-blur-sm border border-purple-500/50 rounded-lg font-semibold text-purple-300 hover:bg-slate-800 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}