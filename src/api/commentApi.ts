import { requestJson } from '@/api/http';
import type { Comment, PageResponse } from '@/domains/journeys/types/core';

export function listBookComments(bookId: string, page = 0, size = 10): Promise<PageResponse<Comment>> {
  return requestJson<PageResponse<Comment>>(`/api/books/${bookId}/comments?page=${page}&size=${size}`);
}

export function createBookComment(bookId: string, content: string): Promise<Comment> {
  return requestJson<Comment>(`/api/books/${bookId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

export function updateComment(commentId: string, content: string): Promise<Comment> {
  return requestJson<Comment>(`/api/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content })
  });
}

export function deleteComment(commentId: string): Promise<void> {
  return requestJson<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
}
