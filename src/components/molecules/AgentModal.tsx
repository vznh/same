'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useFrameStore } from '@/stores/frameStore'
import { executeFrameAction } from '@/services/frameExecutor'
import { validateFrameAction, FrameAction } from '@/models/frame'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

export default function AgentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 0)
    } else {
      // reset draft error but keep messages for session continuity
      setDraft('')
      setError(null)
    }
  }, [isOpen])

  const send = async () => {
    const text = draft.trim()
    if (!text || loading) return
    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setDraft('')
    setLoading(true)
    try {
      const frames = useFrameStore.getState().frames.map(f => ({ id: f.id, title: f.title, type: f.type, x: f.x, y: f.y }))
      const res = await axios.post('/api/ai/frames/parse', { text, frames })
      const data = res.data as { ok: boolean; action?: unknown; error?: string }
      if (!data.ok || !data.action) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'I could not parse an action from that. Try specifying create/move/resize/update/delete with details.' },
        ])
        return
      }
      const validated = validateFrameAction(data.action)
      if (!validated.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: validated.error }])
        return
      }
      const exec = executeFrameAction(validated.action)
      if (!exec.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: exec.error || 'Failed to execute action' }])
        return
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: describeAction(validated.action) }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Request failed' }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col" style={{ maxHeight: '80vh' }}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-800">Agent</div>
            <button onClick={onClose} className="text-xs text-gray-600 hover:text-gray-900">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-scrollable>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm border ${
                  m.role === 'assistant'
                    ? 'bg-white border-gray-200 text-gray-800'
                    : 'bg-blue-600 border-blue-700 text-white ml-auto'
                }`}
              >
                {m.content}
              </div>
            ))}
            {error && <div className="text-[12px] text-red-600">{error}</div>}
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400/60 outline-none resize-none overflow-hidden"
                placeholder="Describe a change (e.g., create a text frame 400x300 at 200,150 named Draft)"
              />
              <button
                onClick={send}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-100 rounded-[8px] text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? '…' : 'Run'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function describeAction(action: FrameAction): string {
  switch (action.type) {
    case 'create': return `Created ${action.payload.frameType} frame "${action.payload.title}" at (${action.payload.x}, ${action.payload.y}) size ${action.payload.width}x${action.payload.height}.`
    case 'update': return `Updated ${action.id} with ${Object.keys(action.updates).join(', ')}.`
    case 'move': return `Moved ${action.id} to (${action.x}, ${action.y}).`
    case 'resize': return `Resized ${action.id} to ${action.width}x${action.height}.`
    case 'bringToFront': return `Brought ${action.id} to front.`
    case 'sendToBack': return `Sent ${action.id} to back.`
    case 'select': return `Selected ${action.id}${action.multiSelect ? ' (multi)' : ''}.`
    case 'clearSelection': return `Cleared selection.`
    case 'delete': return `Deleted ${action.id}.`
    case 'selectMany': return `Selected ${action.ids.length} frames.`
    case 'deleteMany': return `Deleted ${action.ids.length} frames.`
    case 'moveMany': return `Moved ${action.moves.length} frames.`
    case 'connect': return `Connected ${action.pairs.length} pair(s).`
    default: return 'Done.'
  }
}

