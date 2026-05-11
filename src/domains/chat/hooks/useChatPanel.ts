'use client';

import { useState } from 'react';
import { postAiChat } from '@/api/aiApi';

export interface UseChatPanelResult {
  answer: string;
  loading: boolean;
  prompt: string;
  setPrompt: (prompt: string) => void;
  submitPrompt: () => Promise<void>;
}

export function useChatPanel(): UseChatPanelResult {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const submitPrompt = async () => {
    setLoading(true);
    try {
      const result = await postAiChat(prompt);
      setAnswer(result.answer);
    } finally {
      setLoading(false);
    }
  };

  return {
    answer,
    loading,
    prompt,
    setPrompt,
    submitPrompt
  };
}
