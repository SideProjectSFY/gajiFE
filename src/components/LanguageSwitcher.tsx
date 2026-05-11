'use client';

import { useState } from 'react';
import { css } from '../../styled-system/css';
import { Globe, Check } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (code: 'ko' | 'en') => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className={css({ position: 'relative' })}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          p: '2',
          rounded: 'md',
          color: 'gray.600',
          fontSize: 'sm',
          fontWeight: 'medium',
          cursor: 'pointer',
          _hover: { bg: 'gray.100', color: 'gray.900' }
        })}
        aria-label={t('nav.language', '언어 선택')}
        title={t('nav.language', '언어 선택')}
      >
        <Globe size={18} />
        <span className={css({ display: { base: 'none', md: 'inline' } })}>
          {languages.find(l => l.code === locale)?.label || locale.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className={css({ position: 'fixed', inset: '0', zIndex: '40' })} 
            onClick={() => setIsOpen(false)} 
          />
          <div className={css({
            position: 'absolute',
            top: '100%',
            right: '0',
            mt: '2',
            w: '40',
            bg: 'white',
            rounded: 'lg',
            shadow: 'lg',
            border: '1px solid token(colors.gray.200)',
            zIndex: '50',
            overflow: 'hidden',
            py: '1'
          })}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  w: 'full',
                  px: '4',
                  py: '2',
                  fontSize: 'sm',
                  textAlign: 'left',
                  color: locale === lang.code ? 'green.700' : 'gray.700',
                  bg: locale === lang.code ? 'green.50' : 'transparent',
                  fontWeight: locale === lang.code ? 'bold' : 'normal',
                  justifyContent: 'space-between',
                  _hover: { bg: 'gray.50' },
                  cursor: 'pointer'
                })}
              >
                <span>{lang.label}</span>
                {locale === lang.code && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
