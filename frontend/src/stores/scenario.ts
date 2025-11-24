import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scenarioApi } from '@/services/scenarioApi'
import type { CreateScenarioRequest, CreateScenarioResponse } from '@/types'

export interface Scenario {
  id: string
  title: string
  description: string
  bookId?: string
  bookTitle?: string
  characterChanges?: string | null
  eventAlterations?: string | null
  settingModifications?: string | null
  characters: string[]
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export const useScenarioStore = defineStore('scenario', () => {
  // State
  const scenarios = ref<Scenario[]>([])
  const currentScenario = ref<Scenario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setScenarios(newScenarios: Scenario[]): void {
    scenarios.value = newScenarios
  }

  function setCurrentScenario(scenario: Scenario | null): void {
    currentScenario.value = scenario
  }

  async function fetchScenarios(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // This will be implemented when we integrate with the backend
      loading.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch scenarios'
      loading.value = false
    }
  }

  async function fetchBookScenarios(bookId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await scenarioApi.getBookScenarios(bookId)
      scenarios.value = response.map(mapResponseToScenario)
      loading.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch book scenarios'
      loading.value = false
    }
  }

  async function createScenario(data: CreateScenarioRequest): Promise<CreateScenarioResponse> {
    loading.value = true
    error.value = null
    try {
      const response = await scenarioApi.createScenario(data)
      // Add the new scenario to the list
      scenarios.value.push(mapResponseToScenario(response))
      loading.value = false
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create scenario'
      loading.value = false
      throw err
    }
  }

  // Helper function to map API response to Scenario interface
  function mapResponseToScenario(response: CreateScenarioResponse): Scenario {
    return {
      id: response.id,
      title: response.scenario_title,
      description: '', // Will be populated from other API calls
      bookId: response.book_id,
      characterChanges: response.character_changes,
      eventAlterations: response.event_alterations,
      settingModifications: response.setting_modifications,
      characters: [],
      tags: [],
      isPublic: false,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    }
  }

  return {
    scenarios,
    currentScenario,
    loading,
    error,
    setScenarios,
    setCurrentScenario,
    fetchScenarios,
    fetchBookScenarios,
    createScenario,
  }
})
