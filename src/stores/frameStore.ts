// stores/frameStore
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { contentForKind, FrameKind } from '@/components/molecules/contentFactory'

export interface Frame {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  content: React.ReactNode
  type: FrameKind
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

export const useFrameStore = create<FrameState>()(persist((set, get) => ({
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
}), {
  name: 'frame-store-v1',
  storage: createJSONStorage(() => localStorage),
  // Don't persist non-serializable React nodes
  partialize: (state) => ({
    frames: state.frames.map(f => ({
      ...f,
      content: undefined as unknown as React.ReactNode,
    })),
    selectedFrameIds: state.selectedFrameIds,
    nextZIndex: state.nextZIndex,
  }) as unknown as FrameState,
  onRehydrateStorage: () => (state) => {
    // Rebuild content nodes based on type after hydration
    if (!state) return
    const framesWithContent = state.frames.map(f => ({
      ...f,
      content: contentForKind(f.type),
    }))
    // Use set from closure
    // @ts-expect-error set is available in outer scope
    const setState = (useFrameStore as any).setState || get().updateFrame
    // Replace entire frames array to ensure content is restored
    set((s) => ({ ...s, frames: framesWithContent }))
  }
}))