// services/frameExecutor – maps FrameAction to store operations
'use client'

import React from 'react'
import { useFrameStore } from '@/stores/frameStore'
import { FrameAction, FrameType } from '@/models/frame'
import { useConnectionStore } from '@/stores/connectionStore'
import { TextFrameContent, ImageFrameContent } from '@/components/molecules/FrameContent'
import { Placement } from '@/models/frame'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFrameStore as frameStoreHook } from '@/stores/frameStore'

function createFrameContentForType(frameType: FrameType): React.ReactNode {
  switch (frameType) {
    case 'text':
      return <TextFrameContent />
    case 'image':
      return <ImageFrameContent />
    // Minimal fallback content for non-mapped types; can be expanded later
    case 'browser':
    case 'custom':
    default:
      return <div className="w-full h-full p-4 text-sm text-gray-600">New {frameType} frame</div>
  }
}

export function executeFrameAction(action: FrameAction): { ok: boolean; error?: string } {
  try {
    const store = useFrameStore.getState()
    const ws = useWorkspaceStore.getState()

    switch (action.type) {
      case 'createMany': {
        for (const p of action.payloads) {
          const resolved = resolvePlacement(p.placement, { width: p.width, height: p.height }, ws, useFrameStore.getState())
          const x = p.x ?? resolved.x
          const y = p.y ?? resolved.y
          store.addFrame({ title: p.title, x, y, width: p.width, height: p.height, content: createFrameContentForType(p.frameType), type: p.frameType })
        }
        return { ok: true }
      }

      case 'createAndConnect': {
        const ids: string[] = []
        for (const p of action.payloads) {
          const resolved = resolvePlacement(p.placement, { width: p.width, height: p.height }, ws, useFrameStore.getState())
          const x = p.x ?? resolved.x
          const y = p.y ?? resolved.y
          const id = store.addFrame({ title: p.title, x, y, width: p.width, height: p.height, content: createFrameContentForType(p.frameType), type: p.frameType })
          ids.push(id)
        }
        const conn = useConnectionStore.getState()
        for (const pair of action.pairs) {
          const aId = ids[pair.aIndex]
          const bId = ids[pair.bIndex]
          if (aId && bId) conn.addConnection(aId, bId)
        }
        return { ok: true }
      }
      case 'create': {
        const { title, width, height, frameType } = action.payload
        const resolved = resolvePlacement(action.payload.placement, { width, height }, ws, useFrameStore.getState())
        const x = action.payload.x ?? resolved.x
        const y = action.payload.y ?? resolved.y
        store.addFrame({
          title,
          x,
          y,
          width,
          height,
          content: createFrameContentForType(frameType),
          type: frameType,
        })
        return { ok: true }
      }

      case 'update': {
        store.updateFrame(action.id, action.updates)
        return { ok: true }
      }

      case 'updateContent': {
        // swap content react node; allow basic types (text/image)
        // For simplicity, replace with a TextFrameContent showing provided string, or keep as-is if unsupported
        const f = useFrameStore.getState().frames.find(fr => fr.id === action.id)
        if (!f) return { ok: false, error: 'Frame not found' }
        // Minimal: if content is string, put into a simple text wrapper
        if (typeof action.content === 'string') {
          store.updateFrame(action.id, { content: <div className="w-full h-full p-4 text-sm text-gray-800 whitespace-pre-wrap">{action.content}</div> })
          return { ok: true }
        }
        // otherwise no-op
        return { ok: false, error: 'Unsupported content type' }
      }

      case 'updateData': {
        useFrameStore.getState().updateFrame(action.id, { data: { ...(useFrameStore.getState().frames.find(fr=>fr.id===action.id)?.data || {}), ...action.data } })
        return { ok: true }
      }

      case 'move': {
        if (action.placement) {
          const frame = frameStoreHook.getState().frames.find(f => f.id === action.id)
          if (!frame) return { ok: false, error: 'Frame not found' }
          const resolved = resolvePlacement(action.placement, { width: frame.width, height: frame.height }, ws, frameStoreHook.getState())
          store.moveFrame(action.id, resolved.x, resolved.y)
        } else if (typeof action.x === 'number' && typeof action.y === 'number') {
          store.moveFrame(action.id, action.x, action.y)
        } else {
          return { ok: false, error: 'Invalid move parameters' }
        }
        return { ok: true }
      }

      case 'resize': {
        store.resizeFrame(action.id, action.width, action.height)
        return { ok: true }
      }

      case 'bringToFront': {
        store.bringToFront(action.id)
        return { ok: true }
      }

      case 'sendToBack': {
        store.sendToBack(action.id)
        return { ok: true }
      }

      case 'select': {
        store.selectFrame(action.id, action.multiSelect)
        return { ok: true }
      }

      case 'clearSelection': {
        store.clearSelection()
        return { ok: true }
      }

      case 'delete': {
        store.deleteFrame(action.id)
        return { ok: true }
      }

      case 'selectMany': {
        const ids = action.ids.filter(Boolean)
        store.selectFrames(ids)
        return { ok: true }
      }

      case 'deleteMany': {
        for (const id of action.ids) store.deleteFrame(id)
        return { ok: true }
      }

      case 'moveMany': {
        for (const m of action.moves) {
          if (m.placement) {
            const f = frameStoreHook.getState().frames.find(fr => fr.id === m.id)
            if (!f) continue
            const resolved = resolvePlacement(m.placement, { width: f.width, height: f.height }, ws, frameStoreHook.getState())
            store.moveFrame(m.id, resolved.x, resolved.y)
          } else if (typeof m.x === 'number' && typeof m.y === 'number') {
            store.moveFrame(m.id, m.x, m.y)
          }
        }
        return { ok: true }
      }

      case 'connect': {
        const conn = useConnectionStore.getState()
        for (const { a, b } of action.pairs) conn.addConnection(a, b)
        return { ok: true }
      }

      default:
        return { ok: false, error: 'Unsupported action' }
    }
  } catch (error) {
    console.error('[frameExecutor] Failed to execute action:', action, error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function resolvePlacement(
  placement: Placement | undefined,
  size: { width: number; height: number },
  ws: ReturnType<typeof useWorkspaceStore.getState>,
  frameState: ReturnType<typeof frameStoreHook.getState>
): { x: number; y: number } {
  if (!placement) return { x: 200, y: 150 }
  if (placement.type === 'viewportCenter') {
    // Compute visible center under current zoom/pan
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const centerX = (viewportW / 2 - ws.panX) / ws.zoom
    const centerY = (viewportH / 2 - ws.panY) / ws.zoom
    return { x: Math.round(centerX - size.width / 2), y: Math.round(centerY - size.height / 2) }
  }
  if (placement.type === 'relativeToFrame') {
    const gap = placement.gap ?? 20
    const ref = frameState.frames.find(f => placement.ref.by === 'id' ? f.id === placement.ref.value : f.title === placement.ref.value)
    if (!ref) return { x: 200, y: 150 }
    switch (placement.align) {
      case 'rightOf':
        return { x: ref.x + ref.width + gap, y: ref.y }
      case 'leftOf':
        return { x: ref.x - size.width - gap, y: ref.y }
      case 'above':
        return { x: ref.x, y: ref.y - size.height - gap }
      case 'below':
        return { x: ref.x, y: ref.y + ref.height + gap }
      case 'center':
      default:
        return { x: ref.x + Math.round((ref.width - size.width) / 2), y: ref.y + Math.round((ref.height - size.height) / 2) }
    }
  }
  return { x: 200, y: 150 }
}

