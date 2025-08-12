// stores/connectionStore
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useFrameStore } from '@/stores/frameStore'

export interface Connection {
  id: string
  a: string // frameId
  b: string // frameId
}

type PendingStart = { sourceFrameId: string } | null
type PendingReattach = { connectionId: string; endpoint: 'a' | 'b' } | null

interface ConnectionState {
  connections: Connection[]
  selectedConnectionId: string | null
  pendingStart: PendingStart
  pendingReattach: PendingReattach
  pendingCursor: { x: number; y: number } | null

  // CRUD
  addConnection: (a: string, b: string) => void
  removeConnection: (id: string) => void
  updateConnection: (id: string, updates: Partial<Pick<Connection, 'a' | 'b'>>) => void

  // Selection
  setSelectedConnection: (id: string | null) => void

  // Pending creation/reattach
  startConnectionFrom: (sourceFrameId: string) => void
  clearPending: () => void
  startReattach: (connectionId: string, endpoint: 'a' | 'b') => void
  clearReattach: () => void
  setPendingCursor: (x: number, y: number) => void

  // Queries
  findConnectionBetween: (a: string, b: string) => Connection | undefined
  getConnectionsForFrame: (frameId: string) => Connection[]
  getConnectedComponentIds: (startId: string) => string[]
  getAggregatedContentForComponent: (startId: string) => React.ReactNode[]
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      selectedConnectionId: null,
      pendingStart: null,
      pendingReattach: null,
      pendingCursor: null,

      addConnection: (a, b) => {
        if (a === b) return // prevent self-connection
        const exists = get().findConnectionBetween(a, b)
        if (exists) return
        const newConn: Connection = {
          id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          a,
          b,
        }
        set((state) => ({ connections: [...state.connections, newConn] }))
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          selectedConnectionId:
            state.selectedConnectionId === id ? null : state.selectedConnectionId,
        }))
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }))
      },

      setSelectedConnection: (id) => set({ selectedConnectionId: id }),

      startConnectionFrom: (sourceFrameId) => set({ pendingStart: { sourceFrameId } }),
      clearPending: () => set({ pendingStart: null, pendingCursor: null }),
      startReattach: (connectionId, endpoint) => set({ pendingReattach: { connectionId, endpoint } }),
      clearReattach: () => set({ pendingReattach: null }),
      setPendingCursor: (x, y) => set({ pendingCursor: { x, y } }),

      findConnectionBetween: (a, b) => {
        const [x, y] = a < b ? [a, b] : [b, a]
        return get().connections.find((c) => {
          const [u, v] = c.a < c.b ? [c.a, c.b] : [c.b, c.a]
          return u === x && v === y
        })
      },

      getConnectionsForFrame: (frameId) => {
        return get().connections.filter((c) => c.a === frameId || c.b === frameId)
      },

      getConnectedComponentIds: (startId) => {
        const visited = new Set<string>()
        const queue: string[] = [startId]
        while (queue.length) {
          const cur = queue.shift()!
          if (visited.has(cur)) continue
          visited.add(cur)
          const neighbors = get()
            .connections
            .filter((c) => c.a === cur || c.b === cur)
            .map((c) => (c.a === cur ? c.b : c.a))
          for (const n of neighbors) {
            if (!visited.has(n)) queue.push(n)
          }
        }
        return Array.from(visited)
      },

      getAggregatedContentForComponent: (startId) => {
        const frameStore = useFrameStore.getState()
        const ids = get().getConnectedComponentIds(startId)
        return frameStore.frames
          .filter((f) => ids.includes(f.id))
          .map((f) => f.content)
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

