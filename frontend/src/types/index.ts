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
  book_id: string
  scenario_title: string
  character_changes: string | null
  event_alterations: string | null
  setting_modifications: string | null
  created_at: string
  updated_at: string
}

// Scenario Form State
export interface ScenarioFormState {
  title: string
  character_changes: string
  event_alterations: string
  setting_modifications: string
}

// API Error Response
export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}
