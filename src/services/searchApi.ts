import api from './api'

export interface SearchResult {
  books: any[]
  conversations: any[]
  users: any[]
}

export const searchApi = {
  search: async (query: string, page: number = 0, size: number = 6): Promise<SearchResult> => {
    const response = await api.get<SearchResult>('/search', {
      params: { query, page, size },
    })
    return response.data
  },
}
