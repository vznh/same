'use client'

import { ImageIcon, PlusIcon, ChatBubbleIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type FloatingToolbarProps = {
  onImageClick?: () => void
  onAddClick?: (pos: { x: number; y: number }) => void
  onHistoryClick?: () => void
  onChatClick?: () => void
}

export default function FloatingToolbar({
  onImageClick,
  onAddClick,
  onHistoryClick,
  onChatClick,
}: FloatingToolbarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const helpParagraphs: string[] = [
    'Hello Same :^)',
    'You can pan around by dragging, or if you\'re on trackpad, use two fingers. You can also pinch to zoom in, or use +/-.',
    'Start creating by holding down on any empty space or pressing the Plus button. You can add an image, generate components using the Text frame, and connect them all together to build a website with all of those components in context.',
    "Connecting for context is easy - hover around the side until you have a cursor-grab, and drag the line to any frame you desire. Or, if it's a bit buggy, use the chat to connect any frame together.",
    'You can create, ask about frame content, resize frames, delete frames using \u003cstrong\u003eBackspace\u003c/strong\u003e,  and update frames using the Chat.',
    'Hope to see you soon!',
    'Jason',
  ]
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isHelpOpen) {
      setVisibleCount(0)
      return
    }
    let i = 0
    const timers: number[] = []
    for (i = 0; i < helpParagraphs.length; i++) {
      timers.push(window.setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 1, helpParagraphs.length))
      }, 500 * (i + 1)))
    }
    return () => { timers.forEach((t) => window.clearTimeout(t)) }
  }, [isHelpOpen])
  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="relative w-[280px] sm:w-[520px] h-14 sm:h-16 flex items-center justify-center">
        {/* Bar background */}
        <div className="absolute inset-0 rounded-[16px] bg-black/10 translate-y-12" />

        {/* Icon row - slightly above the bar */}
        <div className="relative z-10 flex items-center gap-10 sm:gap-20 pointer-events-auto -translate-y-3 sm:-translate-y-4">
          {/* Image */}
          <div className="relative group">
            <button
              aria-label="Image"
              onClick={onImageClick}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900"
            >
              <Image priority src={"/same.png"} alt={"Same's logo."} width={30} height={30} className="sm:hidden" />
              <Image src={"/same.png"} alt={"Same's logo."} width={39} height={39} className="hidden sm:block" />
            </button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Performs nothing.</div>
          </div>

          {/* Add */}
          <div className="relative group">
            <button
              aria-label="Add"
              onClick={(e) => {
                if (!onAddClick) return
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                onAddClick({ x: rect.left + rect.width / 2, y: rect.top })
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-gray-300/70 hover:bg-gray-300 text-gray-800 flex items-center justify-center shadow-sm"
            >
              <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Add</div>
          </div>

          {/* Help */}
          <div className="relative group">
            <button
              aria-label="Help"
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900"
            >
              <QuestionMarkCircledIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Help</div>
          </div>

          {/* Chat */}
          <div className="relative group">
            <button
              aria-label="Chat"
              onClick={onChatClick}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900"
            >
              <ChatBubbleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Chat</div>
          </div>
        </div>
      </div>
      {/* Help dialog */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsHelpOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-800">Help</div>
                <button className="text-xs text-gray-600 hover:text-gray-900" onClick={() => setIsHelpOpen(false)}>Close</button>
              </div>
              <div className="space-y-3">
                {helpParagraphs.map((p, idx) => (
                  <div
                    key={idx}
                    className={`text-sm text-gray-800 transition-opacity duration-500 ${idx < visibleCount ? 'opacity-100' : 'opacity-10'}`}
                    style={{ transitionDelay: `${0}ms` }}
                    dangerouslySetInnerHTML={{ __html: p }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

