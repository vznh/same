// stores/frameStore
import { create } from 'zustand'

export interface Frame {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  content: React.ReactNode
  type: 'text' | 'image' | 'browser' | 'custom'
  zIndex: number
  isSelected: boolean
  isResizing: boolean
  isDragging: boolean
}

interface FrameState {
  frames: Frame[]
  selectedFrameIds: string[]
  nextZIndex: number
  
  // Actions
  addFrame: (frame: Omit<Frame, 'id' | 'zIndex' | 'isSelected' | 'isResizing' | 'isDragging'>) => void
  updateFrame: (id: string, updates: Partial<Frame>) => void
  deleteFrame: (id: string) => void
  selectFrame: (id: string, multiSelect?: boolean) => void
  deselectFrame: (id: string) => void
  clearSelection: () => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  moveFrame: (id: string, x: number, y: number) => void
  resizeFrame: (id: string, width: number, height: number) => void
}

export const useFrameStore = create<FrameState>((set, get) => ({
  frames: [],
  selectedFrameIds: [],
  nextZIndex: 1,
  
  addFrame: (frameData) => {
    const { nextZIndex, frames } = get()
    const newFrame: Frame = {
      ...frameData,
      id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: nextZIndex,
      isSelected: false,
      isResizing: false,
      isDragging: false,
    }
    
    set((state) => ({
      frames: [...state.frames, newFrame],
      nextZIndex: nextZIndex + 1,
    }))
  },
  
  updateFrame: (id, updates) => {
    set((state) => ({
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, ...updates } : frame
      )
    }))
  },
  
  deleteFrame: (id) => {
    set((state) => ({
      frames: state.frames.filter(frame => frame.id !== id),
      selectedFrameIds: state.selectedFrameIds.filter(frameId => frameId !== id)
    }))
  },
  
  selectFrame: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const isAlreadySelected = state.selectedFrameIds.includes(id)
        return {
          selectedFrameIds: isAlreadySelected 
            ? state.selectedFrameIds.filter(frameId => frameId !== id)
            : [...state.selectedFrameIds, id]
        }
      } else {
        return {
          selectedFrameIds: [id],
          frames: state.frames.map(frame => ({
            ...frame,
            isSelected: frame.id === id
          }))
        }
      }
    })
  },
  
  deselectFrame: (id) => {
    set((state) => ({
      selectedFrameIds: state.selectedFrameIds.filter(frameId => frameId !== id),
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, isSelected: false } : frame
      )
    }))
  },
  
  clearSelection: () => {
    set((state) => ({
      selectedFrameIds: [],
      frames: state.frames.map(frame => ({ ...frame, isSelected: false }))
    }))
  },
  
  bringToFront: (id) => {
    const { nextZIndex } = get()
    set((state) => ({
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, zIndex: nextZIndex } : frame
      ),
      nextZIndex: nextZIndex + 1
    }))
  },
  
  sendToBack: (id) => {
    set((state) => ({
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, zIndex: 0 } : frame
      )
    }))
  },
  
  moveFrame: (id, x, y) => {
    set((state) => ({
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, x, y } : frame
      )
    }))
  },
  
  resizeFrame: (id, width, height) => {
    set((state) => ({
      frames: state.frames.map(frame => 
        frame.id === id ? { ...frame, width, height } : frame
      )
    }))
  },
})) 