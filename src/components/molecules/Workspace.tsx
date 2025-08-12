// components/molecules/Workspace
'use client'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFrameStore } from '@/stores/frameStore'
import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { AspectRatioIcon } from '@radix-ui/react-icons'
import Frame from './Frame'
import ConnectionsLayer from './ConnectionsLayer'
import ContextMenu from './ContextMenu'
import Placeholder from './Placeholder'
import { useConnectionStore } from '@/stores/connectionStore'
import AgentModal from './AgentModal'
import FloatingToolbar from './FloatingToolbar'
import { FrameProvider } from '@/contexts/FrameContext'
import { contentForKind } from './contentFactory'
import { 
  TextFrameContent, 
  ImageFrameContent, 
  CustomFrameContent,
  HTMLFrameContent 
} from './FrameContent'

export default function Workspace() {
  const { mode, zoom, panX, panY, setZoom, setPan, isFullscreen, fullscreenFrameId, fullscreenAspect, exitFullscreen, setFullscreenAspect } = useWorkspaceStore()
  const [fsWidth, setFsWidth] = useState<number>(0)
  const [fsHeight, setFsHeight] = useState<number>(0)

  // Compute fitted fullscreen box on aspect change or resize
  const recomputeFullscreenBox = useCallback(() => {
    const vw = Math.max(0, window.innerWidth)
    const vh = Math.max(0, window.innerHeight)
    const maxW = vw * 0.9
    const maxH = vh * 0.85
    const [rw, rh] = fullscreenAspect === '16:9' ? [16, 9] : fullscreenAspect === '4:3' ? [4, 3] : [9, 16]
    // Fit inside maxW x maxH preserving ratio
    const widthByH = maxH * (rw / rh)
    const heightByW = maxW * (rh / rw)
    if (widthByH <= maxW) {
      setFsWidth(widthByH)
      setFsHeight(maxH)
    } else {
      setFsWidth(maxW)
      setFsHeight(heightByW)
    }
  }, [fullscreenAspect])

  useEffect(() => {
    if (!isFullscreen) return
    recomputeFullscreenBox()
    const onResize = () => recomputeFullscreenBox()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isFullscreen, fullscreenAspect, recomputeFullscreenBox])
  const { frames, addFrame, clearSelection } = useFrameStore()
  const { selectConnection, removeConnection, selectedConnectionId, startPending, clearPending, updatePendingCursor, connections } = useConnectionStore()
  const workspaceRef = useRef<HTMLDivElement>(null)
  
  const [isPanning, setIsPanning] = useState(false)
  const [isDraggingFrame, setIsDraggingFrame] = useState(false)
  const [isAgentOpen, setIsAgentOpen] = useState(false)
  
  // Pan boundary states
  const [boundaryFadeOpacity, setBoundaryFadeOpacity] = useState(0)
  const [boundaryDirection, setBoundaryDirection] = useState<'none' | 'left' | 'right' | 'top' | 'bottom'>('none')
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    position: { x: number; y: number }
    screenPosition: { x: number; y: number }
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    screenPosition: { x: 0, y: 0 }
  })
  
  // Mouse hold detection
  const mouseHoldTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMouseDownRef = useRef(false)
  
  // Touch long-press detection (mobile)
  const touchHoldTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isTouchActiveRef = useRef(false)
  
  // Pan boundaries configuration
  const PAN_BOUNDARIES = {
    minX: -800,
    maxX: 800,
    minY: -600,
    maxY: 600,
    fadeDistance: 200, // Distance from boundary where fade starts
  }
  
  // Constrained pan function with smooth boundaries
  const constrainedPan = useCallback((newPanX: number, newPanY: number) => {
    let constrainedX = newPanX
    let constrainedY = newPanY
    let fadeOpacity = 0
    let direction: 'none' | 'left' | 'right' | 'top' | 'bottom' = 'none'
    
    // X-axis constraints
    if (newPanX < PAN_BOUNDARIES.minX) {
      constrainedX = PAN_BOUNDARIES.minX
      if (newPanX < PAN_BOUNDARIES.minX + PAN_BOUNDARIES.fadeDistance) {
        fadeOpacity = Math.max(0, (PAN_BOUNDARIES.minX + PAN_BOUNDARIES.fadeDistance - newPanX) / PAN_BOUNDARIES.fadeDistance * 0.3)
        direction = 'left'
      }
    } else if (newPanX > PAN_BOUNDARIES.maxX) {
      constrainedX = PAN_BOUNDARIES.maxX
      if (newPanX > PAN_BOUNDARIES.maxX - PAN_BOUNDARIES.fadeDistance) {
        fadeOpacity = Math.max(0, (newPanX - (PAN_BOUNDARIES.maxX - PAN_BOUNDARIES.fadeDistance)) / PAN_BOUNDARIES.fadeDistance * 0.3)
        direction = 'right'
      }
    }
    
    // Y-axis constraints
    if (newPanY < PAN_BOUNDARIES.minY) {
      constrainedY = PAN_BOUNDARIES.minY
      if (newPanY < PAN_BOUNDARIES.minY + PAN_BOUNDARIES.fadeDistance) {
        fadeOpacity = Math.max(fadeOpacity, (PAN_BOUNDARIES.minY + PAN_BOUNDARIES.fadeDistance - newPanY) / PAN_BOUNDARIES.fadeDistance * 0.3)
        direction = direction === 'none' ? 'top' : direction
      }
    } else if (newPanY > PAN_BOUNDARIES.maxY) {
      constrainedY = PAN_BOUNDARIES.maxY
      if (newPanY > PAN_BOUNDARIES.maxY - PAN_BOUNDARIES.fadeDistance) {
        fadeOpacity = Math.max(fadeOpacity, (newPanY - (PAN_BOUNDARIES.maxY - PAN_BOUNDARIES.fadeDistance)) / PAN_BOUNDARIES.fadeDistance * 0.3)
        direction = direction === 'none' ? 'bottom' : direction
      }
    }
    
    // Update boundary fade state
    setBoundaryFadeOpacity(fadeOpacity)
    setBoundaryDirection(direction)
    
    // Apply constrained pan
    setPan(constrainedX, constrainedY)
  }, [setPan])
  
  // Monitor frame dragging state
  useEffect(() => {
    const anyFrameDragging = frames.some(frame => frame.isDragging)
    if (anyFrameDragging && !isDraggingFrame) {
      setIsDraggingFrame(true)
    } else if (!anyFrameDragging && isDraggingFrame) {
      setIsDraggingFrame(false)
    }
  }, [frames, isDraggingFrame])
  
  // Trackpad panning and cursor origin zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    // Always prevent default to stop browser navigation (back/forward tabs)
    e.preventDefault()
    
    // Check if this is a trackpad pan (deltaX/deltaY) vs zoom (deltaY only)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaX) > 0) {
      // This is a trackpad pan gesture
      const panSensitivity = 1.5
      const newPanX = panX - e.deltaX * panSensitivity
      const newPanY = panY - e.deltaY * panSensitivity
      
      // Use constrained pan
      constrainedPan(newPanX, newPanY)
      
      // Set panning state
      setIsPanning(true)
      
      // Reset panning state after a short delay
      setTimeout(() => setIsPanning(false), 150)
      return
    }
    
    // This is a zoom gesture - zoom towards cursor position, but ignore when hovering a scrollable area
    const target = e.target as HTMLElement
    const isOverScrollable = !!target.closest('[data-scrollable]')
    if (isOverScrollable) {
      return // let the inner area handle the wheel
    }

    const delta = e.deltaY > 0 ? 0.98 : 1.02 // lower sensitivity
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta))
    
    // Zoom towards mouse cursor position
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate new pan to keep cursor position stable
      const scaleRatio = newZoom / zoom
      const newPanX = mouseX - (mouseX - panX) * scaleRatio
      const newPanY = mouseY - (mouseY - panY) * scaleRatio
      
      setZoom(newZoom)
      constrainedPan(newPanX, newPanY)
    }
  }, [zoom, panX, panY, setZoom, constrainedPan])
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs/textareas/contenteditable inside frames
    const target = e.target as HTMLElement | null
    if (target) {
      const isTyping = target.closest('input, textarea, [contenteditable="true"]') !== null
      if (isTyping) return
    }
    const panAmount = 50
    const zoomAmount = 0.1
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        constrainedPan(panX, panY + panAmount)
        break
      case 'ArrowDown':
        e.preventDefault()
        constrainedPan(panX, panY - panAmount)
        break
      case 'ArrowLeft':
        e.preventDefault()
        constrainedPan(panX + panAmount, panY)
        break
      case 'ArrowRight':
        e.preventDefault()
        constrainedPan(panX - panAmount, panY)
        break
      case '=':
      case '+':
        e.preventDefault()
        setZoom(Math.min(5, zoom + zoomAmount))
        break
      case '-':
        e.preventDefault()
        setZoom(Math.max(0.1, zoom - zoomAmount))
        break
      case '0':
        e.preventDefault()
        setZoom(1)
        constrainedPan(0, 0)
        break
      case ' ':
        e.preventDefault()
        setZoom(1)
        constrainedPan(0, 0)
        break
    }
  }, [panX, panY, zoom, setZoom, constrainedPan])

  // Track cursor globally for pending connection and endpoint dragging
  useEffect(() => {
    const onMove = (e: MouseEvent) => updatePendingCursor(e.clientX, e.clientY)
    const onUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const isOverFrame = !!target?.closest('[data-frame]')
      // Only clear if the mouseup is NOT over a frame; otherwise, let the frame handle connection creation
      if (!isOverFrame) {
        clearPending()
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [updatePendingCursor, clearPending])
  
  // Frame creation functions - spawn frames in visible center area
  const createTextFrame = useCallback(() => {
    addFrame({
      title: 'Text Frame',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      content: <TextFrameContent />,
      type: 'text'
    })
  }, [addFrame])
  
  const createImageFrame = useCallback(() => {
    addFrame({
      title: 'Image Frame',
      x: 400,
      y: 50,
      width: 250,
      height: 200,
      content: <ImageFrameContent />,
      type: 'image'
    })
  }, [addFrame])
  
  const createBrowserFrame = useCallback(() => {
    addFrame({
      title: 'HTML Frame',
      x: 50,
      y: 300,
      width: 400,
      height: 300,
      content: <HTMLFrameContent />,
      type: 'custom'
    })
  }, [addFrame])
  
  const createCustomFrame = useCallback(() => {
    addFrame({
      title: 'Custom Frame',
      x: 500,
      y: 300,
      width: 250,
      height: 200,
      content: <CustomFrameContent />,
      type: 'custom'
    })
  }, [addFrame])
  
  const createHTMLFrame = useCallback(() => {
    addFrame({
      title: 'HTML Frame',
      x: 250,
      y: 150,
      width: 350,
      height: 250,
      content: <HTMLFrameContent />,
      type: 'custom'
    })
  }, [addFrame])
  
  // Mouse event handlers for context menu
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Open context menu when holding on empty canvas (not a frame or connection)
    const target = e.target as HTMLElement | null
    const isOnFrame = !!target?.closest('[data-frame]')
    const isOnConnection = !!target?.closest('[data-connection]')
    const isCanvasArea = target === workspaceRef.current || (!isOnFrame && !isOnConnection)
    if (e.button === 2 || isCanvasArea) {
      isMouseDownRef.current = true
      
      // Start 500ms timer for context menu
      mouseHoldTimerRef.current = setTimeout(() => {
        if (isMouseDownRef.current) {
          // Calculate workspace-relative position
          const rect = workspaceRef.current?.getBoundingClientRect()
          if (rect) {
            const workspaceX = (e.clientX - rect.left - panX) / zoom
            const workspaceY = (e.clientY - rect.top - panY) / zoom
            
            setContextMenu({
              isVisible: true,
              position: { x: workspaceX, y: workspaceY },
              screenPosition: { x: e.clientX, y: e.clientY }
            })
          }
        }
      }, 500)
    }
  }, [panX, panY, zoom])
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    isMouseDownRef.current = false
    if (mouseHoldTimerRef.current) {
      clearTimeout(mouseHoldTimerRef.current)
      mouseHoldTimerRef.current = null
    }
  }, [])
  
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault() // Prevent default context menu
  }, [])

  // Global key handling for deleting selected connection when focus is on canvas
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedConnectionId) {
        e.preventDefault()
        removeConnection(selectedConnectionId)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [removeConnection, selectedConnectionId])
  
  const closeContextMenu = useCallback(() => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, screenPosition: { x: 0, y: 0 } })
  }, [])

  // Helper to open context menu at a specific screen coordinate
  const openContextMenuAtScreen = useCallback((screenX: number, screenY: number) => {
    const rect = workspaceRef.current?.getBoundingClientRect()
    if (!rect) return
    const workspaceX = (screenX - rect.left - panX) / zoom
    const workspaceY = (screenY - rect.top - panY) / zoom
    setContextMenu({
      isVisible: true,
      position: { x: workspaceX, y: workspaceY },
      screenPosition: { x: screenX, y: screenY },
    })
  }, [panX, panY, zoom])

  // Touch handlers for long-press context menu on mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!workspaceRef.current) return
    if (e.touches.length !== 1) return
    isTouchActiveRef.current = true
    const touch = e.touches[0]
    const rect = workspaceRef.current.getBoundingClientRect()
    const workspaceX = (touch.clientX - rect.left - panX) / zoom
    const workspaceY = (touch.clientY - rect.top - panY) / zoom
    
    touchHoldTimerRef.current = setTimeout(() => {
      if (isTouchActiveRef.current) {
        setContextMenu({
          isVisible: true,
          position: { x: workspaceX, y: workspaceY },
          screenPosition: { x: touch.clientX, y: touch.clientY }
        })
      }
    }, 500)
  }, [panX, panY, zoom])
  
  const handleTouchEnd = useCallback(() => {
    isTouchActiveRef.current = false
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current)
      touchHoldTimerRef.current = null
    }
  }, [])
  
  const handleTouchMove = useCallback(() => {
    // Cancel long-press if the user moves finger (interpreted as pan)
    if (isTouchActiveRef.current && touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current)
      touchHoldTimerRef.current = null
    }
  }, [])
  
  // Compute and apply component colors to frame borders based on connection colors
  const computeFrameBorderColors = useCallback(() => {
    const colorForFrame: Record<string, string | undefined> = {}
    for (const c of connections) {
      colorForFrame[c.a] = colorForFrame[c.a] || c.color
      colorForFrame[c.b] = colorForFrame[c.b] || c.color
    }
    return colorForFrame
  }, [connections])

  useEffect(() => {
    const colors = computeFrameBorderColors()
    // apply colors to frames
    frames.forEach(f => {
      const color = colors[f.id]
      if (color && f.borderColor !== color) {
        useFrameStore.getState().updateFrame(f.id, { borderColor: color })
      } else if (!color && f.borderColor) {
        useFrameStore.getState().updateFrame(f.id, { borderColor: undefined })
      }
    })
  }, [connections, frames, computeFrameBorderColors])

  // Event listeners
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    
    workspace.addEventListener('wheel', handleWheel, { passive: false })
    workspace.addEventListener('mousedown', handleMouseDown)
    workspace.addEventListener('mouseup', handleMouseUp)
    workspace.addEventListener('contextmenu', handleContextMenu)
    workspace.addEventListener('touchstart', handleTouchStart, { passive: true })
    workspace.addEventListener('touchend', handleTouchEnd, { passive: true })
    workspace.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    workspace.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      workspace.removeEventListener('wheel', handleWheel)
      workspace.removeEventListener('mousedown', handleMouseDown)
      workspace.removeEventListener('mouseup', handleMouseUp)
      workspace.removeEventListener('contextmenu', handleContextMenu)
      workspace.removeEventListener('touchstart', handleTouchStart)
      workspace.removeEventListener('touchend', handleTouchEnd)
      workspace.removeEventListener('touchcancel', handleTouchEnd)
      workspace.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleWheel, handleMouseDown, handleMouseUp, handleContextMenu, handleTouchStart, handleTouchEnd, handleTouchMove, handleKeyDown])
  

  
  // Boundary Gradient Fade Component
  const BoundaryGradient = () => {
    if (boundaryFadeOpacity === 0) return null
    
    const getGradientStyle = () => {
      switch (boundaryDirection) {
        case 'left':
          return {
            background: `linear-gradient(to right, rgba(0, 0, 0, ${boundaryFadeOpacity}) 0%, transparent 100%)`,
            left: 0,
            top: 0,
            width: '100px',
            height: '100%',
          }
        case 'right':
          return {
            background: `linear-gradient(to left, rgba(0, 0, 0, ${boundaryFadeOpacity}) 0%, transparent 100%)`,
            right: 0,
            top: 0,
            width: '100px',
            height: '100%',
          }
        case 'top':
          return {
            background: `linear-gradient(to bottom, rgba(0, 0, 0, ${boundaryFadeOpacity}) 0%, transparent 100%)`,
            left: 0,
            top: 0,
            width: '100%',
            height: '100px',
          }
        case 'bottom':
          return {
            background: `linear-gradient(to top, rgba(0, 0, 0, ${boundaryFadeOpacity}) 0%, transparent 100%)`,
            left: 0,
            bottom: 0,
            width: '100%',
            height: '100px',
          }
        default:
          return {}
      }
    }
    
    return (
      <motion.div
        className="absolute pointer-events-none z-10"
        style={getGradientStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    )
  }
  
  return (
    <div className="w-full h-full relative overflow-auto bg-gray-100">
      {/* Fixed UI Controls - simplified (show percent and pan) */}
      <div className="fixed top-4 left-4 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto">
          <span className="ml-0 text-xs text-gray-700">{Math.round(zoom * 100)}%</span>
          <span className="ml-2 text-[11px] text-gray-500">Pan: ({Math.round(panX)}, {Math.round(panY)})</span>
        </div>
      </div>
      
      {/* Frame Creation Buttons removed per design */}
      
      {/* Instructions removed per request */}
      
      
      
      {/* Transformed Workspace Canvas */}
      <div 
        ref={workspaceRef}
        className="w-full h-full bg-gray-100 relative"
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: '0 0',
          minWidth: '2000px',
          minHeight: '2000px',
        }}
              >
          {/* Boundary Gradient Fade */}
        <BoundaryGradient />
        {/* Connections behind frames (lower z-index within this stacking context) */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <ConnectionsLayer frames={frames} containerRef={workspaceRef} zoom={zoom} panX={panX} panY={panY} />
        </div>
        
        {/* Frames */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          {frames.map((frame) => (
            <Frame key={frame.id} frame={frame} />
          ))}
        </div>
      </div>

      {/* Screen-centered placeholder overlay (not transformed with workspace) */}
      {frames.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none select-none">
          <div className="pointer-events-auto">
            <Placeholder
              onCreateTool={() => {
                const store = useFrameStore.getState()
                const existing = store.frames.filter(f => f.title?.startsWith('Generation ')).length
                store.addFrame({
                  title: `Generation ${existing + 1}`,
                  x: 200, y: 150, width: 450, height: 350,
                  content: <CustomFrameContent />, type: 'custom'
                })
              }}
              onBuildWebsite={() => {
                const store = useFrameStore.getState()
                const conn = useConnectionStore.getState()
                // Three text in left column
                const a = store.addFrame({ title: 'Text 1', x: 150, y: 120, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const b = store.addFrame({ title: 'Text 2', x: 150, y: 300, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const c = store.addFrame({ title: 'Text 3', x: 150, y: 480, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                // One image in right column
                const d = store.addFrame({ title: 'Image', x: 520, y: 250, width: 380, height: 300, content: <ImageFrameContent />, type: 'image' })
                // Connect them all
                conn.addConnection(a,b); conn.addConnection(b,c); conn.addConnection(c,d)
              }}
              onChatWithAI={() => {
                const store = useFrameStore.getState()
                const conn = useConnectionStore.getState()
                const genCount = store.frames.filter(f => f.title?.startsWith('Generation ')).length
                const plan = store.addFrame({ title: `Generation ${genCount + 1}`, x: 200, y: 150, width: 450, height: 350, content: <CustomFrameContent />, type: 'custom' })
                const t1 = store.addFrame({ title: 'Note A', x: 700, y: 150, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const t2 = store.addFrame({ title: 'Note B', x: 700, y: 340, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                conn.addConnection(plan, t1); conn.addConnection(plan, t2)
              }}
              onStartTemplate={() => {
                const store = useFrameStore.getState()
                const conn = useConnectionStore.getState()
                // All blocks (combo of website + plan)
                const genCount = store.frames.filter(f => f.title?.startsWith('Generation ')).length
                const p = store.addFrame({ title: `Generation ${genCount + 1}`, x: 200, y: 80, width: 450, height: 350, content: <CustomFrameContent />, type: 'custom' })
                const t1 = store.addFrame({ title: 'Text 1', x: 150, y: 470, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const t2 = store.addFrame({ title: 'Text 2', x: 150, y: 650, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const t3 = store.addFrame({ title: 'Text 3', x: 150, y: 830, width: 320, height: 160, content: <TextFrameContent />, type: 'text' })
                const img = store.addFrame({ title: 'Image', x: 520, y: 540, width: 380, height: 300, content: <ImageFrameContent />, type: 'image' })
                conn.addConnection(p,t1); conn.addConnection(t1,t2); conn.addConnection(t2,t3); conn.addConnection(t3,img)
              }}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop layer - captures click to exit */}
          <div className="absolute inset-0 bg-black/40" onClick={exitFullscreen} />
          {/* Device selector */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-gray-800 tracking-tight">
            <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur rounded-[6px] px-1.5 py-1 text-xs shadow-sm">
              <button
                className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-1 ${fullscreenAspect==='16:9' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setFullscreenAspect('16:9')}}
              >
                {fullscreenAspect==='16:9' && <AspectRatioIcon className="w-3.5 h-3.5" />}
                Desktop
              </button>
              <button
                className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-1 ${fullscreenAspect==='4:3' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setFullscreenAspect('4:3')}}
              >
                {fullscreenAspect==='4:3' && <AspectRatioIcon className="w-3.5 h-3.5" />}
                Tablet
              </button>
              <button
                className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-1 ${fullscreenAspect==='9:16' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setFullscreenAspect('9:16')}}
              >
                {fullscreenAspect==='9:16' && <AspectRatioIcon className="w-3.5 h-3.5" />}
                Phone
              </button>
            </div>
          </div>
          {/* Centered frame */}
          <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="bg-white shadow-xl rounded-lg overflow-auto pointer-events-auto"
                style={{
                  width: fsWidth,
                  height: fsHeight
                }}
              >
                {/* Render the active frame content only */}
                {frames.filter(f=>f.id===fullscreenFrameId).map(f=> (
                  <div key={f.id} className="w-full h-full">
                    <FrameProvider frameId={f.id}>
                      <div className="w-full h-full">
                        {f.content || contentForKind(f.type)}
                      </div>
                    </FrameProvider>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      <ContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        screenPosition={contextMenu.screenPosition}
        anchor="aboveCenter"
        onClose={closeContextMenu}
      />

      {/* Agent Modal */}
      <AgentModal isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />

      {/* Floating Toolbar */}
      <FloatingToolbar
        onImageClick={() => {}}
        onAddClick={({ x, y }) => openContextMenuAtScreen(x, y)}
        onHistoryClick={() => {}}
        onChatClick={() => setIsAgentOpen(true)}
      />
    </div>
  )
} 