// stores/workspaceStore
import { create } from 'zustand'

type WorkspaceMode = 'canvas' | 'grid'

interface WorkspaceState {
  // Mode and settings
  mode: WorkspaceMode
  gridSize: number
  
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
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Initial state
  mode: 'canvas',
  gridSize: 20,
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // Actions
  setMode: (mode) => set({ mode }),
  setGridSize: (gridSize) => set({ gridSize }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
})) 