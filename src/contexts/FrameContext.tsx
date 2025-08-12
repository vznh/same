// contexts/FrameContext – provides frameId to content
'use client'

import { createContext, useContext } from 'react'

type FrameContextValue = { frameId: string }

const FrameContext = createContext<FrameContextValue | null>(null)

export function useFrameContext(): FrameContextValue {
  const ctx = useContext(FrameContext)
  if (!ctx) throw new Error('useFrameContext must be used within <FrameProvider>')
  return ctx
}

export function FrameProvider({ frameId, children }: { frameId: string; children: React.ReactNode }) {
  return <FrameContext.Provider value={{ frameId }}>{children}</FrameContext.Provider>
}

export default FrameContext

