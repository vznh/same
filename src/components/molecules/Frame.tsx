// components/molecules/Frame
'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useFrameStore, Frame as FrameType } from '@/stores/frameStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { FrameProvider } from '@/contexts/FrameContext'
import { contentForKind } from './contentFactory'

interface FrameProps {
  frame: FrameType
  children?: React.ReactNode
}

export default function Frame({ frame, children }: FrameProps) {
  const { updateFrame, selectFrame, bringToFront, deleteFrame } = useFrameStore()
  const { enterFullscreen } = useWorkspaceStore()
  const frameRef = useRef<HTMLDivElement>(null)
  const dragPosRef = useRef<{ x: number; y: number } | null>(null)
  
  // Handle frame selection
  const handleFrameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectFrame(frame.id, e.metaKey || e.ctrlKey)
    bringToFront(frame.id)
    // Ensure the frame receives keyboard focus for in-frame actions/scrolling
    frameRef.current?.focus()
  }, [frame.id, selectFrame, bringToFront])

  // Fullscreen on double click
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Respect frames that should not enter fullscreen (e.g., placeholders)
    if ((frame as any).flags?.disableFullscreen) return
    enterFullscreen(frame.id)
  }, [enterFullscreen, frame.id])

  // Fullscreen when double-clicking the floating label
  const handleLabelDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if ((frame as any).flags?.disableFullscreen) return
    enterFullscreen(frame.id)
  }, [enterFullscreen, frame.id])

  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent drag from initiating when the label is the target
    e.stopPropagation()
  }, [])
  
    // Handle dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Handle resizing
      if (target.closest('.resize-handle')) {
      e.stopPropagation()
      selectFrame(frame.id)
      bringToFront(frame.id)

      const handleEl = target.closest('.resize-handle') as HTMLElement
      const dir = handleEl?.dataset?.dir as
        | 'right'
        | 'left'
        | 'bottom'
        | 'top'
        | 'bottom-right'
        | 'bottom-left'
        | 'top-right'
        | 'top-left'
        | undefined

      const start = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      }
      const minW = 200
      const minH = 150

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - start.mouseX
        const dy = e.clientY - start.mouseY

        let newX = start.x
        let newY = start.y
        let newW = start.width
        let newH = start.height

        switch (dir) {
          case 'right':
            newW = Math.max(minW, start.width + dx)
            break
          case 'left':
            newW = Math.max(minW, start.width - dx)
            newX = start.x + Math.min(dx, start.width - minW)
            break
          case 'bottom':
            newH = Math.max(minH, start.height + dy)
            break
          case 'top':
            newH = Math.max(minH, start.height - dy)
            newY = start.y + Math.min(dy, start.height - minH)
            break
          case 'bottom-right':
            newW = Math.max(minW, start.width + dx)
            newH = Math.max(minH, start.height + dy)
            break
          case 'bottom-left':
            newW = Math.max(minW, start.width - dx)
            newX = start.x + Math.min(dx, start.width - minW)
            newH = Math.max(minH, start.height + dy)
            break
          case 'top-right':
            newW = Math.max(minW, start.width + dx)
            newH = Math.max(minH, start.height - dy)
            newY = start.y + Math.min(dy, start.height - minH)
            break
          case 'top-left':
            newW = Math.max(minW, start.width - dx)
            newX = start.x + Math.min(dx, start.width - minW)
            newH = Math.max(minH, start.height - dy)
            newY = start.y + Math.min(dy, start.height - minH)
            break
          default:
            break
        }

        updateFrame(frame.id, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
          isResizing: true,
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
    const isInteractive = !!target.closest('input, textarea, select, button, [contenteditable="true"], [data-scrollable]')
    if (!isInteractive && (e.target === frameRef.current || (frameRef.current && frameRef.current.contains(target)))) {
      e.stopPropagation()
      selectFrame(frame.id)
      bringToFront(frame.id)
      // Ensure the frame receives keyboard focus for Backspace/Delete handling
      frameRef.current?.focus()
      // Enable pointer lock for drag so cursor doesn't travel
      if (frameRef.current && frameRef.current.requestPointerLock) {
        try { frameRef.current.requestPointerLock() } catch {}
      }
      dragPosRef.current = { x: frame.x, y: frame.y }
      
      const startX = e.clientX - frame.x
      const startY = e.clientY - frame.y
      
      const handleMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement) {
          if (dragPosRef.current) {
            dragPosRef.current.x += e.movementX
            dragPosRef.current.y += e.movementY
            updateFrame(frame.id, {
              x: dragPosRef.current.x,
              y: dragPosRef.current.y,
              isDragging: true
            })
          }
        } else {
          updateFrame(frame.id, {
            x: e.clientX - startX,
            y: e.clientY - startY,
            isDragging: true
          })
        }
      }
      
      const handleMouseUp = () => {
        updateFrame(frame.id, { isDragging: false })
        if (document.pointerLockElement) {
          try { document.exitPointerLock() } catch {}
        }
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else if (isInteractive) {
      // Do not initiate dragging when interacting with scrollable or form elements
      return
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
        return 'Planning'
    }
  }
  
  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(frame.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle) {
      requestAnimationFrame(() => titleInputRef.current?.focus())
    }
  }, [isEditingTitle])

  const startEditTitle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setTitleDraft(frame.title)
    setIsEditingTitle(true)
  }, [frame.title])

  const commitTitle = useCallback(() => {
    const next = titleDraft.trim()
    if (next && next !== frame.title) {
      updateFrame(frame.id, { title: next })
    }
    setIsEditingTitle(false)
  }, [titleDraft, frame.id, frame.title, updateFrame])

  const handleTitleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditingTitle(false)
      setTitleDraft(frame.title)
    }
  }

  // Keep focus after mouse interactions within the frame
  const handleContainerMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (frameRef.current && (e.target === frameRef.current || frameRef.current.contains(e.target as Node))) {
      frameRef.current.focus()
    }
  }, [])

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
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleContainerMouseUp}
      onKeyDown={handleKeyDown}
      data-frame
      tabIndex={0}
    >
      {/* Floating label outside top-left of frame */}
      <div className="absolute -top-6 left-0 text-sm font-medium text-gray-500 flex items-center gap-2">
        <span
          className="cursor-pointer"
          onDoubleClick={handleLabelDoubleClick}
          onMouseDown={handleLabelMouseDown}
        >
          {getFloatingLabel()}
        </span>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            className="opacity-60 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-500 cursor-text"
          />
        ) : (
          frame.title && (
            <span className="opacity-60 cursor-text" onDoubleClick={startEditTitle}>
              {frame.title}
            </span>
          )
        )}
      </div>
      
      {/* Frame Content */}
      <div className="w-full h-full p-4 overflow-visible">
        <FrameProvider frameId={frame.id}>
          {children || frame.content || contentForKind(frame.type)}
        </FrameProvider>
      </div>
      
      {/* Resize Handles (sides + corners) */}
      {/* Sides */}
      <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize resize-handle" data-dir="left" />
      <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize resize-handle" data-dir="right" />
      <div className="absolute inset-x-0 top-0 h-2 cursor-ns-resize resize-handle" data-dir="top" />
      <div className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize resize-handle" data-dir="bottom" />
      {/* Corners (slightly larger for easier hit area) */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize resize-handle" data-dir="bottom-right" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize resize-handle" data-dir="bottom-left" />
      <div className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize resize-handle" data-dir="top-right" />
      <div className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize resize-handle" data-dir="top-left" />
    </div>
  )
}
