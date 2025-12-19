/**
 * Book Comment type definitions
 * Corresponds to backend BookComment DTOs
 */

export interface BookComment {
  id: string
  bookId: string
  userId: string
  username: string
  userAvatarUrl: string | null
  content: string
  createdAt: string // ISO 8601 format
  updatedAt: string // ISO 8601 format
  isAuthor: boolean
}

export interface CreateCommentRequest {
  content: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface CommentPage {
  content: BookComment[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  numberOfElements: number
  empty: boolean
}
