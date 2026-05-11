import 'server-only';

import { springApi } from '@/lib/springApi';
import type { Book } from '@/domains/catalog/types/book';

export async function getBooks(): Promise<Book[]> {
  const response = await springApi('/api/v1/books', {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }

  return (await response.json()) as Book[];
}
