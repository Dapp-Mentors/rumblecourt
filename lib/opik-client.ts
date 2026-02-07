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
 * All operations are fire-and-forget to avoid blocking UI
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
      console.log('[Opik Client] 📊 CourtroomTracer initialized', {
        caseId,
        caseTitle,
      })
    }
  }

  /**
   * Fire-and-forget API call - doesn't wait for response
   * This ensures tracing never blocks the UI
   */
  private fireAndForget(action: string, params: Record<string, unknown> = {}) {
    // Using Promise without awaiting - true fire-and-forget
    fetch('/api/opik', {
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
      .then((response) => response.json())
      .then((data) => {
        if (this.debug && !data.success) {
          console.warn(`[Opik Client] ⚠️  ${action} failed:`, data.error)
        }
      })
      .catch((error) => {
        if (this.debug) {
          console.error(`[Opik Client] ❌ ${action} error:`, error)
        }
      })
  }

  /**
   * Only use await for critical operations that need confirmation
   */
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

      if (!data.success && this.debug) {
        console.error(`[Opik Client] ❌ ${action} failed:`, data.error)
      }

      return data
    } catch (error) {
      if (this.debug) {
        console.error(`[Opik Client] ❌ ${action} error:`, error)
      }
      return { success: false, error: String(error) }
    }
  }

  async startTrace(): Promise<void> {
    await this.callApi('start_trace')
  }

  /**
   * PRIMARY METHOD: Log LLM interactions for optimization
   * Fire-and-forget to never block UI
   */
  logLLMInteraction(
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    prompt: string,
    response: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.fireAndForget('log_llm_interaction', {
      agent,
      phase,
      prompt,
      response,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    })

    if (this.debug) {
      console.log(`[Opik Client] 📝 Queued LLM interaction:`, {
        agent,
        phase,
        promptLength: prompt.length,
        responseLength: response.length,
      })
    }
  }

  async startSpan(
    spanName: string,
    agent: 'prosecution' | 'defense' | 'judge',
    phase: string,
    input: unknown,
  ): Promise<void> {
    // Fire and forget for spans too
    this.fireAndForget('start_span', {
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
    this.fireAndForget('end_span', {
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
    // Use the new logLLMInteraction method
    this.logLLMInteraction(agent, phase, prompt, response)
  }

  async recordPhaseCompletion(phase: string, outcome: unknown): Promise<void> {
    if (this.debug) {
      console.log(`[Opik Client] ✅ Phase completed: ${phase}`, outcome)
    }
  }

  async recordVerdict(
    verdict: 'GUILTY' | 'NOT_GUILTY',
    reasoning: string,
    confidence?: number,
  ): Promise<void> {
    // Fire and forget for verdict too
    this.fireAndForget('record_verdict', {
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
      console.log('[Opik Client] 🧹 CourtroomTracer cleaned up')
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
