/**
 * Book type definitions
 * Corresponds to backend BookResponse DTO
 */

export interface Book {
  id: string
  title: string
  author: string
  genre: string
  coverImageUrl: string | null
  scenarioCount: number
  conversationCount: number
}

export interface BooksResponse {
  content: Book[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
}

export interface BookFilters {
  genre?: string
  sort?: BookSortOption
}

export type BookSortOption = 'scenarios' | 'conversations' | 'newest' | 'alphabetical'

export const BOOK_SORT_OPTIONS: { value: BookSortOption; label: string }[] = [
  { value: 'scenarios', label: 'Most Scenarios' },
  { value: 'conversations', label: 'Most Conversations' },
  { value: 'newest', label: 'Newest Books' },
  { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
]

export const BOOK_GENRES = [
  'All',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Mystery',
  'Horror',
  'Historical',
  'Adventure',
  'Thriller',
  'Comedy',
] as const

export type BookGenre = (typeof BOOK_GENRES)[number]
