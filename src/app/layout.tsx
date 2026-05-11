import type { ReactNode } from 'react';
import '@/app/globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/domains/shell/components/AppShell';
import { ToastContainer } from '@/components/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Gaji - AI 시나리오 대화 플랫폼',
    template: '%s | Gaji'
  },
  description: 'AI 시나리오 대화 플랫폼 Gaji'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <AppShell>{children}</AppShell>
        <ToastContainer />
      </body>
    </html>
  );
}
