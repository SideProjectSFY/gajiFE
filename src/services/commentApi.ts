/**
 * Comment API Service
 * Handles HTTP requests for book comments CRUD operations
 */

import api from './api'
import type {
  BookComment,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentPage,
} from '@/types/comment'

export const commentApi = {
  /**
   * Create a comment on a book
   * @param bookId - Book UUID
   * @param request - Comment content (1-1000 characters)
   * @returns Created comment with user information
   */
  async createComment(bookId: string, request: CreateCommentRequest): Promise<BookComment> {
    const response = await api.post<BookComment>(`/books/${bookId}/comments`, request)
    return response.data
  },

  /**
   * Get paginated comments for a book
   * @param bookId - Book UUID
   * @param page - Page number (0-indexed)
   * @returns Page of comments sorted by newest first
   */
  async getComments(bookId: string, page: number = 0): Promise<CommentPage> {
    const response = await api.get<CommentPage>(`/books/${bookId}/comments`, {
      params: { page },
    })
    return response.data
  },

  /**
   * Update an existing comment
   * @param commentId - Comment UUID
   * @param request - Updated content (1-1000 characters)
   * @returns Updated comment
   * @throws 403 if not the comment author
   */
  async updateComment(commentId: string, request: UpdateCommentRequest): Promise<BookComment> {
    const response = await api.put<BookComment>(`/comments/${commentId}`, request)
    return response.data
  },

  /**
   * Delete a comment
   * @param commentId - Comment UUID
   * @throws 403 if not the comment author
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`)
  },
}
