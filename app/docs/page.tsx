'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Database, FileText, Gavel, Sparkles, CheckCircle, AlertTriangle, Scale, TrendingUp } from 'lucide-react';
import { Case, Verdict, VerdictType } from '../../components/types';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

type EthereumRequestAccounts = string[];

type SandboxTab = 'cases' | 'verdicts' | 'appeals' | 'stats' | 'dummy';

// Dummy blockchain functions for demo
const dummyBlockchainService = {
  cases: new Map<bigint, Case>(),
  verdicts: new Map<bigint, Verdict>(),
  totalCases: BigInt(0),
  owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',

  async fileCase(title: string, evidenceHash: string, plaintiff: string): Promise<bigint> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transaction
    const caseId = this.totalCases + BigInt(1);
    this.totalCases = caseId;

    const newCase: Case = {
      caseId,
      plaintiff,
      caseTitle: title,
      evidenceHash,
      filedAt: BigInt(Math.floor(Date.now() / 1000)),
      status: 'PENDING'
    };

    this.cases.set(caseId, newCase);
    return caseId;
  },

  async getCase(caseId: bigint): Promise<Case> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const case_ = this.cases.get(caseId);
    if (!case_) throw new Error('Case not found');
    return case_;
  },

  async getUserCases(userAddress: string): Promise<bigint[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const userCases: bigint[] = [];
    this.cases.forEach((case_, caseId) => {
      if (case_.plaintiff.toLowerCase() === userAddress.toLowerCase()) {
        userCases.push(caseId);
      }
    });
    return userCases;
  },

  async getTotalCases(): Promise<bigint> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.totalCases;
  },

  async startTrial(caseId: bigint): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const case_ = this.cases.get(caseId);
    if (!case_) throw new Error('Case not found');
    case_.status = 'IN_TRIAL';
    this.cases.set(caseId, case_);
  },

  async recordVerdict(
    caseId: bigint,
    verdictType: number,
    reasoning: string,
    isFinal: boolean
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const case_ = this.cases.get(caseId);
    if (!case_) throw new Error('Case not found');

    const verdict: Verdict = {
      caseId,
      verdictType: verdictType as VerdictType,
      reasoning,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      isFinal
    };

    this.verdicts.set(caseId, verdict);
    case_.status = 'COMPLETED';
    this.cases.set(caseId, case_);
  },

  async getVerdict(caseId: bigint): Promise<Verdict> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const verdict = this.verdicts.get(caseId);
    if (!verdict) throw new Error('Verdict not found');
    return verdict;
  },

  async hasVerdict(caseId: bigint): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.verdicts.has(caseId);
  },

  async appealCase(caseId: bigint): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const case_ = this.cases.get(caseId);
    if (!case_) throw new Error('Case not found');
    case_.status = 'APPEALED';
    this.cases.set(caseId, case_);
  },

  async getOwner(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.owner;
  }
};

export default function DocsPage(): React.ReactNode {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<SandboxTab>('cases');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for cases
  const [caseTitle, setCaseTitle] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [caseId, setCaseId] = useState<bigint>(BigInt(0));
  const [userAddress, setUserAddress] = useState('');

  // Form states for verdicts
  const [verdictCaseId, setVerdictCaseId] = useState<bigint>(BigInt(0));
  const [verdictType, setVerdictType] = useState<number>(0);
  const [reasoning, setReasoning] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  // Form states for appeals
  const [appealCaseId, setAppealCaseId] = useState<bigint>(BigInt(0));

  // Data display states
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [verdictData, setVerdictData] = useState<Verdict | null>(null);
  const [userCases, setUserCases] = useState<bigint[]>([]);
  const [totalCases, setTotalCases] = useState<bigint>(BigInt(0));
  const [ownerAddress, setOwnerAddress] = useState<string>('');

  useEffect(() => {
    const generateRandomParticle = (): Particle => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    });

    setParticles(Array.from({ length: 15 }, generateRandomParticle));

    checkWalletConnection();
  }, []);

  const checkWalletConnection = async (): Promise<void> => {
    if (!window.ethereum) return;

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as EthereumRequestAccounts;

    if (accounts.length > 0) {
      setWalletConnected(true);
      setAccount(accounts[0]);
      await checkOwnerStatus(accounts[0]);
    }
  };

  const checkOwnerStatus = async (address: string): Promise<void> => {
    try {
      const owner = await dummyBlockchainService.getOwner();
      setOwnerAddress(owner);
      setIsOwner(address.toLowerCase() === owner.toLowerCase());
    } catch (err) {
      console.error('Failed to check owner status:', err);
    }
  };

  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) {
      setError('No Ethereum provider found. Please install MetaMask or another wallet.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as EthereumRequestAccounts;

      setWalletConnected(true);
      setAccount(accounts[0]);
      await checkOwnerStatus(accounts[0]);
      setSuccess('Wallet connected successfully! (Demo Mode - Using simulated blockchain)');
    } catch {
      setError('Failed to connect wallet');
    }
  };

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(message);
    setLoading(false);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // ============================================
  // CASE FUNCTIONS
  // ============================================

  const handleFileCase = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await dummyBlockchainService.fileCase(caseTitle, evidenceHash, account || '');
      setSuccess(`Case "${caseTitle}" filed successfully! (Simulated)`);
      setCaseTitle('');
      setEvidenceHash('');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCase = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const data = await dummyBlockchainService.getCase(caseId);
      setCaseData(data);
      setSuccess('Case retrieved successfully!');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUserCases = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const cases = await dummyBlockchainService.getUserCases(userAddress);
      setUserCases(cases);
      setSuccess(`Found ${cases.length} cases for user (simulated data)`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TRIAL & VERDICT FUNCTIONS
  // ============================================

  const handleStartTrial = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await dummyBlockchainService.startTrial(caseId);
      setSuccess('Trial started successfully! (Simulated)');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await dummyBlockchainService.recordVerdict(verdictCaseId, verdictType, reasoning, isFinal);
      setSuccess('Verdict recorded successfully! (Simulated)');
      setReasoning('');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const verdict = await dummyBlockchainService.getVerdict(verdictCaseId);
      setVerdictData(verdict);
      setSuccess('Verdict retrieved successfully!');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const hasVerdictResult = await dummyBlockchainService.hasVerdict(verdictCaseId);
      setSuccess(hasVerdictResult ? '✅ Verdict exists for this case' : '❌ No verdict found for this case');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // APPEAL FUNCTIONS
  // ============================================

  const handleAppealCase = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await dummyBlockchainService.appealCase(appealCaseId);
      setSuccess('Case appealed successfully! (Simulated)');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // STATS FUNCTIONS
  // ============================================

  const handleGetTotalCases = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const total = await dummyBlockchainService.getTotalCases();
      setTotalCases(total);
      const owner = await dummyBlockchainService.getOwner();
      setOwnerAddress(owner);
      setSuccess('Statistics fetched successfully!');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DUMMY DATA GENERATION
  // ============================================

  const generateDummyData = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const dummyCases = [
        {
          title: 'Contract Breach: Delivery Failure',
          evidence: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        {
          title: 'Employment Discrimination: Gender Pay Gap',
          evidence: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        {
          title: 'IP Infringement: Patent Violation',
          evidence: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        },
      ];

      for (const dummyCase of dummyCases) {
        await dummyBlockchainService.fileCase(dummyCase.title, dummyCase.evidence, account || '');
      }

      setSuccess('✨ Successfully generated 3 dummy cases! (Simulated)');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="relative min-h-screen bg-slate-950 overflow-hidden">
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes gridScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
        `}</style>

        {/* Background Effects */}
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

        {/* Animated Particles */}
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

        {/* Gradient Blobs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
                      <Gavel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        RumbleCourt Sandbox
                      </h1>
                      <p className="text-sm text-slate-400">Demo Mode - Simulated Blockchain</p>
                    </div>
                  </div>
                </div>

                {!walletConnected ? (
                  <button
                    onClick={connectWallet}
                    className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Connect Wallet
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm text-slate-300 font-mono">
                          {account?.slice(0, 6)}...{account?.slice(-4)}
                        </span>
                      </div>
                      {isOwner && (
                        <div className="mt-1 text-xs text-cyan-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Owner
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(error || success) && (
            <div className="max-w-7xl mx-auto px-6 pt-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                  <button onClick={clearMessages} className="ml-auto text-red-400 hover:text-red-300">✕</button>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-300">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{success}</p>
                  <button onClick={clearMessages} className="ml-auto text-green-400 hover:text-green-300">✕</button>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="space-y-8">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'cases' as SandboxTab, icon: FileText, label: 'Cases' },
                  { id: 'verdicts' as SandboxTab, icon: Gavel, label: 'Verdicts' },
                  { id: 'appeals' as SandboxTab, icon: Scale, label: 'Appeals' },
                  { id: 'stats' as SandboxTab, icon: TrendingUp, label: 'Stats' },
                  { id: 'dummy' as SandboxTab, icon: Sparkles, label: 'Generate Data' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="pt-8">
                {activeTab === 'cases' && (
                  <div className="space-y-8">
                    {/* File Case */}
                    <div className="max-w-2xl mx-auto">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">File New Case</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case Title</label>
                            <input
                              type="text"
                              placeholder="Contract Breach Dispute"
                              value={caseTitle}
                              onChange={(e) => setCaseTitle(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Evidence Hash</label>
                            <input
                              type="text"
                              placeholder="0xabcdef..."
                              value={evidenceHash}
                              onChange={(e) => setEvidenceHash(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleFileCase}
                            disabled={loading || !walletConnected || !caseTitle || !evidenceHash}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Filing...' : 'File Case'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Get Case & Get User Cases */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Get Case by ID</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(caseId)}
                              onChange={(e) => setCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleGetCase}
                            disabled={loading || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Get Case
                          </button>

                          {caseData && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-purple-400 mb-2">Case Details:</h4>
                              <div className="space-y-1 text-sm text-slate-300">
                                <div><span className="text-slate-400">ID:</span> {caseData.caseId.toString()}</div>
                                <div><span className="text-slate-400">Title:</span> {caseData.caseTitle}</div>
                                <div><span className="text-slate-400">Plaintiff:</span> <span className="font-mono text-xs">{caseData.plaintiff}</span></div>
                                <div><span className="text-slate-400">Status:</span> <span className="text-purple-400 font-semibold">{caseData.status}</span></div>
                                <div><span className="text-slate-400">Filed:</span> {new Date(Number(caseData.filedAt) * 1000).toLocaleString()}</div>
                                <div className="pt-2 border-t border-slate-700">
                                  <span className="text-slate-400">Evidence:</span>
                                  <p className="mt-1 font-mono text-xs text-slate-300 break-all">{caseData.evidenceHash}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Get User Cases</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">User Address</label>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={userAddress}
                              onChange={(e) => setUserAddress(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 font-mono focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleGetUserCases}
                            disabled={loading || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Get Cases
                          </button>

                          {userCases.length > 0 && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-orange-400 mb-2">User Cases:</h4>
                              <div className="space-y-2">
                                {userCases.map((id) => (
                                  <div key={id.toString()} className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-400">Case ID:</span>
                                    <span className="text-orange-400 font-semibold">{id.toString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'verdicts' && (
                  <div className="space-y-8">
                    {/* Start Trial */}
                    <div className="max-w-2xl mx-auto">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Start Trial</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(caseId)}
                              onChange={(e) => setCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <p className="text-sm text-cyan-300">
                              <strong>Note:</strong> Only the contract owner can start trials. This will change the case status to IN_TRIAL.
                            </p>
                          </div>

                          <button
                            onClick={handleStartTrial}
                            disabled={loading || !walletConnected || !isOwner}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Start Trial
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Record Verdict & Get Verdict */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Record Verdict</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(verdictCaseId)}
                              onChange={(e) => setVerdictCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Verdict Type</label>
                            <select
                              value={verdictType}
                              onChange={(e) => setVerdictType(Number(e.target.value))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                            >
                              <option value={0}>GUILTY</option>
                              <option value={1}>NOT_GUILTY</option>
                              <option value={2}>SETTLEMENT</option>
                              <option value={3}>DISMISSED</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Reasoning</label>
                            <textarea
                              placeholder="Explain the verdict..."
                              value={reasoning}
                              onChange={(e) => setReasoning(e.target.value)}
                              rows={3}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isFinal"
                              checked={isFinal}
                              onChange={(e) => setIsFinal(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800/50"
                            />
                            <label htmlFor="isFinal" className="text-sm text-slate-300">Mark as Final</label>
                          </div>

                          <button
                            onClick={handleRecordVerdict}
                            disabled={loading || !walletConnected || !isOwner}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Record Verdict
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4">Get Verdict</h3>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={Number(verdictCaseId)}
                                onChange={(e) => setVerdictCaseId(BigInt(e.target.value || 0))}
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
                              />
                            </div>

                            <button
                              onClick={handleGetVerdict}
                              disabled={loading || !walletConnected}
                              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Get Verdict
                            </button>

                            <button
                              onClick={handleCheckVerdict}
                              disabled={loading || !walletConnected}
                              className="w-full py-2 bg-slate-800/50 border border-slate-600 hover:border-green-500/50 rounded-lg font-semibold text-slate-300 hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Check Status
                            </button>
                          </div>

                          {verdictData && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-purple-400 mb-2">Verdict Details:</h4>
                              <div className="space-y-1 text-sm text-slate-300">
                                <div><span className="text-slate-400">Case ID:</span> {verdictData.caseId.toString()}</div>
                                <div><span className="text-slate-400">Type:</span> <span className="text-purple-400 font-semibold">{VerdictType[verdictData.verdictType]}</span></div>
                                <div><span className="text-slate-400">Final:</span> {verdictData.isFinal ? '✅ Yes' : '❌ No'}</div>
                                <div><span className="text-slate-400">Timestamp:</span> {new Date(Number(verdictData.timestamp) * 1000).toLocaleString()}</div>
                                <div className="pt-2 border-t border-slate-700">
                                  <span className="text-slate-400">Reasoning:</span>
                                  <p className="mt-1 text-slate-300">{verdictData.reasoning}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appeals' && (
                  <div className="space-y-8">
                    <div className="max-w-2xl mx-auto">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                          <Scale className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Appeal Case</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(appealCaseId)}
                              onChange={e => setAppealCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-blue-300">
                              <strong>Note:</strong> Only the plaintiff who filed the case can appeal. The case must be COMPLETED with a final verdict. After appeal, the case status becomes APPEALED. (Simulated)
                            </p>
                          </div>

                          <button
                            onClick={handleAppealCase}
                            disabled={loading || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Appeal Case
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <button
                        onClick={handleGetTotalCases}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          Fetch Statistics
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Total Cases</h3>
                        <p className="text-4xl font-bold text-cyan-400">{totalCases.toString()}</p>
                        <p className="text-sm text-slate-400 mt-2">Cases filed in the system (simulated)</p>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Contract Owner</h3>
                        <p className="text-lg font-mono text-purple-400 break-all">{ownerAddress || 'Loading...'}</p>
                        <p className="text-sm text-slate-400 mt-2">Can start trials & record verdicts (simulated)</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dummy' && (
                  <div className="text-center space-y-8">
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
                      <div className="inline-flex p-4 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Generate Dummy Data</h3>
                      <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                        Create sample cases for testing purposes. This will file 3 dummy cases with realistic titles and evidence hashes to demonstrate the system functionality. (All simulated)
                      </p>
                      <button
                        onClick={generateDummyData}
                        disabled={loading || !walletConnected}
                        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-3">
                          <Sparkles className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          Generate Dummy Cases
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Case 1</h4>
                        <p className="text-slate-300 text-sm">Contract Breach Dispute</p>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Case 2</h4>
                        <p className="text-slate-300 text-sm">Employment Discrimination</p>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Case 3</h4>
                        <p className="text-slate-300 text-sm">IP Infringement Claim</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}