// components/molecules/ConnectionsLayer
'use client'
import * as React from 'react'
import { useConnectionStore } from '@/stores/connectionStore'
import { Connector } from '@/components/elements/Connector'

interface FrameRectLike {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface ConnectionsLayerProps {
  frames: FrameRectLike[]
}

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({ frames }) => {
  const { connections, selectedConnectionId, pendingFromFrameId, pendingCursor, draggingEndpoint } = useConnectionStore()
  const framesById = React.useMemo(() => {
    const map: Record<string, { x: number; y: number; width: number; height: number }> = {}
    for (const f of frames) map[f.id] = { x: f.x, y: f.y, width: f.width, height: f.height }
    return map
  }, [frames])

  // Pending path from a frame to cursor
  const pendingPath = React.useMemo(() => {
    if (!pendingFromFrameId || !pendingCursor) return null
    const rect = framesById[pendingFromFrameId]
    if (!rect) return null
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const p1 = intersectFromCenter(rect, { x: pendingCursor.x, y: pendingCursor.y })
    const d = pathForCurve(p1, pendingCursor)
    return d
  }, [pendingFromFrameId, pendingCursor, framesById])

  // Dragging endpoint path (endpoint follows cursor)
  const draggingPath = React.useMemo(() => {
    if (!draggingEndpoint || !pendingCursor) return null
    const conn = connections.find(c => c.id === draggingEndpoint.connectionId)
    if (!conn) return null
    const fixedFrameId = draggingEndpoint.endpoint === 'a' ? conn.b : conn.a
    const rect = framesById[fixedFrameId]
    if (!rect) return null
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const p1 = intersectFromCenter(rect, pendingCursor)
    const d = pathForCurve(p1, pendingCursor)
    return d
  }, [draggingEndpoint, pendingCursor, connections, framesById])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      {/* Existing connections */}
      {connections.map(c => (
        <Connector
          key={c.id}
          id={c.id}
          aFrameId={c.a}
          bFrameId={c.b}
          framesById={framesById}
          isSelected={selectedConnectionId === c.id}
        />
      ))}

      {/* Pending creation */}
      {pendingPath && (
        <path d={pendingPath} stroke="#9ca3af" strokeWidth={2} fill="none" className="pointer-events-none" />
      )}

      {/* Dragging endpoint */}
      {draggingPath && (
        <path d={draggingPath} stroke="#9ca3af" strokeWidth={2} fill="none" className="pointer-events-none" />
      )}
    </svg>
  )
}

// Helpers duplicated locally to avoid exports from element component
function intersectFromCenter(rect: { x: number; y: number; width: number; height: number }, toward: { x: number; y: number }) {
  const from = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  const x = rect.x
  const y = rect.y
  const x2 = rect.x + rect.width
  const y2 = rect.y + rect.height
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const candidates: { x: number; y: number; t: number }[] = []
  if (dx !== 0) {
    const t = (x - from.x) / dx
    const yy = from.y + t * dy
    if (t > 0 && yy >= y && yy <= y2) candidates.push({ x, y: yy, t })
  }
  if (dx !== 0) {
    const t = (x2 - from.x) / dx
    const yy = from.y + t * dy
    if (t > 0 && yy >= y && yy <= y2) candidates.push({ x: x2, y: yy, t })
  }
  if (dy !== 0) {
    const t = (y - from.y) / dy
    const xx = from.x + t * dx
    if (t > 0 && xx >= x && xx <= x2) candidates.push({ x: xx, y, t })
  }
  if (dy !== 0) {
    const t = (y2 - from.y) / dy
    const xx = from.x + t * dx
    if (t > 0 && xx >= x && xx <= x2) candidates.push({ x: xx, y: y2, t })
  }
  if (!candidates.length) return from
  candidates.sort((a, b) => a.t - b.t)
  return { x: candidates[0].x, y: candidates[0].y }
}

function pathForCurve(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const dx = (p2.x - p1.x) * 0.3
  const dy = (p2.y - p1.y) * 0.3
  const c1 = { x: p1.x + dx, y: p1.y + dy }
  const c2 = { x: p2.x - dx, y: p2.y - dy }
  return `M ${p1.x},${p1.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`
}

export default ConnectionsLayer

