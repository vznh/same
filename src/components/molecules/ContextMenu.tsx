// components/molecules/ContextMenu
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ImageIcon, 
  TextIcon, 
  CubeIcon 
} from '@radix-ui/react-icons'

interface ContextMenuProps {
  isVisible: boolean
  x: number
  y: number
  onCreateTextFrame: () => void
  onCreateImageFrame: () => void
  onCreateCustomFrame: () => void
}

export default function ContextMenu({ 
  isVisible, 
  x, 
  y, 
  onCreateTextFrame, 
  onCreateImageFrame, 
  onCreateCustomFrame 
}: ContextMenuProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50"
          style={{
            left: x + 10, // Offset to the right of cursor
            top: y - 10,  // Slight offset above cursor
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.1,
            ease: "easeOut"
          }}
        >
          <div 
            className="context-menu bg-[#F2F2F2] bg-opacity-40 backdrop-blur-sm rounded-[10px] p-4 border border-gray-200 shadow-lg"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Frame</h3>
            
            <div className="space-y-3">
              {/* Start from image */}
              <button
                onClick={onCreateImageFrame}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Start from image</div>
                  <div className="text-xs text-gray-500">Generate components using an image from reference</div>
                </div>
              </button>

              {/* Start from text */}
              <button
                onClick={onCreateTextFrame}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <TextIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Start from text</div>
                  <div className="text-xs text-gray-500">Generate and edit from text</div>
                </div>
              </button>

              {/* Start from planning */}
              <button
                onClick={onCreateCustomFrame}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <CubeIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Start from planning</div>
                  <div className="text-xs text-gray-500">Plan, iterate, and draft step-by-step</div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 