// components/molecules/FrameContent
'use client'

import { useRef, useState, useEffect } from 'react'
import { QuestionMarkCircledIcon, DrawingPinIcon, ArrowUpIcon, PlusCircledIcon } from '@radix-ui/react-icons'

// Text Frame Content
export function TextFrameContent() {
  const [action, setAction] = useState('')
  const actionRef = useRef<HTMLTextAreaElement | null>(null)

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
            rows={2}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400/60 outline-none resize-none overflow-hidden"
            placeholder="Create a website for a coffee shop with a dark mocha color way"
          />
          <div className="flex flex-col space-y-1">
            <button className="w-6 h-6 bg-gray-100 rounded-[5px] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
              <ArrowUpIcon className="w-4 h-4" />
            </button>
            <button className="w-6 h-6 bg-gray-100 rounded-[5px] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
              <PlusCircledIcon className="w-4 h-4" />
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

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setPreviewSrc(reader.result as string)
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
            <img src={previewSrc} alt="Uploaded" className="max-h-[234px] max-w-full rounded" />
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
  const [messages, setMessages] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const draftRef = useRef<HTMLTextAreaElement | null>(null)

  const resize = () => {
    if (!draftRef.current) return
    draftRef.current.style.height = '0px'
    draftRef.current.style.height = draftRef.current.scrollHeight + 'px'
  }

  useEffect(() => {
    resize()
  }, [draft])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, text])
    setDraft('')
    // resize will run from effect
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="w-full h-full p-4 rounded-[10px] tracking-tight flex flex-col">
      {/* Title placeholder (40% opacity) */}
      <div className="text-gray-900/40 mb-2 select-none">
        Plan out your approach with follow-up questions to match your preference
      </div>
      <div className="h-px w-full bg-gray-200/70" />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className="max-w-[85%] rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 shadow-sm">
            {m}
          </div>
        ))}
        {/* Helper text - hidden when more than 1 message exists */}
        {messages.length <= 1 && (
          <div className="text-gray-900/40 text-base select-none">
            If you still have a plan, and want to flesh it out a bit more
          </div>
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