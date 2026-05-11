import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, Sprout } from 'lucide-react';

type LoadingStateProps = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export function LoadingState({
  title = '이야기를 불러오는 중입니다',
  description = '잠시만 기다려주세요.',
  compact = false,
  className = ''
}: LoadingStateProps) {
  const classNames = ['loading-state', compact ? 'loading-state--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role='status' aria-live='polite'>
      <span className='loading-state__spinner' aria-hidden='true'>
        <Loader2 size={22} strokeWidth={2.4} />
      </span>
      <span className='loading-state__copy'>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
    </div>
  );
}

type SkeletonStateProps = {
  rows?: number;
  variant?: 'cards' | 'messages';
  className?: string;
};

export function SkeletonState({ rows = 3, variant = 'cards', className = '' }: SkeletonStateProps) {
  const classNames = ['skeleton-state', `skeleton-state--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role='status' aria-live='polite' aria-label='콘텐츠를 불러오는 중입니다'>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className='skeleton-state__item'>
          <span className='skeleton-state__media' />
          <span className='skeleton-state__lines'>
            <span />
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}

type StatusStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  tone?: 'empty' | 'error';
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

export function StatusState({
  title,
  description,
  actionHref,
  actionLabel,
  tone = 'empty',
  compact = false,
  className = '',
  children
}: StatusStateProps) {
  const classNames = [
    'status-state',
    `status-state--${tone}`,
    compact ? 'status-state--compact' : '',
    className
  ].filter(Boolean).join(' ');
  const Icon = tone === 'error' ? AlertCircle : Sprout;

  return (
    <section className={classNames} role={tone === 'error' ? 'alert' : 'status'}>
      <span className='status-state__icon' aria-hidden='true'>
        <Icon size={24} strokeWidth={2.25} />
      </span>
      <div className='status-state__copy'>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className='status-state__action'>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
