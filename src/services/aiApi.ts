import api from './api'

export interface ChatHistoryItem {
  role: 'user' | 'model'
  content: string
}

export interface StandardChatRequest {
  store_name: string
  query: string
  history?: ChatHistoryItem[]
}

export interface PremiumChatRequest {
  cache_name: string
  query: string
  history?: ChatHistoryItem[]
}

export interface CacheCreateRequest {
  novel_id: string
  file_uri: string
  character_persona: string
  ttl_seconds?: number
}

export interface FileUploadResponse {
  file_uri: string
  store_name?: string
}

export interface ChatResponse {
  response: string
}

export interface CacheResponse {
  cache_name: string
  message: string
}

export interface RagCitation {
  final_rank?: number
  passage_id: string
  vector_rank?: number | null
  bm25_rank?: number | null
  scores?: Record<string, number | null>
  metadata?: Record<string, unknown>
}

export interface RagChatMetadata {
  enabled?: boolean
  novel_id?: string
  mode?: string
  ranking_policy?: string
  grounding_status?: string
  fallback_used?: boolean
  passage_count?: number
  citations?: RagCitation[]
  timing_ms?: Record<string, number>
  manifest_metadata?: Record<string, unknown>
  config_metadata?: Record<string, unknown>
  query_source?: 'prompt' | 'rag.query' | string
}

export interface ChatCompletionRequest {
  prompt: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  thinkingBudget?: number
  rag?: {
    enabled: boolean
    novelId?: string
    query?: string
    mode?: 'bm25' | 'vector' | 'hybrid'
    topK?: number
    maxContextPassages?: number
    fallbackOnError?: boolean
  }
}

export interface ChatCompletionResponse {
  answer: string
  model: string
  provider: string
  token_usage: number
  rag?: RagChatMetadata
}

export default {
  async completeChat(payload: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await api.post<ChatCompletionResponse>('/ai/chat/completions', payload)
    return response.data
  },

  // Standard Tier: File Search Chat
  async chatStandard(payload: StandardChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/ai/file-search/chat', payload)
    return response.data
  },

  // Premium Tier: Context Cache Chat
  async chatPremium(payload: PremiumChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/ai/cache/chat', payload)
    return response.data
  },

  // Premium Tier: Create/Get Cache
  async createCache(payload: CacheCreateRequest): Promise<CacheResponse> {
    const response = await api.post<CacheResponse>('/ai/cache/create', payload)
    return response.data
  },

  // Helper: Upload File (for testing both)
  async uploadFile(file: File, displayName?: string): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (displayName) {
      formData.append('display_name', displayName)
    }
    const response = await api.post<FileUploadResponse>('/ai/file-search/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
