// components/molecules/Frame
'use client'

import { useRef, useCallback, useState } from 'react'
import { useFrameStore, Frame as FrameType } from '@/stores/frameStore'

interface FrameProps {
  frame: FrameType
  children?: React.ReactNode
}

export default function Frame({ frame, children }: FrameProps) {
  const { updateFrame, selectFrame, deleteFrame, bringToFront } = useFrameStore()
  const frameRef = useRef<HTMLDivElement>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(frame.title)
  
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
    
    // Handle dragging
    if (e.target === frameRef.current || target.closest('.frame-titlebar')) {
      e.stopPropagation()
      selectFrame(frame.id)
      bringToFront(frame.id)
      
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
  
  // Handle title editing
  const handleTitleDoubleClick = useCallback(() => {
    setIsEditingTitle(true)
  }, [])
  
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value)
  }, [])
  
  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false)
    if (titleValue.trim() !== frame.title) {
      updateFrame(frame.id, { title: titleValue.trim() || 'Untitled' })
    }
  }, [titleValue, frame.title, frame.id, updateFrame])
  
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur()
    } else if (e.key === 'Escape') {
      setTitleValue(frame.title)
      setIsEditingTitle(false)
    }
  }, [handleTitleBlur, frame.title])
  
  // Handle delete
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    deleteFrame(frame.id)
  }, [frame.id, deleteFrame])
  
  return (
    <div
      ref={frameRef}
      className={`absolute bg-white border-2 rounded-lg shadow-lg cursor-move ${
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
    >
      {/* Title Bar */}
      <div className="frame-titlebar flex items-center justify-between bg-gray-100 px-3 py-2 rounded-t-lg border-b border-gray-300">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-700"
              autoFocus
            />
          ) : (
            <div
              className="text-sm font-medium text-gray-700 truncate cursor-text"
              onDoubleClick={handleTitleDoubleClick}
              title="Double-click to edit title"
            >
              {frame.title}
            </div>
          )}
        </div>
        
        {/* Frame Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleDelete}
            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete frame"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Frame Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {children || frame.content}
      </div>
      
      {/* Resize Handles */}
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
        <div className="w-full h-full bg-blue-500 opacity-0 hover:opacity-100 transition-opacity rounded-bl-lg" />
      </div>
    </div>
  )
}
