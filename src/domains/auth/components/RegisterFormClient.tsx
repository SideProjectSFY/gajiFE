'use client';

import { useAuthStore } from '@/domains/auth/stores/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { useLocale } from '@/i18n/useLocale';

function getPasswordStrength(password: string): 'none' | 'weak' | 'medium' | 'strong' {
  if (!password) return 'none';
  if (password.length < 8) return 'weak';

  let strength = 0;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength >= 3) return 'strong';
  if (strength >= 2) return 'medium';
  return 'weak';
}

const strengthColor = {
  none: '#d1d5db',
  weak: '#ef4444',
  medium: '#f59e0b',
  strong: '#10b981'
};

export function RegisterFormClient() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isUsernameValid = /^[a-zA-Z0-9_가-힣]{3,50}$/.test(username);
  const isFormValid = isEmailValid && isUsernameValid && isPasswordValid && password === confirmPassword && agreeToTerms;
  const isPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = isFormValid && !isLoading && !submitSuccess;
  const languageLabel = locale === 'ko' ? t('language.korean', '한국어') : t('language.english', 'English');
  const strengthLabel = useMemo(
    () => ({
      none: '',
      weak: t('register.passwordStrength.weak', '약함'),
      medium: t('register.passwordStrength.medium', '보통'),
      strong: t('register.passwordStrength.strong', '강함')
    }),
    [t]
  );

  function handleLanguageToggle() {
    setLocale(locale === 'ko' ? 'en' : 'ko');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!isFormValid) {
      setSubmitError(t('register.errors.invalidForm', '입력한 정보를 다시 확인해주세요.'));
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (email.trim().toLowerCase() === 'taken@gaji.me') {
        throw new Error(t('register.errors.emailTaken', '이미 사용 중인 이메일입니다.'));
      }

      setSubmitSuccess(t('register.success', '계정 생성 완료. 잠시 후 홈으로 이동합니다.'));
      setUser({ id: '1', username: username.trim(), email: email.trim() });
      setTokens('mock-access-token', 'mock-refresh-token');
      router.push('/');
    } catch (registerError) {
      setSubmitError(registerError instanceof Error ? registerError.message : t('register.errors.registrationFailedDetailed', '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setIsLoading(false);
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

        <h1 className='auth-heading auth-heading--register'>{t('register.title', '계정 만들기')}</h1>
        <p className='auth-subheading'>{t('register.subtitle', '이야기 탐험가 커뮤니티에 참여하세요')}</p>

        <form className='auth-form' onSubmit={handleSubmit}>
          {submitError ? (
            <p className='auth-form-alert auth-form-alert--error' role='alert'>
              {submitError}
            </p>
          ) : null}

          {submitSuccess ? (
            <p className='auth-form-alert auth-form-alert--success' role='status'>
              {submitSuccess}
            </p>
          ) : null}

          <div className='auth-field'>
            <label htmlFor='register-email'>{t('register.emailLabel', '이메일')}</label>
            <input
              id='register-email'
              name='email'
              type='email'
              placeholder={t('register.emailPlaceholder', '이메일을 입력하세요')}
              autoComplete='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby='register-email-help'
              aria-invalid={email.length > 0 && !isEmailValid}
              autoFocus
              required
            />
            {email.length > 0 && !isEmailValid ? (
              <p className='auth-field-help' id='register-email-help'>
                {t('register.errors.emailInvalid', '올바른 이메일 형식으로 입력해주세요.')}
              </p>
            ) : null}
          </div>

          <div className='auth-field'>
            <label htmlFor='register-username'>{t('register.usernameLabel', '사용자 이름')}</label>
            <input
              id='register-username'
              name='username'
              type='text'
              placeholder={t('register.usernamePlaceholder', '사용자 이름을 선택하세요')}
              autoComplete='username'
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-describedby='register-username-help'
              aria-invalid={username.length > 0 && !isUsernameValid}
              required
            />
            {username.length > 0 && !isUsernameValid ? (
              <p className='auth-field-help' id='register-username-help'>
                {t('register.errors.usernameInvalidDetailed', '3자 이상, 한글/영문/숫자/_만 사용할 수 있어요.')}
              </p>
            ) : null}
          </div>

          <div className='auth-field'>
            <label htmlFor='register-password'>{t('register.passwordLabel', '비밀번호')}</label>
            <input
              id='register-password'
              name='password'
              type='password'
              placeholder={t('register.passwordPlaceholder', '비밀번호를 생성하세요')}
              autoComplete='new-password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby='register-password-help'
              aria-invalid={password.length > 0 && !isPasswordValid}
              required
            />

            {passwordStrength !== 'none' && (
              <div className='auth-password-strength'>
                <div className='auth-password-strength__label'>
                  <span>{t('register.passwordStrengthLabel', '비밀번호 강도:')}</span>
                  <strong style={{ color: strengthColor[passwordStrength] }}>{strengthLabel[passwordStrength]}</strong>
                </div>
                <div className='auth-password-strength__track'>
                  <span
                    style={{
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                      backgroundColor: strengthColor[passwordStrength]
                    }}
                  />
                </div>
              </div>
            )}
            {password.length > 0 && !isPasswordValid ? (
              <p className='auth-field-help' id='register-password-help'>
                {t('register.errors.passwordComplexityDetailed', '8자 이상, 대문자/소문자/숫자를 포함해주세요.')}
              </p>
            ) : null}
          </div>

          <div className='auth-field'>
            <label htmlFor='register-password-confirm'>{t('register.confirmPasswordLabel', '비밀번호 확인')}</label>
            <input
              id='register-password-confirm'
              name='passwordConfirm'
              type='password'
              placeholder={t('register.confirmPasswordPlaceholder', '비밀번호를 다시 입력하세요')}
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-describedby='register-password-confirm-help'
              aria-invalid={isPasswordMismatch}
              required
            />
            {isPasswordMismatch ? (
              <p className='auth-field-help' id='register-password-confirm-help'>
                {t('register.errors.passwordMismatch', '비밀번호가 서로 일치하지 않습니다.')}
              </p>
            ) : null}
          </div>

          <label className='auth-check' htmlFor='terms'>
            <input
              id='terms'
              type='checkbox'
              checked={agreeToTerms}
              onChange={(event) => setAgreeToTerms(event.target.checked)}
              required
            />
            {t('register.agreeToTerms', '서비스 약관 및 개인정보 처리방침에 동의합니다')}
          </label>

          <button className='auth-submit' type='submit' disabled={!canSubmit}>
            {isLoading ? t('register.submitting', '가입 중...') : t('register.submit', '계정 만들기')}
          </button>
        </form>

        <div className='auth-divider'>
          <span>{t('login.or', '또는')}</span>
        </div>

        <p className='auth-register'>
          {t('register.alreadyHaveAccount', '이미 계정이 있으신가요?')} <Link href='/login'>{t('register.login', '로그인')}</Link>
        </p>
      </div>
    </section>
  );
}
