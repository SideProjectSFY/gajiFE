import { create } from 'zustand';
import { Conversation, Message } from '../types/core';

interface ConversationState {
  currentConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearConversation: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  currentConversation: null,
  messages: [],
  isStreaming: false,
  isLoading: false,
  error: null,

  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) => set((state) => {
    if (state.messages.length === 0) return state;
    const newMessages = [...state.messages];
    const lastMessage = newMessages[newMessages.length - 1];
    newMessages[newMessages.length - 1] = { ...lastMessage, content: lastMessage.content + content };
    return { messages: newMessages };
  }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearConversation: () => set({ currentConversation: null, messages: [], isStreaming: false, error: null }),
}));
