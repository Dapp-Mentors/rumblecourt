'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Database, FileText, Gavel, Sparkles, CheckCircle, AlertTriangle, Scale, TrendingUp } from 'lucide-react';
import {
  fileCase,
  getCase,
  getUserCases,
  getTotalCases,
  startTrial,
  recordVerdict,
  getVerdict,
  hasVerdict,
  appealCase,
  getOwner,
  Case,
  Verdict,
} from '../../services/blockchain';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

type EthereumRequestAccounts = string[];

type SandboxTab = 'cases' | 'verdicts' | 'appeals' | 'stats' | 'dummy';

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
  // const [hasVerdictStatus, setHasVerdictStatus] = useState<boolean>(false);
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
      const owner = await getOwner();
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
      setSuccess('Wallet connected successfully!');
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
      await fileCase(caseTitle, evidenceHash);
      setSuccess(`Case "${caseTitle}" filed successfully!`);
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
      const data = await getCase(caseId);
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
      const cases = await getUserCases(userAddress);
      setUserCases(cases);
      setSuccess(`Found ${cases.length} cases for user (sorted by status: COMPLETED first, then most recent)`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTotalCases = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const total = await getTotalCases();
      setTotalCases(total);
      setSuccess(`Total cases in system: ${total}`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TRIAL FUNCTIONS (Owner Only)
  // ============================================

  const handleStartTrial = async (): Promise<void> => {
    if (!isOwner) {
      setError('Only the contract owner can start trials');
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      await startTrial(caseId);
      setSuccess(`Trial started for case ${caseId}`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // VERDICT FUNCTIONS
  // ============================================

  const handleRecordVerdict = async (): Promise<void> => {
    if (!isOwner) {
      setError('Only the contract owner can record verdicts');
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      await recordVerdict(verdictCaseId, verdictType, reasoning, isFinal);
      setSuccess(`Verdict recorded for case ${verdictCaseId}`);
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
      const data = await getVerdict(verdictCaseId);
      setVerdictData(data);
      setSuccess('Verdict retrieved successfully!');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckHasVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const status = await hasVerdict(verdictCaseId);
      // setHasVerdictStatus(status);
      setSuccess(`Case ${verdictCaseId} ${status ? 'has' : 'does not have'} a verdict`);
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
      await appealCase(appealCaseId);
      setSuccess(`Appeal filed for case ${appealCaseId}`);
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
      // Generate dummy cases
      const dummyCases = [
        { title: 'Contract Breach Dispute', evidence: 'QmHash1234...' },
        { title: 'Employment Discrimination', evidence: 'QmHash5678...' },
        { title: 'IP Infringement Claim', evidence: 'QmHash9012...' },
      ];

      for (const dummyCase of dummyCases) {
        await fileCase(dummyCase.title, dummyCase.evidence);
      }

      setSuccess(`Generated ${dummyCases.length} dummy cases successfully!`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            <div className="text-center mb-12 space-y-6">
              <div className="relative inline-block">
                <h1
                  className="text-5xl sm:text-6xl font-black tracking-tight mb-4"
                  style={{
                    background: 'linear-gradient(135deg,#06b6d4 0%,#8b5cf6 50%,#ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 80px rgba(139,92,246,.5)',
                    filter: 'drop-shadow(0 0 20px rgba(6,182,212,.7))',
                  }}
                >
                  RumbleCourt Sandbox
                </h1>
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
              </div>

              <p className="text-xl sm:text-2xl text-cyan-300 font-medium tracking-wide">
                Test the minimal blockchain courtroom on testnet
              </p>

              {/* Wallet Connection */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                {!walletConnected ? (
                  <button
                    onClick={connectWallet}
                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      Connect Wallet
                      <Activity className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2 text-center">
                    <div className="text-green-400 font-medium">
                      Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                    </div>
                    {isOwner && (
                      <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Contract Owner</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Sandbox Section */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl">
              <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-500 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-purple-500 rounded-br-2xl" />

              <div className="relative z-10">
                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {[
                    { key: 'cases', label: 'Cases', icon: FileText },
                    { key: 'verdicts', label: 'Verdicts', icon: Gavel },
                    { key: 'appeals', label: 'Appeals', icon: Scale },
                    { key: 'stats', label: 'Statistics', icon: TrendingUp },
                    { key: 'dummy', label: 'Dummy Data', icon: Sparkles },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as SandboxTab)}
                      className={`
                        group relative px-6 py-3 rounded-lg font-semibold transition-all duration-300
                        ${activeTab === key
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-cyan-500/50'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </div>
                      {activeTab === key && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/20 to-purple-500/20 blur-xl -z-10" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Status Messages */}
                <div className="mb-6 space-y-3">
                  {loading && (
                    <div className="flex items-center justify-center gap-3 text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <Activity className="w-5 h-5 animate-spin" />
                      <span>Processing transaction...</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center justify-center gap-3 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center justify-center gap-3 text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <CheckCircle className="w-5 h-5" />
                      <span>{success}</span>
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                {activeTab === 'cases' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* File Case */}
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
                              onChange={e => setCaseTitle(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Evidence Hash (IPFS or Summary)</label>
                            <input
                              type="text"
                              placeholder="QmXxx... or brief evidence summary"
                              value={evidenceHash}
                              onChange={e => setEvidenceHash(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleFileCase}
                            disabled={loading || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            File Case
                          </button>
                        </div>
                      </div>

                      {/* Get Case */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Get Case Details</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(caseId)}
                              onChange={e => setCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleGetCase}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Get Case
                          </button>

                          {caseData && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-cyan-400 mb-2">Case Details:</h4>
                              <div className="space-y-1 text-sm text-slate-300">
                                <div><span className="text-slate-400">ID:</span> {caseData.caseId.toString()}</div>
                                <div><span className="text-slate-400">Title:</span> {caseData.caseTitle}</div>
                                <div><span className="text-slate-400">Plaintiff:</span> {caseData.plaintiff.slice(0, 10)}...</div>
                                <div><span className="text-slate-400">Evidence:</span> {caseData.evidenceHash}</div>
                                <div><span className="text-slate-400">Status:</span> <span className="text-cyan-400 font-semibold">{caseData.status}</span></div>
                                <div><span className="text-slate-400">Filed:</span> {new Date(Number(caseData.filedAt) * 1000).toLocaleDateString()}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Query Functions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Get User Cases */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Get User Cases</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">User Address</label>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={userAddress}
                              onChange={e => setUserAddress(e.target.value)}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleGetUserCases}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Get User Cases
                          </button>

                          {userCases.length > 0 && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-green-400 mb-2">Cases ({userCases.length}):</h4>
                              <div className="space-y-1">
                                {userCases.map((id, idx) => (
                                  <div key={idx} className="text-sm text-slate-300">
                                    Case ID: {id.toString()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Start Trial (Owner Only) */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">
                          Start Trial {!isOwner && <span className="text-sm text-yellow-400">(Owner Only)</span>}
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(caseId)}
                              onChange={e => setCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button
                            onClick={handleStartTrial}
                            disabled={loading || !isOwner || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Start Trial
                          </button>

                          {!isOwner && (
                            <p className="text-xs text-slate-400 text-center">
                              Only contract owner ({ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}) can start trials
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'verdicts' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Record Verdict (Owner Only) */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 mb-4">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-300 transition-colors">
                          Record Verdict {!isOwner && <span className="text-sm text-yellow-400">(Owner Only)</span>}
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(verdictCaseId)}
                              onChange={e => setVerdictCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Verdict Type</label>
                            <select
                              value={verdictType}
                              onChange={e => setVerdictType(Number(e.target.value))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value={0}>Guilty</option>
                              <option value={1}>Not Guilty</option>
                              <option value={2}>Settlement</option>
                              <option value={3}>Dismissed</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Note: When recording a final verdict, the case status automatically changes to COMPLETED</p>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Reasoning</label>
                            <textarea
                              placeholder="AI judge's detailed reasoning..."
                              value={reasoning}
                              onChange={e => setReasoning(e.target.value)}
                              rows={4}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isFinal}
                              onChange={e => setIsFinal(e.target.checked)}
                              className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                            />
                            <label className="text-sm text-slate-400">Is Final Verdict</label>
                          </div>

                          <button
                            onClick={handleRecordVerdict}
                            disabled={loading || !isOwner || !walletConnected}
                            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Record Verdict
                          </button>
                        </div>
                      </div>

                      {/* Get Verdict */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Get Verdict</h3>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={Number(verdictCaseId)}
                              onChange={e => setVerdictCaseId(BigInt(e.target.value || 0))}
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={handleGetVerdict}
                              disabled={loading}
                              className="py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Get Verdict
                            </button>

                            <button
                              onClick={handleCheckHasVerdict}
                              disabled={loading}
                              className="py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Check Status
                            </button>
                          </div>

                          {verdictData && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                              <h4 className="text-sm font-bold text-purple-400 mb-2">Verdict Details:</h4>
                              <div className="space-y-1 text-sm text-slate-300">
                                <div><span className="text-slate-400">Case ID:</span> {verdictData.caseId.toString()}</div>
                                <div><span className="text-slate-400">Type:</span> <span className="text-purple-400 font-semibold">{verdictData.verdictType}</span></div>
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
                              <strong>Note:</strong> Only the plaintiff who filed the case can appeal. The case must be COMPLETED with a final verdict. After appeal, the case status becomes APPEALED.
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
                        <p className="text-sm text-slate-400 mt-2">Cases filed in the system</p>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Contract Owner</h3>
                        <p className="text-lg font-mono text-purple-400 break-all">{ownerAddress || 'Loading...'}</p>
                        <p className="text-sm text-slate-400 mt-2">Can start trials & record verdicts</p>
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
                        Create sample cases for testing purposes. This will file 3 dummy cases with realistic titles and evidence hashes to demonstrate the system functionality.
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
    </>
  );
}