// Comment Types
export * from './comment'

// Book Types
export * from './book'

// Scenario Creation Types
export interface CreateScenarioRequest {
  book_id: string
  scenario_title: string
  character_changes: string | null
  event_alterations: string | null
  setting_modifications: string | null
}

export interface CreateScenarioResponse {
  id: string
  userId: string
  baseScenarioId?: string
  parentScenarioId?: string
  title: string
  description: string
  whatIfQuestion: string
  isPrivate: boolean
  forkCount?: number
  scenarioType: 'ROOT' | 'LEAF'
  scenarioCategory: string
  createdAt: string
  updatedAt: string
  // Additional fields for UI
  bookTitle?: string
  characterName?: string
}

// Scenario Form State
export interface ScenarioFormState {
  title: string
  character_changes: string
  event_alterations: string
  setting_modifications: string
}

// Scenario Display Types
export interface ScenarioCreator {
  id: string
  username: string
  avatar_url: string | null
}

export interface Scenario {
  id: string
  scenario_title: string
  scenario_types: string[]
  preview_text: string
  conversation_count: number
  fork_count: number
  like_count: number
  creator: ScenarioCreator
  created_at: string
}

export interface ScenariosResponse {
  scenarios: Scenario[]
  pagination: {
    page: number
    limit: number
    total: number
    has_next: boolean
  }
}

export type ScenarioFilterType =
  | 'all'
  | 'character_changes'
  | 'event_alterations'
  | 'setting_modifications'
export type ScenarioSortOption = 'most_conversations' | 'most_forks' | 'newest' | 'most_liked'

// Book Detail Types
export interface BookStatistics {
  scenario_count: number
  conversation_count: number
}

export interface BookDetail {
  id: string
  title: string
  author: string
  genre: string
  publication_year: number | null
  description: string
  cover_image_url: string | null
  statistics: BookStatistics
  created_at: string
}

// Scenario Browse Types (Story 3.3)
export interface BrowseScenario {
  id: string
  base_story: string
  scenario_type: 'CHARACTER_CHANGE' | 'EVENT_ALTERATION' | 'SETTING_MODIFICATION'
  scenario_preview: string
  fork_count: number
  creator_username: string
  parameters: {
    character?: string
    new_property?: string
    original_property?: string
    event_name?: string
    new_setting?: string
  }
  created_at: string
  // Extended fields for detail page
  title?: string
  description?: string
  whatIfQuestion?: string
  parent_scenario_id?: string
  user_id?: string
  conversation_count?: number
  like_count?: number
}

export interface BrowseFilters {
  baseStory: string[]
  scenarioTypes: string[]
  minQuality: number
  sortBy: 'popular' | 'quality' | 'newest'
}

export interface ScenarioBrowseResponse {
  content: BrowseScenario[]
  page: number
  size: number
  total: number
  last: boolean
}

// Scenario Forking Types (Story 3.5)
export interface ForkScenarioRequest {
  title?: string
  description?: string
  whatIfQuestion?: string
  isPrivate?: boolean
}

export interface ForkedScenarioResponse {
  id: string
  userId: string
  parentScenarioId: string
  title: string
  description: string | null
  whatIfQuestion: string
  isPrivate: boolean
  scenarioType: 'ROOT' | 'LEAF'
  createdAt: string
}

// Scenario Tree Visualization Types (Story 5.2)
// Matches backend response from Story 5.1
export interface ScenarioTreeNode {
  id: string
  title: string
  whatIfQuestion: string
  description: string | null
  user_id: string
  created_at: string
  conversation_count: number
  fork_count: number
  like_count: number
  parent_scenario_id?: string | null // Only for leaf nodes
  scenarioType?: 'ROOT' | 'LEAF'
}

export interface ScenarioTreeResponse {
  root: ScenarioTreeNode
  children: ScenarioTreeNode[] // Direct children only (depth 1)
  totalCount: number // 1 + children.length
  maxDepth: number // 0 (no children) or 1 (has children)
}

// Scenario Search Types (Story 3.6)
export interface ScenarioSearchFilters {
  query?: string
  category?: 'CHARACTER_CHANGE' | 'EVENT_ALTERATION' | 'SETTING_MODIFICATION' | 'MIXED'
  creatorId?: string
  minQualityScore?: number
  page?: number
  size?: number
  sort?: string
}

export interface ScenarioSearchResult extends BrowseScenario {
  relevanceScore?: number
}

export interface ScenarioSearchResponse {
  content: ScenarioSearchResult[]
  page: {
    number: number
    size: number
    totalElements: number
    totalPages: number
  }
  last: boolean
  first: boolean
  empty: boolean
}

// Memo Types (Story 6.9)
export interface ConversationMemo {
  id: string
  conversationId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateMemoRequest {
  content: string
}

export interface UpdateMemoRequest {
  content: string
}

// API Error Response
export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}
