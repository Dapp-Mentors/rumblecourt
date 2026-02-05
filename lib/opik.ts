import 'server-only';
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
    console.warn('Opik API key not configured. Tracing will be disabled.')
    return null
  }

  try {
    opikClient = new Opik({
      apiKey,
      projectName,
    })
    console.log(`✅ Opik initialized for project: ${projectName}`)
    return opikClient
  } catch (error) {
    console.error('Failed to initialize Opik:', error)
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
      console.log('📊 CourtroomTracer initialized', {
        caseId,
        caseTitle,
        hasOpik: !!this.opik,
      })
    }
  }

  async startTrace(): Promise<void> {
    if (!this.opik) {
      if (this.debug) {
        console.log('⚠️  Opik not available, skipping trace creation')
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
        console.log('✅ Courtroom trace started')
      }
    } catch (error) {
      console.error('Failed to start Opik trace:', error)
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
        console.log(`📝 Span started: ${spanName}`, { agent, phase })
      }
    } catch (error) {
      console.error(`Failed to start span ${spanName}:`, error)
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
        console.warn(`⚠️  Span not found: ${spanName}`)
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
        console.log(`✅ Span ended: ${spanName}`)
      }
    } catch (error) {
      console.error(`Failed to end span ${spanName}:`, error)
    }
  }

  async recordAgentInteraction(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
  ): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    const spanName = `${agent}_${phase}_${Date.now()}`

    try {
      await this.startSpan(spanName, agent, phase, { prompt })
      await this.endSpan(spanName, { response })
    } catch (error) {
      console.error('Failed to record agent interaction:', error)
    }
  }

  async recordPhaseCompletion(phase: string, outcome: unknown): Promise<void> {
    if (!this.opik || !this.currentTrace) {
      return
    }

    try {
      if (this.debug) {
        console.log(`✅ Phase completed: ${phase}`, outcome)
      }
    } catch (error) {
      console.error('Failed to record phase completion:', error)
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
        console.log('⚖️  Verdict recorded:', { verdict, confidence })
      }
    } catch (error) {
      console.error('Failed to record verdict:', error)
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
          console.error(`Failed to close span ${spanName}:`, error)
        }
      }
      this.currentSpans.clear()

      await this.currentTrace.end(output || {})

      if (this.debug) {
        console.log('✅ Courtroom trace ended')
      }

      this.currentTrace = null
    } catch (error) {
      console.error('Failed to end Opik trace:', error)
    }
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
