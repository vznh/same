// services/frameExecutor – maps FrameAction to store operations
'use client'

import React from 'react'
import { useFrameStore } from '@/stores/frameStore'
import { FrameAction, FrameType } from '@/models/frame'
import { TextFrameContent, ImageFrameContent } from '@/components/molecules/FrameContent'

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

    switch (action.type) {
      case 'create': {
        const { title, x, y, width, height, frameType } = action.payload
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

      case 'move': {
        store.moveFrame(action.id, action.x, action.y)
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

      default:
        return { ok: false, error: 'Unsupported action' }
    }
  } catch (error) {
    console.error('[frameExecutor] Failed to execute action:', action, error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

