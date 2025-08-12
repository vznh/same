// components/molecules/Workspace
'use client'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFrameStore } from '@/stores/frameStore'
import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import Frame from './Frame'
import { 
  TextFrameContent, 
  ImageFrameContent, 
  BrowserFrameContent, 
  CustomFrameContent,
  HTMLFrameContent 
} from './FrameContent'

export default function Workspace() {
  const { mode, zoom, panX, panY, setZoom, setPan } = useWorkspaceStore()
  const { frames, addFrame, clearSelection } = useFrameStore()
  const workspaceRef = useRef<HTMLDivElement>(null)
  
  // Grid animation states
  const [gridOpacity, setGridOpacity] = useState(0.1) // Default 10%
  const [isPanning, setIsPanning] = useState(false)
  const [isDraggingFrame, setIsDraggingFrame] = useState(false)
  
  // Pan boundary states
  const [boundaryFadeOpacity, setBoundaryFadeOpacity] = useState(0)
  const [boundaryDirection, setBoundaryDirection] = useState<'none' | 'left' | 'right' | 'top' | 'bottom'>('none')
  
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
  
  // Monitor frame dragging state for grid opacity
  useEffect(() => {
    const anyFrameDragging = frames.some(frame => frame.isDragging)
    if (anyFrameDragging && !isDraggingFrame) {
      setIsDraggingFrame(true)
      setGridOpacity(0.2) // 20% opacity when dragging frames
    } else if (!anyFrameDragging && isDraggingFrame) {
      setIsDraggingFrame(false)
      setGridOpacity(0.1) // Back to 10% opacity
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
      
      // Reduce grid opacity during panning
      setIsPanning(true)
      setGridOpacity(0.05) // 5% opacity
      
      // Reset panning state after a short delay
      setTimeout(() => setIsPanning(false), 150)
      setTimeout(() => setGridOpacity(0.1), 200)
      return
    }
    
    // This is a zoom gesture - zoom towards cursor position
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
    
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
    const panAmount = 50
    const zoomAmount = 0.1
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        constrainedPan(panX, panY + panAmount)
        // Reduce grid opacity during keyboard panning
        setGridOpacity(0.05)
        setTimeout(() => setGridOpacity(0.1), 200)
        break
      case 'ArrowDown':
        e.preventDefault()
        constrainedPan(panX, panY - panAmount)
        setGridOpacity(0.05)
        setTimeout(() => setGridOpacity(0.1), 200)
        break
      case 'ArrowLeft':
        e.preventDefault()
        constrainedPan(panX + panAmount, panY)
        setGridOpacity(0.05)
        setTimeout(() => setGridOpacity(0.1), 200)
        break
      case 'ArrowRight':
        e.preventDefault()
        constrainedPan(panX - panAmount, panY)
        setGridOpacity(0.05)
        setTimeout(() => setGridOpacity(0.1), 200)
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
      title: 'Browser Frame',
      x: 50,
      y: 300,
      width: 400,
      height: 300,
      content: <BrowserFrameContent />,
      type: 'browser'
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
  
  // Event listeners
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    
    workspace.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      workspace.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleWheel, handleKeyDown])
  
  // Animated Grid Component
  const AnimatedGrid = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, ${gridOpacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, ${gridOpacity}) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
      animate={{ opacity: gridOpacity }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    />
  )
  
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
            Grid: {Math.round(gridOpacity * 100)}% {isDraggingFrame ? '(Dragging)' : isPanning ? '(Panning)' : ''}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Pan: ({Math.round(panX)}, {Math.round(panY)})
          </div>
          {boundaryDirection !== 'none' && (
            <div className="text-xs text-orange-500 mt-1">
              Boundary: {boundaryDirection} ({Math.round(boundaryFadeOpacity * 100)}%)
            </div>
          )}
        </div>
      </div>
      
      {/* Frame Creation Buttons - Minimal link style */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto">
          <div className="text-xs font-medium text-gray-700 mb-2">Create:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={createTextFrame}
              className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Text
            </button>
            <button
              onClick={createImageFrame}
              className="text-xs text-green-600 hover:text-green-800 underline cursor-pointer"
            >
              Image
            </button>
            <button
              onClick={createBrowserFrame}
              className="text-xs text-purple-600 hover:text-purple-800 underline cursor-pointer"
            >
              Browser
            </button>
            <button
              onClick={createCustomFrame}
              className="text-xs text-orange-600 hover:text-orange-800 underline cursor-pointer"
            >
              Custom
            </button>
            <button
              onClick={createHTMLFrame}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              HTML
            </button>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border pointer-events-auto text-xs text-gray-600">
          <div>Two-finger trackpad to pan</div>
          <div>Scroll to zoom</div>
          <div>Arrow keys to pan</div>
          <div>+/- to zoom</div>
          <div>Space/0 to reset</div>
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
        {/* Animated Grid Background */}
        <AnimatedGrid />
        
        {/* Boundary Gradient Fade */}
        <BoundaryGradient />
        
        {/* Frames */}
        {frames.map((frame) => (
          <Frame key={frame.id} frame={frame} />
        ))}
      </div>
    </div>
  )
} 