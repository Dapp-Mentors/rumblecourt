// API route for server-side Opik operations
// Place this file at: app/api/opik/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createCourtroomTracer, CourtroomTracer } from '@/lib/opik'

// Store active tracers in memory (you might want to use a more persistent solution)
const activeTracers = new Map<string, CourtroomTracer>()

// Logging helper for background operations
const log = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `[Opik] ℹ️  ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    )
  },
  success: (message: string, data?: Record<string, unknown>) => {
    console.log(
      `[Opik] ✅ ${message}`,
      data ? JSON.stringify(data, null, 2) : '',
    )
  },
  error: (message: string, error?: unknown) => {
    console.error(`[Opik] ❌ ${message}`, error)
  },
  trace: (action: string, details: Record<string, unknown>) => {
    console.log(`[Opik Trace] 🔍 ${action}:`, {
      timestamp: new Date().toISOString(),
      ...details,
    })
  },
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action, caseId, caseTitle, evidenceHash, ...params } = body

    log.trace(action, { caseId, caseTitle, ...params })

    switch (action) {
      case 'start_trace': {
        const tracer = createCourtroomTracer(
          caseId,
          caseTitle,
          evidenceHash,
          true, // debug mode
        )
        await tracer.startTrace()
        activeTracers.set(caseId, tracer)

        log.success('Trace started', { caseId, caseTitle })

        return NextResponse.json({
          success: true,
          message: 'Trace started',
          caseId,
        })
      }

      case 'log_llm_interaction': {
        // Fire-and-forget LLM interaction logging
        const tracer = activeTracers.get(caseId)

        if (!tracer) {
          log.info('Creating new tracer for LLM interaction', { caseId })
          const newTracer = createCourtroomTracer(
            caseId,
            caseTitle,
            evidenceHash,
            true,
          )
          await newTracer.startTrace()
          activeTracers.set(caseId, newTracer)
        }

        const currentTracer = activeTracers.get(caseId)!

        // Log the interaction in the background without blocking response
        setImmediate(async () => {
          try {
            await currentTracer.logLLMInteraction(
              params.agent as 'prosecution' | 'defense' | 'judge',
              params.phase as string,
              params.prompt as string,
              params.response as string,
              params.metadata as Record<string, unknown>,
            )

            log.trace('LLM interaction logged', {
              agent: params.agent,
              phase: params.phase,
              promptLength: (params.prompt as string)?.length || 0,
              responseLength: (params.response as string)?.length || 0,
            })
          } catch (error) {
            log.error('Failed to log LLM interaction', error)
          }
        })

        // Return immediately without waiting
        return NextResponse.json({
          success: true,
          message: 'LLM interaction queued for logging',
        })
      }

      case 'start_span': {
        const tracer = activeTracers.get(caseId)
        if (!tracer) {
          return NextResponse.json(
            { success: false, error: 'Tracer not found' },
            { status: 404 },
          )
        }

        await tracer.startSpan(
          params.spanName,
          params.agent,
          params.phase,
          params.input,
        )

        log.trace('Span started', {
          spanName: params.spanName,
          agent: params.agent,
          phase: params.phase,
        })

        return NextResponse.json({
          success: true,
          message: 'Span started',
        })
      }

      case 'end_span': {
        const tracer = activeTracers.get(caseId)
        if (!tracer) {
          return NextResponse.json(
            { success: false, error: 'Tracer not found' },
            { status: 404 },
          )
        }

        await tracer.endSpan(
          params.spanName,
          params.output,
          params.error,
          params.usage,
        )

        log.trace('Span ended', {
          spanName: params.spanName,
          hasOutput: !!params.output,
          hasError: !!params.error,
        })

        return NextResponse.json({
          success: true,
          message: 'Span ended',
        })
      }

      case 'record_verdict': {
        const tracer = activeTracers.get(caseId)
        if (!tracer) {
          return NextResponse.json(
            { success: false, error: 'Tracer not found' },
            { status: 404 },
          )
        }

        await tracer.recordVerdict(
          params.verdict,
          params.reasoning,
          params.confidence,
        )

        log.success('Verdict recorded', {
          verdict: params.verdict,
          confidence: params.confidence,
        })

        return NextResponse.json({
          success: true,
          message: 'Verdict recorded',
        })
      }

      case 'end_trace': {
        const tracer = activeTracers.get(caseId)
        if (!tracer) {
          return NextResponse.json(
            { success: false, error: 'Tracer not found' },
            { status: 404 },
          )
        }

        await tracer.endTrace(params.output)
        activeTracers.delete(caseId)

        log.success('Trace ended and cleaned up', { caseId })

        return NextResponse.json({
          success: true,
          message: 'Trace ended',
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error) {
    log.error('Opik API error', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
