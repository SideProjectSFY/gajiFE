import type { Metadata } from 'next';
import { AuthScrollytelling } from '@/domains/auth/components/AuthScrollytelling';
import { LoginFormClient } from '@/domains/auth/components/LoginFormClient';

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export const metadata: Metadata = {
  title: '로그인'
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { redirect = '/' } = await searchParams;

  return (
    <AuthScrollytelling
      stages={[
        { id: 0, title: '펼쳐지지 않은 이야기', description: 'The story yet to be written.' },
        { id: 1, title: '연결의 시작', description: 'A handshake that welcomes you.' },
        { id: 2, title: '감정의 공명', description: 'Feelings take shape and color.' },
        { id: 3, title: '마법 같은 순간', description: 'Your imagination sparkles.' }
      ]}
      variant='login'
      form={<LoginFormClient />}
    />
  );
}
