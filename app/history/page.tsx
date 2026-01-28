'use client';

import React from 'react';
import { BookOpen, Clock, Shield, Users, FileText } from 'lucide-react';

export default function HistoryPage(): React.ReactNode {
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
          <p className="text-xl text-cyan-300 font-medium">
            Review past courtroom simulations and verdicts
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Cases</p>
                <p className="text-2xl font-bold text-white">1,234</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">78%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg. Duration</p>
                <p className="text-2xl font-bold text-white">4.2 min</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">156</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Recent Simulations
          </h2>

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
                className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm font-medium rounded-full">
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
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold text-white transition-all hover:scale-105">
              View All Cases
              <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}