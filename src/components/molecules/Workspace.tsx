// components/molecules/Workspace
'use client'

import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useEffect, useRef, useCallback } from 'react'

export default function Workspace() {
  const { mode, zoom, panX, panY, setZoom, setPan } = useWorkspaceStore()
  const workspaceRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  
  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.95 : 1.05 // Reduced from 0.9/1.1 to 0.95/1.05
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
    
    // Zoom towards mouse position
    if (workspaceRef.current) {
      const rect = workspaceRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom)
      
      setZoom(newZoom)
      setPan(newPanX, newPanY)
    }
  }, [zoom, panX, panY, setZoom, setPan])
  
  // Mouse drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      isDragging.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      document.body.style.cursor = 'grabbing'
    }
  }, [])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMousePos.current.x
      const deltaY = e.clientY - lastMousePos.current.y
      
      setPan(panX + deltaX, panY + deltaY)
      lastMousePos.current = { x: e.clientX, y: e.clientY }
    }
  }, [panX, panY, setPan])
  
  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = 'default'
  }, [])
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const panAmount = 50
    const zoomAmount = 0.1
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setPan(panX, panY + panAmount) // Fixed: was panY - panAmount
        break
      case 'ArrowDown':
        e.preventDefault()
        setPan(panX, panY - panAmount) // Fixed: was panY + panAmount
        break
      case 'ArrowLeft':
        e.preventDefault()
        setPan(panX + panAmount, panY) // Fixed: was panX - panAmount
        break
      case 'ArrowRight':
        e.preventDefault()
        setPan(panX - panAmount, panY) // Fixed: was panX + panAmount
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
    }
  }, [panX, panY, zoom, setPan, setZoom])
  
  // Event listeners
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    
    workspace.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      workspace.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleWheel, handleMouseMove, handleMouseUp, handleKeyDown])
  
  return (
    <div 
      ref={workspaceRef}
      className="w-full h-full bg-gray-50 relative overflow-hidden cursor-grab"
      style={{
        transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
        transformOrigin: '0 0',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Mode indicator - temporary for testing */}
      <div className="absolute top-4 left-4 z-10 bg-white px-3 py-2 rounded-lg shadow-sm border">
        <span className="text-sm font-medium text-gray-700">
          Mode: {mode}
        </span>
        <span className="ml-2 text-xs text-gray-500">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 right-4 z-10 bg-white px-3 py-2 rounded-lg shadow-sm border text-xs text-gray-600">
        <div>Scroll to zoom</div>
        <div>Drag to pan</div>
        <div>Arrow keys to pan</div>
        <div>+/- to zoom</div>
        <div>0 to reset</div>
      </div>
      
      {/* Background content based on mode */}
      <div className="w-full h-full">
        {mode === 'canvas' ? (
          <div className="w-full h-full bg-white" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
    </div>
  )
} 