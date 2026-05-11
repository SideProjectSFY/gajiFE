'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, GitBranch, MessageCircle, PenLine, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/i18n/useLocale';

type ContinueCard = {
  id: string;
  label: string;
  title: string;
  meta: string;
  href: string;
  icon: 'conversation' | 'draft' | 'book' | 'scenario';
};

const SCENARIO_DRAFT_PREFIX = 'gaji:scenario-draft:';

const starterPrompts = [
  '이 장면에서 가장 중요한 선택은 무엇인가요?',
  '원작과 달라지는 첫 순간은 어디인가요?',
  '이 인물은 왜 그런 결정을 했을까요?'
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asContent(value: unknown): Record<string, unknown>[] {
  const record = asRecord(value);
  const candidate = Array.isArray(value) ? value : record.content;
  return Array.isArray(candidate) ? candidate.map(asRecord) : [];
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readLatestScenarioDraft(): ContinueCard | null {
  const draftKeys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(SCENARIO_DRAFT_PREFIX)));
  const drafts = draftKeys
    .map((key) => {
      try {
        const value = JSON.parse(window.localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
        return {
          key,
          title: readString(value.title, '작성 중인 가지'),
          path: readString(value.path, '/scenarios/new'),
          updatedAt: readString(value.updatedAt)
        };
      } catch {
        return null;
      }
    })
    .filter((draft): draft is { key: string; title: string; path: string; updatedAt: string } => Boolean(draft))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const latest = drafts[0];
  if (!latest) return null;

  return {
    id: latest.key,
    label: '작성 중인 가지',
    title: latest.title,
    meta: '저장된 초안 이어쓰기',
    href: latest.path,
    icon: 'draft'
  };
}

function cardIcon(icon: ContinueCard['icon']) {
  if (icon === 'draft') return <PenLine size={20} strokeWidth={2.25} aria-hidden='true' />;
  if (icon === 'book') return <BookOpen size={20} strokeWidth={2.25} aria-hidden='true' />;
  if (icon === 'scenario') return <GitBranch size={20} strokeWidth={2.25} aria-hidden='true' />;
  return <MessageCircle size={20} strokeWidth={2.25} aria-hidden='true' />;
}

export function HomeLandingPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [continueCards, setContinueCards] = useState<ContinueCard[]>([]);
  const trimmed = useMemo(() => searchQuery.trim(), [searchQuery]);
  const primaryCard = continueCards[0] ?? {
    id: 'fallback-conversation',
    label: '최근 경로',
    title: 'Elizabeth asks about first impressions',
    meta: 'Pride and Prejudice · 근거 있는 대화',
    href: '/conversations/conv-1',
    icon: 'conversation' as const
  };

  useEffect(() => {
    let mounted = true;

    async function run() {
      const cards: ContinueCard[] = [];
      const draft = readLatestScenarioDraft();
      if (draft) cards.push(draft);

      const [conversations, likedBooks, scenarios] = await Promise.allSettled([
        fetch('/api/conversations?page=0&size=1').then((response) => response.ok ? response.json() : null),
        fetch('/api/books/liked?page=0&size=1').then((response) => response.ok ? response.json() : null),
        fetch('/api/scenarios/search?page=0&size=1&sort=recommended').then((response) => response.ok ? response.json() : null)
      ]);

      if (conversations.status === 'fulfilled') {
        const item = asContent(conversations.value)[0];
        if (item) {
          cards.push({
            id: `conversation-${readString(item.id, 'recent')}`,
            label: '최근 대화',
            title: readString(item.title, '제목 없는 대화'),
            meta: readString(item.bookTitle, '대화 이어가기'),
            href: `/conversations/${readString(item.id, 'conv-1')}`,
            icon: 'conversation'
          });
        }
      }

      if (likedBooks.status === 'fulfilled') {
        const item = asContent(likedBooks.value)[0];
        if (item) {
          cards.push({
            id: `book-${readString(item.id, 'book')}`,
            label: '저장한 책',
            title: readString(item.title, '저장한 책'),
            meta: readString(item.author, '책에서 다시 시작하기'),
            href: `/books/${readString(item.id, 'book-1')}`,
            icon: 'book'
          });
        }
      }

      if (scenarios.status === 'fulfilled') {
        const item = asContent(scenarios.value)[0];
        if (item) {
          cards.push({
            id: `scenario-${readString(item.id, 'scenario')}`,
            label: '추천 가지',
            title: readString(item.title, '추천 시나리오'),
            meta: readString(item.description, '새로운 해석으로 대화 시작'),
            href: `/scenarios/${readString(item.id, 'scenario-1')}`,
            icon: 'scenario'
          });
        }
      }

      if (!mounted) return;
      setContinueCards(cards.slice(0, 4));
    }

    void run();
    const onFocus = () => void run();
    window.addEventListener('focus', onFocus);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const goSearch = () => {
    if (!trimmed) {
      return;
    }
    router.push(`/search?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className='home-page'>
      <div className='home-hero'>
        <div className='home-hero__copy'>
          <span className='home-eyebrow'>Branch all of story</span>
          <h1>{t('home.title', 'Gaji')}</h1>
          <p>다시 읽고, 근거를 확인하고, 다른 장면으로 이어가는 이야기 대화.</p>
        </div>

        <Link href={primaryCard.href} className='resume-card'>
          <span className='resume-card__label'>{primaryCard.label}</span>
          <strong>{primaryCard.title}</strong>
          <span>{primaryCard.meta}</span>
          <ArrowRight size={20} strokeWidth={2.4} aria-hidden='true' />
        </Link>
      </div>

      <div className='home-command-row'>
        <label className='home-search'>
          <Search size={18} strokeWidth={2.25} aria-hidden='true' />
          <input
            type='text'
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                goSearch();
              }
            }}
            placeholder={t('search.allBooks', '책, 가지, 대화 검색')}
            aria-label='검색어 입력'
          />
        </label>
        <button type='button' onClick={goSearch} disabled={!trimmed}>
          검색
        </button>
      </div>

      <section className='home-continue-panel' aria-labelledby='home-continue-title'>
        <div className='home-continue-panel__header'>
          <div>
            <span className='home-eyebrow'>다시 이어가기</span>
            <h2 id='home-continue-title'>지금 이어갈 수 있는 작업</h2>
          </div>
          <Link href='/scenarios/new'>새 가지 쓰기</Link>
        </div>
        <div className='home-continue-grid'>
          {(continueCards.length > 0 ? continueCards : [primaryCard]).map((card) => (
            <Link key={card.id} href={card.href} className={`home-continue-card home-continue-card--${card.icon}`}>
              <span className='home-continue-card__icon'>{cardIcon(card.icon)}</span>
              <span className='home-continue-card__copy'>
                <small>{card.label}</small>
                <strong>{card.title}</strong>
                <span>{card.meta}</span>
              </span>
              <ArrowRight size={17} strokeWidth={2.25} aria-hidden='true' />
            </Link>
          ))}
        </div>
      </section>

      <section className='home-start-panel' aria-labelledby='home-start-title'>
        <div className='home-start-panel__header'>
          <div>
            <span className='home-eyebrow'>처음이라면</span>
            <h2 id='home-start-title'>세 단계로 첫 대화까지 가보세요</h2>
          </div>
          <p>책을 고르고, 달라질 장면을 정한 뒤, 인물에게 첫 질문을 던지면 됩니다.</p>
        </div>
        <div className='home-start-grid'>
          <Link href='/books'>
            <small>1</small>
            <BookOpen size={20} strokeWidth={2.25} aria-hidden='true' />
            <strong>책 고르기</strong>
            <span>대화하고 싶은 작품을 먼저 선택합니다.</span>
          </Link>
          <Link href='/scenarios'>
            <small>2</small>
            <GitBranch size={20} strokeWidth={2.25} aria-hidden='true' />
            <strong>가지 선택 또는 생성</strong>
            <span>원작과 달라진 조건을 살펴봅니다.</span>
          </Link>
          <Link href='/conversations'>
            <small>3</small>
            <MessageCircle size={20} strokeWidth={2.25} aria-hidden='true' />
            <strong>첫 질문 시작</strong>
            <span>인물에게 묻고, 마음에 드는 지점에서 가지칩니다.</span>
          </Link>
        </div>
        <div className='home-starter-prompts' aria-label='첫 질문 예시'>
          <span>
            <Sparkles size={15} strokeWidth={2.25} aria-hidden='true' />
            첫 질문 예시
          </span>
          <div>
            {starterPrompts.map((prompt) => (
              <Link key={prompt} href={`/search?query=${encodeURIComponent(prompt)}`}>
                {prompt}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className='home-quick-grid'>
        <Link href='/books/book-1'>
          <BookOpen size={22} strokeWidth={2.25} aria-hidden='true' />
          <strong>오만과 편견</strong>
          <span>12개 가지 · 34개 대화</span>
        </Link>
        <Link href='/scenarios/scenario-1'>
          <GitBranch size={22} strokeWidth={2.25} aria-hidden='true' />
          <strong>엘리자베스가 먼저 마음을 받아들였다면</strong>
          <span>공개 가지</span>
        </Link>
        <Link href='/conversations'>
          <MessageCircle size={22} strokeWidth={2.25} aria-hidden='true' />
          <strong>근거 있는 대화</strong>
          <span>최근 대화 이어보기</span>
        </Link>
      </div>
    </section>
  );
}
