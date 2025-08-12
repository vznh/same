// components/molecules/Frame
'use client'

import { useRef, useCallback } from 'react'
import { useFrameStore, Frame as FrameType } from '@/stores/frameStore'

interface FrameProps {
  frame: FrameType
  children?: React.ReactNode
}

export default function Frame({ frame, children }: FrameProps) {
  const { updateFrame, selectFrame, bringToFront, deleteFrame } = useFrameStore()
  const frameRef = useRef<HTMLDivElement>(null)
  
  // Handle frame selection
  const handleFrameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectFrame(frame.id, e.metaKey || e.ctrlKey)
    bringToFront(frame.id)
  }, [frame.id, selectFrame, bringToFront])
  
    // Handle dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Handle resizing
      if (target.closest('.resize-handle')) {
      e.stopPropagation()
      selectFrame(frame.id)
      bringToFront(frame.id)
      
      const startX = e.clientX
      const startY = e.clientY
      const startWidth = frame.width
      const startHeight = frame.height
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY
        
        const newWidth = Math.max(200, startWidth + deltaX)
        const newHeight = Math.max(150, startHeight + deltaY)
        
        updateFrame(frame.id, {
          width: newWidth,
          height: newHeight,
          isResizing: true
        })
      }
      
      const handleMouseUp = () => {
        updateFrame(frame.id, { isResizing: false })
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return
    }
    
    // Handle dragging (clicking on the frame or non-interactive descendants)
    const isInteractive = !!target.closest('input, textarea, button, [contenteditable="true"]')
    if (!isInteractive && (e.target === frameRef.current || (frameRef.current && frameRef.current.contains(target)))) {
      e.stopPropagation()
      selectFrame(frame.id)
      bringToFront(frame.id)
      // Ensure the frame receives keyboard focus for Backspace/Delete handling
      frameRef.current?.focus()
      
      const startX = e.clientX - frame.x
      const startY = e.clientY - frame.y
      
      const handleMouseMove = (e: MouseEvent) => {
        updateFrame(frame.id, {
          x: e.clientX - startX,
          y: e.clientY - startY,
          isDragging: true
        })
      }
      
      const handleMouseUp = () => {
        updateFrame(frame.id, { isDragging: false })
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }, [frame.id, frame.x, frame.y, frame.width, frame.height, selectFrame, bringToFront, updateFrame])
  
  // Derive floating label from frame type
  const getFloatingLabel = (): string => {
    switch (frame.type) {
      case 'text':
        return 'Text'
      case 'image':
        return 'Image'
      case 'browser':
        return 'Browser'
      case 'custom':
      default:
        return 'Component'
    }
  }
  
  // Keyboard handling for delete when frame is focused
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Only delete if this frame has focus
      if (document.activeElement === frameRef.current) {
        e.preventDefault()
        deleteFrame(frame.id)
      }
    }
  }, [deleteFrame, frame.id])
  
  return (
    <div
      ref={frameRef}
      className={`absolute bg-white border-2 rounded-lg shadow-lg cursor-move tracking-tight ${
        frame.isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-300 hover:border-gray-400'
      } ${frame.isDragging ? 'opacity-80' : ''}`}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        zIndex: frame.zIndex,
      }}
      onClick={handleFrameClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      data-frame
      tabIndex={0}
    >
      {/* Floating label outside top-left of frame */}
      <div className="absolute -top-6 left-0 text-sm font-medium text-gray-500 pointer-events-none">
        {getFloatingLabel()}
      </div>
      
      {/* Frame Content */}
      <div className="w-full h-full p-4 overflow-visible">
        {children || frame.content}
      </div>
      
      {/* Resize Handles */}
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize resize-handle">
        <div className="w-full h-full bg-blue-500 opacity-0 hover:opacity-100 transition-opacity rounded-bl-lg" />
      </div>
    </div>
  )
}
