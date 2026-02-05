// API route for server-side Opik operations
// Place this file at: app/api/opik/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createCourtroomTracer, CourtroomTracer } from '@/lib/opik'

// Store active tracers in memory (you might want to use a more persistent solution)
const activeTracers = new Map<string, CourtroomTracer>()

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action, caseId, caseTitle, evidenceHash, ...params } = body

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

        return NextResponse.json({
          success: true,
          message: 'Trace started',
          caseId,
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
    console.error('Opik API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
