// utils/gridSnapping
import { Frame } from '@/stores/frameStore'

export interface SnapPoint {
  x: number
  y: number
  type: 'grid' | 'alignment'
}

export interface AlignmentGuide {
  x?: number
  y?: number
  type: 'vertical' | 'horizontal'
  frameId: string
}

// Snap coordinate to nearest grid point
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// Snap frame position to grid
export function snapFrameToGrid(
  frame: Frame, 
  gridSize: number, 
  snapEnabled: boolean = true
): { x: number; y: number } {
  if (!snapEnabled) return { x: frame.x, y: frame.y }
  
  return {
    x: snapToGrid(frame.x, gridSize),
    y: snapToGrid(frame.y, gridSize)
  }
}

// Find alignment guides between frames
export function findAlignmentGuides(
  currentFrame: Frame,
  allFrames: Frame[],
  threshold: number = 5
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = []
  
  allFrames.forEach(frame => {
    if (frame.id === currentFrame.id) return
    
    // Vertical alignment (left edges)
    if (Math.abs(frame.x - currentFrame.x) <= threshold) {
      guides.push({ x: frame.x, type: 'vertical', frameId: frame.id })
    }
    
    // Vertical alignment (right edges)
    if (Math.abs((frame.x + frame.width) - (currentFrame.x + currentFrame.width)) <= threshold) {
      guides.push({ x: frame.x + frame.width, type: 'vertical', frameId: frame.id })
    }
    
    // Horizontal alignment (top edges)
    if (Math.abs(frame.y - currentFrame.y) <= threshold) {
      guides.push({ y: frame.y, type: 'horizontal', frameId: frame.id })
    }
    
    // Horizontal alignment (bottom edges)
    if (Math.abs((frame.y + frame.height) - (currentFrame.y + currentFrame.height)) <= threshold) {
      guides.push({ y: frame.y + frame.height, type: 'horizontal', frameId: frame.id })
    }
  })
  
  return guides
}

// Get snap points for a frame
export function getSnapPoints(
  frame: Frame,
  gridSize: number,
  mode: 'canvas' | 'grid'
): SnapPoint[] {
  const points: SnapPoint[] = []
  
  if (mode === 'grid') {
    // Add grid snap points
    points.push(
      { x: snapToGrid(frame.x, gridSize), y: snapToGrid(frame.y, gridSize), type: 'grid' },
      { x: snapToGrid(frame.x + frame.width, gridSize), y: snapToGrid(frame.y, gridSize), type: 'grid' },
      { x: snapToGrid(frame.x, gridSize), y: snapToGrid(frame.y + frame.height, gridSize), type: 'grid' },
      { x: snapToGrid(frame.x + frame.width, gridSize), y: snapToGrid(frame.y + frame.height, gridSize), type: 'grid' }
    )
  }
  
  return points
} 