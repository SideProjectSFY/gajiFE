import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { CatalogBrowseClient } from '@/domains/catalog/components/CatalogBrowseClient';

type BooksPageProps = {
  searchParams: Promise<{ __e2e_delay?: string; __e2e_error?: string }>;
};

export const metadata: Metadata = {
  title: '책'
};

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;

  if (process.env.ENABLE_E2E_MOCK_DOWNSTREAM === 'true' && params.__e2e_error === '1') {
    throw new Error('E2E forced error');
  }

  if (process.env.ENABLE_E2E_MOCK_DOWNSTREAM === 'true' && params.__e2e_delay === '1') {
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  return (
    <Suspense fallback={<main className='content-page'><LoadingState /></main>}>
      <CatalogBrowseClient />
    </Suspense>
  );
}
