'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Compass, GitBranch, MessageCircle, Search, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { searchAll } from '@/api/searchApi';
import type { Conversation, Scenario, SearchResult } from '@/domains/journeys/types/core';
import { toPositiveInt } from '@/domains/journeys/utils/routeQuery';
import { useLocale } from '@/i18n/useLocale';

function parseParams(searchParams: URLSearchParams) {
  return {
    query: searchParams.get('query') ?? '',
    page: toPositiveInt(searchParams.get('page'), 0),
    size: toPositiveInt(searchParams.get('size'), 6)
  };
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function bookLabel(book: Record<string, unknown>, fallbackId: number) {
  const idCandidate = book.id ?? book.bookId ?? `book-${fallbackId}`;
  const titleCandidate = book.title ?? book.name ?? book.bookTitle ?? '제목 없는 책';
  return {
    id: String(idCandidate),
    title: readString(titleCandidate, '제목 없는 책'),
    meta: readString(book.author, readString(book.genre, '책에서 시작하기')),
    description: readString(book.description, '이 작품에서 만들 수 있는 가지와 대화를 살펴보세요.'),
    count: readNumber(book.scenarioCount ?? book.scenario_count)
  };
}

function conversationMeta(item: Conversation): string {
  const record = item as Conversation & Record<string, unknown>;
  return readString(record.bookTitle, readString(record.book_title, '대화 이어가기'));
}

function scenarioMeta(item: Scenario): string {
  const record = item as Scenario & Record<string, unknown>;
  return readString(record.bookTitle, readString(record.book_title, item.visibility === 'PRIVATE' ? '비공개 가지' : '공개 가지'));
}

export function SearchClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = useSearchParams();

  const params = useMemo(() => parseParams(new URLSearchParams(currentSearch.toString())), [currentSearch]);
  const [activeTab, setActiveTab] = useState<'all' | 'book' | 'scenario' | 'conversation' | 'user'>('all');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.query.trim()) {
      setResult({ books: [], conversations: [], users: [], scenarios: [] });
      setError(null);
      return;
    }

    searchAll(params)
      .then((payload) => {
        setResult(payload);
        setError(null);
      })
      .catch(() => {
        setResult(null);
        setError(t('common.error', '오류'));
      });
  }, [params, t]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get('query') ?? '').trim();

    const next = new URLSearchParams();
    if (query) next.set('query', query);
    next.set('page', '0');
    next.set('size', String(params.size));

    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }

  const counts = {
    books: result?.books.length ?? 0,
    conversations: result?.conversations.length ?? 0,
    users: result?.users.length ?? 0,
    scenarios: result?.scenarios.length ?? 0
  };

  const totalCount = counts.books + counts.conversations + counts.users + counts.scenarios;

  const showInitial = !params.query.trim() && !error;
  const showEmpty = params.query.trim() && !error && (result ? totalCount === 0 : false);

  return (
    <main className='search-page'>
      <section className='page-hero page-hero--compact'>
        <span>검색</span>
        <h1>{t('nav.search', '검색')}</h1>
        <p>책, 가지, 대화, 사용자를 한 번에 찾습니다.</p>
      </section>

      <form className='search-page__form' onSubmit={onSubmit}>
        <Search size={18} strokeWidth={2.25} aria-hidden='true' />
        <input
          name='query'
          defaultValue={params.query}
          aria-label={t('search.ariaLabel', '책, 가지, 대화, 사용자 검색')}
          placeholder={t('search.placeholder', '책, 가지, 대화, 사용자 검색...')}
        />
      </form>

      <div className='search-page__tabs'>
        <button
          type='button'
          className={activeTab === 'all' ? 'is-active' : ''}
          onClick={() => setActiveTab('all')}
        >
          {t('searchPage.tabs.all', '전체')}
        </button>
        <button
          type='button'
          className={activeTab === 'book' ? 'is-active' : ''}
          onClick={() => setActiveTab('book')}
        >
          {t('searchPage.tabs.book', '책')} ({counts.books})
        </button>
        <button
          type='button'
          className={activeTab === 'scenario' ? 'is-active' : ''}
          onClick={() => setActiveTab('scenario')}
        >
          가지 ({counts.scenarios})
        </button>
        <button
          type='button'
          className={activeTab === 'conversation' ? 'is-active' : ''}
          onClick={() => setActiveTab('conversation')}
        >
          {t('searchPage.tabs.conversation', '대화')} ({counts.conversations})
        </button>
        <button
          type='button'
          className={activeTab === 'user' ? 'is-active' : ''}
          onClick={() => setActiveTab('user')}
        >
          {t('searchPage.tabs.user', '사용자')} ({counts.users})
        </button>
      </div>

      {error ? (
        <div className='search-page__error-wrap' role='alert'>
          <div className='search-page__error-msg'>{t('search.error', '검색 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')}</div>
        </div>
      ) : null}

      {showInitial ? (
        <section className='search-empty-card'>
          <div className='search-empty-card__icon'><Compass size={34} strokeWidth={1.9} aria-hidden='true' /></div>
          <h2>{t('searchPage.initialState.title', '검색을 시작하세요')}</h2>
          <p>{t('searchPage.initialState.description', '작품명, 인물, 가지 제목, 독자 이름으로 찾아볼 수 있습니다.')}</p>
        </section>
      ) : null}

      {showEmpty ? (
        <section className='search-empty-card'>
          <div className='search-empty-card__icon'><Search size={34} strokeWidth={1.9} aria-hidden='true' /></div>
          <h2>{t('searchPage.noResults.title', '검색 결과가 없습니다')}</h2>
          <p>{t('searchPage.noResults.description', '다른 키워드로 검색해보세요')}</p>
          <Link href='/books'>책 목록에서 다시 시작하기</Link>
        </section>
      ) : null}

      {!showInitial && !showEmpty && result ? (
        <div className='search-results'>
          {(activeTab === 'all' || activeTab === 'book') && (
            <section className='search-result-section'>
              <div className='search-result-section__header'>
                <div>
                  <h2>{t('searchPage.sections.book', '책')} ({counts.books})</h2>
                  <p>작품에서 바로 시작할 수 있는 가지를 찾습니다.</p>
                </div>
              </div>
              {counts.books === 0 ? <p className='search-section-empty'>{t('search.noResults.books', '책 결과가 없습니다.')}</p> : null}
              {counts.books > 0 ? (
                <div className='search-result-grid'>
                  {result.books.map((book, index) => {
                    const parsed = bookLabel(book, index);
                    return (
                      <SearchResultCard
                        key={parsed.id}
                        href={`/books/${encodeURIComponent(parsed.id)}`}
                        icon='book'
                        label='책'
                        title={parsed.title}
                        meta={parsed.meta}
                        description={parsed.count ? `${parsed.count}개의 가지에서 시작할 수 있습니다.` : parsed.description}
                      />
                    );
                  })}
                </div>
              ) : null}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'scenario') && (
            <section className='search-result-section'>
              <div className='search-result-section__header'>
                <div>
                  <h2>가지 ({counts.scenarios})</h2>
                  <p>원작에서 달라지는 선택과 대화 시작점을 확인합니다.</p>
                </div>
              </div>
              {counts.scenarios === 0 ? <p className='search-section-empty'>가지 결과가 없습니다.</p> : null}
              {counts.scenarios > 0 ? (
                <div className='search-result-grid'>
                  {result.scenarios.map((item) => (
                    <SearchResultCard
                      key={item.id}
                      href={`/scenarios/${encodeURIComponent(item.id)}`}
                      icon='scenario'
                      label='가지'
                      title={item.title}
                      meta={scenarioMeta(item)}
                      description={item.description || '원작의 선택을 다르게 놓고 대화를 시작할 수 있습니다.'}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'conversation') && (
            <section className='search-result-section'>
              <div className='search-result-section__header'>
                <div>
                  <h2>{t('searchPage.sections.conversation', '대화')} ({counts.conversations})</h2>
                  <p>이미 이어진 해석과 근거 있는 응답을 다시 엽니다.</p>
                </div>
              </div>
              {counts.conversations === 0 ? <p className='search-section-empty'>{t('search.noResults.conversations', '대화 결과가 없습니다.')}</p> : null}
              {counts.conversations > 0 ? (
                <div className='search-result-grid'>
                  {result.conversations.map((item) => (
                    <SearchResultCard
                      key={item.id}
                      href={`/conversations/${encodeURIComponent(item.id)}`}
                      icon='conversation'
                      label='대화'
                      title={item.title}
                      meta={conversationMeta(item)}
                      description='인물의 응답과 근거를 이어서 확인할 수 있습니다.'
                    />
                  ))}
                </div>
              ) : null}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'user') && (
            <section className='search-result-section'>
              <div className='search-result-section__header'>
                <div>
                  <h2>{t('searchPage.sections.user', '사용자')} ({counts.users})</h2>
                  <p>공개 활동과 저장한 대화가 있는 독자를 찾습니다.</p>
                </div>
              </div>
              {counts.users === 0 ? <p className='search-section-empty'>{t('search.noResults.users', '사용자 결과가 없습니다.')}</p> : null}
              {counts.users > 0 ? (
                <div className='search-result-grid'>
                  {result.users.map((item) => (
                    <SearchResultCard
                      key={item.id}
                      href={`/profile/${encodeURIComponent(item.username)}`}
                      icon='user'
                      label='사용자'
                      title={item.username}
                      meta={item.bio || '독자 프로필'}
                      description='공개 활동과 저장한 대화를 살펴볼 수 있습니다.'
                    />
                  ))}
                </div>
              ) : null}
            </section>
          )}
        </div>
      ) : null}
    </main>
  );
}

function SearchResultCard({
  href,
  icon,
  label,
  title,
  meta,
  description
}: {
  href: string;
  icon: 'book' | 'scenario' | 'conversation' | 'user';
  label: string;
  title: string;
  meta: string;
  description: string;
}) {
  const Icon = icon === 'book'
    ? BookOpen
    : icon === 'scenario'
      ? GitBranch
      : icon === 'conversation'
        ? MessageCircle
        : UserRound;

  return (
    <Link href={href} className={`search-result-card search-result-card--${icon}`}>
      <span className='search-result-card__icon'>
        <Icon size={19} strokeWidth={2.25} aria-hidden='true' />
      </span>
      <span className='search-result-card__copy'>
        <span className='search-result-card__meta'>
          <small>{label}</small>
          <span>{meta}</span>
        </span>
        <strong>{title}</strong>
        <em>{description}</em>
      </span>
      <span className='search-result-card__arrow' aria-hidden='true'>
        <ArrowRight size={16} strokeWidth={2.25} />
      </span>
    </Link>
  );
}
