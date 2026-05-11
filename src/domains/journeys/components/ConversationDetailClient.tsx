'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, GitBranch, Heart, Loader2, PenLine, Send, X } from 'lucide-react';
import {
  createConversationMemo,
  deleteConversationMemo,
  forkConversation,
  getChildConversation,
  getConversation,
  getConversationMemo,
  getForkRelationship,
  getParentConversation,
  getRagSources,
  isConversationLiked,
  likeConversation,
  pollConversationMessage,
  sendConversationChatCompletion,
  sendConversationMessage,
  unlikeConversation,
  updateConversationMemo
} from '@/api/conversationApi';
import { LoadingState, SkeletonState, StatusState } from '@/components/LoadingState';
import type {
  Conversation,
  ConversationForkRelationship,
  ConversationMemo,
  ConversationMessage,
  RagChatSourceResponse,
  RagCitation
} from '@/domains/journeys/types/core';
import {
  canMutateOwnedResource,
  getCurrentUserFromToken,
  type CurrentUser
} from '@/domains/journeys/utils/currentUser';
import type { Locale } from '@/i18n';
import { useLocale } from '@/i18n/useLocale';

type PollPayload =
  | ConversationMessage
  | {
      status?: string;
      content?: string;
      role?: 'system' | 'user' | 'assistant';
      messageId?: string;
      id?: string;
      error?: string;
    };

const MAX_POLL_RETRIES = 30;
const POLL_INTERVAL_MS = 1000;

type Translate = (path: string, fallback?: string) => string;

type ConversationContextSummary = {
  bookTitle: string;
  bookAuthor: string;
  characterName: string;
  scenarioTitle: string;
  scenarioDescription: string;
  messageCount: number;
  likeCount: number;
};

type MemoSaveStatus = {
  tone: 'empty' | 'dirty' | 'saving' | 'saved' | 'readonly' | 'error';
  label: string;
};

type ConversationNotice = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

function readPassageId(citation: RagCitation): string {
  return citation.passageId ?? citation.passage_id ?? '';
}

function readFinalRank(citation: RagCitation): number | null | undefined {
  return citation.finalRank ?? citation.final_rank;
}

function readSourceAvailable(citation: RagCitation): boolean {
  return citation.sourceAvailable ?? citation.source_available ?? true;
}

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

function formatGroundingStatus(status: string | null | undefined, fallbackUsed: boolean | undefined, t: Translate): string {
  const normalized = status?.toLowerCase() ?? '';

  if (fallbackUsed || normalized.includes('fallback')) {
    return t('chat.evidence.partial', '일부 근거만 확인됨');
  }

  if (normalized.includes('grounded') || normalized.includes('verified')) {
    return t('chat.evidence.verified', '근거 확인됨');
  }

  return t('chat.evidence.reviewed', '근거 검토됨');
}

function getMessageTimestamp(message: ConversationMessage, locale: Locale): string {
  const value = message.timestamp ?? message.createdAt;
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function getMessageCitations(message: ConversationMessage): RagCitation[] {
  if (message.role !== 'assistant') return [];
  return (message.rag?.citations ?? []).slice(0, 4);
}

function orderSourceCitations(citations: RagCitation[], selectedPassageId: string): RagCitation[] {
  if (!selectedPassageId) return citations;
  const selected = citations.filter((citation) => readPassageId(citation) === selectedPassageId);
  const rest = citations.filter((citation) => readPassageId(citation) !== selectedPassageId);
  return [...selected, ...rest];
}

function getRoleLabel(role: ConversationMessage['role'], t: Translate): string {
  if (role === 'user') {
    return t('chat.messageRole.user', '나');
  }
  if (role === 'assistant') {
    return t('chat.messageRole.assistant', 'AI');
  }
  return t('chat.messageRole.system', '시스템');
}

function getSourceLabel(rank: number, t: Translate): string {
  return formatTemplate(t('chat.evidence.source', '관련 장면 {rank}'), { rank });
}

function readConversationText(conversation: Conversation | null, keys: string[], fallback = ''): string {
  if (!conversation) return fallback;
  const record = conversation as Conversation & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readConversationNumber(conversation: Conversation | null, keys: string[], fallback = 0): number {
  if (!conversation) return fallback;
  const record = conversation as Conversation & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }

  return fallback;
}

function getScenarioHref(conversation: Conversation | null): string {
  if (!conversation) return '/scenarios/new';
  const record = conversation as Conversation & Record<string, unknown>;
  const scenarioId = readConversationText(conversation, ['scenarioId', 'scenario_id']);
  const rootScenarioId = typeof record.rootScenarioId === 'string'
    ? record.rootScenarioId
    : typeof record.root_scenario_id === 'string'
      ? record.root_scenario_id
      : '';
  const target = scenarioId || rootScenarioId;
  return target ? `/scenarios/new?forkFrom=${encodeURIComponent(target)}` : '/scenarios/new';
}

function getConversationContextSummary(
  conversation: Conversation | null,
  messages: ConversationMessage[],
  liked: boolean,
  t: Translate
): ConversationContextSummary {
  return {
    bookTitle: readConversationText(conversation, ['bookTitle', 'book_title', 'novelTitle', 'novel_title'], t('chat.context.unknownBook', '책 정보 확인 중')),
    bookAuthor: readConversationText(conversation, ['bookAuthor', 'book_author', 'authorName', 'author_name'], t('chat.context.unknownAuthor', '작가 정보 없음')),
    characterName: readConversationText(conversation, ['characterName', 'character_name', 'character'], t('chat.context.unknownCharacter', '대화 인물')),
    scenarioTitle: readConversationText(conversation, ['scenarioTitle', 'scenario_title'], conversation?.title ?? t('chat.path.untitled', '대화')),
    scenarioDescription: readConversationText(
      conversation,
      ['scenarioDescription', 'scenario_description', 'description'],
      t('chat.context.defaultScenario', '원작의 선택을 다르게 놓고 이어지는 장면입니다.')
    ),
    messageCount: readConversationNumber(conversation, ['messageCount', 'message_count'], messages.length),
    likeCount: readConversationNumber(conversation, ['likeCount', 'like_count'], liked ? 1 : 0)
  };
}

export function ConversationDetailClient({ conversationId }: { conversationId: string }) {
  const { locale, t } = useLocale();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [message, setMessage] = useState('');
  const [liked, setLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [memo, setMemo] = useState<ConversationMemo | null>(null);
  const [memoInput, setMemoInput] = useState('');
  const [memoPending, setMemoPending] = useState(false);
  const [memoSaveFailed, setMemoSaveFailed] = useState(false);
  const [actionNotice, setActionNotice] = useState<ConversationNotice | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [forkRelationship, setForkRelationship] = useState<ConversationForkRelationship | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkPending, setForkPending] = useState(false);
  const [sendPending, setSendPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, username: null });
  const [sourceDrawer, setSourceDrawer] = useState<{ messageId: string; passageId: string } | null>(null);
  const [sourceResponse, setSourceResponse] = useState<RagChatSourceResponse | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserFromToken());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const [conv, parent, child, likedData, memoData, relationship] = await Promise.all([
          getConversation(conversationId),
          getParentConversation(conversationId),
          getChildConversation(conversationId),
          isConversationLiked(conversationId),
          getConversationMemo(conversationId),
          getForkRelationship(conversationId).catch(() => null)
        ]);

        if (!mounted) return;
        setConversation(conv);
        setMessages(conv.messages ?? []);
        setParentId(parent?.id ?? null);
        setChildId(child?.id ?? null);
        setLiked(Boolean(likedData.isLiked ?? likedData.liked));
        setMemo(memoData);
        setMemoInput(memoData?.content ?? '');
        setForkRelationship(relationship);
      } catch {
        if (mounted) {
          setError(t('chat.loadError.title', '대화를 불러오지 못했습니다'));
          setConversation(null);
          setMessages([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [conversationId, t]);

  useEffect(() => {
    if (!messagesContainerRef.current) {
      return;
    }

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length, sendPending]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeout = window.setTimeout(
      () => setActionNotice(null),
      actionNotice.tone === 'error' ? 3600 : 2400
    );
    return () => window.clearTimeout(timeout);
  }, [actionNotice]);

  const isConversationOwner = useMemo(() => {
    if (!conversation) return false;
    return canMutateOwnedResource(
      { userId: conversation.userId },
      currentUser,
      { requireExplicitOwner: true }
    );
  }, [conversation, currentUser]);

  const canManageMemo = useMemo(() => {
    if (!conversation) return false;
    return canMutateOwnedResource(
      { userId: conversation.userId },
      currentUser,
      { requireExplicitOwner: true }
    );
  }, [conversation, currentUser]);

  const memoDirty = useMemo(() => {
    const savedContent = memo?.content ?? '';
    return memoInput.trim() !== savedContent.trim();
  }, [memo, memoInput]);

  const memoSaveStatus = useMemo<MemoSaveStatus>(() => {
    if (!canManageMemo) {
      return { tone: 'readonly', label: t('chat.memo.status.readonly', '읽기 전용') };
    }

    if (memoSaveFailed) {
      return { tone: 'error', label: t('chat.memo.status.error', '저장 실패') };
    }

    if (memoPending) {
      return { tone: 'saving', label: t('chat.memo.status.saving', '저장 중') };
    }

    if (memoDirty) {
      return { tone: 'dirty', label: t('chat.memo.status.dirty', '수정 중') };
    }

    if (memo) {
      return { tone: 'saved', label: t('chat.memo.status.saved', '저장됨') };
    }

    return { tone: 'empty', label: t('chat.memo.status.empty', '메모 없음') };
  }, [canManageMemo, memo, memoDirty, memoPending, memoSaveFailed, t]);

  const isRootConversation = useMemo(() => {
    if (!conversation) return false;

    const candidate = (conversation as Conversation & { isRoot?: boolean; is_root?: boolean }).isRoot ??
      (conversation as Conversation & { isRoot?: boolean; is_root?: boolean }).is_root;

    if (typeof candidate === 'boolean') {
      return candidate;
    }

    return !parentId;
  }, [conversation, parentId]);

  const hasBeenForked = useMemo(() => {
    if (!conversation) return false;
    const candidate = (conversation as Conversation & { hasBeenForked?: boolean; has_been_forked?: boolean }).hasBeenForked ??
      (conversation as Conversation & { hasBeenForked?: boolean; has_been_forked?: boolean }).has_been_forked;
    return Boolean(candidate ?? childId);
  }, [childId, conversation]);

  const forkDepth = useMemo(() => {
    if (!conversation) return 0;
    const candidate = (conversation as Conversation & { depth?: number; conversationDepth?: number }).depth ??
      (conversation as Conversation & { depth?: number; conversationDepth?: number }).conversationDepth;
    const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
    return parentId ? 1 : 0;
  }, [conversation, parentId]);

  const contextSummary = useMemo(
    () => getConversationContextSummary(conversation, messages, liked, t),
    [conversation, liked, messages, t]
  );
  const showConversationInsight = conversation && messages.length >= 3;

  function normalizePollMessage(payload: PollPayload): ConversationMessage | null {
    if (payload && 'status' in payload && payload.status) {
      if (payload.status === 'completed' && payload.content) {
        return {
          id: payload.id ?? payload.messageId,
          role: 'assistant',
          content: payload.content
        };
      }

      if (payload.status === 'failed') {
        throw new Error(payload.error ?? t('chat.errors.aiFailed', '응답 생성에 실패했습니다.'));
      }

      return null;
    }

    if ('content' in payload && payload.content) {
      const data = payload as ConversationMessage;
      return {
        id: data.id,
        conversationId: data.conversationId,
        role: data.role ?? 'assistant',
        content: data.content,
        timestamp: data.timestamp,
        createdAt: data.createdAt,
        rag: data.rag,
        ragMetadataId: data.ragMetadataId,
        providerElapsedMs: data.providerElapsedMs
      };
    }

    return null;
  }

  async function pollAssistantMessage(): Promise<ConversationMessage | null> {
    for (let attempt = 0; attempt < MAX_POLL_RETRIES; attempt += 1) {
      const result = await pollConversationMessage(conversationId) as PollPayload;
      const normalized = normalizePollMessage(result);
      if (normalized) {
        return normalized;
      }

      if (attempt < MAX_POLL_RETRIES - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    return null;
  }

  async function onSendMessage() {
    const nextMessage = message.trim();
    if (!nextMessage || sendPending) return;

    try {
      setSendPending(true);
      setError(null);
      setMessage('');

      try {
        const response = await sendConversationChatCompletion(conversationId, { content: nextMessage });
        setMessages((prev) => [
          ...prev,
          response.userMessage,
          {
            ...response.assistantMessage,
            rag: response.assistantMessage.rag ?? response.rag ?? null,
            ragMetadataId: response.assistantMessage.ragMetadataId ?? response.ragMetadataId ?? null,
            providerElapsedMs: response.assistantMessage.providerElapsedMs ?? response.providerElapsedMs ?? null
          }
        ]);
        setActionNotice({ tone: 'success', text: t('chat.feedback.sent', '메시지를 보냈습니다') });
        return;
      } catch {
        // Keep the MVP-C UI usable against older Spring endpoints during migration.
      }

      const optimisticAssistantId = `optimistic-assistant-${Date.now()}`;
      const userMessage = await sendConversationMessage(conversationId, { content: nextMessage });
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: optimisticAssistantId,
          role: 'assistant',
          content: t('chat.input.loading', 'AI가 응답 중입니다...')
        }
      ]);

      const aiMessage = await pollAssistantMessage();
      if (!aiMessage) {
        setMessages((prev) =>
          prev.map((entry) =>
            entry.id === optimisticAssistantId
              ? { ...entry, content: t('chat.errors.timeout', '응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.') }
              : entry
          )
        );
        return;
      }

      setMessages((prev) =>
        prev.map((entry) => (entry.id === optimisticAssistantId ? aiMessage : entry))
      );
      setActionNotice({ tone: 'success', text: t('chat.feedback.sent', '메시지를 보냈습니다') });
    } catch {
      setError(t('chat.errors.sendFailed', '메시지를 보내지 못했습니다. 잠시 후 다시 시도해주세요.'));
      setActionNotice({ tone: 'error', text: t('chat.feedback.sendFailed', '전송에 실패했습니다') });
    } finally {
      setSendPending(false);
    }
  }

  async function onToggleLike() {
    if (likePending) return;

    const previous = liked;
    setLiked(!previous);
    setLikePending(true);
    setError(null);

    try {
      if (previous) {
        await unlikeConversation(conversationId);
      } else {
        await likeConversation(conversationId);
      }
      setActionNotice({
        tone: 'success',
        text: previous ? t('chat.feedback.unliked', '좋아요를 취소했습니다') : t('chat.feedback.liked', '대화를 저장했습니다')
      });
    } catch {
      setLiked(previous);
      setError(t('chat.errors.likeFailed', '좋아요 상태를 변경하지 못했습니다.'));
      setActionNotice({ tone: 'error', text: t('chat.feedback.likeFailed', '좋아요 변경에 실패했습니다') });
    } finally {
      setLikePending(false);
    }
  }

  async function onSaveMemo() {
    if (!canManageMemo) {
      setError(t('chat.errors.memoOwnerOnly', '대화 소유자만 메모를 수정할 수 있습니다.'));
      return;
    }

    try {
      setMemoPending(true);
      setMemoSaveFailed(false);
      setError(null);
      const next = memo
        ? await updateConversationMemo(conversationId, memoInput)
        : await createConversationMemo(conversationId, memoInput);
      setMemo(next);
      setActionNotice({ tone: 'success', text: t('chat.memo.updated', '메모가 저장되었습니다.') });
    } catch {
      setMemoSaveFailed(true);
      setError(t('chat.errors.memoSaveFailed', '메모를 저장하지 못했습니다.'));
      setActionNotice({ tone: 'error', text: t('chat.feedback.memoSaveFailed', '메모 저장에 실패했습니다') });
    } finally {
      setMemoPending(false);
    }
  }

  async function onDeleteMemo() {
    if (!canManageMemo) {
      setError(t('chat.errors.memoOwnerOnly', '대화 소유자만 메모를 수정할 수 있습니다.'));
      return;
    }

    try {
      setMemoPending(true);
      setMemoSaveFailed(false);
      setError(null);
      await deleteConversationMemo(conversationId);
      setMemo(null);
      setMemoInput('');
      setActionNotice({ tone: 'success', text: t('chat.memo.cleared', '메모를 비웠습니다.') });
    } catch {
      setMemoSaveFailed(true);
      setError(t('chat.errors.memoDeleteFailed', '메모를 삭제하지 못했습니다.'));
      setActionNotice({ tone: 'error', text: t('chat.feedback.memoDeleteFailed', '메모 삭제에 실패했습니다') });
    } finally {
      setMemoPending(false);
    }
  }

  async function onConfirmFork() {
    if (forkPending) return;

    try {
      setForkPending(true);
      setError(null);
      const forked = await forkConversation(conversationId);
      setActionNotice({ tone: 'info', text: t('chat.fork.redirecting', '새 가지로 이동합니다') });
      window.location.href = `/conversations/${forked.id}`;
    } catch {
      setError(t('chat.errors.forkFailed', '대화를 분기하지 못했습니다.'));
      setActionNotice({ tone: 'error', text: t('chat.feedback.forkFailed', '가지 만들기에 실패했습니다') });
    } finally {
      setForkPending(false);
      setShowForkModal(false);
    }
  }

  async function openSources(messageId: string | undefined, passageId: string) {
    if (!messageId || sourceLoading) return;
    setSourceDrawer({ messageId, passageId });
    setSourceLoading(true);
    setSourceError(null);

    try {
      const response = await getRagSources(conversationId, messageId);
      setSourceResponse(response);
    } catch {
      setSourceResponse(null);
      setSourceError(t('chat.errors.sourceFailed', '근거를 불러오지 못했습니다.'));
    } finally {
      setSourceLoading(false);
    }
  }

  function closeSources() {
    setSourceDrawer(null);
    setSourceResponse(null);
    setSourceError(null);
  }

  const loadError = !loading && !conversation ? t('chat.loadError.title', '대화를 불러오지 못했습니다') : null;

  return (
    <main className='conversation-detail-page'>
      {actionNotice ? (
        <div className={`conversation-action-toast conversation-action-toast--${actionNotice.tone}`} role='status'>
          {actionNotice.text}
        </div>
      ) : null}
      {loadError ? (
        <section className='conversation-detail-banner'>
          <h2>{loadError}</h2>
          <p>{t('chat.loadError.description', '지금 이 대화를 열 수 없습니다. 링크를 확인하거나 잠시 후 다시 시도해주세요.')}</p>
          <Link href='/'>{t('notFound.goHome', '메인 스토리로 돌아가기')}</Link>
        </section>
      ) : null}

      <div className='conversation-detail-layout'>
        <aside className='conversation-side-panel'>
          <div className='conversation-side-panel__head'>
            <Link href='/conversations'>
              <ArrowLeft size={16} strokeWidth={2.25} aria-hidden='true' />
              {t('chat.backToList', '목록으로 돌아가기')}
            </Link>
          </div>

          <div className='conversation-side-panel__cover' aria-hidden='true'>
            <BookOpen size={42} strokeWidth={1.8} />
          </div>

          <div className='path-card'>
            <span>{t('chat.path.current', '현재 경로')}</span>
            <strong>
              {isRootConversation
                ? t('chat.path.base', '기본 경로')
                : formatTemplate(t('chat.path.forkDepth', '분기 깊이 {depth}'), { depth: forkDepth })}
            </strong>
            <p>{conversation?.title ?? t('chat.path.untitled', '대화')}</p>
          </div>

          {conversation ? (
            <ConversationContextCard
              summary={contextSummary}
              pathLabel={isRootConversation ? t('chat.context.root', '원본 경로') : t('chat.context.forked', '가지친 경로')}
            />
          ) : null}

          {parentId || childId ? (
            <div className='conversation-side-panel__meta'>
              {parentId ? <Link href={`/conversations/${parentId}`}>{t('chat.path.viewOriginal', '원본 보기')}</Link> : null}
              {childId ? <Link href={`/conversations/${childId}`}>{t('chat.path.viewFork', '분기 보기')}</Link> : null}
            </div>
          ) : null}

          <section className='conversation-memo-panel'>
            <div className='conversation-memo-panel__header'>
              <div className='conversation-memo-panel__title'>
                <span>{t('chat.memo.eyebrow', '나만 보는 노트')}</span>
                <h2>{t('chat.memo.title', '개인 메모')}</h2>
              </div>
              <div className='conversation-memo-panel__meta'>
                <span className={`conversation-memo-status conversation-memo-status--${memoSaveStatus.tone}`}>
                  {memoSaveStatus.label}
                </span>
                <PenLine size={18} strokeWidth={2.25} aria-hidden='true' />
              </div>
            </div>
            <div className='conversation-memo-field'>
              <textarea
                value={memoInput}
                onChange={(event) => {
                  setMemoSaveFailed(false);
                  setMemoInput(event.target.value);
                }}
                placeholder={t('chat.memo.placeholder', '이 대화에서 떠오른 생각을 남겨보세요.')}
                disabled={!canManageMemo || memoPending}
              />
              <div className='conversation-memo-field__footer'>
                <span>{memoInput.trim().length}자</span>
                <span>{t('chat.memo.privateHint', '내 계정에만 저장됩니다')}</span>
              </div>
            </div>
            <div className='conversation-memo-panel__actions'>
              <button type='button' onClick={onSaveMemo} disabled={!canManageMemo || memoPending}>
                {t('chat.memo.save', '저장')}
              </button>
              <button type='button' onClick={onDeleteMemo} disabled={!canManageMemo || memoPending}>
                {t('chat.memo.clear', '비우기')}
              </button>
            </div>
          </section>

          <div data-testid='has-been-forked' data-forked={String(hasBeenForked)} className='sr-only' />
          <div data-testid='conversation-depth' data-depth={String(forkDepth)} className='sr-only' />
          <div data-testid='is-root-conversation' data-is-root={String(isRootConversation)} className='sr-only' />
        </aside>

        <section className='conversation-chat-panel'>
          <header className='conversation-chat-header'>
            <div>
              {conversation ? <h1>{conversation.title}</h1> : <h1 className='sr-only'>{t('profile.conversation', '대화')}</h1>}
              <p>
                {isRootConversation
                  ? t('chat.path.baseConversation', '기본 대화')
                  : formatTemplate(t('chat.path.forkedConversation', '분기된 대화 · 깊이 {depth}'), { depth: forkDepth })}
              </p>
            </div>
            <div className='conversation-header-actions'>
              <button type='button' onClick={onToggleLike} disabled={!conversation || likePending} aria-pressed={liked}>
                <Heart size={17} strokeWidth={2.25} fill={liked ? 'currentColor' : 'none'} aria-hidden='true' />
                {liked ? t('chat.unlike', '좋아요 취소') : t('chat.like', '좋아요')}
              </button>
            </div>
          </header>

          {conversation && !isRootConversation ? (
            <div className='fork-navigation-widget' data-testid='fork-navigation-widget'>
              <GitBranch size={16} strokeWidth={2.25} aria-hidden='true' />
              {forkRelationship?.parent ? (
                <Link href={`/conversations/${forkRelationship.parent.id}`}>{t('chat.path.viewOriginal', '원본 보기')}</Link>
              ) : parentId ? (
                <Link href={`/conversations/${parentId}`}>{t('chat.path.viewOriginal', '원본 보기')}</Link>
              ) : (
                <span>{t('chat.forkedConversation', `분기된 대화 (깊이: ${forkDepth})`).replace('{depth}', String(forkDepth))}</span>
              )}
            </div>
          ) : null}

          {conversation ? (
            <div className='conversation-context-strip' aria-label={t('chat.context.label', '대화 맥락')}>
              <span>{isRootConversation ? t('chat.context.root', '원본 경로') : t('chat.context.forked', '가지친 경로')}</span>
              <span>{t('chat.context.evidence', '근거 기반 답변')}</span>
              <span>{t('chat.context.userLed', '사용자가 시작한 대화')}</span>
            </div>
          ) : null}

          {conversation ? (
            <ConversationContextCard
              summary={contextSummary}
              pathLabel={isRootConversation ? t('chat.context.root', '원본 경로') : t('chat.context.forked', '가지친 경로')}
              compact
            />
          ) : null}

          {conversation && isRootConversation && !isConversationOwner ? (
            <div className='fork-action-banner'>
              <div>
                <p>{t('chat.fork.title', '이 지점에서 가지치기')}</p>
                <span>{t('chat.fork.description', '최근 흐름을 이어받아 다른 해석의 길을 열어봅니다.')}</span>
              </div>
              <button
                type='button'
                data-testid='fork-conversation-button'
                onClick={() => setShowForkModal(true)}
                disabled={!conversation}
              >
                <GitBranch size={16} strokeWidth={2.25} aria-hidden='true' />
                {t('chat.fork.action', '가지치기')}
              </button>
            </div>
          ) : null}

          <div className='conversation-chat-log'>
            {error && !loadError ? <p className='conversation-inline-error'>{error}</p> : null}
            {loading ? (
              <SkeletonState className='conversation-message-skeleton' rows={3} variant='messages' />
            ) : null}

            {!loading && messages.length === 0 ? (
              <StatusState
                compact
                className='conversation-empty'
                title={t('chat.startConversation', '대화를 시작해보세요')}
                description={t('chat.askAnything', '인물에게 장면, 선택, 다른 가능성에 대해 물어볼 수 있어요.')}
              >
                <MessageCircleIcon />
                <button
                  type='button'
                  className='conversation-empty__action'
                  onClick={() => setMessage(t('chat.emptyPrompt', '이 장면에서 가장 중요한 선택은 무엇인가요?'))}
                >
                  {t('chat.emptyPromptAction', '첫 질문 넣기')}
                </button>
              </StatusState>
            ) : null}

            {messages.length > 0 ? (
              <ul ref={messagesContainerRef} data-testid='messages-container'>
                {messages.map((item, index) => {
                  const citations = getMessageCitations(item);
                  const groundingStatus = item.rag?.groundingStatus ?? item.rag?.grounding_status;
                  const fallbackUsed = item.rag?.fallbackUsed ?? item.rag?.fallback_used;
                  const timestamp = getMessageTimestamp(item, locale);
                  const shouldShowEvidence = item.role === 'assistant' && (Boolean(item.rag) || citations.length > 0);
                  return (
                    <li
                      key={item.id ?? `${item.role}-${index}`}
                      className={`conversation-message conversation-message--${item.role}`}
                    >
                      <div className='conversation-message__body'>
                        <div className='conversation-message__meta'>
                          <span className='conversation-message__role'>{getRoleLabel(item.role, t)}</span>
                          {timestamp ? <time>{timestamp}</time> : null}
                        </div>
                        <p>{item.content}</p>
                        {shouldShowEvidence ? (
                          <div className='rag-strip' aria-label={t('chat.evidence.label', '근거 정보')}>
                            <span>{formatGroundingStatus(groundingStatus, fallbackUsed, t)}</span>
                            {citations.length > 0 ? (
                              <span>{formatTemplate(t('chat.evidence.sourceCount', '근거 {count}개'), { count: citations.length })}</span>
                            ) : null}
                          </div>
                        ) : null}
                        {citations.length > 0 ? (
                          <div className='citation-row' aria-label={t('chat.evidence.citationsLabel', '참고 근거')}>
                            {citations.map((citation, citationIndex) => {
                              const passageId = readPassageId(citation);
                              const rank = readFinalRank(citation) ?? citationIndex + 1;
                              return (
                                <button
                                  key={`${passageId}-${citationIndex}`}
                                  type='button'
                                  onClick={() => void openSources(item.id, passageId)}
                                >
                                  {getSourceLabel(rank, t)}
                                  <span>{citation.chapter ?? t('chat.evidence.open', '보기')}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {showConversationInsight ? (
              <ConversationInsightCard
                summary={contextSummary}
                messageCount={messages.length}
                branchHref={getScenarioHref(conversation)}
                onPickPrompt={(prompt) => setMessage(prompt)}
              />
            ) : null}

            {sendPending ? (
              <div className='conversation-typing' data-testid='typing-indicator'>
                <Loader2 size={16} strokeWidth={2.25} aria-hidden='true' />
                {t('chat.aiThinking', '인물의 기억과 관련 장면을 맞춰보고 있어요...')}
              </div>
            ) : null}
          </div>

          <form
            className='conversation-chat-input'
            onSubmit={(event) => {
              event.preventDefault();
              void onSendMessage();
            }}
          >
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              aria-label={t('chat.input.ariaLabel', '메시지 입력')}
              placeholder={t('chat.input.placeholder', '이 장면에서 묻고 싶은 것을 입력하세요.')}
              disabled={!conversation}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (!sendPending && message.trim()) {
                    void onSendMessage();
                  }
                }
              }}
            />
            <button type='submit' disabled={!conversation || !message.trim() || sendPending}>
              <Send size={18} strokeWidth={2.25} aria-hidden='true' />
              {t('chat.input.send', '전송')}
            </button>
          </form>
        </section>
      </div>

      {sourceDrawer ? (
        <aside className='source-drawer' aria-label={t('chat.evidence.drawerLabel', '근거 보기')}>
          <div className='source-drawer__panel'>
            <header>
              <div>
                <span>{t('chat.evidence.drawerEyebrow', '관련 장면')}</span>
                <h2>{t('chat.evidence.drawerTitle', '답변이 참고한 문맥')}</h2>
              </div>
              <button type='button' onClick={closeSources} aria-label={t('chat.closeSources', '근거 닫기')}>
                <X size={18} strokeWidth={2.25} aria-hidden='true' />
              </button>
            </header>

            {sourceLoading ? (
              <LoadingState
                compact
                className='source-drawer__state'
                title={t('chat.sourceLoading', '근거를 불러오는 중입니다')}
                description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
              />
            ) : null}
            {sourceError ? <p className='source-drawer__error'>{sourceError}</p> : null}

            {!sourceLoading && sourceResponse ? (
              <div className='source-drawer__sources'>
                <div className='source-drawer__summary'>
                  <span>{formatGroundingStatus(sourceResponse.groundingStatus, undefined, t)}</span>
                  <span>{formatTemplate(t('chat.evidence.sourceCount', '근거 {count}개'), { count: sourceResponse.citations.length })}</span>
                </div>
                {orderSourceCitations(sourceResponse.citations, sourceDrawer.passageId).map((citation, index) => {
                  const passageId = readPassageId(citation);
                  const rank = readFinalRank(citation) ?? index + 1;
                  return (
                    <article key={`${passageId}-${index}`} className='source-card'>
                      <div>
                        <strong>{getSourceLabel(rank, t)}</strong>
                        <span>{citation.chapter ?? t('chat.evidence.sourceTitle', '근거 문단')}</span>
                      </div>
                      {readSourceAvailable(citation) && citation.text ? (
                        <p>{citation.text}</p>
                      ) : (
                        <p>{t('chat.evidence.unavailable', '현재 이 근거의 원문을 표시할 수 없습니다.')}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}

      {showForkModal ? (
        <div className='fork-modal' data-testid='fork-modal'>
          <div className='fork-modal__card'>
            <h3>{t('chat.fork.modalTitle', '이 지점에서 가지를 만들까요?')}</h3>
            <p>{t('chat.fork.modalDescription', '최근 메시지를 이어받아 다른 해석으로 대화를 계속할 수 있습니다.')}</p>
            <div className='fork-modal__actions'>
              <button
                type='button'
                data-testid='cancel-fork-button'
                disabled={forkPending}
                onClick={() => setShowForkModal(false)}
              >
                {t('common.cancel', '취소')}
              </button>
              <button
                type='button'
                data-testid='confirm-fork-button'
                disabled={forkPending}
                onClick={() => {
                  void onConfirmFork();
                }}
              >
                {forkPending ? t('chat.fork.pending', '가지를 만드는 중...') : t('chat.fork.confirm', '가지 만들기')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ConversationInsightCard({
  summary,
  messageCount,
  branchHref,
  onPickPrompt
}: {
  summary: ConversationContextSummary;
  messageCount: number;
  branchHref: string;
  onPickPrompt: (prompt: string) => void;
}) {
  const prompts = [
    `${summary.characterName}은 이 선택을 어떻게 받아들이나요?`,
    `원작과 가장 달라지는 장면은 어디인가요?`,
    '이 지점에서 새 가지를 만들면 어떤 가능성이 열리나요?'
  ];

  return (
    <aside className='conversation-insight-card' aria-labelledby='conversation-insight-title'>
      <div className='conversation-insight-card__head'>
        <span>대화 정리</span>
        <h2 id='conversation-insight-title'>지금까지의 흐름</h2>
      </div>
      <p>
        {summary.scenarioTitle}에서 {summary.characterName}와 {messageCount}개의 메시지를 주고받았습니다.
        이제 선택의 이유를 더 묻거나, 이 지점에서 새 가지를 만들 수 있어요.
      </p>
      <div className='conversation-insight-card__prompts' aria-label='다음 질문'>
        {prompts.map((prompt) => (
          <button key={prompt} type='button' onClick={() => onPickPrompt(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <Link href={branchHref} className='conversation-insight-card__branch'>
        <GitBranch size={16} strokeWidth={2.25} aria-hidden='true' />
        이 지점에서 새 가지 만들기
      </Link>
    </aside>
  );
}

function MessageCircleIcon() {
  return (
    <div aria-hidden='true' className='conversation-empty__icon'>
      <BookOpen size={42} strokeWidth={1.8} />
    </div>
  );
}

function ConversationContextCard({
  summary,
  pathLabel,
  compact = false
}: {
  summary: ConversationContextSummary;
  pathLabel: string;
  compact?: boolean;
}) {
  const className = compact
    ? 'conversation-context-card conversation-context-card--mobile'
    : 'conversation-context-card';

  return (
    <section className={className} aria-label='대화 상세 맥락'>
      <div className='conversation-context-card__head'>
        <span>{pathLabel}</span>
        <strong>{summary.scenarioTitle}</strong>
      </div>
      <p>{summary.scenarioDescription}</p>
      <dl className='conversation-context-card__grid'>
        <div>
          <dt>책</dt>
          <dd>
            {summary.bookTitle}
            <small>{summary.bookAuthor}</small>
          </dd>
        </div>
        <div>
          <dt>인물</dt>
          <dd>{summary.characterName}</dd>
        </div>
        <div>
          <dt>대화</dt>
          <dd>{summary.messageCount}개</dd>
        </div>
        <div>
          <dt>저장</dt>
          <dd>{summary.likeCount}명</dd>
        </div>
      </dl>
    </section>
  );
}
