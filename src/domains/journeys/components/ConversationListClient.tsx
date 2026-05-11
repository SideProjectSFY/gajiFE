'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { listConversations } from '@/api/conversationApi';
import { LoadingState } from '@/components/LoadingState';
import type { Conversation } from '@/domains/journeys/types/core';
import { toPositiveInt } from '@/domains/journeys/utils/routeQuery';
import { useLocale } from '@/i18n/useLocale';

function parseParams(searchParams: URLSearchParams) {
  return {
    page: toPositiveInt(searchParams.get('page'), 0),
    size: toPositiveInt(searchParams.get('size'), 20),
    filter: searchParams.get('filter') ?? '',
    search: searchParams.get('search') ?? '',
    genre: searchParams.get('genre') ?? '',
    sort: searchParams.get('sort') ?? 'latest'
  };
}

export function ConversationListClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = useSearchParams();

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => parseParams(new URLSearchParams(currentSearch.toString())), [currentSearch]);
  const genres = useMemo(
    () => [
      { label: t('conversations.filters.allGenres', '모든 장르'), value: '' },
      { label: t('conversations.filters.romance', '로맨스'), value: 'Romance' },
      { label: t('conversations.filters.classic', '고전'), value: 'Classic' },
      { label: t('conversations.filters.genre', '장르'), value: 'Genre' },
      { label: t('conversations.filters.adventure', '모험'), value: 'Adventure' },
      { label: t('conversations.filters.dystopian', '디스토피아'), value: 'Dystopian' }
    ],
    [t]
  );
  const sortOptions = useMemo(
    () => [
      { label: t('conversations.sort.latest', '최신순'), value: 'latest' },
      { label: t('conversations.sort.recommended', '추천순'), value: 'recommended' },
      { label: t('conversations.sort.popular', '인기순'), value: 'popular' }
    ],
    [t]
  );

  function updateRoute(next: Partial<typeof params>) {
    const merged = { ...params, ...next };
    const query = new URLSearchParams();

    if (merged.page > 0) query.set('page', String(merged.page));
    if (merged.size !== 20) query.set('size', String(merged.size));
    if (merged.filter) query.set('filter', merged.filter);
    if (merged.search) query.set('search', merged.search);
    if (merged.genre) query.set('genre', merged.genre);
    if (merged.sort && merged.sort !== 'latest') query.set('sort', merged.sort);

    const encoded = query.toString();
    router.replace(encoded ? `${pathname}?${encoded}` : pathname);
  }

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    listConversations(params)
      .then((response) => {
        if (!mounted) return;
        const list = response.content ?? [];
        setItems(list.filter((item) => item.id));
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        setError('대화를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [params]);

  return (
    <main className='conversation-list-page'>
      <section className='page-hero page-hero--compact'>
        <span>{t('conversations.heroEyebrow', '대화')}</span>
        <h1>{t('nav.conversations', '대화')}</h1>
        <p>{t('conversations.heroDescription', '근거가 붙은 답변과 분기 가능한 대화를 이어보세요.')}</p>
      </section>

      <div className='conversation-list-toolbar'>
        <div className='conversation-list-pills'>
          {genres.map((genre) => (
            <button
              key={genre.label}
              type='button'
              className={params.genre === genre.value ? 'is-active' : ''}
              onClick={() => updateRoute({ genre: genre.value, page: 0 })}
            >
              {genre.label}
            </button>
          ))}
        </div>

        <div className='conversation-list-sort'>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type='button'
              className={params.sort === option.value ? 'is-active' : ''}
              onClick={() => updateRoute({ sort: option.value, page: 0 })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && !error ? <p className='conversation-list-count'>{items.length} {t('conversations.count.available', '개의 대화 이용 가능')}</p> : null}

      {loading ? (
        <LoadingState
          compact
          className='conversation-list-loading'
          title={t('chat.loadingConversation', '대화를 불러오는 중입니다')}
          description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
        />
      ) : null}

      {!loading && error ? <p className='conversation-list-error'>{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className='conversation-list-empty'>{t('conversations.empty', '대화를 찾을 수 없습니다.')}</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className='conversation-list-grid'>
          {items.map((item) => (
            <li key={item.id}>
              <div className='conversation-list-card-head'>
                <div className='conversation-list-avatar'>{item.id ? '👤' : '📚'}</div>
                <div>
                  <Link href={`/conversations/${item.id}`}>{item.title || t('conversations.unknown.title', '제목 없는 대화')}</Link>
                  <p>
                    {(item as Conversation & { bookTitle?: string }).bookTitle ?? t('conversations.unknown.book', '알 수 없는 책')} {t('conversations.by', '저자:')}{' '}
                    {(item as Conversation & { bookAuthor?: string }).bookAuthor ?? t('conversations.unknown.author', '알 수 없는 저자')}
                  </p>
                </div>
              </div>

              <p className='conversation-list-description'>
                {(item as Conversation & { scenarioDescription?: string }).scenarioDescription ??
                  t('conversations.noDescription', '이 대화에 대한 설명이 없습니다.')}
              </p>

              <div className='conversation-list-stats'>
                <span>💬 {(item as Conversation & { messageCount?: number }).messageCount ?? (item.messages?.length ?? 0)} {t('conversations.messageCount', '메시지')}</span>
              </div>

              <div className='conversation-list-actions'>
                <Link href={`/conversations/${item.id}`} className='conversation-list-open'>
                  {t('conversations.actions.openConversation', '대화 열기')}
                </Link>
                {(item as Conversation & { bookId?: string }).bookId ? (
                  <Link href={`/books/${(item as Conversation & { bookId?: string }).bookId}`} aria-label='책 보기'>📖</Link>
                ) : (
                  <Link href='/books' aria-label='책 보기'>📖</Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
