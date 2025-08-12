// stores/planChatStore – per-frame chat persistence for PlanFrameContent
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface PlanChatState {
  conversations: Record<string, ChatMessage[]> // frameId -> messages
  appendMessage: (frameId: string, message: ChatMessage) => void
  setConversation: (frameId: string, messages: ChatMessage[]) => void
  clearConversation: (frameId: string) => void
}

export const usePlanChatStore = create<PlanChatState>()(persist((set, get) => ({
  conversations: {},
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
    set({ conversations: next })
  },
}), {
  name: 'plan-chat-store-v1',
  storage: createJSONStorage(() => localStorage),
}))

