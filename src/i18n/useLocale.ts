'use client';

import { useCallback, useEffect } from 'react';
import { setLocaleStorage, translate, type Locale } from '@/i18n';
import { useLocaleStore } from '@/domains/shell/stores/localeStore';

export function useLocale() {
  const { locale, setLocale } = useLocaleStore();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setAndStoreLocale = useCallback((next: Locale) => {
    setLocaleStorage(next);
    setLocale(next);
  }, [setLocale]);

  const t = useCallback((path: string, fallback?: string) => translate(locale, path, fallback), [locale]);

  return { locale, setLocale: setAndStoreLocale, t };
}
