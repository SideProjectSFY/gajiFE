'use client';

import { useChatPanel } from '@/domains/chat/hooks/useChatPanel';
import { useLocale } from '@/i18n/useLocale';

export function ChatPanel() {
  const { answer, loading, prompt, setPrompt, submitPrompt } = useChatPanel();
  const { t } = useLocale();

  return (
    <section>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={submitPrompt} disabled={loading || !prompt.trim()}>
        {loading ? t('chat.input.loading', 'AI가 응답 중입니다...') : t('chat.input.send', '전송')}
      </button>
      <pre>{answer}</pre>
    </section>
  );
}
