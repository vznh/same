// components/molecules/Workspace
'use client'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFrameStore } from '@/stores/frameStore'
import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { AspectRatioIcon } from '@radix-ui/react-icons'
import Frame from './Frame'
import ContextMenu from './ContextMenu'
import Placeholder from './Placeholder'
import AgentModal from './AgentModal'
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
    // Only handle right mouse button or if not clicking on a frame
    if (e.button === 2 || e.target === workspaceRef.current) {
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
  
  const closeContextMenu = useCallback(() => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, screenPosition: { x: 0, y: 0 } })
  }, [])

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
      {/* Fixed UI Controls - Outside transformed workspace */}
      <div className="fixed top-4 left-4 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto">
          <span className="text-sm font-medium text-gray-700">
            Mode: {mode}
          </span>
          <span className="ml-2 text-xs text-gray-500">
            Zoom: {Math.round(zoom * 100)}%
          </span>
          <div className="text-xs text-gray-400 mt-1">
            {isDraggingFrame ? '(Dragging)' : isPanning ? '(Panning)' : ''}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Pan: ({Math.round(panX)}, {Math.round(panY)})
          </div>
          {boundaryDirection !== 'none' && (
            <div className="text-xs text-orange-500 mt-1">
              Boundary: {boundaryDirection} ({Math.round(boundaryFadeOpacity * 100)}%)
            </div>
          )}
          <div className="mt-2">
            <button
              onClick={() => setIsAgentOpen(true)}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border"
            >
              Open Agent
            </button>
          </div>
        </div>
      </div>
      
      {/* Frame Creation Buttons removed per design */}
      
      {/* Instructions */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto text-xs text-gray-600">
          <div>Two-finger trackpad to pan</div>
          <div>Scroll to zoom</div>
          <div>Arrow keys to pan</div>
          <div>+/- to zoom</div>
          <div>Space/0 to reset</div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="font-medium text-gray-700">Context Menu:</div>
            <div>Hold mouse for 500ms to create frames</div>
          </div>
        </div>
      </div>
      
      {/* Reset View Button - Bottom Middle */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto">
          <button
            onClick={() => {
              setZoom(1)
              setPan(0, 0)
            }}
            className="text-xs text-gray-600 hover:text-gray-800 underline cursor-pointer"
          >
            Reset View
          </button>
        </div>
      </div>
      
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
        
        {/* Frames */}
        {frames.map((frame) => (
          <Frame key={frame.id} frame={frame} />
        ))}
      </div>

      {/* Screen-centered placeholder overlay (not transformed with workspace) */}
      {frames.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none select-none">
          <div className="pointer-events-auto">
            <Placeholder />
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
                    {/* Preserve content state by providing the same context */}
                    <Frame key={f.id} frame={f} />
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
        onClose={closeContextMenu}
      />

      {/* Agent Modal */}
      <AgentModal isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
    </div>
  )
} 