import en from '@/i18n/locales/en.json';
import ko from '@/i18n/locales/ko.json';

export type Locale = 'ko' | 'en';

const messages = { ko, en } as const;

type Dictionary = (typeof messages)[Locale];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ko';
  }

  const stored = window.localStorage.getItem('locale');
  return stored === 'en' ? 'en' : 'ko';
}

export function setLocaleStorage(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('locale', locale);
}

function resolvePath(dictionary: Dictionary, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = dictionary;

  for (const key of keys) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

export function translate(locale: Locale, path: string, fallback = path): string {
  const selected = messages[locale] ?? messages.ko;
  const resolved = resolvePath(selected, path);
  if (typeof resolved === 'string') {
    return resolved;
  }

  const fallbackResolved = resolvePath(messages.ko, path);
  return typeof fallbackResolved === 'string' ? fallbackResolved : fallback;
}
