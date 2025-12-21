<template>
  <div class="scenario-detail-page">
    <div v-if="isLoading" class="loading-state">
      <p>Loading scenario...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">
        {{ error }}
      </p>
      <button @click="$router.push('/scenarios/browse')">← Back to Browse</button>
    </div>

    <div v-else-if="scenario" class="content">
      <div class="header">
        <button class="back-button" @click="$router.push('/scenarios/browse')">
          ← Back to Browse
        </button>

        <div class="badges">
          <span class="badge base-story">{{ scenario.base_story }}</span>
          <span class="badge scenario-type">{{ scenarioTypeLabel }}</span>
          <span
            v-if="scenario.parent_scenario_id"
            class="badge forked"
            data-testid="meta-fork-indicator"
          >
            🍴 Forked from
          </span>
        </div>

        <h1 data-testid="scenario-title" class="title">
          {{ scenario.title }}
        </h1>

        <p data-testid="scenario-what-if" class="what-if">
          {{ scenario.whatIfQuestion || whatIfPreview }}
        </p>

        <p v-if="scenario.description" class="description">
          {{ scenario.description }}
        </p>

        <div class="stats">
          <div class="stat-item">
            <span>💬</span>
            <span>{{ scenario.conversation_count || 0 }} conversations</span>
          </div>
          <div class="stat-item">
            <span>🍴</span>
            <span data-testid="meta-fork-count">{{ scenario.fork_count || 0 }} forks</span>
          </div>
          <div class="stat-item">
            <span>❤️</span>
            <span>{{ scenario.like_count || 0 }} likes</span>
          </div>
        </div>

        <div class="actions">
          <button
            :disabled="isLiking"
            class="btn-like"
            :class="{ liked: isLiked }"
            @click="toggleLike"
          >
            {{ isLiked ? '❤️' : '🤍' }} {{ isLiked ? 'Unlike' : 'Like' }}
          </button>
          <button
            data-testid="start-conversation-button"
            class="btn-primary"
            @click="handleStartConversation"
          >
            💬 Start Conversation
          </button>
          <button
            v-if="!scenario.parent_scenario_id"
            data-testid="meta-fork-button"
            class="btn-secondary"
            @click="handleFork"
          >
            🍴 Fork Scenario
          </button>
        </div>
      </div>

      <div class="tabs">
        <TabView>
          <TabPanel header="Scenario Tree">
            <ScenarioTreeView v-if="scenario.parent_scenario_id" :scenario-id="scenarioId" />
            <p v-else class="no-tree">This is a root scenario (no parent)</p>
          </TabPanel>
          <TabPanel v-if="!scenario.parent_scenario_id" header="Fork History">
            <ForkHistoryTree :scenario-id="scenarioId" />
          </TabPanel>
        </TabView>
      </div>
    </div>

    <ForkScenarioModal
      v-if="showForkModal"
      :parent-scenario="scenario"
      :is-open="showForkModal"
      @close="showForkModal = false"
      @forked="handleForked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAnalytics } from '@/composables/useAnalytics'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ForkScenarioModal from '@/components/scenario/ForkScenarioModal.vue'
import ScenarioTreeView from '@/components/scenario/ScenarioTreeView.vue'
import ForkHistoryTree from '@/components/scenario/ForkHistoryTree.vue'
import type { BrowseScenario } from '@/types'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { success, error: showErrorToast } = useToast()
const { trackScenarioViewed, trackScenarioForked } = useAnalytics()
const authStore = useAuthStore()
const scenarioId = route.params.id as string

const scenario = ref<BrowseScenario | null>(null)
const isLoading = ref(true)
const error = ref('')
const showForkModal = ref(false)
const isLiked = ref(false)
const isLiking = ref(false)

const scenarioTypeLabel = computed(() => {
  if (!scenario.value) return ''
  const labels = {
    CHARACTER_CHANGE: 'Character Change',
    EVENT_ALTERATION: 'Event Alteration',
    SETTING_MODIFICATION: 'Setting Modification',
  }
  return labels[scenario.value.scenario_type as keyof typeof labels] || scenario.value.scenario_type
})

const whatIfPreview = computed(() => {
  if (!scenario.value) return ''
  const { scenario_type, parameters, base_story } = scenario.value

  if (scenario_type === 'CHARACTER_CHANGE') {
    return `What if ${parameters.character} was ${parameters.new_property} instead of ${parameters.original_property}?`
  } else if (scenario_type === 'EVENT_ALTERATION') {
    return `What if ${parameters.event_name} had a different outcome in ${base_story}?`
  } else {
    return `What if ${base_story} took place in ${parameters.new_setting}?`
  }
})

const fetchScenario = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await api.get(`/scenarios/${scenarioId}`)
    scenario.value = response.data
    trackScenarioViewed(scenarioId, response.data.book_id)

    // Fetch like status if authenticated
    if (authStore.isAuthenticated && authStore.user) {
      try {
        const likeResponse = await api.get(`/scenarios/${scenarioId}/like-status`)
        isLiked.value = likeResponse.data.isLiked || false
      } catch (err) {
        console.error('Failed to fetch like status:', err)
      }
    }
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { message?: string } } }
    console.error('Failed to fetch scenario:', err)

    // Handle authentication errors
    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
      router.push({ name: 'Login', query: { redirect: `/scenarios/${scenarioId}` } })
      return
    }

    error.value = apiError.response?.data?.message || 'Failed to load scenario'
  } finally {
    isLoading.value = false
  }
}

const handleFork = () => {
  if (!authStore.isAuthenticated) {
    showErrorToast('Please login to fork a scenario')
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }

  if (scenario.value?.parent_scenario_id) {
    alert('Cannot fork a forked scenario. Maximum fork depth is 1.')
    return
  }
  showForkModal.value = true
}

const handleForked = async (forkedConversation: { id: string }) => {
  console.log('Scenario forked and conversation created!', forkedConversation)

  trackScenarioForked({
    originalId: scenarioId,
    bookId: scenario.value?.book_id,
  })

  if (scenario.value) {
    scenario.value.fork_count = (scenario.value.fork_count || 0) + 1
  }

  success('🍴 Scenario forked! Starting your conversation...', 4000)
  router.push(`/conversations/${forkedConversation.id}`)
}

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    showErrorToast('Please login to like scenarios')
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }

  if (isLiking.value) return

  isLiking.value = true
  const previousLikedState = isLiked.value

  try {
    // Optimistic update
    isLiked.value = !isLiked.value

    if (isLiked.value) {
      await api.post(`/scenarios/${scenarioId}/like`)
      if (scenario.value) {
        scenario.value.like_count = (scenario.value.like_count || 0) + 1
      }
    } else {
      await api.delete(`/scenarios/${scenarioId}/like`)
      if (scenario.value) {
        scenario.value.like_count = Math.max(0, (scenario.value.like_count || 0) - 1)
      }
    }
  } catch (err) {
    console.error('Failed to toggle like:', err)
    // Revert on error
    isLiked.value = previousLikedState
    showErrorToast('Failed to update like status')
  } finally {
    isLiking.value = false
  }
}

const handleStartConversation = async () => {
  if (!scenario.value) return

  // Check authentication
  const authData = localStorage.getItem('auth')
  if (!authData) {
    // Not authenticated, redirect to login
    router.push({ name: 'Login', query: { redirect: `/scenarios/${scenarioId}` } })
    return
  }

  try {
    // TODO: Allow user to select character
    // For now, use a default character VectorDB ID
    const response = await api.post(`/conversations`, {
      scenarioId: scenarioId,
      scenarioType: scenario.value.scenario_type,
      characterVectordbId: 'default-character-id', // TODO: Get from character selection
    })

    const conversationId = response.data.id
    router.push(`/conversations/${conversationId}`)
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { message?: string } } }
    console.error('Failed to create conversation:', err)

    // Check if it's an authentication error
    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
      router.push({ name: 'Login', query: { redirect: `/scenarios/${scenarioId}` } })
      return
    }

    // Show error toast for other errors
    const errorMessage = apiError.response?.data?.message || 'Failed to create conversation'
    showErrorToast('대화 생성 실패: ' + errorMessage)
  }
}

onMounted(() => {
  fetchScenario()
})
</script>

<style scoped>
.scenario-detail-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.error-message {
  color: #dc2626;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.back-button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.back-button:hover {
  text-decoration: underline;
}

.badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.base-story {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge.scenario-type {
  background-color: #e0e7ff;
  color: #4338ca;
}

.badge.forked {
  background-color: #fef3c7;
  color: #92400e;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.what-if {
  font-size: 1.25rem;
  color: #2563eb;
  font-style: italic;
  margin-bottom: 1rem;
}

.description {
  font-size: 1rem;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-like {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-secondary:hover {
  background-color: #eff6ff;
}

.btn-like {
  background-color: white;
  color: #6b7280;
  border: 2px solid #d1d5db;
}

.btn-like:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-like.liked {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

.btn-like:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabs {
  margin-top: 2rem;
}

.no-tree {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
}
</style>
