// components/molecules/Frame
'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useFrameStore, Frame as FrameType } from '@/stores/frameStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { FrameProvider } from '@/contexts/FrameContext'
import { contentForKind } from './contentFactory'
import { useConnectionStore } from '@/stores/connectionStore'
import { PlusCircledIcon } from '@radix-ui/react-icons'

interface FrameProps {
  frame: FrameType
  children?: React.ReactNode
}

export default function Frame({ frame, children }: FrameProps) {
  const { updateFrame, selectFrame, bringToFront, deleteFrame, selectFrames, moveSelectedBy, setDraggingForSelected } = useFrameStore()
  const { enterFullscreen } = useWorkspaceStore()
  const { getConnectedComponent, startPending, updatePendingCursor, clearPending, addConnection, hasConnectionBetween, draggingEndpoint, reattachEndpoint, clearDragEndpoint } = useConnectionStore()
  const frameRef = useRef<HTMLDivElement>(null)
  const dragPosRef = useRef<{ x: number; y: number } | null>(null)
  const [showPlus, setShowPlus] = useState(false)
  const [plusPos, setPlusPos] = useState<{ left: number; top: number } | null>(null)
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null)
  
  // Handle frame selection
  const handleFrameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    const isInteractive = !!target.closest('input, textarea, select, button, [contenteditable="true"], [data-scrollable]')
      || !!target.closest('[data-connection-ui]')
    // Component selection behavior
    const componentIds = getConnectedComponent(frame.id)
    if (componentIds.length > 1) {
      const selected = useFrameStore.getState().selectedFrameIds
      const isComponentFullySelected = componentIds.every(id => selected.includes(id))
      if (isComponentFullySelected) {
        selectFrames([frame.id])
      } else {
        selectFrames(componentIds)
      }
    } else {
      selectFrame(frame.id, e.metaKey || e.ctrlKey)
    }
    bringToFront(frame.id)
    if (!isInteractive) {
      // Only focus the frame when not interacting with inner controls
      frameRef.current?.focus()
    }
  }, [frame.id, selectFrame, bringToFront, getConnectedComponent, selectFrames, frame.isSelected])

  // Fullscreen on double click
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const target = e.target as HTMLElement
    const isInteractive = !!target.closest('input, textarea, select, button, [contenteditable="true"], [data-scrollable]')
    if (isInteractive) return
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

        updateFrame(frame.id, { x: newX, y: newY, width: newW, height: newH, isResizing: true })
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
      // Ensure selection matches connected component before dragging
      const componentIds = getConnectedComponent(frame.id)
      if (componentIds.length > 1) {
        selectFrames(componentIds)
      } else {
        selectFrame(frame.id)
      }
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
            const dx = e.movementX
            const dy = e.movementY
            dragPosRef.current.x += dx
            dragPosRef.current.y += dy
            moveSelectedBy(dx, dy)
          }
        } else {
          // If connection UI is active, do not drag
          if (useConnectionStore.getState().pendingFromFrameId || useConnectionStore.getState().draggingEndpoint) {
            return
          }
          const newX = e.clientX - startX
          const newY = e.clientY - startY
          const dx = newX - frame.x
          const dy = newY - frame.y
          moveSelectedBy(dx, dy)
        }
      }
      
      const handleMouseUp = () => {
        setDraggingForSelected(false)
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

  // Touch support for mobile: resize and drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    const touch = e.touches[0]
    if (!touch) return

    // Resize via handle
    if (target.closest('.resize-handle')) {
      e.stopPropagation()
      e.preventDefault()
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
        touchX: touch.clientX,
        touchY: touch.clientY,
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      }
      const minW = 200
      const minH = 150

      const onMove = (ev: TouchEvent) => {
        const t = ev.touches[0]
        if (!t) return
        const dx = t.clientX - start.touchX
        const dy = t.clientY - start.touchY

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

        updateFrame(frame.id, { width: newW, height: newH, x: newX, y: newY, isResizing: true })
      }

      const onEnd = () => {
        updateFrame(frame.id, { isResizing: false })
        document.removeEventListener('touchmove', onMove, { capture: false } as any)
        document.removeEventListener('touchend', onEnd, { capture: false } as any)
      }

      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onEnd)
      return
    }

    // Dragging
    const isInteractive = !!target.closest('input, textarea, select, button, [contenteditable="true"], [data-scrollable]')
    if (!isInteractive && (e.target === frameRef.current || (frameRef.current && frameRef.current.contains(target)))) {
      e.stopPropagation()
      e.preventDefault()
      selectFrame(frame.id)
      bringToFront(frame.id)
      const startX = touch.clientX - frame.x
      const startY = touch.clientY - frame.y

      const onMove = (ev: TouchEvent) => {
        const t = ev.touches[0]
        if (!t) return
        updateFrame(frame.id, { x: t.clientX - startX, y: t.clientY - startY, isDragging: true })
      }

      const onEnd = () => {
        updateFrame(frame.id, { isDragging: false })
        document.removeEventListener('touchmove', onMove, { capture: false } as any)
        document.removeEventListener('touchend', onEnd, { capture: false } as any)
      }

      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onEnd)
    }
  }, [bringToFront, frame.id, frame.x, frame.y, selectFrame, updateFrame])
  
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
    const target = e.target as HTMLElement
    const isInteractive = !!target.closest('input, textarea, select, button, [contenteditable="true"], [data-scrollable]')
    if (!isInteractive && frameRef.current && (e.target === frameRef.current || frameRef.current.contains(e.target as Node))) {
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

  // Detection zones on left/right sides: handlers make the plus icon follow the mouse
  const handleDetectMove = useCallback((side: 'left' | 'right') => (e: React.MouseEvent<HTMLDivElement>) => {
    if (!frameRef.current) return
    const detectRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (e.clientY - detectRect.top) / detectRect.height))
    const topWithin = frame.height * (0.2 + 0.6 * p)
    // Gravitational horizontal offset based on how far the cursor moves outward in the detection band
    const dxRatio = side === 'left'
      ? Math.min(1, Math.max(0, (detectRect.right - e.clientX) / detectRect.width))
      : Math.min(1, Math.max(0, (e.clientX - detectRect.left) / detectRect.width))
    const baseOffset = 12 // starting distance outside the side
    const extra = 28 * dxRatio // move farther out as cursor goes outward
    const left = side === 'left' ? -(baseOffset + extra) : frame.width + (baseOffset + extra)
    setActiveSide(side)
    setShowPlus(true)
    setPlusPos({ left, top: topWithin })
  }, [frame.height, frame.width])

  const handleDetectEnter = useCallback((side: 'left' | 'right') => (e: React.MouseEvent<HTMLDivElement>) => {
    setActiveSide(side)
    setShowPlus(true)
  }, [])

  const handleDetectLeave = useCallback(() => {
    setShowPlus(false)
    setPlusPos(null)
    setActiveSide(null)
  }, [])

  const onPlusMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Use the actual screen coordinates of the icon center as the anchor
    const btn = e.currentTarget as HTMLButtonElement
    const br = btn.getBoundingClientRect()
    const anchor = { x: br.left + br.width / 2, y: br.top + br.height / 2 }
    startPending(frame.id, anchor)
  }, [frame.id, startPending])

  // Pending tracking is handled globally in workspace

  const onFrameMouseUp = useCallback((e: React.MouseEvent) => {
    const state = useConnectionStore.getState()
    if (state.pendingFromFrameId && state.pendingFromFrameId !== frame.id) {
      if (!hasConnectionBetween(state.pendingFromFrameId, frame.id)) {
        addConnection(state.pendingFromFrameId, frame.id)
      }
      clearPending()
    }
  }, [addConnection, clearPending, frame.id, hasConnectionBetween])

  const onFrameMouseUpReattach = useCallback(() => {
    const state = useConnectionStore.getState()
    if (state.draggingEndpoint) {
      reattachEndpoint(state.draggingEndpoint.connectionId, state.draggingEndpoint.endpoint, frame.id)
      clearDragEndpoint()
    }
  }, [reattachEndpoint, frame.id, clearDragEndpoint])
  
  return (
    <div
      ref={frameRef}
      className={`absolute bg-white rounded-lg shadow-lg cursor-move tracking-tight ${frame.isDragging ? 'opacity-80' : ''}`}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        zIndex: frame.zIndex,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: frame.borderColor || (frame.isSelected ? '#3b82f6' : '#d1d5db'),
        boxShadow: frame.isSelected ? '0 0 0 3px rgba(59,130,246,0.25)' : undefined,
      }}
      onClick={handleFrameClick}
      onMouseDown={(e)=>{
        // If interacting with connection UI, do not start dragging the frame
        const target = e.target as HTMLElement
        if (target.closest('[data-connection-ui]')) return
        handleMouseDown(e)
      }}
      onMouseUp={(e)=>{ onFrameMouseUp(e); onFrameMouseUpReattach(); handleContainerMouseUp(e) }}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
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

      {/* Plus handle for connection creation */}
      {showPlus && plusPos && (
        <button
          className="absolute pointer-events-auto cursor-grab bg-transparent"
          style={{ left: plusPos.left, top: plusPos.top, width: 24, height: 24, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
          onMouseDown={onPlusMouseDown}
          title="Connect"
          data-connection-ui
        >
          <PlusCircledIcon className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Detection zones (left/right), only middle 60% vertical band */}
      <div
        className="absolute cursor-grab"
        style={{ left: -48, width: 48, top: frame.height * 0.2, height: frame.height * 0.6, zIndex: 15 }}
        onMouseEnter={handleDetectEnter('left')}
        onMouseMove={handleDetectMove('left')}
        onMouseLeave={handleDetectLeave}
        onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation() }}
        data-connection-ui
      />
      <div
        className="absolute cursor-grab"
        style={{ right: -48, width: 48, top: frame.height * 0.2, height: frame.height * 0.6, zIndex: 15 }}
        onMouseEnter={handleDetectEnter('right')}
        onMouseMove={handleDetectMove('right')}
        onMouseLeave={handleDetectLeave}
        onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation() }}
        data-connection-ui
      />
    </div>
  )
}
