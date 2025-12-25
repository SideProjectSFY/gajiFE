/**
 * Book API Service
 * Handles HTTP requests for book browsing
 */

import api from '@/services/api'
import type { BooksResponse } from '@/types/book'

export interface GetBooksParams {
  page?: number
  size?: number
  genre?: string
  sort?: string
}

export const bookApi = {
  /**
   * Get paginated list of books
   * @param params Query parameters for filtering, sorting, pagination
   * @returns Promise with paginated books response
   */
  async getBooks(params: GetBooksParams = {}): Promise<BooksResponse> {
    const response = await api.get<BooksResponse>('/books', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        genre: params.genre || undefined,
        sort: params.sort || 'scenarios',
      },
    })
    return response.data
  },

  /**
   * Get book by ID
   * @param id Book UUID
   * @returns Promise with book details
   */
  async getBookById(id: string): Promise<BooksResponse['content'][0]> {
    const response = await api.get(`/books/${id}`)
    return response.data
  },

  /**
   * Get liked books
   * @param userId Optional User ID to fetch liked books for
   * @param page Page number (0-indexed)
   * @param size Page size
   */
  async getLikedBooks(
    userId?: string,
    page: number = 0,
    size: number = 20
  ): Promise<BooksResponse> {
    const params: any = { page, size }
    if (userId) params.userId = userId

    const response = await api.get<BooksResponse>('/books/liked', {
      params,
    })
    return response.data
  },

  /**
   * Like a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async likeBook(bookId: string): Promise<void> {
    await api.post(`/books/${bookId}/like`)
  },

  /**
   * Unlike a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async unlikeBook(bookId: string): Promise<void> {
    await api.delete(`/books/${bookId}/like`)
  },

  /**
   * Bookmark a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async bookmarkBook(bookId: string): Promise<void> {
    await api.post(`/books/${bookId}/bookmark`)
  },

  /**
   * Remove bookmark from a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async unbookmarkBook(bookId: string): Promise<void> {
    await api.delete(`/books/${bookId}/bookmark`)
  },

  /**
   * Get characters by book ID
   * @param bookId Book UUID
   * @returns Promise with characters array
   */
  async getCharactersByBookId(bookId: string): Promise<any[]> {
    const response = await api.get(`/novels/${bookId}/characters`)
    return response.data
  },
}
