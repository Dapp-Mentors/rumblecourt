// Client-side wrapper for Opik tracing
// Place this file at: lib/opik-client.ts

export interface CourtroomMetadata {
  caseId?: string
  caseTitle?: string
  evidenceHash?: string
  agent?: 'prosecution' | 'defense' | 'judge'
  phase?: string
  turnNumber?: number
  [key: string]: string | number | boolean | undefined
}

/**
 * Client-side CourtroomTracer that communicates with the API route
 */
export class CourtroomTracerClient {
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
    this.caseId = caseId
    this.caseTitle = caseTitle
    this.evidenceHash = evidenceHash
    this.debug = debug

    if (this.debug) {
      console.log('📊 CourtroomTracer initialized (client)', {
        caseId,
        caseTitle,
      })
    }
  }

  private async callApi(action: string, params: Record<string, unknown> = {}) {
    try {
      const response = await fetch('/api/opik', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          caseId: this.caseId,
          caseTitle: this.caseTitle,
          evidenceHash: this.evidenceHash,
          ...params,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        console.error(`Opik API error (${action}):`, data.error)
      }

      return data
    } catch (error) {
      if (this.debug) {
        console.error(`Failed to call Opik API (${action}):`, error)
      }
      return { success: false, error: String(error) }
    }
  }

  async startTrace(): Promise<void> {
    await this.callApi('start_trace')
  }

  async startSpan(
    spanName: string,
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    input: unknown,
  ): Promise<void> {
    await this.callApi('start_span', {
      spanName,
      agent,
      phase,
      input,
    })
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
    await this.callApi('end_span', {
      spanName,
      output,
      error: error ? { message: error.message, stack: error.stack } : undefined,
      usage,
    })
  }

  async recordAgentInteraction(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
  ): Promise<void> {
    const spanName = `${agent}_${phase}_${Date.now()}`
    await this.startSpan(spanName, agent, phase, { prompt })
    await this.endSpan(spanName, { response })
  }

  async recordPhaseCompletion(phase: string, outcome: unknown): Promise<void> {
    if (this.debug) {
      console.log(`✅ Phase completed: ${phase}`, outcome)
    }
  }

  async recordVerdict(
    verdict: 'GUILTY' | 'NOT_GUILTY',
    reasoning: string,
    confidence?: number,
  ): Promise<void> {
    await this.callApi('record_verdict', {
      verdict,
      reasoning,
      confidence,
    })
  }

  async endTrace(output?: unknown): Promise<void> {
    await this.callApi('end_trace', { output })
  }

  cleanup(): void {
    // Client-side cleanup if needed
    if (this.debug) {
      console.log('🧹 CourtroomTracer cleaned up (client)')
    }
  }
}

export const createCourtroomTracer = (
  caseId: string,
  caseTitle: string,
  evidenceHash: string,
  debug: boolean = false,
): CourtroomTracerClient => {
  return new CourtroomTracerClient(caseId, caseTitle, evidenceHash, debug)
}
