'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GitBranch, MessageCircle } from 'lucide-react';
import { searchScenarios } from '@/domains/journeys/services/scenarioApi';
import { SkeletonState, StatusState } from '@/components/LoadingState';
import type { Scenario } from '@/domains/journeys/types/core';
import { toPositiveInt } from '@/domains/journeys/utils/routeQuery';
import { useLocale } from '@/i18n/useLocale';

function parseParams(searchParams: URLSearchParams) {
  return {
    query: searchParams.get('query') ?? '',
    filter: searchParams.get('filter') ?? '',
    sort: searchParams.get('sort') ?? 'latest',
    page: toPositiveInt(searchParams.get('page'), 0),
    size: toPositiveInt(searchParams.get('size'), 20)
  };
}

export function ScenarioListClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = useSearchParams();

  const [items, setItems] = useState<Scenario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => parseParams(new URLSearchParams(currentSearch.toString())), [currentSearch]);
  const filterOptions = useMemo(
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

    if (merged.query) query.set('query', merged.query);
    if (merged.filter) query.set('filter', merged.filter);
    if (merged.sort && merged.sort !== 'latest') query.set('sort', merged.sort);
    if (merged.page > 0) query.set('page', String(merged.page));
    if (merged.size !== 20) query.set('size', String(merged.size));

    const encoded = query.toString();
    router.replace(encoded ? `${pathname}?${encoded}` : pathname);
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const response = await searchScenarios(params);
        if (!mounted) return;
        setItems(response.content ?? []);
        setTotal(response.totalElements ?? response.content.length);
      } catch {
        if (!mounted) return;
        setItems([]);
        setTotal(0);
        setError(t('scenario.error', '가지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [params, t]);

  return (
    <main className='scenario-list-page'>
      <section className='page-hero page-hero--compact'>
        <span>가지 탐색</span>
        <h1>{t('scenario.title', '가지')}</h1>
        <p>책에서 갈라진 해석과 가정형 가지를 둘러보세요.</p>
      </section>

      <div className='scenario-list-toolbar'>
        <div className='scenario-list-pills'>
          {filterOptions.map((option) => (
            <button
              key={option.label}
              type='button'
              className={params.filter === option.value ? 'is-active' : ''}
              onClick={() => updateRoute({ filter: option.value, page: 0 })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className='scenario-list-sort'>
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

      {!loading && !error ? <p className='scenario-list-count'>{total} {t('scenario.count.available', '개의 가지 이용 가능')}</p> : null}

      {loading ? (
        <SkeletonState
          className='scenario-list-loading'
          rows={3}
          variant='cards'
        />
      ) : null}
      {!loading && error ? (
        <StatusState
          compact
          tone='error'
          className='scenario-list-error'
          title={t('scenario.errorTitle', '가지를 불러오지 못했습니다')}
          description={error}
          actionHref='/scenarios'
          actionLabel={t('common.retryList', '목록 다시 보기')}
        />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <StatusState
          compact
          className='scenario-list-empty'
          title={t('scenario.emptyTitle', '아직 펼쳐진 가지가 없습니다')}
          description={t('scenario.emptyDescription', '책을 고르고 첫 가정형 가지를 만들면 이곳에 가지가 쌓입니다.')}
          actionHref='/books'
          actionLabel={t('scenario.emptyAction', '책에서 시작하기')}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className='scenario-list-grid'>
          {items.map((scenario) => {
            const branchCount = (scenario as Scenario & { forkCount?: number; fork_count?: number }).forkCount ??
              (scenario as Scenario & { forkCount?: number; fork_count?: number }).fork_count ?? 0;
            const conversationCount = (scenario as Scenario & { conversationCount?: number; conversation_count?: number }).conversationCount ??
              (scenario as Scenario & { conversationCount?: number; conversation_count?: number }).conversation_count ?? 0;
            const bookTitle = (scenario as Scenario & { bookTitle?: string; book_title?: string }).bookTitle ??
              (scenario as Scenario & { bookTitle?: string; book_title?: string }).book_title;
            return (
              <li key={scenario.id} className='scenario-list-card'>
                <div className='scenario-list-card__meta'>
                  <span>{scenario.visibility === 'PRIVATE' ? '비공개 가지' : '공개 가지'}</span>
                  {bookTitle ? <span>{bookTitle}</span> : null}
                </div>
                <Link href={`/scenarios/${scenario.id}`}>{scenario.title}</Link>
                <p>{scenario.description || '원작에서 바뀐 선택을 따라 새로운 대화로 이어지는 가지입니다.'}</p>
                <div className='scenario-list-card__stats' aria-label='가지 활동'>
                  <span>
                    <GitBranch size={15} strokeWidth={2.25} aria-hidden='true' />
                    {branchCount} 가지
                  </span>
                  <span>
                    <MessageCircle size={15} strokeWidth={2.25} aria-hidden='true' />
                    {conversationCount} 대화
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
