import { NextRequest, NextResponse } from 'next/server'
import helperClient from '@/services/helperClient'
import { validateUINode } from '@/models/uiNode'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const instruction: unknown = body?.instruction
    const previous = body?.previous_ui
    if (typeof instruction !== 'string' || !instruction.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing instruction' }, { status: 400 })
    }

    const system = `You generate UI as strict JSON conforming to this schema (no prose, no code fences):
UINode := Stack|Box|Heading|Text|Button|Input|Image|List|Divider
Stack: {"type":"Stack","props":{"direction":"vertical|horizontal","gap":number,"className":string},"children":UINode[]}
Box:   {"type":"Box","props":{"className":string},"children":UINode[]}
Heading:{"type":"Heading","props":{"level":1|2|3|4|5|6,"text":string,"className":string}}
Text:  {"type":"Text","props":{"text":string,"className":string}}
Button:{"type":"Button","props":{"text":string,"variant":"primary|secondary|link","href":string,"className":string}}
Input: {"type":"Input","props":{"placeholder":string,"className":string}}
Image: {"type":"Image","props":{"src":string,"alt":string,"className":string}}
List:  {"type":"List","props":{"ordered":boolean,"className":string},"children":Text[]}
Divider:{"type":"Divider","props":{"className":string}}
Return only valid JSON matching the schema.`

    const userPayload = {
      instruction,
      previous_ui: previous ?? null,
    }

    const res = await helperClient.chat([
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(userPayload) },
    ])
    if (!res.ok || !res.reply) return NextResponse.json({ ok: false, error: 'No reply' }, { status: 200 })

    // Try parse raw reply as JSON (model is instructed to output raw JSON)
    let parsed: unknown
    try {
      parsed = JSON.parse(res.reply)
    } catch {
      // Fallback to fenced json extraction
      const match = res.reply.match(/```json\n([\s\S]*?)\n```/)
      if (!match) return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 200 })
      parsed = JSON.parse(match[1])
    }
    const validated = validateUINode(parsed)
    if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 200 })
    return NextResponse.json({ ok: true, ui: validated.node })
  } catch (e) {
    console.error('[api/ai/text/generate] error', e)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}

