/**
 * Book type definitions
 * Corresponds to backend BookResponse DTO
 */

// Character type from backend
export interface Character {
  id: string
  name: string
  isFeatured: boolean
  description: string
  vectordbCharacterId?: string
  portraitPrompt?: string
  persona?: string
  speakingStyle?: string
}

export interface Book {
  id: string
  title: string
  author: string
  genre: string
  coverImageUrl: string | null
  scenarioCount: number
  conversationCount: number
  likeCount?: number // Optional: backend provides this
  isLiked?: boolean
  characters?: Character[] // Added character list
  // Optional fields not yet provided by backend:
  tags?: string[]
  year?: number
  description?: string
  charactersCount?: number
  viewsCount?: number
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

export type BookSortOption = 'latest' | 'recommended' | 'popular'

export const BOOK_SORT_OPTIONS: { value: BookSortOption; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Popular' },
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
