'use client';

import React, { useState } from 'react';
import CourtroomSimulation from '../components/CourtroomSimulation';
import ProtectedRoute from '../components/ProtectedRoute';

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
    // 1. Mark as mounted
    setMounted(true);

    // 2. Generate random particles ONLY on the client
    const newParticles = Array.from({ length: 15 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    }));

    setParticles(newParticles);
  }, []);

  // On the server and the very first client pass, return null.
  // This ensures the "Initial UI" matches perfectly.
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

        <div className="relative z-10 min-h-screen pt-24 pb-8">
          <CourtroomSimulation />
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default CourtroomPage;

