// stores/connectionStore
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Connection {
  id: string
  // Undirected connection between two frames
  a: string
  b: string
}

export type EndpointKey = 'a' | 'b'

interface CursorPosition {
  x: number
  y: number
}

interface ConnectionState {
  connections: Connection[]
  selectedConnectionId: string | null

  // Pending creation (user started from a frame, following cursor)
  pendingFromFrameId: string | null
  pendingCursor: CursorPosition | null

  // Endpoint reattach state
  draggingEndpoint: { connectionId: string; endpoint: EndpointKey } | null

  // Actions
  addConnection: (a: string, b: string) => void
  removeConnection: (connectionId: string) => void
  removeConnectionsForFrame: (frameId: string) => void
  selectConnection: (connectionId: string | null) => void

  startPending: (fromFrameId: string) => void
  updatePendingCursor: (x: number, y: number) => void
  clearPending: () => void

  startDragEndpoint: (connectionId: string, endpoint: EndpointKey) => void
  clearDragEndpoint: () => void
  reattachEndpoint: (connectionId: string, endpoint: EndpointKey, toFrameId: string) => void

  hasConnectionBetween: (a: string, b: string) => boolean
  getConnectedComponent: (startId: string) => string[]
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      selectedConnectionId: null,
      pendingFromFrameId: null,
      pendingCursor: null,
      draggingEndpoint: null,

      addConnection: (a, b) => {
        if (a === b) return
        const [na, nb] = normalizePair(a, b)
        if (get().connections.some(c => {
          const [ca, cb] = normalizePair(c.a, c.b)
          return ca === na && cb === nb
        })) return
        const id = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        set(state => ({ connections: [...state.connections, { id, a: na, b: nb }] }))
      },

      removeConnection: (connectionId) => {
        set(state => ({
          connections: state.connections.filter(c => c.id !== connectionId),
          selectedConnectionId: state.selectedConnectionId === connectionId ? null : state.selectedConnectionId,
        }))
      },

      removeConnectionsForFrame: (frameId) => {
        set(state => ({
          connections: state.connections.filter(c => c.a !== frameId && c.b !== frameId),
          selectedConnectionId: state.selectedConnectionId && state.connections.find(c => c.id === state.selectedConnectionId && (c.a === frameId || c.b === frameId)) ? null : state.selectedConnectionId,
        }))
      },

      selectConnection: (connectionId) => set({ selectedConnectionId: connectionId }),

      startPending: (fromFrameId) => set({ pendingFromFrameId: fromFrameId }),
      updatePendingCursor: (x, y) => set({ pendingCursor: { x, y } }),
      clearPending: () => set({ pendingFromFrameId: null, pendingCursor: null }),

      startDragEndpoint: (connectionId, endpoint) => set({ draggingEndpoint: { connectionId, endpoint } }),
      clearDragEndpoint: () => set({ draggingEndpoint: null }),

      reattachEndpoint: (connectionId, endpoint, toFrameId) => {
        if (!toFrameId) return
        set(state => {
          const idx = state.connections.findIndex(c => c.id === connectionId)
          if (idx === -1) return state
          const conn = state.connections[idx]
          const other = endpoint === 'a' ? conn.b : conn.a
          if (toFrameId === other) return state // no change
          if (toFrameId === (endpoint === 'a' ? conn.a : conn.b)) return state
          if (toFrameId === (endpoint === 'a' ? conn.b : conn.a)) return state
          // prevent self-connection and duplicate pairs
          if (toFrameId === other) return state
          const [na, nb] = normalizePair(other, toFrameId)
          if (state.connections.some(c => {
            const [ca, cb] = normalizePair(c.a, c.b)
            return c.id !== connectionId && ca === na && cb === nb
          })) return state
          const updated: Connection = endpoint === 'a' ? { ...conn, a: toFrameId } : { ...conn, b: toFrameId }
          const [ua, ub] = normalizePair(updated.a, updated.b)
          const normalized: Connection = { ...updated, a: ua, b: ub }
          const next = state.connections.slice()
          next[idx] = normalized
          return { ...state, connections: next }
        })
      },

      hasConnectionBetween: (a, b) => {
        const [na, nb] = normalizePair(a, b)
        return get().connections.some(c => {
          const [ca, cb] = normalizePair(c.a, c.b)
          return ca === na && cb === nb
        })
      },

      getConnectedComponent: (startId) => {
        const visited = new Set<string>()
        const queue: string[] = [startId]
        const neighbors = (id: string) => get().connections
          .filter(c => c.a === id || c.b === id)
          .map(c => (c.a === id ? c.b : c.a))
        while (queue.length) {
          const id = queue.shift()!
          if (visited.has(id)) continue
          visited.add(id)
          for (const n of neighbors(id)) {
            if (!visited.has(n)) queue.push(n)
          }
        }
        return Array.from(visited)
      },
    }),
    {
      name: 'connection-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connections: state.connections,
        selectedConnectionId: state.selectedConnectionId,
      }) as unknown as ConnectionState,
    }
  )
)

