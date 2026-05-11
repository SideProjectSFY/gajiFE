import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInitialLocale, setLocaleStorage, type Locale } from '@/i18n';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: getInitialLocale(),
      setLocale: (locale) => {
        setLocaleStorage(locale);
        set({ locale });
      }
    }),
    {
      name: 'locale-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          setLocaleStorage(state.locale);
        }
      }
    }
  )
);
