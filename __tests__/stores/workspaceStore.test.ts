// __tests__/stores/workspaceStore.test.ts
import { useWorkspaceStore } from '@/stores/workspaceStore'

describe('workspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      mode: 'canvas',
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    })
  })

  test('should have correct initial state', () => {
    const state = useWorkspaceStore.getState()
    
    expect(state.mode).toBe('canvas')
    expect(state.gridSize).toBe(20)
    expect(state.zoom).toBe(1)
    expect(state.panX).toBe(0)
    expect(state.panY).toBe(0)
  })

  test('should switch modes correctly', () => {
    useWorkspaceStore.getState().setMode('grid')
    const state = useWorkspaceStore.getState()
    
    expect(state.mode).toBe('grid')
  })

  test('should update grid size', () => {
    useWorkspaceStore.getState().setGridSize(40)
    const state = useWorkspaceStore.getState()
    
    expect(state.gridSize).toBe(40)
  })

  test('should update zoom and pan', () => {
    useWorkspaceStore.getState().setZoom(1.5)
    useWorkspaceStore.getState().setPan(100, 200)
    const state = useWorkspaceStore.getState()
    
    expect(state.zoom).toBe(1.5)
    expect(state.panX).toBe(100)
    expect(state.panY).toBe(200)
  })

  test('should reset view correctly', () => {
    // Set some values first
    useWorkspaceStore.getState().setZoom(2)
    useWorkspaceStore.getState().setPan(50, 75)
    
    // Reset view
    useWorkspaceStore.getState().resetView()
    const state = useWorkspaceStore.getState()
    
    expect(state.zoom).toBe(1)
    expect(state.panX).toBe(0)
    expect(state.panY).toBe(0)
  })
}) 