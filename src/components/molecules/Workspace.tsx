// components/molecules/Workspace
'use client'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFrameStore } from '@/stores/frameStore'
import { useEffect, useRef, useCallback } from 'react'
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
  
  // Trackpad panning only - no zoom on scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    // Only handle trackpad pan gestures (deltaX/deltaY)
    if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
      const panSensitivity = 1.5
      setPan(panX - e.deltaX * panSensitivity, panY - e.deltaY * panSensitivity)
    }
  }, [panX, panY, setPan])
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const panAmount = 50
    const zoomAmount = 0.1
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setPan(panX, panY + panAmount)
        break
      case 'ArrowDown':
        e.preventDefault()
        setPan(panX, panY - panAmount)
        break
      case 'ArrowLeft':
        e.preventDefault()
        setPan(panX + panAmount, panY)
        break
      case 'ArrowRight':
        e.preventDefault()
        setPan(panX - panAmount, panY)
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
        setPan(0, 0)
        break
      case ' ':
        e.preventDefault()
        setZoom(1)
        setPan(0, 0)
        break
    }
  }, [panX, panY, zoom, setPan, setZoom])
  
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
          <div>Arrow keys to pan</div>
          <div>+/- to zoom</div>
          <div>Space/0 to reset</div>
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
        {/* Frames */}
        {frames.map((frame) => (
          <Frame key={frame.id} frame={frame} />
        ))}
      </div>
    </div>
  )
} 