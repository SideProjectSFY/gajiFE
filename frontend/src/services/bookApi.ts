/**
 * Book API Service
 * Handles HTTP requests for book browsing
 */

import axios from 'axios'
import type { BooksResponse } from '@/types/book'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    const response = await axios.get(`${API_BASE_URL}/api/v1/books/${id}`)
    return response.data
  },
}
