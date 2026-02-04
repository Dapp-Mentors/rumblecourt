'use client';

import React, { useState } from 'react';
import { Users, Target, Rocket, Brain, Shield, Sparkles } from 'lucide-react';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

export default function AboutPage(): React.ReactNode {
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
          {/* Hero Section */}
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
            <p className="text-xl sm:text-2xl text-cyan-300 font-medium tracking-wide max-w-3xl mx-auto">
              Revolutionizing legal preparation through AI-powered courtroom simulation and blockchain transparency
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {[
              {
                title: "Our Mission",
                subtitle: "Empowering legal professionals",
                description: `We're on a mission to transform the legal industry by providing cutting-edge AI technology that allows lawyers and legal teams to
                preview courtroom outcomes before stepping into real litigation. Our platform combines advanced language models with blockchain
                transparency to deliver unprecedented insights and preparation tools.`,
                icon: Target,
                gradient: "from-cyan-500 to-blue-500",
                glowColor: "rgba(34,211,238,0.5)",
                features: [
                  { text: "AI-driven legal strategy optimization", icon: Sparkles, color: "text-cyan-400" },
                  { text: "Blockchain-secured case records", icon: Shield, color: "text-purple-400" },
                  { text: "Advanced legal reasoning algorithms", icon: Brain, color: "text-pink-400" },
                ],
              },
              {
                title: "Our Vision",
                subtitle: "Shaping the future of law",
                description: `We envision a future where every legal professional has access to powerful AI tools that enhance their capabilities, reduce uncertainty, and improve case outcomes.
                By leveraging the transparency of blockchain and the intelligence of AI, we're building the foundation for a more efficient and equitable legal system.`,
                icon: Rocket,
                gradient: "from-purple-500 to-pink-500",
                glowColor: "rgba(168,85,247,0.5)",
                features: [
                  { text: "Democratizing access to legal technology", color: "bg-cyan-400" },
                  { text: "Reducing litigation costs and risks", color: "bg-purple-400" },
                  { text: "Enhancing legal decision-making", color: "bg-pink-400" },
                ],
              },
            ].map((section, index) => (
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
                    isHovering === index ? `0 0 40px ${section.glowColor}` : 'none',
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`
                      w-12 h-12 bg-gradient-to-br ${section.gradient}
                      rounded-lg flex items-center justify-center
                      group-hover:scale-110 transition-transform
                    `}
                  >
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                    <p className="text-slate-400">{section.subtitle}</p>
                  </div>
                </div>
                
                <p className="text-slate-300 leading-relaxed mb-6">
                  {section.description}
                </p>

                <div className="space-y-2">
                  {section.features.map((feature, featureIndex) => (
                    'icon' in feature && feature.icon ? (
                      <div key={featureIndex} className="flex items-center gap-3 text-slate-400">
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                        <span>{feature.text}</span>
                      </div>
                    ) : (
                      <div key={featureIndex} className="flex items-center gap-3 text-slate-400">
                        <span className={`w-2 h-2 ${feature.color} rounded-full`} />
                        <span>{feature.text}</span>
                      </div>
                    )
                  ))}
                </div>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div
                    className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-br ${section.gradient}
                      opacity-20 blur-xl
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Team Section */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl mb-16">
            {/* Animated Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Users className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  The DappMentors Team
                </h2>
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: 'Darlington Gospel',
                    role: 'Lead Developer',
                    expertise: 'Blockchain & Smart Contracts',
                    icon: Shield,
                    gradient: "from-cyan-500 to-purple-500",
                  },
                  {
                    name: 'AI Integration Specialist',
                    role: 'LLM Architecture',
                    expertise: 'AI Agents & Legal Reasoning',
                    icon: Brain,
                    gradient: "from-blue-500 to-cyan-500",
                  },
                  {
                    name: 'Frontend Engineer',
                    role: 'UI/UX Design',
                    expertise: 'React & User Experience',
                    icon: Sparkles,
                    gradient: "from-pink-500 to-purple-500",
                  },
                ].map((member, index) => (
                  <div
                    key={index}
                    className="
                      group relative bg-slate-800/50 border border-slate-600/50
                      rounded-lg p-6 hover:border-cyan-500/50 transition-all
                    "
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`
                          w-16 h-16 bg-gradient-to-br ${member.gradient}
                          rounded-full flex items-center justify-center
                          group-hover:scale-110 transition-transform
                        `}
                      >
                        <member.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                        <p className="text-cyan-300 text-sm">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">{member.expertise}</p>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-slate-400">
                  Built for the Encode Club Comet Resolution v2 Hackathon with passion and innovation
                </p>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "AI & Machine Learning",
                icon: Brain,
                gradient: "from-cyan-500 to-blue-500",
                glowColor: "rgba(34,211,238,0.5)",
                items: [
                  "LLM-powered opposing lawyers",
                  "Real-time legal reasoning",
                  "Case outcome prediction",
                  "Evidence analysis algorithms",
                ],
              },
              {
                title: "Blockchain & Security",
                icon: Shield,
                gradient: "from-purple-500 to-pink-500",
                glowColor: "rgba(168,85,247,0.5)",
                items: [
                  "Immutable case records",
                  "Multi-chain compatibility",
                  "Smart contract integration",
                  "Transparent verdict storage",
                ],
              },
              {
                title: "User Experience",
                icon: Sparkles,
                gradient: "from-green-500 to-emerald-500",
                glowColor: "rgba(34,197,94,0.5)",
                items: [
                  "Intuitive courtroom interface",
                  "Real-time simulation updates",
                  "Mobile-responsive design",
                  "Seamless wallet integration",
                ],
              },
            ].map((tech, index) => (
              <div
                key={index}
                onMouseEnter={() => setIsHovering(index + 2)}
                onMouseLeave={() => setIsHovering(null)}
                className="
                  group relative bg-slate-900/50 backdrop-blur-sm
                  border border-slate-700/50 rounded-xl p-8
                  hover:border-cyan-500/50 transition-all duration-300 cursor-pointer
                "
                style={{
                  boxShadow:
                    isHovering === index + 2 ? `0 0 40px ${tech.glowColor}` : 'none',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`
                      w-10 h-10 bg-gradient-to-br ${tech.gradient}
                      rounded-lg flex items-center justify-center
                      group-hover:scale-110 transition-transform
                    `}
                  >
                    <tech.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{tech.title}</h3>
                </div>
                
                <ul className="space-y-2 text-slate-300">
                  {tech.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Animated Border Glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div
                    className={`
                      absolute inset-0 rounded-xl
                      bg-gradient-to-br ${tech.gradient}
                      opacity-20 blur-xl
                    `}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl">
              {/* Animated Corner Accents */}
              <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Join the Legal Revolution
                </h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto text-lg">
                  Experience the future of legal preparation. Whether you're a seasoned attorney or 
                  just starting your legal journey, RumbleCourt provides the tools you need to succeed.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white
                  transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      Start Your Free Trial
                      <Sparkles className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity" />
                  </button>
                  <button className="group relative px-8 py-4 bg-slate-800/50 backdrop-blur-sm border border-purple-500/50 rounded-lg
                  font-bold text-purple-300 hover:bg-slate-800 transition-all hover:scale-105">
                    Contact Sales
                    <span className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-25 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
