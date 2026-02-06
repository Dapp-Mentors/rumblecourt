import 'server-only'
// Opik configuration for evaluation and tracing
import { Opik } from 'opik'

// Initialize Opik client
let opikClient: Opik | null = null

/**
 * Initialize the Opik client with API key and project configuration
 */
export const initializeOpik = (): Opik | null => {
  if (opikClient) {
    return opikClient
  }

  const apiKey =
    process.env.NEXT_PUBLIC_OPIK_API_KEY || process.env.OPIK_API_KEY
  const projectName = process.env.OPIK_PROJECT_NAME || 'rumblecourt-agents'

  if (!apiKey) {
    console.warn('[Opik] ⚠️  API key not configured. Tracing will be disabled.')
    return null
  }

  try {
    opikClient = new Opik({
      apiKey,
      projectName,
    })
    console.log(`[Opik] ✅ Initialized for project: ${projectName}`)
    return opikClient
  } catch (error) {
    console.error('[Opik] ❌ Failed to initialize:', error)
    return null
  }
}

/**
 * Get the Opik client instance
 */
export const getOpikClient = (): Opik | null => {
  return opikClient || initializeOpik()
}

/**
 * Courtroom-specific metadata types
 */
export interface CourtroomMetadata {
  caseId?: string
  caseTitle?: string
  evidenceHash?: string
  agent?: 'prosecution' | 'defense' | 'judge'
  phase?: string
  turnNumber?: number
  [key: string]: string | number | boolean | undefined
}

interface OpikTrace {
  span: (options: {
    name: string
    type?: string
    input: unknown
    metadata?: unknown
  }) => OpikSpan
  end: (output?: unknown) => Promise<void>
  update?: (options: unknown) => Promise<void>
}

interface OpikSpan {
  end: (options: { output?: unknown; usage?: unknown }) => Promise<void>
  feedbackScores?: Array<{
    name: string
    value: number
    reason?: string
  }>
}

/**
 * CourtroomTracer class for managing courtroom simulation traces
 */
export class CourtroomTracer {
  private opik: Opik | null
  private currentTrace: OpikTrace | null = null
  private currentSpans: Map<string, OpikSpan> = new Map()
  private caseId: string
  private caseTitle: string
  private evidenceHash: string
  private debug: boolean

  constructor(
    caseId: string,
    caseTitle: string,
    evidenceHash: string,
    debug: boolean = false,
  ) {
    this.opik = getOpikClient()
    this.caseId = caseId
    this.caseTitle = caseTitle
    this.evidenceHash = evidenceHash
    this.debug = debug

    if (this.debug) {
      console.log('[Opik] 📊 CourtroomTracer initialized', {
        caseId,
        caseTitle,
        hasOpik: !!this.opik,
      })
    }
  }

  async startTrace(): Promise<void> {
    if (!this.opik) {
      if (this.debug) {
        console.log('[Opik] ⚠️  Opik not available, skipping trace creation')
      }
      return
    }

    try {
      this.currentTrace = this.opik.trace({
        name: 'courtroom_simulation',
        input: {
          caseId: this.caseId,
          caseTitle: this.caseTitle,
          evidenceHash: this.evidenceHash,
        },
        metadata: {
          caseId: this.caseId,
          caseTitle: this.caseTitle,
          evidenceHash: this.evidenceHash,
          simulationType: 'full_trial',
          timestamp: new Date().toISOString(),
        },
      }) as unknown as OpikTrace

      if (this.debug) {
        console.log('[Opik] ✅ Courtroom trace started')
      }
    } catch (error) {
      console.error('[Opik] ❌ Failed to start trace:', error)
    }
  }

  /**
   * Log a complete LLM interaction with prompt, response, and metadata
   * This is the primary method for capturing LLM calls for optimization
   */
  async logLLMInteraction(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      if (this.debug) {
        console.log('[Opik] ⚠️  Skipping LLM interaction log (no trace)')
      }
      return
    }

    const spanName = `llm_${agent}_${phase}_${Date.now()}`

    try {
      // Create and immediately end a span with the full interaction
      const span = this.currentTrace.span({
        name: spanName,
        type: 'llm',
        input: {
          agent,
          phase,
          prompt,
          promptLength: prompt.length,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
        metadata: {
          agent,
          phase,
          caseId: this.caseId,
          caseTitle: this.caseTitle,
          evidenceHash: this.evidenceHash,
          interactionType: 'llm_call',
          ...metadata,
        },
      })

      // Calculate automatic scores for courtroom simulation
      const scores = this.calculateCourtroomScores(agent, phase, prompt, response)

      await span.end({
        output: {
          response,
          responseLength: response.length,
          completedAt: new Date().toISOString(),
          feedbackScores: scores,
        },
      })

      if (this.debug) {
        console.log(`[Opik] 📝 LLM interaction logged:`, {
          agent,
          phase,
          promptLength: prompt.length,
          responseLength: response.length,
          scores,
        })
      }
    } catch (error) {
      console.error(`[Opik] ❌ Failed to log LLM interaction:`, error)
    }
  }

  async startSpan(
    spanName: string,
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    input: unknown,
  ): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    try {
      const span = this.currentTrace.span({
        name: spanName,
        type: 'llm',
        input,
        metadata: {
          agent,
          phase,
          caseId: this.caseId,
          timestamp: new Date().toISOString(),
        },
      })

      this.currentSpans.set(spanName, span)

      if (this.debug) {
        console.log(`[Opik] 🔍 Span started: ${spanName}`, { agent, phase })
      }
    } catch (error) {
      console.error(`[Opik] ❌ Failed to start span ${spanName}:`, error)
    }
  }

  async endSpan(
    spanName: string,
    output: unknown,
    error?: Error,
    usage?: {
      promptTokens?: number
      completionTokens?: number
      totalTokens?: number
    },
  ): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    const span = this.currentSpans.get(spanName)
    if (!span) {
      if (this.debug) {
        console.warn(`[Opik] ⚠️  Span not found: ${spanName}`)
      }
      return
    }

    try {
      await span.end({
        output,
        ...(usage && { usage }),
      })

      this.currentSpans.delete(spanName)

      if (this.debug) {
        console.log(`[Opik] ✅ Span ended: ${spanName}`)
      }
    } catch (error) {
      console.error(`[Opik] ❌ Failed to end span ${spanName}:`, error)
    }
  }

  async recordAgentInteraction(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
  ): Promise<void> {
    // Use the new logLLMInteraction method for better tracking
    await this.logLLMInteraction(agent, phase, prompt, response)
  }

  async recordPhaseCompletion(phase: string, outcome: unknown): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    try {
      if (this.debug) {
        console.log(`[Opik] ✅ Phase completed: ${phase}`, outcome)
      }
    } catch (error) {
      console.error('[Opik] ❌ Failed to record phase completion:', error)
    }
  }

  async recordVerdict(
    verdict: 'GUILTY' | 'NOT_GUILTY',
    reasoning: string,
    confidence?: number,
  ): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    try {
      await this.currentTrace.update?.({
        output: {
          verdict,
          reasoning,
          confidence,
        },
        metadata: {
          verdict,
          confidence,
          completedAt: new Date().toISOString(),
        },
      })

      if (this.debug) {
        console.log('[Opik] ⚖️  Verdict recorded:', { verdict, confidence })
      }
    } catch (error) {
      console.error('[Opik] ❌ Failed to record verdict:', error)
    }
  }

  async endTrace(output?: unknown): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    try {
      for (const [spanName, span] of this.currentSpans.entries()) {
        try {
          await span.end({
            output: { status: 'auto_closed' },
          })
        } catch (error) {
          console.error(`[Opik] ❌ Failed to close span ${spanName}:`, error)
        }
      }
      this.currentSpans.clear()

      await this.currentTrace.end(output || {})

      if (this.debug) {
        console.log('[Opik] ✅ Courtroom trace ended')
      }

      this.currentTrace = null
    } catch (error) {
      console.error('[Opik] ❌ Failed to end trace:', error)
    }
  }

  /**
   * Calculate automatic scores for courtroom simulation LLM responses
   */
  private calculateCourtroomScores(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
  ): Array<{ name: string; value: number; reason?: string }> {
    const scores: Array<{ name: string; value: number; reason?: string }> = []

    // 1. Relevance Score (0-1)
    const relevance = this.calculateRelevanceScore(prompt, response)
    scores.push({
      name: 'relevance',
      value: relevance,
      reason: relevance > 0.8 ? 'Highly relevant to the prompt' : relevance > 0.5 ? 'Moderately relevant' : 'Low relevance',
    })

    // 2. Argument Quality Score (0-1)
    const argumentQuality = this.calculateArgumentQualityScore(response)
    scores.push({
      name: 'argument_quality',
      value: argumentQuality,
      reason: argumentQuality > 0.8 ? 'Strong, logical argument' : argumentQuality > 0.5 ? 'Adequate argument' : 'Weak argument structure',
    })

    // 3. Professionalism Score (0-1)
    const professionalism = this.calculateProfessionalismScore(response)
    scores.push({
      name: 'professionalism',
      value: professionalism,
      reason: professionalism > 0.8 ? 'Highly professional tone' : professionalism > 0.5 ? 'Moderately professional' : 'Unprofessional language detected',
    })

    // 4. Legal Accuracy Score (0-1)
    const legalAccuracy = this.calculateLegalAccuracyScore(response, phase)
    scores.push({
      name: 'legal_accuracy',
      value: legalAccuracy,
      reason: legalAccuracy > 0.8 ? 'Legally accurate content' : legalAccuracy > 0.5 ? 'Mostly accurate with minor issues' : 'Significant legal inaccuracies',
    })

    // 5. Agent Role Adherence Score (0-1)
    const roleAdherence = this.calculateRoleAdherenceScore(response, agent)
    scores.push({
      name: 'role_adherence',
      value: roleAdherence,
      reason: roleAdherence > 0.8 ? 'Perfect role adherence' : roleAdherence > 0.5 ? 'Good role adherence' : 'Poor role adherence',
    })

    // 6. Response Completeness Score (0-1)
    const completeness = this.calculateCompletenessScore(response, prompt)
    scores.push({
      name: 'completeness',
      value: completeness,
      reason: completeness > 0.8 ? 'Complete response' : completeness > 0.5 ? 'Partially complete' : 'Incomplete response',
    })

    return scores
  }

  private calculateRelevanceScore(prompt: string, response: string): number {
    // Simple keyword matching for relevance
    const promptWords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    const responseText = response.toLowerCase()
    
    let relevantWords = 0
    promptWords.forEach(word => {
      if (responseText.includes(word)) relevantWords++
    })

    return Math.min(1, relevantWords / Math.max(1, promptWords.length))
  }

  private calculateArgumentQualityScore(response: string): number {
    // Check for logical connectors and structure
    const logicalConnectors = ['therefore', 'because', 'since', 'thus', 'consequently', 'however', 'moreover', 'furthermore']
    const structureMarkers = ['first', 'second', 'third', 'finally', 'in conclusion', 'additionally']
    
    let score = 0.3 // Base score
    
    logicalConnectors.forEach(connector => {
      if (response.toLowerCase().includes(connector)) score += 0.1
    })
    
    structureMarkers.forEach(marker => {
      if (response.toLowerCase().includes(marker)) score += 0.05
    })

    // Penalize for lack of substance
    if (response.length < 100) score -= 0.2
    if (response.includes('I don\'t know') || response.includes('I cannot')) score -= 0.3

    return Math.max(0, Math.min(1, score))
  }

  private calculateProfessionalismScore(response: string): number {
    const unprofessionalWords = ['fuck', 'shit', 'damn', 'hell', 'crap', 'bastard', 'idiot', 'stupid']
    const profanityCount = unprofessionalWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length

    let score = 1.0
    score -= profanityCount * 0.2

    // Check for excessive punctuation
    const exclamationCount = (response.match(/!/g) || []).length
    const questionCount = (response.match(/\?/g) || []).length
    
    if (exclamationCount > 3) score -= 0.1
    if (questionCount > 5) score -= 0.1

    return Math.max(0, score)
  }

  private calculateLegalAccuracyScore(response: string, phase: string): number {
    // Check for legal terminology and structure
    const legalTerms = ['law', 'statute', 'precedent', 'jurisdiction', 'evidence', 'testimony', 'objection', 'motion', 'ruling', 'verdict']
    const courtPhases = ['opening_statements', 'prosecution_case', 'defense_case', 'closing_arguments', 'judgment']
    
    let score = 0.3 // Base score
    
    legalTerms.forEach(term => {
      if (response.toLowerCase().includes(term)) score += 0.05
    })

    // Phase-specific scoring
    if (courtPhases.includes(phase)) {
      if (phase === 'opening_statements' && response.toLowerCase().includes('outline')) score += 0.1
      if (phase === 'prosecution_case' && response.includes('burden')) score += 0.1
      if (phase === 'defense_case' && response.includes('reasonable doubt')) score += 0.1
      if (phase === 'closing_arguments' && response.includes('summary')) score += 0.1
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateRoleAdherenceScore(response: string, agent: string): number {
    let score = 0.5 // Base score

    // Agent-specific expectations
    if (agent === 'prosecution') {
      if (response.includes('beyond reasonable doubt') || response.includes('burden of proof')) score += 0.2
      if (response.includes('guilty') || response.includes('evidence')) score += 0.2
    } else if (agent === 'defense') {
      if (response.includes('reasonable doubt') || response.includes('constitutional rights')) score += 0.2
      if (response.includes('innocent') || response.includes('rights')) score += 0.2
    } else if (agent === 'judge') {
      if (response.includes('objection') || response.includes('sustained') || response.includes('overruled')) score += 0.2
      if (response.includes('court') || response.includes('proceedings')) score += 0.2
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateCompletenessScore(response: string, prompt: string): number {
    // Check if response addresses the main question
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who']
    const hasQuestion = questionWords.some(word => prompt.toLowerCase().includes(word))
    
    if (!hasQuestion) return response.length > 50 ? 1.0 : 0.5

    // Check for complete sentences and conclusion
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const hasConclusion = response.toLowerCase().includes('therefore') || 
                         response.toLowerCase().includes('in conclusion') ||
                         response.toLowerCase().includes('thus')

    let score = 0.3
    if (sentences.length >= 3) score += 0.3
    if (hasConclusion) score += 0.4

    return Math.max(0, Math.min(1, score))
  }

  cleanup(): void {
    this.currentSpans.clear()
    this.currentTrace = null
  }
}

export const createCourtroomTracer = (
  caseId: string,
  caseTitle: string,
  evidenceHash: string,
  debug: boolean = false,
): CourtroomTracer => {
  return new CourtroomTracer(caseId, caseTitle, evidenceHash, debug)
}

// Initialize Opik on module load
initializeOpik()
