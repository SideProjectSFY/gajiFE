import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogDetailClient } from '@/domains/catalog/components/CatalogDetailClient';
import { isValidIdSegment } from '@/lib/routeValidation';

export const metadata: Metadata = {
  title: '책 상세'
};

export default async function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;

  if (!isValidIdSegment(bookId)) {
    notFound();
  }

  return <CatalogDetailClient bookId={bookId} />;
}
