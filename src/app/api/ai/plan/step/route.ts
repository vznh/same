import { NextRequest, NextResponse } from 'next/server'
import helperClient from '@/services/helperClient'
import { validateUINode } from '@/models/uiNode'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body?.messages
    if (!Array.isArray(messages)) {
      return NextResponse.json({ ok: false, error: 'messages must be an array' }, { status: 400 })
    }
    // Use existing chat with planning system prompt already included on client side
    const res = await helperClient.chat(messages)
    if (!res.ok || !res.reply) return NextResponse.json({ ok: false, error: 'No reply' }, { status: 200 })
    // Try to extract a JSON node for preview/build when agent emits it
    const match = res.reply.match(/```json\n([\s\S]*?)\n```/)
    if (match) {
      try {
        const parsed = JSON.parse(match[1])
        const validated = validateUINode(parsed)
        if (validated.ok) {
          return NextResponse.json({ ok: true, reply: res.reply, ui: validated.node })
        }
      } catch {}
    }
    return NextResponse.json({ ok: true, reply: res.reply })
  } catch (e) {
    console.error('[api/ai/plan/step] error', e)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}

