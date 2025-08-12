'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFrameStore } from '@/stores/frameStore'
import { 
  ImageIcon, 
  TextIcon, 
  LayersIcon,
  CubeIcon
} from '@radix-ui/react-icons'
import { 
  TextFrameContent, 
  ImageFrameContent, 
  CustomFrameContent, 
  PlanFrameContent
} from './FrameContent'

interface ContextMenuProps {
  isVisible: boolean
  position: { x: number; y: number }
  screenPosition: { x: number; y: number }
  onClose: () => void
}

interface MenuOption {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  frameType: 'image' | 'text' | 'component' | 'plan'
}

const MENU_OPTIONS: MenuOption[] = [
  {
    id: 'image',
    title: 'Start from image',
    subtitle: 'Generate components using an image from reference',
    icon: <ImageIcon className="w-5 h-5" />,
    frameType: 'image'
  },
  {
    id: 'text',
    title: 'Start from text',
    subtitle: 'Generate and edit from text',
    icon: <TextIcon className="w-5 h-5" />,
    frameType: 'text'
  },
  {
    id: 'plan',
    title: 'Start from planning',
    subtitle: 'Plan, iterate, and draft step-by-step',
    icon: <CubeIcon className="w-5 h-5" />,
    frameType: 'plan'
  }
]

const ContextMenu = ({ isVisible, position, screenPosition, onClose }: ContextMenuProps) => {
  const { addFrame } = useFrameStore()
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate menu position (menu's bottom-left corner slightly offset from cursor)
  const menuPosition = {
    left: screenPosition.x + 10, // 10px to the right of cursor
    top: screenPosition.y - 140, // 140px above cursor so bottom-left of menu is near cursor
  }

  // Handle frame creation
  const handleOptionClick = useCallback((option: MenuOption) => {
    // Get the appropriate content component based on frame type
    let content
    switch (option.frameType) {
      case 'text':
        content = <TextFrameContent />
        break
      case 'image':
        content = <ImageFrameContent />
        break
      case 'plan':
        content = <PlanFrameContent />
        break
      case 'component':
        content = <CustomFrameContent />
        break
      default:
        content = <div className="p-4 text-gray-600">New {option.frameType} frame</div>
    }
    
    // Create frame at the original mouse click position
    addFrame({
      title: `${option.title} Frame`,
      x: position.x - 200, // Center frame on cursor
      y: position.y - 150, // Center frame on cursor
      width: 450, // Increased width to better fit content
      height: 350, // Increased height to better fit content
      content,
      // Persist correct kind so content restores after refresh
      type: option.frameType === 'component' ? 'custom' : option.frameType
    })
    
    onClose()
  }, [position, addFrame, onClose])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={menuRef}
          className="fixed z-50"
          style={menuPosition}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="bg-white rounded-[10px] shadow-lg border border-gray-200 py-3 min-w-[280px]">
            {/* Title */}
            <div className="px-4 pb-2 border-b border-gray-100">
              <h3 className="text-xs opacity-40 tracking-tight">
                Add Frame
              </h3>
            </div>
            
            {/* Options */}
            <div className="py-1">
              {MENU_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-start space-x-3 group"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-gray-100 transition-colors">
                    {option.icon}
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 tracking-tight group-hover:text-gray-900">
                      {option.title}
                    </div>
                    <div className="text-xs text-gray-500 tracking-tight mt-0.5">
                      {option.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ContextMenu 