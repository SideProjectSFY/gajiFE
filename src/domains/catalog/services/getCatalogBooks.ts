import 'server-only';

import { springApi } from '@/lib/springApi';
import type { BookFilters, BooksResponse } from '@/domains/catalog/types/book';

export async function getCatalogBooks(filters: BookFilters): Promise<BooksResponse> {
  const searchParams = new URLSearchParams({
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 20),
    sort: filters.sort ?? 'latest'
  });

  if (filters.genre) {
    searchParams.set('genre', filters.genre);
  }
  if (filters.search) {
    searchParams.set('search', filters.search);
  }

  const response = await springApi(`/api/v1/books?${searchParams.toString()}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch books from catalog downstream');
  }

  const payload = (await response.json()) as {
    content: BooksResponse['content'];
    totalElements: number;
    totalPages: number;
    pageable?: { pageNumber: number; pageSize: number };
  };

  return {
    content: payload.content,
    totalElements: payload.totalElements,
    totalPages: payload.totalPages,
    page: payload.pageable?.pageNumber ?? filters.page ?? 0,
    size: payload.pageable?.pageSize ?? filters.size ?? 20
  };
}
