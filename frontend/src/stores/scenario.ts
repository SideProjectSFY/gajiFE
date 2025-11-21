import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Scenario {
  id: string
  title: string
  description: string
  bookTitle?: string
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

  async function createScenario(
    scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // This will be implemented when we integrate with the backend
      loading.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create scenario'
      loading.value = false
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
    createScenario,
  }
})
