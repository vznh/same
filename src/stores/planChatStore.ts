// stores/planChatStore – per-frame chat persistence for PlanFrameContent
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface PlanChatState {
  conversations: Record<string, ChatMessage[]> // frameId -> messages
  ready: Record<string, boolean>
  preview: Record<string, string | null>
  appendMessage: (frameId: string, message: ChatMessage) => void
  setConversation: (frameId: string, messages: ChatMessage[]) => void
  clearConversation: (frameId: string) => void
  setReady: (frameId: string, value: boolean) => void
  setPreview: (frameId: string, value: string | null) => void
}

export const usePlanChatStore = create<PlanChatState>()(persist((set, get) => ({
  conversations: {},
  ready: {},
  preview: {},
  appendMessage: (frameId, message) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [frameId]: [...(state.conversations[frameId] || []), message],
      },
    }))
  },
  setConversation: (frameId, messages) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [frameId]: messages,
      },
    }))
  },
  clearConversation: (frameId) => {
    const next = { ...get().conversations }
    delete next[frameId]
    const ready = { ...get().ready }
    delete ready[frameId]
    const preview = { ...get().preview }
    delete preview[frameId]
    set({ conversations: next, ready, preview })
  },
  setReady: (frameId, value) => set((state) => ({ ready: { ...state.ready, [frameId]: value } })),
  setPreview: (frameId, value) => set((state) => ({ preview: { ...state.preview, [frameId]: value } })),
}), {
  name: 'plan-chat-store-v1',
  storage: createJSONStorage(() => localStorage),
}))

