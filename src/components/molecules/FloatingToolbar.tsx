'use client'

import { ImageIcon, PlusIcon, CounterClockwiseClockIcon, ChatBubbleIcon } from '@radix-ui/react-icons'
import Image from 'next/image'

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
              <Image src={"/same.png"} alt={"Same's logo."} width={30} height={30} className="sm:hidden" />
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

          {/* History */}
          <div className="relative group">
            <button
              aria-label="History"
              onClick={onHistoryClick}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900"
            >
              <CounterClockwiseClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-2 py-1 rounded bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">History</div>
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
    </div>
  )
}

