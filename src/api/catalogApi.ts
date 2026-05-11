import { requestJson } from '@/api/http';
import type { Book, BookFilters, BooksResponse } from '@/domains/catalog/types/book';

function toQueryString(filters: BookFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.page !== undefined) {
    searchParams.set('page', String(filters.page));
  }
  if (filters.size !== undefined) {
    searchParams.set('size', String(filters.size));
  }
  if (filters.genre) {
    searchParams.set('genre', filters.genre);
  }
  if (filters.sort) {
    searchParams.set('sort', filters.sort);
  }
  if (filters.search) {
    searchParams.set('search', filters.search);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : '';
}

export async function getCatalogBooks(filters: BookFilters): Promise<BooksResponse> {
  return requestJson<BooksResponse>(`/api/catalog/books${toQueryString(filters)}`);
}

export async function getCatalogBookDetail(bookId: string): Promise<Book> {
  return requestJson<Book>(`/api/catalog/books/${bookId}`);
}
