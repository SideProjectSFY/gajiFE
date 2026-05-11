'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getCatalogBooks } from '@/api/catalogApi';
import { LoadingState } from '@/components/LoadingState';
import type { Book, BookSortOption, BooksResponse } from '@/domains/catalog/types/book';
import { useLocale } from '@/i18n/useLocale';

function parseSort(value: string | null): BookSortOption {
  if (value === 'recommended' || value === 'popular') {
    return value;
  }
  return 'latest';
}

function parseBooksParams(searchParams: URLSearchParams) {
  return {
    page: Number.parseInt(searchParams.get('page') ?? '0', 10),
    size: Number.parseInt(searchParams.get('size') ?? '20', 10),
    genre: searchParams.get('genre') ?? '',
    sort: parseSort(searchParams.get('sort')),
    search: searchParams.get('search') ?? ''
  };
}

export function CatalogBrowseClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => parseBooksParams(new URLSearchParams(currentSearchParams.toString())),
    [currentSearchParams]
  );
  const genres = useMemo(
    () => [
      { label: t('books.filters.allGenres', '모든 장르'), value: '' },
      { label: t('books.filters.romance', '로맨스'), value: 'Romance' },
      { label: t('books.filters.fantasy', '판타지'), value: 'Fantasy' },
      { label: t('books.filters.mystery', '미스터리'), value: 'Mystery' },
      { label: t('books.filters.sciFi', 'SF'), value: 'Sci-Fi' },
      { label: t('books.filters.horror', '호러'), value: 'Horror' },
      { label: t('books.filters.adventure', '모험'), value: 'Adventure' },
      { label: t('books.filters.historical', '역사'), value: 'Historical' }
    ],
    [t]
  );
  const sortOptions = useMemo(
    () => [
      { label: t('books.sort.latest', '최신순'), value: 'latest' as const },
      { label: t('books.sort.recommended', '추천순'), value: 'recommended' as const },
      { label: t('books.sort.popular', '인기순'), value: 'popular' as const }
    ],
    [t]
  );

  const updateRoute = useCallback(
    (updates: Partial<typeof params>) => {
      const next = { ...params, ...updates };
      const searchParams = new URLSearchParams();

      if (next.page > 0) searchParams.set('page', String(next.page));
      if (next.size !== 20) searchParams.set('size', String(next.size));
      if (next.genre) searchParams.set('genre', next.genre);
      if (next.sort !== 'latest') searchParams.set('sort', next.sort);
      if (next.search) searchParams.set('search', next.search);

      const query = searchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [params, pathname, router]
  );

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: BooksResponse = await getCatalogBooks({
        page: params.page,
        size: params.size,
        genre: params.genre || undefined,
        sort: params.sort,
        search: params.search || undefined
      });

      setBooks(response.content);
      setTotalElements(response.totalElements);
    } catch {
      setBooks([]);
      setTotalElements(0);
      setError(t('books.error.failed', '책을 불러오는데 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  }, [params.genre, params.page, params.search, params.size, params.sort, t]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <main className='books-page'>
      <section className='page-hero page-hero--compact'>
        <span>{t('books.heroEyebrow', '서재')}</span>
        <h1>{t('nav.books', '책')}</h1>
        <p>{t('books.heroDescription', '대화와 시나리오를 시작할 기준 작품을 고르세요.')}</p>
      </section>

      <div className='books-toolbar'>
        <div className='books-pill-group'>
          {genres.map((genre) => {
            const selected = genre.value === params.genre || (!genre.value && !params.genre);
            return (
              <button
                key={genre.label}
                type='button'
                className={selected ? 'is-active' : ''}
                onClick={() => updateRoute({ page: 0, genre: genre.value })}
              >
                {genre.label}
              </button>
            );
          })}
        </div>

        <div className='books-sort-group'>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type='button'
              className={params.sort === option.value ? 'is-active' : ''}
              onClick={() => updateRoute({ page: 0, sort: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && !error ? <p className='books-count'>{totalElements} {t('books.count.available', '권의 책 이용 가능')}</p> : null}

      {loading ? (
        <LoadingState
          compact
          className='books-loading'
          title={t('common.loadingTitle', '이야기를 불러오는 중입니다')}
          description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
        />
      ) : null}

      {!loading && error ? (
        <section className='books-error-panel' role='alert'>
          <div className='books-error-icon'>⚠️</div>
          <h1>{t('books.error.title', '페이지가 넘어가지 않아요...')}</h1>
          <p>
            {t('books.error.description', '지금 서재의 문을 여는 데 어려움이 있어요.<br />연결이 잠시 길을 잃은 것 같습니다. 다시 한번 시도해 볼까요?')
              .split('<br />')
              .map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
          </p>
          <button type='button' onClick={fetchBooks}>
            {t('books.error.retry', '책장 다시 열기')}
          </button>
          <span className='sr-only'>{error}</span>
        </section>
      ) : null}

      {!loading && !error && books.length === 0 ? (
        <section className='books-empty-panel'>
          <h2>{t('books.empty', '아직 이용 가능한 책이 없습니다.')}</h2>
          <p>{t('books.emptyFiltered', '곧 다시 확인해주세요.')}</p>
        </section>
      ) : null}

      {!loading && !error && books.length > 0 ? (
        <ul className='books-grid'>
          {books.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`}>
                <div className='books-grid__cover'>📚</div>
                <h2>{book.title}</h2>
                <p>{book.author}</p>
                <p>{book.genre}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
