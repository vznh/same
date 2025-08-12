// app/api/ai/frames/parse – parse NL into a FrameAction
import { NextRequest, NextResponse } from 'next/server'
import helperClient from '@/services/helperClient'
import { useFrameStore } from '@/stores/frameStore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text: unknown = body?.text
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 })
    }

    // Snapshot frames (id + title) for resolver context
    const frames = useFrameStore.getState().frames.map(f => ({ id: f.id, title: f.title }))
    const result = await helperClient.parseFrameCommand(text, frames)
    const status = result.ok ? 200 : 400
    return NextResponse.json(result, { status })
  } catch (e) {
    console.error('[api/ai/frames/parse] error', e)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}

