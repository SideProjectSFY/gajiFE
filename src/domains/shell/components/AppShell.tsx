'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/domains/shell/components/AppHeader';
import { AppFooter } from '@/domains/shell/components/AppFooter';

type AppShellProps = {
  children: ReactNode;
};

const SHELL_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/about$/,
  /^\/books$/,
  /^\/books\/[^/]+$/,
  /^\/search$/,
  /^\/scenarios$/,
  /^\/scenarios\/new$/,
  /^\/scenarios\/[^/]+$/,
  /^\/scenarios\/[^/]+\/edit$/,
  /^\/conversations$/,
  /^\/liked$/,
  /^\/profile\/edit$/,
  /^\/profile\/[^/]+$/,
  /^\/profile\/[^/]+\/followers$/,
  /^\/profile\/[^/]+\/following$/
];

function shouldUseShell(pathname: string): boolean {
  if (pathname === '/login' || pathname.startsWith('/login/')) return false;
  if (pathname === '/register' || pathname.startsWith('/register/')) return false;
  if (pathname === '/logout' || pathname.startsWith('/logout/')) return false;
  if (/^\/conversations\/[^/]+$/.test(pathname)) return false;

  return SHELL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (!shouldUseShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className='app-shell'>
      <AppHeader />
      <main className='app-shell__content'>{children}</main>
      <AppFooter />
    </div>
  );
}
