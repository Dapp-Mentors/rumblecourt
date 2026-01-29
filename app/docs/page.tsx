'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Database, FileText, UserPlus, Gavel, Clock, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { ethers } from 'ethers';
import {
  recordVerdict,
  finalizeVerdict,
  fileAppeal,
  updateAppealStatus,
  scheduleAppealHearing,
  getVerdict,
  getVerdictsByCase,
  getAppeal,
  getAppealsByVerdict,
  requestAdjournment,
  approveAdjournment,
  emergencyReschedule,
  // getAdjournment,
  // getAdjournmentsByCase,
  getTotalAdjournmentRequests,
  getAdjournmentStatistics,
  createParticipantProfile,
  createCourt,
  assignParticipantToCourt,
  isCourtComplete,
  getCourtParticipantsByRole,
  getTotalVerdicts,
  getTotalAppeals,
  VerdictType,
  AppealStatus,
  AdjournmentReason,
  ParticipantType,
  Verdict,
  Appeal,
  Adjournment,
} from '../../services/blockchain';

type Particle = {
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
};

type AdjournmentStats = {
  pending: bigint;
  approved: bigint;
  denied: bigint;
};

type Stats = {
  totalVerdicts: bigint;
  totalAppeals: bigint;
  totalAdj: bigint;
  adjStats: AdjournmentStats;
};

type EthereumRequestAccounts = string[];

type SandboxTab = 'participants' | 'verdicts' | 'adjournments' | 'stats' | 'dummy';

export default function DocsPage(): React.ReactNode {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SandboxTab>('participants');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for participants
  const [participantAddress, setParticipantAddress] = useState('');
  const [participantType, setParticipantType] = useState<ParticipantType>('JUDGE');
  const [llmProvider, setLlmProvider] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmModelName, setLlmModelName] = useState('');
  const [expertiseLevel, setExpertiseLevel] = useState(0);
  const [eloquenceScore, setEloquenceScore] = useState(0);
  const [analyticalScore, setAnalyticalScore] = useState(0);
  const [emotionalIntelligence, setEmotionalIntelligence] = useState(0);
  const [traits, setTraits] = useState('');

  const [courtName, setCourtName] = useState('');
  const [courtDescription, setCourtDescription] = useState('');
  const [courtId, setCourtId] = useState<bigint>(BigInt(0));
  const [profileId, setProfileId] = useState<bigint>(BigInt(0));
  const [assignType, setAssignType] = useState<ParticipantType>('JUDGE');

  // Form states for verdicts
  const [caseId, setCaseId] = useState<bigint>(BigInt(0));
  const [verdictTypeState, setVerdictTypeState] = useState<VerdictType>('GUILTY');
  const [verdictDetails, setVerdictDetails] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [supportingDocs, setSupportingDocs] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [verdictId, setVerdictId] = useState<bigint>(BigInt(0));

  const [appealReason, setAppealReason] = useState('');
  const [appealDocs, setAppealDocs] = useState('');
  const [appealId, setAppealId] = useState<bigint>(BigInt(0));
  const [appealStatusState, setAppealStatusState] = useState<AppealStatus>('FILED');
  const [decisionDetails, setDecisionDetails] = useState('');
  const [hearingDate, setHearingDate] = useState<bigint>(BigInt(0));

  // Form states for adjournments
  const [adjReason, setAdjReason] = useState<AdjournmentReason>('MEDICAL');
  const [adjReasonDetails, setAdjReasonDetails] = useState('');
  const [requestedNewDate, setRequestedNewDate] = useState<bigint>(BigInt(0));
  const [adjSupportingDocs, setAdjSupportingDocs] = useState('');
  const [adjournmentId, setAdjournmentId] = useState<bigint>(BigInt(0));
  const [approvedNewDate, setApprovedNewDate] = useState<bigint>(BigInt(0));
  const [approvalNotes, setApprovalNotes] = useState('');
  const [emergencyNewDate, setEmergencyNewDate] = useState<bigint>(BigInt(0));
  const [emergencyReason, setEmergencyReason] = useState('');

  // Data display states
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [adjournments, ] = useState<Adjournment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [courtComplete, setCourtComplete] = useState(false);
  const [participantsByRole, setParticipantsByRole] = useState<bigint[]>([]);

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
    }
  };


  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) {
      setError('No Ethereum provider found');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as EthereumRequestAccounts;

      setWalletConnected(true);
      setAccount(accounts[0]);
    } catch {
      setError('Failed to connect wallet');
    }
  };


  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'An unknown error occurred');
    setLoading(false);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Participants functions
  const handleCreateProfile = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await createParticipantProfile(
        participantAddress,
        participantType,
        llmProvider,
        llmModel,
        llmModelName,
        expertiseLevel,
        eloquenceScore,
        analyticalScore,
        emotionalIntelligence,
        traits
      );
      setSuccess('Participant profile created');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourt = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await createCourt(courtName, courtDescription);
      setSuccess('Court created');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToCourt = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await assignParticipantToCourt(courtId, profileId, assignType);
      setSuccess('Participant assigned to court');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourtComplete = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const complete = await isCourtComplete(courtId);
      setCourtComplete(complete);
      setSuccess(`Court complete: ${complete}`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantsByRole = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const participants = await getCourtParticipantsByRole(courtId, assignType);
      setParticipantsByRole(participants);
      setSuccess('Fetched participants by role');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Verdicts functions
  const handleRecordVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await recordVerdict(
        caseId,
        verdictTypeState,
        verdictDetails,
        reasoning,
        supportingDocs.split(','),
        isFinal
      );
      setSuccess('Verdict recorded');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await finalizeVerdict(verdictId);
      setSuccess('Verdict finalized');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAppeal = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await fileAppeal(verdictId, appealReason, appealDocs.split(','));
      setSuccess('Appeal filed');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppealStatus = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await updateAppealStatus(appealId, appealStatusState, decisionDetails);
      setSuccess('Appeal status updated');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppealHearing = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await scheduleAppealHearing(appealId, hearingDate);
      setSuccess('Appeal hearing scheduled');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerdictsByCase = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const verdictIds = await getVerdictsByCase(caseId);
      const fetchedVerdicts = await Promise.all(verdictIds.map(id => getVerdict(id)));
      setVerdicts(fetchedVerdicts);
      setSuccess('Fetched verdicts');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppealsByVerdict = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const appealIds = await getAppealsByVerdict(verdictId);
      const fetchedAppeals = await Promise.all(appealIds.map(id => getAppeal(id)));
      setAppeals(fetchedAppeals);
      setSuccess('Fetched appeals');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Adjournments functions
  const handleRequestAdjournment = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await requestAdjournment(
        caseId,
        adjReason,
        adjReasonDetails,
        requestedNewDate,
        adjSupportingDocs.split(',')
      );
      setSuccess('Adjournment requested');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdjournment = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await approveAdjournment(adjournmentId, approvedNewDate, approvalNotes);
      setSuccess('Adjournment approved');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyReschedule = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      await emergencyReschedule(caseId, emergencyNewDate, emergencyReason);
      setSuccess('Emergency reschedule completed');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // const fetchAdjournmentsByCase = async (): Promise<void> => {
  //   setLoading(true);
  //   clearMessages();
  //   try {
  //     const adjIds = await getAdjournmentsByCase(caseId);
  //     const fetchedAdj = await Promise.all(adjIds.map(id => getAdjournment(id)));
  //     setAdjournments(fetchedAdj);
  //     setSuccess('Fetched adjournments');
  //   } catch (err) {
  //     handleError(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Stats
  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      const totalVerdicts = await getTotalVerdicts();
      const totalAppeals = await getTotalAppeals();
      const totalAdj = await getTotalAdjournmentRequests();
      const adjStats = await getAdjournmentStatistics();
      setStats({ totalVerdicts, totalAppeals, totalAdj, adjStats });
      setSuccess('Fetched statistics');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Dummy data generation
  const generateDummyData = async (): Promise<void> => {
    setLoading(true);
    clearMessages();
    try {
      // Simulate creating dummy profiles, courts, verdicts, etc.
      // Judge profile
      await createParticipantProfile(
        ethers.Wallet.createRandom().address,
        'JUDGE',
        'openrouter',
        'gpt-4',
        'GPT-4',
        9,
        8,
        9,
        7,
        '{"traits": "impartial, fair, experienced"}'
      );

      // Prosecutor profile
      await createParticipantProfile(
        ethers.Wallet.createRandom().address,
        'PROSECUTOR',
        'anthropic',
        'claude-3-sonnet',
        'Claude 3 Sonnet',
        8,
        9,
        8,
        6,
        '{"traits": "persuasive, determined, strategic"}'
      );

      // Defense profile
      await createParticipantProfile(
        ethers.Wallet.createRandom().address,
        'DEFENSE_ATTORNEY',
        'google',
        'gemini-pro',
        'Gemini Pro',
        8,
        8,
        9,
        8,
        '{"traits": "protective, analytical, empathetic"}'
      );

      // Clerk profile
      await createParticipantProfile(
        ethers.Wallet.createRandom().address,
        'CLERK',
        'openrouter',
        'llama-3',
        'Llama 3',
        7,
        7,
        7,
        8,
        '{"traits": "organized, efficient, detail-oriented"}'
      );

      // Create court
      await createCourt('Dummy Supreme Court', 'Test court for dummy data');

      // Record dummy verdict
      await recordVerdict(
        BigInt(9999),
        'GUILTY',
        'Dummy guilty verdict',
        'Based on dummy evidence',
        ['dummy_doc1.pdf', 'dummy_doc2.pdf'],
        false
      );

      // Request dummy adjournment
      await requestAdjournment(
        BigInt(9999),
        'OTHER',
        'Dummy reason',
        BigInt(Math.floor(Date.now() / 1000) + 86400 * 7),
        ['dummy_support.pdf']
      );

      setSuccess('Dummy records generated successfully');
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
                  Interactive Sandbox
                </h1>
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
              </div>

              <p className="text-xl sm:text-2xl text-cyan-300 font-medium tracking-wide">
                Test smart contract interactions live on the testnet
              </p>

              {/* CTA Buttons */}
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
                  <div className="text-center text-green-400 mb-4 font-medium">
                    Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
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
                    { key: 'participants', label: 'Participants', icon: Users },
                    { key: 'verdicts', label: 'Verdicts & Appeals', icon: Gavel },
                    { key: 'adjournments', label: 'Adjournments', icon: Clock },
                    { key: 'stats', label: 'Statistics', icon: Database },
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
                      <span>Loading...</span>
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
                {activeTab === 'participants' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Create Profile Card */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">Create Participant Profile</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Address</label>
                            <input 
                              type="text" 
                              placeholder="0x..." 
                              value={participantAddress} 
                              onChange={e => setParticipantAddress(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Participant Type</label>
                            <select 
                              value={participantType} 
                              onChange={e => setParticipantType(e.target.value as ParticipantType)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="JUDGE">Judge</option>
                              <option value="PROSECUTOR">Prosecutor</option>
                              <option value="DEFENSE_ATTORNEY">Defense Attorney</option>
                              <option value="CLERK">Clerk</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">LLM Provider</label>
                              <input 
                                type="text" 
                                placeholder="openrouter" 
                                value={llmProvider} 
                                onChange={e => setLlmProvider(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">LLM Model</label>
                              <input 
                                type="text" 
                                placeholder="gpt-4" 
                                value={llmModel} 
                                onChange={e => setLlmModel(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">LLM Model Name</label>
                            <input 
                              type="text" 
                              placeholder="GPT-4" 
                              value={llmModelName} 
                              onChange={e => setLlmModelName(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Expertise Level</label>
                              <input 
                                type="number" 
                                placeholder="9" 
                                value={expertiseLevel} 
                                onChange={e => setExpertiseLevel(Number(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Eloquence Score</label>
                              <input 
                                type="number" 
                                placeholder="8" 
                                value={eloquenceScore} 
                                onChange={e => setEloquenceScore(Number(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Analytical Score</label>
                              <input 
                                type="number" 
                                placeholder="9" 
                                value={analyticalScore} 
                                onChange={e => setAnalyticalScore(Number(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Emotional Intelligence</label>
                              <input 
                                type="number" 
                                placeholder="7" 
                                value={emotionalIntelligence} 
                                onChange={e => setEmotionalIntelligence(Number(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Traits (JSON)</label>
                            <input 
                              type="text" 
                              placeholder='{"traits": "impartial, fair, experienced"}' 
                              value={traits} 
                              onChange={e => setTraits(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button 
                            onClick={handleCreateProfile} 
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                          >
                            Create Profile
                          </button>
                        </div>
                      </div>

                      {/* Create Court & Assign Card */}
                      <div className="space-y-6">
                        {/* Create Court */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Create Court</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Court Name</label>
                              <input 
                                type="text" 
                                placeholder="Supreme Court" 
                                value={courtName} 
                                onChange={e => setCourtName(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Description</label>
                              <input 
                                type="text" 
                                placeholder="Test court for litigation" 
                                value={courtDescription} 
                                onChange={e => setCourtDescription(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <button 
                              onClick={handleCreateCourt} 
                              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                            >
                              Create Court
                            </button>
                          </div>
                        </div>

                        {/* Assign to Court */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Assign to Court</h3>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm text-slate-400 mb-1">Court ID</label>
                                <input 
                                  type="number" 
                                  placeholder="1" 
                                  value={Number(courtId)} 
                                  onChange={e => setCourtId(BigInt(e.target.value))} 
                                  className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-400 mb-1">Profile ID</label>
                                <input 
                                  type="number" 
                                  placeholder="1" 
                                  value={Number(profileId)} 
                                  onChange={e => setProfileId(BigInt(e.target.value))} 
                                  className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Assignment Type</label>
                              <select 
                                value={assignType} 
                                onChange={e => setAssignType(e.target.value as ParticipantType)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                              >
                                <option value="JUDGE">Judge</option>
                                <option value="PROSECUTOR">Prosecutor</option>
                                <option value="DEFENSE_ATTORNEY">Defense Attorney</option>
                                <option value="CLERK">Clerk</option>
                              </select>
                            </div>

                            <button 
                              onClick={handleAssignToCourt} 
                              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                            >
                              Assign to Court
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Queries Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">Court Status Queries</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Court ID</label>
                            <input 
                              type="number" 
                              placeholder="1" 
                              value={Number(courtId)} 
                              onChange={e => setCourtId(BigInt(e.target.value))} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button 
                            onClick={fetchCourtComplete} 
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                          >
                            Check Court Complete
                          </button>
                          
                          {courtComplete && (
                            <div className="text-green-400 text-center font-semibold"> Court is complete</div>
                          )}
                        </div>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Participants by Role</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Court ID</label>
                            <input 
                              type="number" 
                              placeholder="1" 
                              value={Number(courtId)} 
                              onChange={e => setCourtId(BigInt(e.target.value))} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Participant Type</label>
                            <select 
                              value={assignType} 
                              onChange={e => setAssignType(e.target.value as ParticipantType)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="JUDGE">Judge</option>
                              <option value="PROSECUTOR">Prosecutor</option>
                              <option value="DEFENSE_ATTORNEY">Defense Attorney</option>
                              <option value="CLERK">Clerk</option>
                            </select>
                          </div>

                          <button 
                            onClick={fetchParticipantsByRole} 
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                          >
                            Get Participants by Role
                          </button>
                          
                          {participantsByRole.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                              <h4 className="text-sm text-slate-400 mb-2">Found Participants:</h4>
                              <ul className="space-y-1">
                                {participantsByRole.map((id, idx) => (
                                  <li key={idx} className="text-slate-300 font-mono">Profile ID: {id.toString()}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'verdicts' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Record Verdict */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 mb-4">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-300 transition-colors">Record Verdict</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input 
                              type="number" 
                              placeholder="1" 
                              value={Number(caseId)} 
                              onChange={e => setCaseId(BigInt(e.target.value))} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Verdict Type</label>
                            <select 
                              value={verdictTypeState} 
                              onChange={e => setVerdictTypeState(e.target.value as VerdictType)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="GUILTY">Guilty</option>
                              <option value="NOT_GUILTY">Not Guilty</option>
                              <option value="ACQUITTED">Acquitted</option>
                              <option value="CONVICTED">Convicted</option>
                              <option value="DISMISSED">Dismissed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Verdict Details</label>
                            <input 
                              type="text" 
                              placeholder="Verdict details..." 
                              value={verdictDetails} 
                              onChange={e => setVerdictDetails(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Reasoning</label>
                            <input 
                              type="text" 
                              placeholder="Legal reasoning..." 
                              value={reasoning} 
                              onChange={e => setReasoning(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Supporting Docs (comma separated)</label>
                            <input 
                              type="text" 
                              placeholder="doc1.pdf, doc2.pdf" 
                              value={supportingDocs} 
                              onChange={e => setSupportingDocs(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={isFinal} 
                              onChange={e => setIsFinal(e.target.checked)} 
                              className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                            />
                            <label className="text-sm text-slate-400">Is Final</label>
                          </div>

                          <button 
                            onClick={handleRecordVerdict} 
                            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                          >
                            Record Verdict
                          </button>
                        </div>
                      </div>

                      {/* File Appeal */}
                      <div className="space-y-6">
                        {/* File Appeal */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">File Appeal</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Verdict ID</label>
                              <input 
                                type="number" 
                                placeholder="1" 
                                value={Number(verdictId)} 
                                onChange={e => setVerdictId(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Appeal Reason</label>
                              <input 
                                type="text" 
                                placeholder="Appeal reason..." 
                                value={appealReason} 
                                onChange={e => setAppealReason(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Appeal Docs (comma separated)</label>
                              <input 
                                type="text" 
                                placeholder="appeal1.pdf, appeal2.pdf" 
                                value={appealDocs} 
                                onChange={e => setAppealDocs(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <button 
                              onClick={handleFileAppeal} 
                              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                            >
                              File Appeal
                            </button>
                          </div>
                        </div>

                        {/* Update Appeal Status */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Update Appeal Status</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Appeal ID</label>
                              <input 
                                type="number" 
                                placeholder="1" 
                                value={Number(appealId)} 
                                onChange={e => setAppealId(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Status</label>
                              <select 
                                value={appealStatusState} 
                                onChange={e => setAppealStatusState(e.target.value as AppealStatus)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                              >
                                <option value="FILED">Filed</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="DISMISSED">Dismissed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Decision Details</label>
                              <input 
                                type="text" 
                                placeholder="Decision details..." 
                                value={decisionDetails} 
                                onChange={e => setDecisionDetails(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <button 
                              onClick={handleUpdateAppealStatus} 
                              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-green-300 transition-colors">Finalize Verdict</h3>
                        <div className="space-y-3">
                          <input 
                            type="number" 
                            placeholder="Verdict ID" 
                            value={Number(verdictId)} 
                            onChange={e => setVerdictId(BigInt(e.target.value))} 
                            className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                          <button 
                            onClick={handleFinalizeVerdict} 
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                          >
                            Finalize
                          </button>
                        </div>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">Schedule Hearing</h3>
                        <div className="space-y-3">
                          <input 
                            type="number" 
                            placeholder="Appeal ID" 
                            value={Number(appealId)} 
                            onChange={e => setAppealId(BigInt(e.target.value))} 
                            className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                          <input 
                            type="number" 
                            placeholder="Hearing Date (Unix)" 
                            value={Number(hearingDate)} 
                            onChange={e => setHearingDate(BigInt(e.target.value))} 
                            className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                          <button 
                            onClick={handleScheduleAppealHearing} 
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>

                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">Data Queries</h3>
                        <div className="space-y-3">
                          <input 
                            type="number" 
                            placeholder="Case ID" 
                            value={Number(caseId)} 
                            onChange={e => setCaseId(BigInt(e.target.value))} 
                            className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                          <button 
                            onClick={fetchVerdictsByCase} 
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                          >
                            Get Verdicts by Case
                          </button>
                          <button 
                            onClick={fetchAppealsByVerdict} 
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                          >
                            Get Appeals by Verdict
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Data Display */}
                    {(verdicts.length > 0 || appeals.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {verdicts.length > 0 && (
                          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-white mb-4">Verdicts</h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {verdicts.map((v, idx) => (
                                <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-300 font-mono">ID: {v.verdictId.toString()}</span>
                                    <span className="text-cyan-400 font-semibold">{v.verdictType}</span>
                                  </div>
                                  <div className="text-sm text-slate-400 mt-1">{v.verdictDetails}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {appeals.length > 0 && (
                          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-white mb-4">Appeals</h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {appeals.map((a, idx) => (
                                <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-300 font-mono">ID: {a.appealId.toString()}</span>
                                    <span className="text-purple-400 font-semibold">{a.status}</span>
                                  </div>
                                  <div className="text-sm text-slate-400 mt-1">{a.appealReason || 'No reason provided'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'adjournments' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Request Adjournment */}
                      <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Request Adjournment</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                            <input 
                              type="number" 
                              placeholder="1" 
                              value={Number(caseId)} 
                              onChange={e => setCaseId(BigInt(e.target.value))} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Reason</label>
                            <select 
                              value={adjReason} 
                              onChange={e => setAdjReason(e.target.value as AdjournmentReason)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="MEDICAL">Medical</option>
                              <option value="LEGAL">Legal</option>
                              <option value="PERSONAL">Personal</option>
                              <option value="TECHNICAL">Technical</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Reason Details</label>
                            <input 
                              type="text" 
                              placeholder="Detailed reason..." 
                              value={adjReasonDetails} 
                              onChange={e => setAdjReasonDetails(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Requested New Date (Unix)</label>
                            <input 
                              type="number" 
                              placeholder="1704067200" 
                              value={Number(requestedNewDate)} 
                              onChange={e => setRequestedNewDate(BigInt(e.target.value))} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Supporting Docs (comma separated)</label>
                            <input 
                              type="text" 
                              placeholder="medical.pdf, note.pdf" 
                              value={adjSupportingDocs} 
                              onChange={e => setAdjSupportingDocs(e.target.value)} 
                              className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>

                          <button 
                            onClick={handleRequestAdjournment} 
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                          >
                            Request Adjournment
                          </button>
                        </div>
                      </div>

                      {/* Approve Adjournment */}
                      <div className="space-y-6">
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Approve Adjournment</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Adjournment ID</label>
                              <input 
                                type="number" 
                                placeholder="1" 
                                value={Number(adjournmentId)} 
                                onChange={e => setAdjournmentId(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Approved New Date (Unix)</label>
                              <input 
                                type="number" 
                                placeholder="1704153600" 
                                value={Number(approvedNewDate)} 
                                onChange={e => setApprovedNewDate(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Approval Notes</label>
                              <input 
                                type="text" 
                                placeholder="Approval notes..." 
                                value={approvalNotes} 
                                onChange={e => setApprovalNotes(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <button 
                              onClick={handleApproveAdjournment} 
                              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                            >
                              Approve Adjournment
                            </button>
                          </div>
                        </div>

                        {/* Emergency Reschedule */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 mb-4">
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-300 transition-colors">Emergency Reschedule</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Case ID</label>
                              <input 
                                type="number" 
                                placeholder="1" 
                                value={Number(caseId)} 
                                onChange={e => setCaseId(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">New Date (Unix)</label>
                              <input 
                                type="number" 
                                placeholder="1704153600" 
                                value={Number(emergencyNewDate)} 
                                onChange={e => setEmergencyNewDate(BigInt(e.target.value))} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Reason</label>
                              <input 
                                type="text" 
                                placeholder="Emergency reason..." 
                                value={emergencyReason} 
                                onChange={e => setEmergencyReason(e.target.value)} 
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>

                            <button 
                              onClick={handleEmergencyReschedule} 
                              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                            >
                              Emergency Reschedule
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Display */}
                    {adjournments.length > 0 && (
                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Adjournments</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {adjournments.map((adj, idx) => (
                            <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300 font-mono">ID: {adj.adjournmentId.toString()}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  adj.status === 'REQUESTED' ? 'bg-yellow-500/20 text-yellow-400' :
                                  adj.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {adj.status}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">{adj.reason}</div>
                              <div className="text-xs text-slate-500 mt-1">Requested: {new Date(Number(adj.requestDate) * 1000).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <button 
                        onClick={fetchStats} 
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                          <Database className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          Fetch Statistics
                        </span>
                      </button>
                    </div>

                    {stats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                            <Gavel className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Total Verdicts</h3>
                          <p className="text-3xl font-bold text-cyan-400">{stats.totalVerdicts.toString()}</p>
                        </div>

                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Total Appeals</h3>
                          <p className="text-3xl font-bold text-purple-400">{stats.totalAppeals.toString()}</p>
                        </div>

                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Total Adjournments</h3>
                          <p className="text-3xl font-bold text-orange-400">{stats.totalAdj.toString()}</p>
                        </div>

                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                          <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Adjournment Status</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Pending:</span>
                              <span className="text-yellow-400 font-bold">{stats.adjStats.pending.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Approved:</span>
                              <span className="text-green-400 font-bold">{stats.adjStats.approved.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Denied:</span>
                              <span className="text-red-400 font-bold">{stats.adjStats.denied.toString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        Create sample participant profiles, courts, verdicts, and adjournments for testing purposes. 
                        This will populate the system with realistic test data to demonstrate all functionality.
                      </p>
                      <button 
                        onClick={generateDummyData} 
                        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-3">
                          <Sparkles className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          Generate Dummy Records
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Participant Profiles</h4>
                        <p className="text-slate-300 text-sm">Judge, Prosecutor, Defense Attorney, and Clerk profiles with realistic LLM configurations</p>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Court Records</h4>
                        <p className="text-slate-300 text-sm">Test court with complete metadata and configuration</p>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 mb-4">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Legal Proceedings</h4>
                        <p className="text-slate-300 text-sm">Sample verdicts, appeals, and adjournment requests</p>
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