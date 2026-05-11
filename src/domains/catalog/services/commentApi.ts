export interface BookComment {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentPage {
  content: BookComment[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Assuming a generic fetch wrapper or axios instance will be used
// For now, we'll use fetch as a placeholder
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const commentApi = {
  async createComment(bookId: string, request: CreateCommentRequest): Promise<BookComment> {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  },

  async getComments(bookId: string, page: number = 0, size: number = 10): Promise<CommentPage> {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/comments?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  async updateComment(commentId: string, request: UpdateCommentRequest): Promise<BookComment> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
  },

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  },
};
