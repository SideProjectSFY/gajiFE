'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import { useLocale } from '@/i18n/useLocale';

const AUTH_GUARD_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD !== 'false');

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const redirectTarget = useMemo(() => {
    const currentSearch = searchParams.toString();
    const current = `${pathname || '/'}${currentSearch ? `?${currentSearch}` : ''}`;
    return `/login?redirect=${encodeURIComponent(current)}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (AUTH_GUARD_DISABLED) {
      setAuthed(true);
      setReady(true);
      return;
    }

    const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
    const isAuthed = Boolean(token);
    setAuthed(isAuthed);
    setReady(true);

    if (!isAuthed) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  if (AUTH_GUARD_DISABLED) {
    return <>{children}</>;
  }

  if (!ready || !authed) {
    return (
      <LoadingState
        compact
        title={t('common.loadingTitle', '이야기를 불러오는 중입니다')}
        description={t('common.loadingSubtitle', '잠시만 기다려주세요.')}
      />
    );
  }

  return <>{children}</>;
}
