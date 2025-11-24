import api from './api'
import type { CreateScenarioRequest, CreateScenarioResponse } from '@/types'

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
}

export default scenarioApi
