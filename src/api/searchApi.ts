import { requestJson } from '@/api/http';
import type { SearchResult } from '@/domains/journeys/types/core';

export interface SearchParams {
  query: string;
  page?: number;
  size?: number;
}

export function searchAll(params: SearchParams): Promise<SearchResult> {
  const searchParams = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 0),
    size: String(params.size ?? 6)
  });

  return requestJson<SearchResult>(`/api/search?${searchParams.toString()}`);
}
