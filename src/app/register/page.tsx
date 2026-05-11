import type { Metadata } from 'next';
import { AuthScrollytelling } from '@/domains/auth/components/AuthScrollytelling';
import { RegisterFormClient } from '@/domains/auth/components/RegisterFormClient';

export const metadata: Metadata = {
  title: '회원가입'
};

export default function RegisterPage() {
  return (
    <AuthScrollytelling
      stages={[
        { id: 0, title: '모든 이야기는 작은 씨앗에서 시작됩니다.', description: 'Every story begins with a small seed.' },
        { id: 1, title: '당신의 선택으로 뻗어나가는 무한한 가능성.', description: 'Infinite possibilities branching from your choices.' },
        { id: 2, title: 'AI와 함께 상상을 현실로 만드세요.', description: 'Turn imagination into reality with AI.' },
        { id: 3, title: 'Gaji에서 당신만의 세계를 완성하세요.', description: 'Complete your world in Gaji.' }
      ]}
      variant='register'
      form={<RegisterFormClient />}
    />
  );
}
