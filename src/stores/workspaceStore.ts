// stores/workspaceStore
import { create } from 'zustand'

type WorkspaceMode = 'canvas' | 'grid'

interface WorkspaceState {
  // Mode and settings
  mode: WorkspaceMode
  gridSize: number
  isFullscreen: boolean
  fullscreenFrameId: string | null
  fullscreenAspect: '16:9' | '4:3' | '9:16'
  
  // Viewport state
  zoom: number
  panX: number
  panY: number
  
  // Actions
  setMode: (mode: WorkspaceMode) => void
  setGridSize: (size: number) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetView: () => void
  enterFullscreen: (frameId: string) => void
  exitFullscreen: () => void
  setFullscreenAspect: (aspect: '16:9' | '4:3' | '9:16') => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Initial state
  mode: 'canvas',
  gridSize: 20,
  isFullscreen: false,
  fullscreenFrameId: null,
  fullscreenAspect: '16:9',
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // Actions
  setMode: (mode) => set({ mode }),
  setGridSize: (gridSize) => set({ gridSize }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  enterFullscreen: (frameId) => set({ isFullscreen: true, fullscreenFrameId: frameId }),
  exitFullscreen: () => set({ isFullscreen: false, fullscreenFrameId: null }),
  setFullscreenAspect: (fullscreenAspect) => set({ fullscreenAspect })
})) 