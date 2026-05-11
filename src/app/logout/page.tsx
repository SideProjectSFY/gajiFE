'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('gaji_username');

    const timer = window.setTimeout(() => {
      router.replace('/login');
    }, 300);

    return () => window.clearTimeout(timer);
  }, [router]);

  return <main className='logout-page'>Logging out...</main>;
}
