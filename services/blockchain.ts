import { ethers } from 'ethers'
import rumbleCourtAbi from '../artifacts/contracts/RumbleCourt.sol/RumbleCourt.json'
import deploymentArtifacts from '../artifacts/RumbleCourt.json'

// Type definitions
export type CaseStatus = 'PENDING' | 'IN_TRIAL' | 'COMPLETED' | 'APPEALED'
export type VerdictType = 'GUILTY' | 'NOT_GUILTY' | 'SETTLEMENT' | 'DISMISSED'

export interface Case {
  caseId: bigint
  plaintiff: string
  caseTitle: string
  evidenceHash: string
  filedAt: bigint
  status: CaseStatus
}

export interface Verdict {
  caseId: bigint
  verdictType: VerdictType
  reasoning: string
  timestamp: bigint
  isFinal: boolean
}

// Get contract address from deployment artifacts
const getContractAddress = (): string => {
  const address = deploymentArtifacts['contract']?.contractAddress

  if (!address) {
    console.error('Contract address not found in deployment artifacts!')
    throw new Error(
      'Contract address is missing from deployment artifacts. Ensure artifacts/RumbleCourt.json contains a valid address under ["contract"]["contractAddress"].',
    )
  }

  return address
}

const contractAddress = getContractAddress()

// ============================================
// PROVIDER MANAGEMENT (Inspired by Solana pattern)
// ============================================

/**
 * Get READ-ONLY contract instance
 * Use this for all view/query operations that don't require signing
 */
export const getContractReadonly = (): ethers.Contract => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL

  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL not configured')
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  return new ethers.Contract(contractAddress, rumbleCourtAbi.abi, provider)
}

/**
 * Get READ-WRITE contract instance with signer
 * Use this for all transactions that require signing
 *
 * IMPORTANT: This function checks for browser context safely
 */
export const getContractWithSigner = async (): Promise<ethers.Contract> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Cannot sign transactions in non-browser environment')
  }

  // Check if ethereum provider exists
  if (!window.ethereum) {
    throw new Error('No browser wallet available. Please connect your wallet.')
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    return new ethers.Contract(contractAddress, rumbleCourtAbi.abi, signer)
  } catch (error) {
    console.error('Error getting signer:', error)
    throw new Error(
      'Failed to get wallet signer. Please ensure your wallet is connected and unlocked.',
    )
  }
}

/**
 * Error reporting helper
 */
const reportError = (error: unknown): void => {
  console.error('Blockchain Service Error:', error)
  if (error instanceof Error && error.message) {
    console.error('Error message:', error.message)
  }
  if (typeof error === 'object' && error !== null && 'reason' in error) {
    console.error('Error reason:', (error as { reason: string }).reason)
  }
}

// ============================================
// CASE FILING FUNCTIONS (WRITE OPERATIONS)
// ============================================

/**
 * File a new case - WRITE operation, requires signer
 */
export const fileCase = async (
  caseTitle: string,
  evidenceHash: string,
): Promise<ethers.TransactionResponse> => {
  try {
    const contract = await getContractWithSigner()
    const tx = await contract.fileCase(caseTitle, evidenceHash)

    // Ensure tx is a proper TransactionResponse
    if (!tx || typeof tx.wait !== 'function') {
      throw new Error('Invalid transaction response from contract')
    }

    await tx.wait()
    return tx
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// CASE QUERY FUNCTIONS (READ-ONLY OPERATIONS)
// ============================================

/**
 * Get case details by ID - READ operation, no signer needed
 */
export const getCase = async (caseId: bigint): Promise<Case> => {
  try {
    const contract = getContractReadonly()
    const caseData = await contract.getCase(caseId)
    return formatCase(caseData)
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Get all cases filed by a user - READ operation
 */
export const getUserCases = async (user: string): Promise<bigint[]> => {
  try {
    const contract = getContractReadonly()
    return (await contract.getUserCases(user)) as bigint[]
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Get total number of cases - READ operation
 */
export const getTotalCases = async (): Promise<bigint> => {
  try {
    const contract = getContractReadonly()
    return (await contract.getTotalCases()) as bigint
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// TRIAL MANAGEMENT FUNCTIONS (WRITE OPERATIONS)
// ============================================

/**
 * Start trial for a pending case - WRITE operation, requires signer
 */
export const startTrial = async (
  caseId: bigint,
): Promise<ethers.TransactionResponse> => {
  try {
    const contract = await getContractWithSigner()
    const tx = await contract.startTrial(caseId)

    if (!tx || typeof tx.wait !== 'function') {
      throw new Error('Invalid transaction response from contract')
    }

    await tx.wait()
    return tx
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Record AI-generated verdict - WRITE operation, requires signer
 */
export const recordVerdict = async (
  caseId: bigint,
  verdictType: number,
  reasoning: string,
  isFinal: boolean,
): Promise<ethers.TransactionResponse> => {
  try {
    const contract = await getContractWithSigner()
    const tx = await contract.recordVerdict(
      caseId,
      verdictType,
      reasoning,
      isFinal,
    )

    if (!tx || typeof tx.wait !== 'function') {
      throw new Error('Invalid transaction response from contract')
    }

    await tx.wait()
    return tx
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// VERDICT FUNCTIONS (READ-ONLY OPERATIONS)
// ============================================

/**
 * Get verdict for a case - READ operation
 */
export const getVerdict = async (caseId: bigint): Promise<Verdict> => {
  try {
    const contract = getContractReadonly()
    const verdictData = await contract.getVerdict(caseId)
    return formatVerdict(verdictData)
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Check if a case has a verdict - READ operation
 */
export const hasVerdict = async (caseId: bigint): Promise<boolean> => {
  try {
    const contract = getContractReadonly()
    return (await contract.hasVerdict(caseId)) as boolean
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// APPEAL FUNCTIONS (WRITE OPERATIONS)
// ============================================

/**
 * Appeal a completed case - WRITE operation, requires signer
 */
export const appealCase = async (
  caseId: bigint,
): Promise<ethers.TransactionResponse> => {
  try {
    const contract = await getContractWithSigner()
    const tx = await contract.appealCase(caseId)

    if (!tx || typeof tx.wait !== 'function') {
      throw new Error('Invalid transaction response from contract')
    }

    await tx.wait()
    return tx
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// UTILITY FUNCTIONS (READ-ONLY OPERATIONS)
// ============================================

/**
 * Get the contract owner address - READ operation
 */
export const getOwner = async (): Promise<string> => {
  try {
    const contract = getContractReadonly()
    return (await contract.owner()) as string
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Get the contract address
 */
export const getContractAddressExport = (): string => {
  return contractAddress
}

// ============================================
// EVENT LISTENERS (READ-ONLY OPERATIONS)
// ============================================

/**
 * Listen for CaseFiled events
 */
export const onCaseFiled = async (
  callback: (caseId: bigint, plaintiff: string, caseTitle: string) => void,
): Promise<void> => {
  try {
    const contract = getContractReadonly()
    contract.on(
      'CaseFiled',
      (caseId: unknown, plaintiff: unknown, caseTitle: unknown) => {
        callback(
          BigInt(caseId as string | number | bigint),
          plaintiff as string,
          caseTitle as string,
        )
      },
    )
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Listen for TrialStarted events
 */
export const onTrialStarted = async (
  callback: (caseId: bigint) => void,
): Promise<void> => {
  try {
    const contract = getContractReadonly()
    contract.on('TrialStarted', (caseId: unknown) => {
      callback(BigInt(caseId as string | number | bigint))
    })
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Listen for VerdictRecorded events
 */
export const onVerdictRecorded = async (
  callback: (caseId: bigint, verdictType: number, isFinal: boolean) => void,
): Promise<void> => {
  try {
    const contract = getContractReadonly()
    contract.on(
      'VerdictRecorded',
      (caseId: unknown, verdictType: unknown, isFinal: unknown) => {
        callback(
          BigInt(caseId as string | number | bigint),
          Number(verdictType),
          isFinal as boolean,
        )
      },
    )
  } catch (error) {
    reportError(error)
    throw error
  }
}

/**
 * Listen for CaseAppealed events
 */
export const onCaseAppealed = async (
  callback: (caseId: bigint) => void,
): Promise<void> => {
  try {
    const contract = getContractReadonly()
    contract.on('CaseAppealed', (caseId: unknown) => {
      callback(BigInt(caseId as string | number | bigint))
    })
  } catch (error) {
    reportError(error)
    throw error
  }
}

// ============================================
// DATA FORMATTING HELPERS
// ============================================

const formatCase = (caseData: unknown): Case => {
  const c = caseData as Record<string, unknown>
  return {
    caseId: BigInt(c.caseId as string | number | bigint),
    plaintiff: c.plaintiff as string,
    caseTitle: c.caseTitle as string,
    evidenceHash: c.evidenceHash as string,
    filedAt: BigInt(c.filedAt as string | number | bigint),
    status: formatStatus(Number(c.status)),
  }
}

const formatVerdict = (verdictData: unknown): Verdict => {
  const v = verdictData as Record<string, unknown>
  return {
    caseId: BigInt(v.caseId as string | number | bigint),
    verdictType: formatVerdictType(Number(v.verdictType)),
    reasoning: v.reasoning as string,
    timestamp: BigInt(v.timestamp as string | number | bigint),
    isFinal: v.isFinal as boolean,
  }
}

const formatStatus = (status: number): CaseStatus => {
  const statuses: CaseStatus[] = [
    'PENDING',
    'IN_TRIAL',
    'COMPLETED',
    'APPEALED',
  ]
  return statuses[status] || 'PENDING'
}

const formatVerdictType = (type: number): VerdictType => {
  const types: VerdictType[] = [
    'GUILTY',
    'NOT_GUILTY',
    'SETTLEMENT',
    'DISMISSED',
  ]
  return types[type] || 'DISMISSED'
}
