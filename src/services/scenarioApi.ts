import api from './api'
import type {
  CreateScenarioRequest,
  CreateScenarioResponse,
  ScenarioSearchFilters,
  ScenarioSearchResponse,
  ScenarioTreeResponse,
} from '@/types'

/**
 * Scenario API service for handling scenario-related API calls
 */
export const scenarioApi = {
  /**
   * Create a new scenario
   * POST /api/v1/scenarios
   */
  async createScenario(data: CreateScenarioRequest): Promise<CreateScenarioResponse> {
    const response = await api.post<CreateScenarioResponse>('/scenarios', data)
    return response.data
  },

  /**
   * Get a scenario by ID
   * GET /api/v1/scenarios/:id
   */
  async getScenario(scenarioId: string): Promise<CreateScenarioResponse> {
    const response = await api.get<CreateScenarioResponse>(`/scenarios/${scenarioId}`)
    return response.data
  },

  /**
   * Get scenarios for a book
   * GET /api/v1/books/:bookId/scenarios
   */
  async getBookScenarios(bookId: string): Promise<CreateScenarioResponse[]> {
    const response = await api.get<CreateScenarioResponse[]>(`/books/${bookId}/scenarios`)
    return response.data
  },

  /**
   * Delete a scenario
   * DELETE /api/v1/scenarios/:id
   */
  async deleteScenario(scenarioId: string): Promise<void> {
    await api.delete(`/scenarios/${scenarioId}`)
  },

  /**
   * Advanced search with filters
   * GET /api/v1/scenarios/search
   * Story 3.6: Scenario Search & Advanced Filtering
   */
  async searchScenarios(filters: ScenarioSearchFilters): Promise<ScenarioSearchResponse> {
    const params = new URLSearchParams()

    if (filters.query) params.append('query', filters.query)
    if (filters.category) params.append('category', filters.category)
    if (filters.creatorId) params.append('creatorId', filters.creatorId)
    if (filters.minQualityScore !== undefined)
      params.append('minQualityScore', filters.minQualityScore.toString())
    if (filters.page !== undefined) params.append('page', filters.page.toString())
    if (filters.size !== undefined) params.append('size', filters.size.toString())
    if (filters.sort) params.append('sort', filters.sort)

    const response = await api.get<ScenarioSearchResponse>(`/scenarios/search?${params}`)
    return response.data
  },

  /**
   * Get scenario tree (fork structure)
   * GET /api/v1/scenarios/:id/tree
   * Story 5.2: Scenario Tree Visualization
   */
  async getScenarioTree(scenarioId: string): Promise<ScenarioTreeResponse> {
    // Check for mock API in test/development mode
    if (
      typeof window !== 'undefined' &&
      (window as { mockScenarioTreeAPI?: (id: string) => Promise<ScenarioTreeResponse> })
        .mockScenarioTreeAPI
    ) {
      return (
        window as { mockScenarioTreeAPI: (id: string) => Promise<ScenarioTreeResponse> }
      ).mockScenarioTreeAPI(scenarioId)
    }

    const response = await api.get<ScenarioTreeResponse>(`/scenarios/${scenarioId}/tree`)
    return response.data
  },
}

export default scenarioApi
