import 'server-only';

import { springApi } from '@/lib/springApi';
import type { Book } from '@/domains/catalog/types/book';

export async function getCatalogBookDetail(bookId: string): Promise<Book> {
  const response = await springApi(`/api/v1/books/${bookId}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch book detail from catalog downstream');
  }

  return (await response.json()) as Book;
}
