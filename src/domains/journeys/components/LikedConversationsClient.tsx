'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { unlikeConversation } from '@/api/conversationApi';
import { getLikedConversations } from '@/api/socialApi';
import { LoadingState } from '@/components/LoadingState';
import type { Conversation } from '@/domains/journeys/types/core';
import { useLocale } from '@/i18n/useLocale';

function readConversationText(conversation: Conversation, keys: string[], fallback: string): string {
  const record = conversation as Conversation & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readConversationNumber(conversation: Conversation, keys: string[], fallback = 0): number {
  const record = conversation as Conversation & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }

  return fallback;
}

export function LikedConversationsClient() {
  const { t } = useLocale();
  const [items, setItems] = useState<Conversation[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLiked, setTotalLiked] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setToastMessage(null);

    getLikedConversations(currentPage, 20)
      .then((response) => {
        if (!mounted) return;
        setItems(response.content ?? []);
        setTotalLiked(response.totalElements ?? response.content?.length ?? 0);
        setTotalPages(response.totalPages ?? 0);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        setToastMessage('좋아요한 대화를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentPage]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function onUnlike(conversationId: string) {
    if (pendingId) return;
    const previous = items;
    setPendingId(conversationId);
    setItems((prev) => prev.filter((item) => item.id !== conversationId));
    setTotalLiked((prev) => Math.max(0, prev - 1));
    setToastMessage(null);

    try {
      await unlikeConversation(conversationId);
    } catch {
      setItems(previous);
      setTotalLiked((prev) => prev + 1);
      setToastMessage('좋아요를 취소하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setPendingId(null);
    }
  }

  const totalLabel = useMemo(() => `${totalLiked}개의 좋아요한 대화`, [totalLiked]);

  return (
    <main className='liked-page'>
      {toastMessage ? (
        <div className='toast-error' role='alert'>
          <span>×</span>
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <header className='liked-page__header'>
        <span>저장한 대화</span>
        <h1>좋아요한 대화</h1>
        <p>{totalLabel}를 다시 열어볼 수 있습니다.</p>
      </header>

      {loading ? (
        <LoadingState
          compact
          className='liked-loading'
          title={t('chat.loadingConversation', '대화를 불러오는 중입니다')}
          description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
        />
      ) : null}

      {!loading && items.length === 0 ? (
        <section className='liked-empty'>
          <div className='liked-empty__icon' aria-hidden='true'>
            <Heart size={34} strokeWidth={1.9} />
          </div>
          <h2>아직 좋아요한 대화가 없습니다</h2>
          <p>마음에 드는 대화를 좋아요해두면 여기에서 바로 이어갈 수 있어요.</p>
          <Link href='/scenarios' className='liked-empty__button'>
            가지 둘러보기
          </Link>
        </section>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className='liked-list'>
          {items.map((item) => {
            const bookTitle = readConversationText(item, ['bookTitle', 'book_title'], '작품 정보 없음');
            const preview = readConversationText(
              item,
              ['scenarioDescription', 'scenario_description', 'description'],
              '이 대화에서 이어진 장면과 인물의 선택을 다시 확인할 수 있습니다.'
            );
            const messageCount = readConversationNumber(item, ['messageCount', 'message_count'], item.messages?.length ?? 0);
            const likeCount = readConversationNumber(item, ['likeCount', 'like_count'], item.likeCount ?? 0);

            return (
              <li key={item.id} className='liked-list-card'>
                <div className='liked-list-card__copy'>
                  <span className='liked-list-card__kicker'>
                    <MessageCircle size={15} strokeWidth={2.25} aria-hidden='true' />
                    {bookTitle}
                  </span>
                  <Link href={`/conversations/${item.id}`}>{item.title || '제목 없는 대화'}</Link>
                  <p>{preview}</p>
                  <div className='liked-list-card__stats' aria-label='대화 활동'>
                    <span>{messageCount}개 메시지</span>
                    <span>{likeCount}개 좋아요</span>
                  </div>
                </div>
                <div className='liked-list-card__actions'>
                  <Link href={`/conversations/${item.id}`}>대화 열기</Link>
                  <button type='button' disabled={pendingId === item.id} onClick={() => void onUnlike(item.id)}>
                    <Heart size={15} strokeWidth={2.25} aria-hidden='true' />
                    {pendingId === item.id ? '취소 중' : '좋아요 취소'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {totalPages > 1 ? (
        <div className='liked-pagination'>
          <button
            type='button'
            disabled={loading || currentPage <= 0}
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
          >
            <ArrowLeft size={15} strokeWidth={2.25} aria-hidden='true' />
            이전
          </button>
          <span>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type='button'
            disabled={loading || currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev))}
          >
            다음
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden='true' />
          </button>
        </div>
      ) : null}
    </main>
  );
}
