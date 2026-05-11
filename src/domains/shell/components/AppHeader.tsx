'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, GitBranch, Globe2, MessageCircle, Search, UserRound } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

type NavItem = { href: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> };

const AUTH_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD !== 'false');

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function readStoredUsername(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const directUsername =
    window.localStorage.getItem('gaji_username') ||
    window.localStorage.getItem('username') ||
    window.localStorage.getItem('userName');
  if (directUsername) {
    return directUsername;
  }

  const userPayload = window.localStorage.getItem('user');
  if (userPayload) {
    try {
      const parsed = JSON.parse(userPayload) as { username?: string };
      if (parsed.username) {
        return parsed.username;
      }
    } catch {
      // Ignore malformed localStorage payload.
    }
  }

  const hasToken = Boolean(
    window.localStorage.getItem('accessToken') || window.localStorage.getItem('token')
  );
  return hasToken ? 'dev-bypass' : null;
}

export function AppHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [username, setUsername] = useState<string | null>(AUTH_BYPASS_ENABLED ? 'dev-bypass' : null);
  const navItems: NavItem[] = useMemo(
    () => [
      { href: '/books', label: t('nav.books', '책'), icon: BookOpen },
      { href: '/scenarios', label: t('scenario.title', '시나리오'), icon: GitBranch },
      { href: '/conversations', label: t('nav.conversations', '대화'), icon: MessageCircle }
    ],
    [t]
  );

  useEffect(() => {
    const stored = readStoredUsername();
    setUsername(stored || (AUTH_BYPASS_ENABLED ? 'dev-bypass' : null));
  }, [pathname]);

  const profileHref = useMemo(() => {
    const target = username || 'dev-bypass';
    return `/profile/${encodeURIComponent(target)}`;
  }, [username]);

  return (
    <header className='app-header'>
      <div className='app-header__inner'>
        <Link href='/' className='app-logo' aria-label='Gaji 홈'>
          <img src='/Logo.svg' alt='Gaji' />
          <span className='app-logo__text'>Gaji</span>
        </Link>

        <nav className='app-nav' aria-label='Main navigation'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            >
              <item.icon size={16} strokeWidth={2.25} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className='app-actions'>
          <form className='app-search' action='/search' role='search'>
            <input
              name='query'
              placeholder={t('search.placeholder', '책, 대화 검색...')}
              aria-label={t('search.ariaLabel', '책, 대화 검색')}
              autoComplete='off'
            />
            <button type='submit' aria-label='검색'>
              <Search size={18} strokeWidth={2.25} aria-hidden='true' />
            </button>
          </form>

          <button
            className='app-language'
            type='button'
            aria-label={t('nav.language', '언어')}
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
            title={t('nav.language', '언어')}
          >
            <Globe2 size={19} strokeWidth={2.25} aria-hidden='true' />
          </button>

          {username ? (
            <>
              <Link href={profileHref} className='app-profile-btn'>
                <UserRound size={16} strokeWidth={2.25} />
                {t('nav.profile', '프로필')}
              </Link>
              <Link href='/logout' className='app-link-btn'>
                {t('nav.logout', '로그아웃')}
              </Link>
            </>
          ) : (
            <>
              <Link href='/login' className='app-link-btn'>
                {t('nav.login', '로그인')}
              </Link>
              <Link href='/register' className='app-cta-btn'>
                {t('nav.signup', '회원가입')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
