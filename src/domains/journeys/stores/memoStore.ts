import { create } from 'zustand';

export interface ConversationMemo {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface MemoState {
  memos: Record<string, ConversationMemo>;
  loading: boolean;
  error: string | null;
  
  setMemo: (conversationId: string, memo: ConversationMemo) => void;
  removeMemo: (conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMemoStore = create<MemoState>((set) => ({
  memos: {},
  loading: false,
  error: null,

  setMemo: (conversationId, memo) => set((state) => ({
    memos: { ...state.memos, [conversationId]: memo }
  })),
  removeMemo: (conversationId) => set((state) => {
    const newMemos = { ...state.memos };
    delete newMemos[conversationId];
    return { memos: newMemos };
  }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
