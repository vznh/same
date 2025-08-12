// utils/alignmentGuides
import { Frame } from '@/stores/frameStore'

export interface AlignmentGuide {
  x?: number
  y?: number
  type: 'vertical' | 'horizontal'
  frameId: string
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

 