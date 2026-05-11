import type { Metadata } from 'next';
import { AboutParityPage } from '@/domains/about/components/AboutParityPage';

export const metadata: Metadata = {
  title: '소개',
  description: 'Gaji 소개 페이지'
};

export default function AboutPage() {
  return <AboutParityPage />;
}
