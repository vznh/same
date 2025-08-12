// components/elements/Connector
'use client'

import React, { useMemo } from 'react'
import { useFrameStore } from '@/stores/frameStore'
import { useConnectionStore, Connection } from '@/stores/connectionStore'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getAttachmentPoint(frame: { x: number; y: number; width: number; height: number }, target: { x: number; y: number }) {
  const left = frame.x
  const right = frame.x + frame.width
  const top = frame.y
  const bottom = frame.y + frame.height
  const centerX = frame.x + frame.width / 2
  const centerY = frame.y + frame.height / 2

  const dx = target.x - centerX
  const dy = target.y - centerY

  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (absDx > absDy) {
    // Attach on left/right side
    if (dx >= 0) {
      return { x: right, y: clamp(target.y, top, bottom), side: 'right' as const }
    }
    return { x: left, y: clamp(target.y, top, bottom), side: 'left' as const }
  } else {
    // Attach on top/bottom side
    if (dy >= 0) {
      return { x: clamp(target.x, left, right), y: bottom, side: 'bottom' as const }
    }
    return { x: clamp(target.x, left, right), y: top, side: 'top' as const }
  }
}

function cubicPath(p0: { x: number; y: number }, p1: { x: number; y: number }) {
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const curve = Math.max(40, Math.min(200, Math.hypot(dx, dy) * 0.3))
  const c1 = { x: p0.x + curve, y: p0.y }
  const c2 = { x: p1.x - curve, y: p1.y }
  return `M ${p0.x},${p0.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`
}

export function ConnectorLine({ connection, isSelected, onClick, onStartDragEndpoint }: {
  connection: Connection
  isSelected: boolean
  onClick?: (e: React.MouseEvent) => void
  onStartDragEndpoint?: (endpoint: 'a' | 'b', e: React.MouseEvent) => void
}) {
  const { frames } = useFrameStore()
  const { pendingReattach } = useConnectionStore()
  const a = frames.find((f) => f.id === connection.a)
  const b = frames.find((f) => f.id === connection.b)
  if (!a || !b) return null

  const aAttach = getAttachmentPoint(a, { x: b.x + b.width / 2, y: b.y + b.height / 2 })
  const bAttach = getAttachmentPoint(b, { x: a.x + a.width / 2, y: a.y + a.height / 2 })
  const d = cubicPath(aAttach, bAttach)

  // Small draggable handles at each endpoint for reattach
  const handleRadius = isSelected ? 6 : 4
  const strokeColor = isSelected ? '#3b82f6' : '#9ca3af'
  const strokeWidth = isSelected ? 3 : 2

  return (
    <g className="pointer-events-auto" onClick={onClick}>
      <path d={d} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <circle
        cx={aAttach.x}
        cy={aAttach.y}
        r={handleRadius}
        fill="#ffffff"
        stroke={strokeColor}
        strokeWidth={2}
        onMouseDown={(e) => onStartDragEndpoint?.('a', e)}
      />
      <circle
        cx={bAttach.x}
        cy={bAttach.y}
        r={handleRadius}
        fill="#ffffff"
        stroke={strokeColor}
        strokeWidth={2}
        onMouseDown={(e) => onStartDragEndpoint?.('b', e)}
      />
    </g>
  )
}

export function PendingConnector({ sourceFrameId, cursor }: { sourceFrameId: string; cursor: { x: number; y: number } }) {
  const { frames } = useFrameStore()
  const a = frames.find((f) => f.id === sourceFrameId)
  if (!a) return null
  const aAttach = getAttachmentPoint(a, cursor)
  const d = cubicPath(aAttach, cursor)
  return <path d={d} fill="none" stroke="#9ca3af" strokeDasharray="6 6" strokeWidth={2} />
}

export default function ConnectorLayer() {
  const { connections, selectedConnectionId, setSelectedConnection, startReattach, pendingStart, pendingCursor } = useConnectionStore()

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <g className="pointer-events-none">
        {pendingStart && pendingCursor && (
          <PendingConnector sourceFrameId={pendingStart.sourceFrameId} cursor={pendingCursor} />
        )}
      </g>
      <g className="pointer-events-auto">
        {connections.map((c) => (
          <ConnectorLine
            key={c.id}
            connection={c}
            isSelected={selectedConnectionId === c.id}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedConnection(c.id)
            }}
            onStartDragEndpoint={(endpoint, e) => {
              e.stopPropagation()
              setSelectedConnection(c.id)
              startReattach(c.id, endpoint)
            }}
          />)
        )}
      </g>
    </svg>
  )
}


