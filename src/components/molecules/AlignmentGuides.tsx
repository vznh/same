// components/molecules/AlignmentGuides
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlignmentGuide } from '@/utils/gridSnapping'

interface AlignmentGuidesProps {
  guides: AlignmentGuide[]
  visible: boolean
}

export default function AlignmentGuides({ guides, visible }: AlignmentGuidesProps) {
  if (!visible || guides.length === 0) return null
  
  return (
    <AnimatePresence>
      {guides.map((guide, index) => (
        <motion.div
          key={`${guide.frameId}-${guide.type}-${index}`}
          className="absolute pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            left: guide.x ? guide.x - 1 : 0,
            top: guide.y ? guide.y - 1 : 0,
            width: guide.type === 'vertical' ? 2 : '100vw',
            height: guide.type === 'horizontal' ? 2 : '100vh',
            backgroundColor: '#3B82F6',
          }}
        />
      ))}
    </AnimatePresence>
  )
} 