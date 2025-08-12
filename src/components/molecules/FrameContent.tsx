// components/molecules/FrameContent
'use client'

import { useRef, useState, useEffect } from 'react'
import { QuestionMarkCircledIcon, DrawingPinIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import axios from 'axios'
import { useFrameContext } from '@/contexts/FrameContext'
import { usePlanChatStore } from '@/stores/planChatStore'
import RenderNode from './RenderNode'
import { validateUINode, UINode } from '@/models/uiNode'
import { useFrameStore } from '@/stores/frameStore'
import { useConnectionStore } from '@/stores/connectionStore'
import Image from 'next/image'

// Text Frame Content
export function TextFrameContent() {
  const [action, setAction] = useState('')
  const actionRef = useRef<HTMLTextAreaElement | null>(null)
  const { addFrame } = useFrameStore()

  const autoResize = () => {
    if (!actionRef.current) return
    actionRef.current.style.height = '0px'
    actionRef.current.style.height = actionRef.current.scrollHeight + 'px'
  }

  useEffect(() => {
    autoResize()
  }, [action])
  
  return (
    <div className="w-full h-full relative tracking-tight">
      {/* Main Content Container */}
      <div className="w-full h-full p-4 rounded-[10px] tracking-tight">
        {/* Immutable Title with divider */}
        <div className="mb-3">
        <div className="text-sm text-gray-900/40 mb-2 select-none">
        Generate components, websites, or services from an image reference
      </div>
          <div className="mt-2 h-px w-full bg-gray-200" />
        </div>
      
        <div className="mb-10 h-1" />
      {/* Middle Section - Suggestions */}
      <div className="mb-4 space-y-3 opacity-40">
        <div className="flex items-center space-x-3">
          <QuestionMarkCircledIcon className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Ask a question</span>
        </div>
        <div className="flex items-center space-x-3">
          <DrawingPinIcon className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Plan out your approach</span>
        </div>
        <div className="text-xs text-gray-400 mt-5">
          Best for if you have a solid idea in mind, or want to get specifics down
        </div>
        <div className="mt-4 h-px w-full" />
      </div>

      <div className="mt-2 h-px w-full bg-gray-200" />
      
      {/* Bottom Section - Action Input */}
      <div className="pt-3 border-t border-gray-200/30">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          <textarea
            ref={actionRef}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const instruction = action.trim()
                if (!instruction) return
                try {
                  const res = await axios.post('/api/ai/text/generate', { instruction })
                  const data = res.data as { ok: boolean; ui?: unknown }
                  if (data.ok && data.ui) {
                    const v = validateUINode(data.ui)
                    if (v.ok) {
                      const idx = useFrameStore.getState().frames.filter(f => f.title?.startsWith('Generation ')).length
                      addFrame({
                        title: `Generation ${idx + 1}`,
                        x: 200,
                        y: 150,
                        width: 450,
                        height: 350,
                        content: <RenderNode node={v.node as UINode} />,
                        type: 'custom',
                      })
                      setAction('')
                    }
                  }
                } catch {}
              }
            }}
            rows={2}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400/60 outline-none resize-none overflow-hidden"
            placeholder="Create a website for a coffee shop with a dark mocha color way"
          />
          <div className="flex flex-col space-y-1">
            <button className="w-6 h-6 bg-gray-100 rounded-[5px] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={async () => {
                const instruction = action.trim()
                if (!instruction) return
                try {
                  const res = await axios.post('/api/ai/text/generate', { instruction })
                  const data = res.data as { ok: boolean; ui?: unknown }
                  if (data.ok && data.ui) {
                    const v = validateUINode(data.ui)
                    if (v.ok) {
                      const idx = useFrameStore.getState().frames.filter(f => f.title?.startsWith('Generation ')).length
                      addFrame({
                        title: `Generation ${idx + 1}`,
                        x: 200,
                        y: 150,
                        width: 450,
                        height: 350,
                        content: <RenderNode node={v.node as UINode} />,
                        type: 'custom',
                      })
                      setAction('')
                    }
                  }
                } catch {}
              }}
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

// Image Frame Content
export function ImageFrameContent() {
  const [isDragging, setIsDragging] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addFrame } = useFrameStore()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      const src = reader.result as string
      setPreviewSrc(src)
      // Immediately pass-through the image into a generated frame without calling the AI
      const ui: UINode = {
        type: 'Stack',
        props: { direction: 'vertical', gap: 12, className: 'p-3' },
        children: [
          { type: 'Image', props: { src, alt: 'Uploaded image', className: 'max-w-full max-h-full object-contain rounded' } },
        ],
      }
      const idx = useFrameStore.getState().frames.filter(f => f.title?.startsWith('Generation ')).length
      addFrame({
        title: `Generation ${idx + 1}`,
        x: 200,
        y: 150,
        width: 450,
        height: 350,
        content: <RenderNode node={ui} />,
        type: 'custom',
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
      <div className="w-full h-full p-4 rounded-[10px] tracking-tight">
      {/* Title (40% opacity) */}
      <div className="text-sm text-gray-900/40 mb-2 select-none">
        Generate components, websites, or services from an image reference
      </div>
      <div className="h-px w-full bg-gray-200/60 mb-4" />

      {/* Drop zone */}
      <div
        className={`relative rounded-[10px] p-6`}
      >
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-[10px] min-h-[140px] flex items-center justify-center border-2 border-dashed transition-colors ${
            isDragging ? 'border-gray-500' : 'border-gray-400/80'
          }`}
        >
          {previewSrc ? (
            <Image src={previewSrc} alt="Uploaded" className="max-h-[234px] max-w-full rounded" />
          ) : (
            <div className="flex items-center space-x-3">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-900/80"
              >
                <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14" />
                <rect x="3" y="3" width="18" height="14" rx="2" ry="2" />
                <circle cx="9" cy="8" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <div className="flex flex-col">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[15px] font-medium underline"
                  style={{ color: '#002fa7' }}
                >
                  Upload an image
                </button>
                <span className="text-sm text-gray-900/80 -mt-0.5">or drag & drop</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper (40% opacity) */}
      <div className="mt-4 text-sm text-gray-900/40 select-none">
        Best if you have inspiration to use as reference
      </div>

      {/* Hidden input (not visible, just for file picker) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}


// Custom Frame Content - Example with buttons and interactions
export function CustomFrameContent() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      <div className="text-2xl font-bold text-gray-700">Counter: {count}</div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          -
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          +
        </button>
      </div>
      <div className="text-xs text-gray-500 text-center">
        This frame contains custom React components
      </div>
    </div>
  )
}

// HTML Attributes Frame Content - Demonstrates hosting any HTML content
export function HTMLFrameContent() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-2">HTML Content Frame</h3>
      <p className="text-sm text-gray-600 mb-3">
        This frame can host any HTML content with full styling.
      </p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Lists and formatting</li>
        <li>Custom CSS classes</li>
        <li>Interactive elements</li>
        <li>Any React components</li>
      </ul>
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
        <strong>Note:</strong> Frames are content-agnostic containers!
      </div>
    </div>
  )
} 

// Plan/Chat Frame Content (scrollable chat with helper text)
export function PlanFrameContent() {
  const { frameId } = useFrameContext()
  const { conversations, appendMessage, setReady, ready, setPreview, preview } = usePlanChatStore()
  const messages = conversations[frameId] || []
  const isReady = !!ready[frameId]
  const previewText = preview[frameId] || null
  const { addFrame } = useFrameStore()
  const [draft, setDraft] = useState('')
  const draftRef = useRef<HTMLTextAreaElement | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const SYSTEM_PROMPT = `You are a product-planning assistant. Your job is to elicit precise requirements through short, targeted questions, then converge on a buildable spec.

Rules:
- Ask ONE focused question per turn.
- Keep it brief and neutral (no enthusiasm or filler).
- Prefer concrete options and checklists the user can pick from.
- If the user is non‑technical or uncertain, offer 2–4 clear choices with plain-language trade‑offs.
- Build logically on prior answers; don’t repeat covered ground.
- Do not suggest solutions unless the question needs options.
- Stop and summarize only when the user explicitly asks.

Prioritize clarifying across these areas (top → bottom):
1) Product and users
   - Target users, core job-to-be-done, primary outcome, must-have vs nice-to-have.
2) Scope and flows
   - Key screens/flows, minimal milestone (v0), non-goals.
3) Data and integration constraints
   - Data sources/ownership, APIs/integrations, input formats, storage/retention.
4) Platform and distribution
   - Web/Native/Desktop; devices; auth model (email, SSO, guest).
5) Quality and limitations
   - Performance (latency/throughput), scale, cost/limits, offline, A11y, i18n.
6) Security/compliance
   - Privacy, PII/PHI, encryption, audit, regulatory needs (e.g., GDPR).
7) Technical decisions (only when needed)
   - Offer small option sets with plain-language trade‑offs.

Style examples:
- Product: "Who uses this first: students, freelancers, or small teams?"
- Scope: "Which v0 flow is essential: sign-in, capture content, or export?"
- Data: "Where does the source data come from: upload, URL, or API?"
- Platform: "Target first: Web desktop (Chrome/Safari) or mobile?"
- Quality: "Latency target for main action: ~0.5s, ~1s, or ~2s?"
- Security: "Any PII/PHI stored? yes/no"
- Tech (if asked): "Storage: local only vs cloud (easy sharing) — preference?"

Behavior:
- After each reply, ask one direct, specific question next.
- If the user is stuck, propose 2–3 defaults to choose from.
- Do not express encouragement or opinions.`

  const resize = () => {
    if (!draftRef.current) return
    draftRef.current.style.height = '0px'
    draftRef.current.style.height = draftRef.current.scrollHeight + 'px'
  }

  useEffect(() => {
    resize()
  }, [draft])

  const send = async () => {
    const text = draft.trim()
    if (!text || isSending) return
    setError(null)
    // Optimistically append user message
    appendMessage(frameId, { role: 'user', content: text })
    setDraft('')
    setIsSending(true)
    try {
      // Aggregate context from connected frames (recent messages)
      const connectedIds = useConnectionStore.getState().getConnectedComponent(frameId).filter(id => id !== frameId)
      const frames = useFrameStore.getState().frames
      const conversations = usePlanChatStore.getState().conversations
      let contextBlock = ''
      if (connectedIds.length > 0) {
        const parts: string[] = []
        parts.push('Context from connected frames:')
        for (const id of connectedIds) {
          const f = frames.find(fr => fr.id === id)
          const title = f?.title || id
          const msgs = (conversations[id] || []).slice(-8)
          const transcript = msgs.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n')
          parts.push(`- Frame: ${title}${transcript ? `\n${transcript}` : ''}`)
        }
        contextBlock = parts.join('\n')
      }
      const res = await axios.post('/api/ai/plan/step', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(contextBlock ? [{ role: 'system', content: contextBlock }] as const : []),
          ...messages,
          { role: 'user', content: text },
        ],
      })
      const data = res.data as { ok: boolean; reply?: string; error?: string; ui?: unknown }
      if (!data.ok || !data.reply) {
        setError(data.error || 'No reply')
        return
      }
      appendMessage(frameId, { role: 'assistant', content: data.reply as string })
      // Detect readiness
      const userReady = /\bready to build\b/i.test(text)
      const assistantReady = /\bready to build\b/i.test(data.reply || '')
      if (userReady || assistantReady) {
        setReady(frameId, true)
        // If UI JSON provided, validate and store as preview json string
        if (data.ui) {
          const validated = validateUINode(data.ui)
          if (validated.ok) setPreview(frameId, JSON.stringify(validated.node))
        }
        // Auto-create a new frame for the preview with indexed naming
        const uiJson = data.ui && validateUINode(data.ui).ok ? JSON.stringify((validateUINode(data.ui) as any).node) : previewText
        const existingGenerations = useFrameStore.getState().frames.filter(f => f.title?.startsWith('Generation ')).length
        addFrame({
          title: `Generation ${existingGenerations + 1}`,
          x: 200,
          y: 150,
          width: 450,
          height: 350,
          content: uiJson ? <RenderNode node={JSON.parse(uiJson) as UINode} /> : <div className="p-4 text-sm text-gray-700">Generated content</div>,
          type: 'custom',
        })
      }
    } catch (e) {
      setError('Request failed')
    } finally {
      setIsSending(false)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="w-full h-full p-4 rounded-[10px] tracking-tight flex flex-col">
      {/* Preview or planning header */}
      {isReady && (
        <div className="mb-2">
          <div className="text-sm text-gray-900/70 mb-2 select-none">Preview (not building yet)</div>
          {previewText ? (
            <div className="p-3 rounded border bg-white text-sm text-gray-800">
              {/* Render validated UI JSON */}
              <RenderNode node={JSON.parse(previewText) as UINode} />
            </div>
          ) : (
            <div className="p-3 rounded border bg-white text-sm text-gray-800 whitespace-pre-wrap">
              Ready to build. Provide final confirmation or adjustments.
            </div>
          )}
        </div>
      )}
      {!isReady && (
        <>
          <div className="text-gray-900/40 mb-2 select-none">
            Plan out your approach with follow-up questions to match your preference
          </div>
          <div className="h-px w-full bg-gray-200/70" />
        </>
      )}

      {/* Chat area */}

      <div className="flex-1 overflow-y-auto py-6 space-y-3" data-scrollable>
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
        {/* Helper text - hidden when more than 1 message exists */}
        {messages.length <= 1 && (
          <div className="text-gray-900/40 text-base select-none">
            If you still have a plan, and want to flesh it out a bit more
          </div>
        )}
        {messages.length >= 1 && !isReady && (
          <div className="text-xs text-gray-500 select-none">
            Say <span className="font-medium">ready to build</span> when you&apos;re confident
          </div>
        )}
        {error && (
          <div className="text-[12px] text-red-600">{error}</div>
        )}
      </div>

      {/* Input area */}
      <div className="pt-3 border-t border-gray-200/70">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400/60 outline-none resize-none overflow-hidden"
            placeholder="Spitball an idea"
          />
          <button
            onClick={send}
            disabled={isSending}
            className="w-7 h-7 bg-gray-100 rounded-[10px] flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label="Send"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}