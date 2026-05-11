'use client';

import { useAuthStore } from '@/domains/auth/stores/authStore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useLocale } from '@/i18n/useLocale';

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { locale, setLocale, t } = useLocale();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;
  const languageLabel = locale === 'ko' ? t('language.korean', '한국어') : t('language.english', 'English');

  function handleLanguageToggle() {
    setLocale(locale === 'ko' ? 'en' : 'ko');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setError(t('login.errors.credentialsRequired', '이메일 또는 사용자 이름과 비밀번호를 모두 입력해주세요.'));
      return;
    }
    
    try {
      await login(email.trim(), password);
      setSuccessMessage(t('login.success', '로그인 완료. 잠시 후 이동합니다.'));
      router.push(redirect);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('login.errors.loginFailedDetailed', '로그인에 실패했습니다. 입력 정보를 다시 확인해주세요.'));
    }
  }

  return (
    <section className='auth-form-side'>
      <button className='auth-language' type='button' aria-label={t('nav.language', '언어')} title={t('nav.language', '언어')} onClick={handleLanguageToggle}>
        <img src='/Globe.svg' alt='' aria-hidden='true' />
        {languageLabel}
      </button>

      <div className='auth-form-wrap'>
        <Link href='/' className='auth-logo'>
          <img src='/Logo.svg' alt='Gaji' />
          <span>Gaji</span>
        </Link>
        
        <h1 className='auth-heading'>{t('login.title', '이야기의 가지를 계속 탐험하세요')}</h1>

        <form className='auth-form' onSubmit={handleSubmit}>
          {error ? (
            <p className='auth-form-alert auth-form-alert--error' role='alert'>
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className='auth-form-alert auth-form-alert--success' role='status'>
              {successMessage}
            </p>
          ) : null}
          
          <div className='auth-field'>
            <label htmlFor='email'>{t('login.emailLabel', '이메일 또는 사용자 이름')}</label>
            <input
              id='email'
              name='email'
              type='text'
              placeholder={t('login.emailPlaceholder', '이메일 또는 사용자 이름을 입력하세요')}
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error && !email.trim())}
              autoFocus
              required
            />
          </div>

          <div className='auth-field'>
            <label htmlFor='password'>{t('login.passwordLabel', '비밀번호')}</label>
            <input
              id='password'
              name='password'
              type='password'
              placeholder={t('login.passwordPlaceholder', '비밀번호를 입력하세요')}
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error && !password)}
              required
            />
          </div>

          <label className='auth-check' htmlFor='remember'>
            <input id='remember' type='checkbox' />
            {t('login.rememberMe', '로그인 유지')}
          </label>

          <button 
            className='auth-submit' 
            type='submit' 
            disabled={!canSubmit}
          >
            {isLoading ? t('login.submitting', '로그인 중...') : t('login.submit', '로그인')}
          </button>
        </form>

        <div className='auth-divider'>
          <span>{t('login.or', '또는')}</span>
        </div>

        <p className='auth-register'>
          {t('login.newToGaji', 'Gaji가 처음이신가요?')} <Link href='/register'>{t('login.createAccount', '계정 만들기')}</Link>
        </p>
      </div>
    </section>
  );
}
