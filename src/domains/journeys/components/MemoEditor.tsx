'use client';

import { useState } from 'react';
import { useMemoStore } from '@/domains/journeys/stores/memoStore';
import { css } from '../../../../styled-system/css';
import { Loader2, AlertCircle } from 'lucide-react';

interface MemoEditorProps {
  conversationId: string;
  initialContent?: string;
  onClose?: () => void;
}

export function MemoEditor({ conversationId, initialContent = '', onClose }: MemoEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { setMemo, setError, clearError } = useMemoStore();

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    setApiError(null);
    clearError();

    try {
      // Logic to actually save would go here, calling an API service
      // For now we simulate an update to the store and a timeout
      // In a real implementation we'd call memoApi.saveMemo(conversationId, content)
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      const updatedMemo = {
        id: 'temp-id', // Would come from API
        conversationId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMemo(conversationId, updatedMemo);
      onClose?.();
    } catch {
        const errorMessage = '메모를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.';
        setApiError(errorMessage);
        setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={css({ p: '4', bg: 'white', rounded: 'lg', shadow: 'sm', border: '1px solid token(colors.gray.200)' })}>
      <h3 className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '2' })}>개인 메모</h3>
      
      {apiError && (
        <div className={css({ display: 'flex', alignItems: 'center', gap: '2', color: 'red.600', mb: '2', fontSize: 'sm' })}>
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={css({
          w: 'full',
          h: '32',
          p: '2',
          border: '1px solid token(colors.gray.300)',
          rounded: 'md',
          resize: 'none',
          outline: 'none',
          _focus: { borderColor: 'green.600', ring: '2px solid token(colors.green.100)' }
        })}
        placeholder="이 대화에서 떠오른 생각을 남겨보세요."
        disabled={isSaving}
      />
      
      <div className={css({ mt: '4', display: 'flex', justifyContent: 'flex-end', gap: '2' })}>
        <button
          onClick={onClose}
          className={css({
            px: '3',
            py: '1.5',
            bg: 'gray.100',
            color: 'gray.700',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            cursor: 'pointer',
            _hover: { bg: 'gray.200' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' }
          })}
          disabled={isSaving}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className={css({
            px: '3',
            py: '1.5',
            bg: 'green.700',
            color: 'white',
            rounded: 'md',
            fontSize: 'sm',
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            cursor: 'pointer',
            _hover: { bg: 'green.800' },
            _disabled: { opacity: 0.5, cursor: 'not-allowed' }
          })}
          disabled={isSaving || !content.trim()}
        >
          {isSaving && <Loader2 className={css({ animation: 'spin' })} size={16} />}
          저장
        </button>
      </div>
    </div>
  );
}
