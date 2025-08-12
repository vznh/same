// components/molecules/contentFactory – returns content node by kind
'use client'

import React from 'react'
import { TextFrameContent, ImageFrameContent, CustomFrameContent, HTMLFrameContent, PlanFrameContent } from './FrameContent'

export type FrameKind = 'text' | 'image' | 'browser' | 'plan' | 'custom'

export function contentForKind(kind: FrameKind): React.ReactNode {
  switch (kind) {
    case 'text':
      return <TextFrameContent />
    case 'image':
      return <ImageFrameContent />
    case 'plan':
      return <PlanFrameContent />
    case 'browser':
      // Placeholder browser content
      return <HTMLFrameContent />
    case 'custom':
    default:
      return <CustomFrameContent />
  }
}

