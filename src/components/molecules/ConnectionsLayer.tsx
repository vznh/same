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
  containerRef: React.RefObject<HTMLDivElement>
  zoom: number
  panX: number
  panY: number
}

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({ frames, containerRef, zoom, panX, panY }) => {
  const { connections, selectedConnectionId, pendingFromFrameId, pendingCursor, pendingAnchor, draggingEndpoint } = useConnectionStore()
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
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return null
    const cursor = {
      x: (pendingCursor.x - containerRect.left - panX) / zoom,
      y: (pendingCursor.y - containerRect.top - panY) / zoom,
    }
    // Source anchor in workspace coordinates
    const sourcePoint = pendingAnchor
      ? { x: (pendingAnchor.x - containerRect.left - panX) / zoom, y: (pendingAnchor.y - containerRect.top - panY) / zoom }
      : intersectFromCenter(rect, cursor)

    // If cursor is over a target frame, snap endpoint to its edge intersection
    const target = findFrameAtPoint(cursor, frames)
    const snappedEndpoint = target && target.id !== pendingFromFrameId
      ? intersectFromCenter(framesById[target.id], sourcePoint)
      : cursor

    const d = pathForCurve(sourcePoint, snappedEndpoint)
    return d
  }, [pendingFromFrameId, pendingCursor, pendingAnchor, framesById, containerRef, zoom, panX, panY, frames])

  // Dragging endpoint path (endpoint follows cursor)
  const draggingPath = React.useMemo(() => {
    if (!draggingEndpoint || !pendingCursor) return null
    const conn = connections.find(c => c.id === draggingEndpoint.connectionId)
    if (!conn) return null
    const fixedFrameId = draggingEndpoint.endpoint === 'a' ? conn.b : conn.a
    const rect = framesById[fixedFrameId]
    if (!rect) return null
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return null
    const cursor = {
      x: (pendingCursor.x - containerRect.left - panX) / zoom,
      y: (pendingCursor.y - containerRect.top - panY) / zoom,
    }
    const p1 = intersectFromCenter(rect, cursor)
    const d = pathForCurve(p1, cursor)
    return d
  }, [draggingEndpoint, pendingCursor, connections, framesById, containerRef, zoom, panX, panY])

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
      {/* Existing connections */}
      {connections.map(c => (
        <Connector
          key={c.id}
          id={c.id}
          aFrameId={c.a}
          bFrameId={c.b}
          framesById={framesById}
          isSelected={selectedConnectionId === c.id}
          color={c.color}
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

function findFrameAtPoint(p: { x: number; y: number }, frames: { id: string; x: number; y: number; width: number; height: number }[]) {
  for (let i = frames.length - 1; i >= 0; i--) {
    const f = frames[i]
    if (p.x >= f.x && p.x <= f.x + f.width && p.y >= f.y && p.y <= f.y + f.height) {
      return f
    }
  }
  return null
}

export default ConnectionsLayer

