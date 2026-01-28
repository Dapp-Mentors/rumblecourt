import { ethers } from 'ethers';
import verdictStorageAbi from '../artifacts/contracts/VerdictStorage.sol/VerdictStorage.json';
import adjournmentTrackingAbi from '../artifacts/contracts/AdjournmentTracking.sol/AdjournmentTracking.json';

// Type definitions for the contract data structures
export type VerdictType = 'GUILTY' | 'NOT_GUILTY' | 'ACQUITTED' | 'CONVICTED' | 'DISMISSED';
export type AppealStatus = 'FILED' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type AdjournmentReason = 'MEDICAL' | 'LEGAL' | 'PERSONAL' | 'TECHNICAL' | 'OTHER';
export type AdjournmentStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'COMPLETED';

export interface Verdict {
  caseId: bigint;
  verdictId: bigint;
  judge: string;
  verdictType: VerdictType;
  verdictDetails: string;
  reasoning: string;
  timestamp: bigint;
  isFinal: boolean;
  supportingDocumentsText: string[];
}

export interface Appeal {
  appealId: bigint;
  originalVerdictId: bigint;
  appellant: string;
  appealReason: string;
  status: AppealStatus;
  filingDate: bigint;
  hearingDate: bigint;
  appealDocumentsText: string[];
}

export interface Adjournment {
  adjournmentId: bigint;
  caseId: bigint;
  requestedBy: string;
  reason: AdjournmentReason;
  reasonDetails: string;
  originalHearingDate: bigint;
  newHearingDate: bigint;
  status: AdjournmentStatus;
  requestDate: bigint;
  approvalDate: bigint;
  approvedBy: string;
  supportingDocumentsText: string[];
}

// Type definition for window.ethereum
interface EthereumProvider {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

let ethereum: EthereumProvider | undefined;
let tx: ethers.TransactionResponse | undefined;

if (typeof window !== 'undefined') ethereum = window.ethereum;

// Contract addresses - these should be updated with actual deployed contract addresses
const contractAddresses = {
  verdictStorage: process.env.NEXT_PUBLIC_VERDICT_STORAGE_ADDRESS || '',
  adjournmentTracking: process.env.NEXT_PUBLIC_ADJOURNMENT_TRACKING_ADDRESS || ''
};

const getEthereumContracts = async (contractName: 'verdictStorage' | 'adjournmentTracking'): Promise<ethers.Contract> => {
  const accounts = (await ethereum?.request?.({ method: 'eth_accounts' }) as string[] | undefined) ?? [];
  if (accounts.length > 0) {
    const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
    const signer = await provider.getSigner();
    if (contractName === 'verdictStorage') {
      return new ethers.Contract(contractAddresses.verdictStorage, verdictStorageAbi.abi, signer);
    } else {
      return new ethers.Contract(contractAddresses.adjournmentTracking, adjournmentTrackingAbi.abi, signer);
    }
  } else {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const wallet = ethers.Wallet.createRandom();
    const signer = wallet.connect(provider);
    if (contractName === 'verdictStorage') {
      return new ethers.Contract(contractAddresses.verdictStorage, verdictStorageAbi.abi, signer);
    } else {
      return new ethers.Contract(contractAddresses.adjournmentTracking, adjournmentTrackingAbi.abi, signer);
    }
  }
};

// Error reporting helper
const reportError = (error: unknown): void => {
  console.error('Blockchain Service Error:', error);
  if (error instanceof Error && error.message) {
    console.error('Error message:', error.message);
  }
  // Check for ethers-specific error properties
  if (typeof error === 'object' && error !== null && 'reason' in error) {
    console.error('Error reason:', (error as { reason: string }).reason);
  }
};

// Verdict Storage Functions
/**
 * Get the contract owner/admin
 */
export const getAdmin = async (): Promise<string> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    const owner = await contract.owner();
    return owner as string;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Add an authorized judge (only owner)
 */
export const addAuthorizedJudge = async (judgeAddress: string): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.addAuthorizedJudge(judgeAddress) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Check if an address is an authorized judge
 */
export const isAuthorizedJudge = async (judgeAddress: string): Promise<boolean> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.isAuthorizedJudge(judgeAddress) as boolean;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Record a verdict for a case
 */
export const recordVerdict = async (
  caseId: bigint,
  verdictType: VerdictType,
  verdictDetails: string,
  reasoning: string,
  supportingDocumentsText: string[],
  isFinal: boolean
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.recordVerdict(
      caseId,
      verdictType,
      verdictDetails,
      reasoning,
      supportingDocumentsText,
      isFinal
    ) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Finalize a verdict (mark as final and immutable)
 */
export const finalizeVerdict = async (verdictId: bigint): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.finalizeVerdict(verdictId) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * File an appeal against a verdict
 */
export const fileAppeal = async (
  originalVerdictId: bigint,
  appealReason: string,
  appealDocumentsText: string[]
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.fileAppeal(
      originalVerdictId,
      appealReason,
      appealDocumentsText
    ) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Update appeal status and decision
 */
export const updateAppealStatus = async (
  appealId: bigint,
  status: AppealStatus,
  decisionDetails: string
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.updateAppealStatus(
      appealId,
      status,
      decisionDetails
    ) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Schedule a hearing date for an appeal
 */
export const scheduleAppealHearing = async (
  appealId: bigint,
  hearingDate: bigint
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('verdictStorage');
    tx = await contract.scheduleAppealHearing(appealId, hearingDate) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get verdict details by ID
 */
export const getVerdict = async (verdictId: bigint): Promise<Verdict> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    const verdict = await contract.getVerdict(verdictId);
    return formatVerdict(verdict);
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get all verdicts for a case
 */
export const getVerdictsByCase = async (caseId: bigint): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.getVerdictsByCase(caseId) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get appeal details by ID
 */
export const getAppeal = async (appealId: bigint): Promise<Appeal> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    const appeal = await contract.getAppeal(appealId);
    return formatAppeal(appeal);
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get appeals for a specific verdict
 */
export const getAppealsByVerdict = async (verdictId: bigint): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.getAppealsByVerdict(verdictId) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get verdicts issued by a specific judge
 */
export const getVerdictsByJudge = async (judgeAddress: string): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.getVerdictsByJudge(judgeAddress) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get appeals filed by a specific appellant
 */
export const getAppealsByAppellant = async (appellantAddress: string): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.getAppealsByAppellant(appellantAddress) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Check if a verdict is final
 */
export const isVerdictFinal = async (verdictId: bigint): Promise<boolean> => {
  try {
    const contract = await getEthereumContracts('verdictStorage');
    return await contract.isVerdictFinal(verdictId) as boolean;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

// Adjournment Tracking Functions
/**
 * Request an adjournment for a case hearing
 */
export const requestAdjournment = async (
  caseId: bigint,
  reason: AdjournmentReason,
  reasonDetails: string,
  requestedNewDate: bigint,
  supportingDocumentsText: string[]
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.requestAdjournment(
      caseId,
      reason,
      reasonDetails,
      requestedNewDate,
      supportingDocumentsText
    ) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Approve an adjournment request
 */
export const approveAdjournment = async (
  adjournmentId: bigint,
  approvedNewDate: bigint,
  approvalNotes: string
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.approveAdjournment(adjournmentId, approvedNewDate, approvalNotes) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Deny an adjournment request
 */
export const denyAdjournment = async (
  adjournmentId: bigint,
  denialReason: string
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.denyAdjournment(adjournmentId, denialReason) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Cancel an approved adjournment
 */
export const cancelAdjournment = async (
  adjournmentId: bigint,
  cancellationReason: string
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.cancelAdjournment(adjournmentId, cancellationReason) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Mark an adjournment as completed
 */
export const completeAdjournment = async (adjournmentId: bigint): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.completeAdjournment(adjournmentId) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Emergency reschedule hearing
 */
export const emergencyReschedule = async (
  caseId: bigint,
  newHearingDate: bigint,
  reason: string
): Promise<ethers.TransactionResponse> => {
  if (!ethereum) {
    reportError('Please install a browser provider');
    return Promise.reject(new Error('Browser provider not installed'));
  }
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    tx = await contract.emergencyReschedule(caseId, newHearingDate, reason) as ethers.TransactionResponse;
    await tx.wait();
    return tx;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get adjournment details by ID
 */
export const getAdjournment = async (adjournmentId: bigint): Promise<Adjournment> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    const adjournment = await contract.getAdjournment(adjournmentId);
    return formatAdjournment(adjournment);
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get all adjournments for a case
 */
export const getAdjournmentsByCase = async (caseId: bigint): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.getAdjournmentsByCase(caseId) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get adjournments requested by a specific address
 */
export const getAdjournmentsByRequester = async (requesterAddress: string): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.getAdjournmentsByRequester(requesterAddress) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get adjournments by status
 */
export const getAdjournmentsByStatus = async (status: AdjournmentStatus): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.getAdjournmentsByStatus(status) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get pending adjournment requests for a case
 */
export const getPendingAdjournmentRequests = async (caseId: bigint): Promise<bigint[]> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.getPendingAdjournmentRequests(caseId) as bigint[];
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Check if a case has any active adjournments
 */
export const hasActiveAdjournment = async (caseId: bigint): Promise<boolean> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.hasActiveAdjournment(caseId) as boolean;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

/**
 * Get the next scheduled hearing date for a case
 */
export const getNextHearingDate = async (caseId: bigint): Promise<bigint> => {
  try {
    const contract = await getEthereumContracts('adjournmentTracking');
    return await contract.getNextHearingDate(caseId) as bigint;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

// Data formatting helpers
const formatVerdict = (verdict: unknown): Verdict => {
  const v = verdict as Record<string, unknown>;
  return {
    caseId: BigInt(v.caseId as string | number | bigint),
    verdictId: BigInt(v.verdictId as string | number | bigint),
    judge: v.judge as string,
    verdictType: v.verdictType as VerdictType,
    verdictDetails: v.verdictDetails as string,
    reasoning: v.reasoning as string,
    timestamp: BigInt(v.timestamp as string | number | bigint),
    isFinal: v.isFinal as boolean,
    supportingDocumentsText: v.supportingDocumentsText as string[]
  };
};

const formatAppeal = (appeal: unknown): Appeal => {
  const a = appeal as Record<string, unknown>;
  return {
    appealId: BigInt(a.appealId as string | number | bigint),
    originalVerdictId: BigInt(a.originalVerdictId as string | number | bigint),
    appellant: a.appellant as string,
    appealReason: a.appealReason as string,
    status: a.status as AppealStatus,
    filingDate: BigInt(a.filingDate as string | number | bigint),
    hearingDate: BigInt(a.hearingDate as string | number | bigint),
    appealDocumentsText: a.appealDocumentsText as string[]
  };
};

const formatAdjournment = (adjournment: unknown): Adjournment => {
  const adj = adjournment as Record<string, unknown>;
  return {
    adjournmentId: BigInt(adj.adjournmentId as string | number | bigint),
    caseId: BigInt(adj.caseId as string | number | bigint),
    requestedBy: adj.requestedBy as string,
    reason: adj.reason as AdjournmentReason,
    reasonDetails: adj.reasonDetails as string,
    originalHearingDate: BigInt(adj.originalHearingDate as string | number | bigint),
    newHearingDate: BigInt(adj.newHearingDate as string | number | bigint),
    status: adj.status as AdjournmentStatus,
    requestDate: BigInt(adj.requestDate as string | number | bigint),
    approvalDate: BigInt(adj.approvalDate as string | number | bigint),
    approvedBy: adj.approvedBy as string,
    supportingDocumentsText: adj.supportingDocumentsText as string[]
  };
};