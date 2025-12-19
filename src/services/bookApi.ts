/**
 * Book API Service
 * Handles HTTP requests for book browsing
 */

import axios from 'axios'
import type { BooksResponse } from '@/types/book'

// Use the base API URL without /api/v1 since we'll add the full path
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080'

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
    const response = await axios.get<BooksResponse>(`${API_BASE_URL}/api/v1/books`, {
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
    const response = await axios.get(`${API_BASE_URL}/api/v1/books/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't send credentials to prevent auth token from being sent
      withCredentials: false,
    })
    return response.data
  },

  /**
   * Get liked books
   * @param userId Optional User ID to fetch liked books for
   */
  async getLikedBooks(userId?: string): Promise<BooksResponse> {
    const params: any = { size: 100 } // Fetch more for now
    if (userId) params.userId = userId

    const response = await axios.get<BooksResponse>(`${API_BASE_URL}/api/v1/books/liked`, {
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
    await axios.post(`${API_BASE_URL}/api/v1/books/${bookId}/like`)
  },

  /**
   * Unlike a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async unlikeBook(bookId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/books/${bookId}/like`)
  },

  /**
   * Bookmark a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async bookmarkBook(bookId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/v1/books/${bookId}/bookmark`)
  },

  /**
   * Remove bookmark from a book
   * @param bookId Book UUID
   * @returns Promise with success response
   */
  async unbookmarkBook(bookId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/books/${bookId}/bookmark`)
  },
}
