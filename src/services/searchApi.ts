import api from './api'

export interface SearchResult {
  books: any[]
  conversations: any[]
  users: any[]
}

export const searchApi = {
  search: async (query: string): Promise<SearchResult> => {
    const response = await api.get<SearchResult>('/search', {
      params: { query },
    })
    return response.data
  },
}
