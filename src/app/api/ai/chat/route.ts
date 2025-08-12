// app/api/ai/chat – per-request chat completion passthrough
import { NextRequest, NextResponse } from 'next/server'
import helperClient from '@/services/helperClient'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: unknown = body?.messages
    if (!Array.isArray(messages)) {
      return NextResponse.json({ ok: false, error: 'messages must be an array' }, { status: 400 })
    }
    // Minimal structural validation
    const safeMessages: ChatMessage[] = []
    for (const m of messages as any[]) {
      if (!m || (m.role !== 'system' && m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
        return NextResponse.json({ ok: false, error: 'invalid message structure' }, { status: 400 })
      }
      safeMessages.push({ role: m.role, content: m.content })
    }

    const result = await helperClient.chat(safeMessages)
    const status = result.ok ? 200 : 500
    return NextResponse.json(result, { status })
  } catch (e) {
    console.error('[api/ai/chat] error', e)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}

