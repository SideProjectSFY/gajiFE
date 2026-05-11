export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string | null;
  scenarioCount: number;
  conversationCount: number;
  likeCount: number;
}

export interface BooksResponse {
  content: Book[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export type BookSortOption = 'latest' | 'recommended' | 'popular';

export interface BookFilters {
  page?: number;
  size?: number;
  genre?: string;
  sort?: BookSortOption;
  search?: string;
}
