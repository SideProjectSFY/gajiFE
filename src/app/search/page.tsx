import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { SearchClient } from '@/domains/journeys/components/SearchClient';

export const metadata: Metadata = {
  title: '검색'
};

export default function SearchPage() {
  return (
    <Suspense fallback={<main className='content-page'><LoadingState /></main>}>
      <SearchClient />
    </Suspense>
  );
}
