// components/elements/FramePlaceholder
'use client'

import { motion } from 'framer-motion'

interface FramePlaceholderProps {
  title?: string
  description?: string
}

export default function FramePlaceholder({ 
  title = "Frame", 
  description = "Double-click to edit content" 
}: FramePlaceholderProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full text-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </motion.div>
  )
} 