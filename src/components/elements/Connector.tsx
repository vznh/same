// components/elements/Connector
'use client'
import * as React from 'react'
import { useConnectionStore, EndpointKey } from '@/stores/connectionStore'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface ConnectorProps {
  id: string
  aFrameId: string
  bFrameId: string
  framesById: Record<string, Rect>
  isSelected: boolean
  color: string
}

function getCenter(rect: Rect) {
  return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 }
}

function lineRectIntersection(from: { x: number; y: number }, rect: Rect, toward: { x: number; y: number }) {
  // Compute intersection point of line from 'toward' to 'from' with rect's perimeter closest to 'from'.
  // Approach: parametric intersection against each side, choose valid with smallest t in (0,1].
  const { x, y, width, height } = rect
  const x2 = x + width
  const y2 = y + height
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const candidates: { x: number; y: number; t: number }[] = []
  // Left (x)
  if (dx !== 0) {
    const t = (x - from.x) / dx
    const yy = from.y + t * dy
    if (t > 0 && yy >= y && yy <= y2) candidates.push({ x, y: yy, t })
  }
  // Right
  if (dx !== 0) {
    const t = (x2 - from.x) / dx
    const yy = from.y + t * dy
    if (t > 0 && yy >= y && yy <= y2) candidates.push({ x: x2, y: yy, t })
  }
  // Top (y)
  if (dy !== 0) {
    const t = (y - from.y) / dy
    const xx = from.x + t * dx
    if (t > 0 && xx >= x && xx <= x2) candidates.push({ x: xx, y, t })
  }
  // Bottom
  if (dy !== 0) {
    const t = (y2 - from.y) / dy
    const xx = from.x + t * dx
    if (t > 0 && xx >= x && xx <= x2) candidates.push({ x: xx, y: y2, t })
  }
  if (candidates.length === 0) return { x: from.x, y: from.y }
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

export const Connector: React.FC<ConnectorProps> = ({ id, aFrameId, bFrameId, framesById, isSelected, color }) => {
  const { selectConnection, startDragEndpoint } = useConnectionStore()

  const aRect = framesById[aFrameId]
  const bRect = framesById[bFrameId]
  if (!aRect || !bRect) return null

  const { cx: acx, cy: acy } = getCenter(aRect)
  const { cx: bcx, cy: bcy } = getCenter(bRect)
  const aAnchor = lineRectIntersection({ x: acx, y: acy }, aRect, { x: bcx, y: bcy })
  const bAnchor = lineRectIntersection({ x: bcx, y: bcy }, bRect, { x: acx, y: acy })
  const d = pathForCurve(aAnchor, bAnchor)

  const stroke = color
  const strokeWidth = isSelected ? 3 : 2

  const onSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectConnection(id)
  }

  const onDragEndpoint = (endpoint: EndpointKey) => (e: React.MouseEvent) => {
    e.stopPropagation()
    // Select the connection when starting a drag from its endpoint
    selectConnection(id)
    startDragEndpoint(id, endpoint)
  }

  return (
    <g data-connection data-connection-id={id}>
      <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill="none" onMouseDown={onSelect} style={{ cursor: 'pointer' }} />
      {/* Endpoint handles */}
      <circle cx={aAnchor.x} cy={aAnchor.y} r={6} fill="#fff" stroke={stroke} strokeWidth={2} onMouseDown={onDragEndpoint('a')} style={{ cursor: 'grab' }} />
      <circle cx={bAnchor.x} cy={bAnchor.y} r={6} fill="#fff" stroke={stroke} strokeWidth={2} onMouseDown={onDragEndpoint('b')} style={{ cursor: 'grab' }} />
      {/* Emphasis rings when selected */}
      {isSelected && (
        <>
          <circle cx={aAnchor.x} cy={aAnchor.y} r={10} fill="none" stroke={stroke} strokeOpacity={0.3} strokeWidth={3} />
          <circle cx={bAnchor.x} cy={bAnchor.y} r={10} fill="none" stroke={stroke} strokeOpacity={0.3} strokeWidth={3} />
        </>
      )}
    </g>
  )
}

export default Connector


