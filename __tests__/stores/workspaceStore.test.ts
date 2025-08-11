// __tests__/stores/workspaceStore.test.ts
import { renderHook, act } from '../utils/test-utils'
import { useWorkspaceStore } from '@/stores/workspaceStore'

// Reset store before each test
beforeEach(() => {
  useWorkspaceStore.setState({
    mode: 'canvas',
    gridSize: 20,
    zoom: 1,
    panX: 0,
    panY: 0,
  })
})

describe('workspaceStore', () => {
  test('should have correct initial state', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    
    expect(result.current.mode).toBe('canvas')
    expect(result.current.gridSize).toBe(20)
    expect(result.current.zoom).toBe(1)
    expect(result.current.panX).toBe(0)
    expect(result.current.panY).toBe(0)
  })

  test('should switch modes correctly', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    
    act(() => {
      result.current.setMode('grid')
    })
    
    expect(result.current.mode).toBe('grid')
  })

  test('should update grid size', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    
    act(() => {
      result.current.setGridSize(40)
    })
    
    expect(result.current.gridSize).toBe(40)
  })

  test('should update zoom and pan', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    
    act(() => {
      result.current.setZoom(1.5)
      result.current.setPan(100, 200)
    })
    
    expect(result.current.zoom).toBe(1.5)
    expect(result.current.panX).toBe(100)
    expect(result.current.panY).toBe(200)
  })

  test('should reset view correctly', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    
    // Set some values first
    act(() => {
      result.current.setZoom(2)
      result.current.setPan(50, 75)
    })
    
    // Reset view
    act(() => {
      result.current.resetView()
    })
    
    expect(result.current.zoom).toBe(1)
    expect(result.current.panX).toBe(0)
    expect(result.current.panY).toBe(0)
  })
}) 