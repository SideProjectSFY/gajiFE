<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<template>
  <div :class="css(pageContainer)">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      :class="css({ textAlign: 'center', py: '12' })"
    >
      <div :class="css({ fontSize: '1.5rem', color: 'gray.400' })">
        Loading...
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      :class="css({ textAlign: 'center', py: '12' })"
    >
      <div :class="css({ fontSize: '1.25rem', color: 'red.600', mb: '4' })">
        {{ error }}
      </div>
      <button
        :class="css(backButton)"
        @click="router.push('/scenarios/browse')"
      >
        ← Back to Browse
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="scenario">
      <!-- Header -->
      <div :class="css(headerSection)">
        <button
          :class="css(backButton)"
          @click="router.push('/scenarios/browse')"
        >
          ← Back to Browse
        </button>

        <div :class="css({ display: 'flex', gap: '2', mt: '4', flexWrap: 'wrap' })">
          <span :class="css(baseStoryBadge)">
            {{ scenario.base_story }}
          </span>
          <span :class="css(scenarioTypeBadge)">
            {{ scenarioTypeLabel }}
          </span>
          <span
            v-if="scenario.parent_scenario_id"
            :class="css(forkedBadge)"
          > 🍴 Forked </span>
        </div>

        <h1
          :class="css({ fontSize: '2rem', fontWeight: '700', color: 'gray.900', mt: '3', mb: '2' })"
        >
          {{ scenario.title }}
        </h1>

        <p :class="css({ fontSize: '1.25rem', color: 'blue.600', fontStyle: 'italic', mb: '4' })">
          {{ scenario.whatIfQuestion || whatIfPreview }}
        </p>

        <p
          v-if="scenario.description"
          :class="css({ fontSize: '1rem', color: 'gray.700', lineHeight: '1.6', mb: '6' })"
        >
          {{ scenario.description }}
        </p>

        <!-- Stats -->
        <div :class="css(statsRow)">
          <div :class="css(statItem)">
            <span :class="css({ fontSize: '1.5rem' })">💬</span>
            <span>{{ scenario.conversation_count }} conversations</span>
          </div>
          <div :class="css(statItem)">
            <span :class="css({ fontSize: '1.5rem' })">🍴</span>
            <span>{{ scenario.fork_count }} forks</span>
          </div>
          <div :class="css(statItem)">
            <span :class="css({ fontSize: '1.5rem' })">❤️</span>
            <span>{{ scenario.like_count }} likes</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div :class="css({ display: 'flex', gap: '3', mt: '6' })">
          <button
            :class="css(primaryButton)"
            :disabled="!!scenario.parent_scenario_id"
            :title="
              scenario.parent_scenario_id
                ? 'Cannot fork a forked scenario (max depth: 1)'
                : 'Create a fork'
            "
            @click="handleFork"
          >
            🍴 Fork This Scenario
          </button>
          <button
            :class="css(secondaryButton)"
            @click="handleStartConversation"
          >
            💬 Start Conversation
          </button>
        </div>
      </div>

      <!-- Tabbed Content -->
      <TabView :class="css({ mb: '8' })">
        <!-- Details Tab -->
        <TabPanel header="Details">
          <!-- Parameters Section -->
          <div :class="css(parametersSection)">
            <h2 :class="css(sectionTitle)">
              Scenario Parameters
            </h2>
            <div :class="css(parameterGrid)">
              <div
                v-for="(value, key) in scenario.parameters"
                :key="key"
                :class="css(parameterItem)"
              >
                <strong :class="css({ textTransform: 'capitalize', color: 'gray.700' })">
                  {{ key.replace(/_/g, ' ') }}:
                </strong>
                <span :class="css({ color: 'gray.600' })">{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- Fork Lineage (if forked) -->
          <div
            v-if="scenario.parent_scenario_id"
            :class="css(lineageSection)"
          >
            <h2 :class="css(sectionTitle)">
              Fork Lineage
            </h2>
            <div
              :class="
                css({
                  bg: 'blue.50',
                  p: '4',
                  borderRadius: 'md',
                  border: '1px solid',
                  borderColor: 'blue.200',
                })
              "
            >
              <p :class="css({ fontSize: '0.875rem', color: 'blue.900' })">
                This scenario is a fork of
                <strong
                  :class="
                    css({ color: 'blue.700', cursor: 'pointer', textDecoration: 'underline' })
                  "
                  @click="router.push(`/scenarios/${scenario.parent_scenario_id}`)"
                >
                  Parent Scenario
                </strong>
              </p>
            </div>
          </div>

          <!-- Creator Info -->
          <div :class="css(creatorSection)">
            <h2 :class="css(sectionTitle)">
              Created By
            </h2>
            <div :class="css({ display: 'flex', alignItems: 'center', gap: '3' })">
              <div :class="css(avatar)">
                {{ scenario.user_id.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p :class="css({ fontWeight: '500', color: 'gray.900' })">
                  {{ scenario.user_id }}
                </p>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.500' })">
                  Created {{ new Date(scenario.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Fork History Tab (only for root scenarios) -->
        <TabPanel
          v-if="!scenario.parent_scenario_id"
          header="Fork History"
        >
          <ScenarioTreeView
            :scenario-id="scenarioId"
            :current-scenario-id="scenarioId"
          />
        </TabPanel>
      </TabView>
    </div>

    <!-- Fork Modal -->
    <ForkScenarioModal
      v-if="scenario"
      :parent-scenario="scenario"
      :is-open="showForkModal"
      @close="showForkModal = false"
      @forked="handleForked"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import { useToast } from '@/composables/useToast'
import { useAnalytics } from '@/composables/useAnalytics'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ForkScenarioModal from '@/components/scenario/ForkScenarioModal.vue'
import ScenarioTreeView from '@/components/scenario/ScenarioTreeView.vue'
import type { BrowseScenario } from '@/types'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const { success } = useToast()
const { trackScenarioViewed, trackScenarioForked } = useAnalytics()
const scenarioId = route.params.id as string

const scenario = ref<BrowseScenario | null>(null)
const isLoading = ref(true)
const error = ref('')
const showForkModal = ref(false)

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

    // GA4: 시나리오 조회 추적
    trackScenarioViewed(scenarioId, response.data.book_id)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    console.error('Failed to fetch scenario:', err)
    error.value = error.response?.data?.message || 'Failed to load scenario'
  } finally {
    isLoading.value = false
  }
}

const handleFork = () => {
  // Check if it's a LEAF scenario (forked scenario)
  if (scenario.value?.parent_scenario_id) {
    alert('Cannot fork a forked scenario. Maximum fork depth is 1.')
    return
  }
  showForkModal.value = true
}

interface ForkedScenario {
  id: string
  [key: string]: unknown
}

const handleForked = async (forkedScenario: ForkedScenario): Promise<void> => {
  console.log('Scenario forked successfully!', forkedScenario)

  // GA4: 시나리오 포크 추적
  trackScenarioForked({
    originalId: scenarioId,
    bookId: scenario.value?.book_id,
  })

  // Update the parent scenario's fork count
  if (scenario.value) {
    scenario.value.fork_count = (scenario.value.fork_count || 0) + 1
  }

  // Show success toast notification
  success('🍴 Scenario forked! Explore your meta-timeline.', 4000)

  // Navigate to the new forked scenario
  router.push(`/scenarios/${forkedScenario.id}`)
}

const handleStartConversation = () => {
  // TODO: Implement conversation start logic
  console.log('Start conversation with scenario:', scenarioId)
  alert('Start Conversation feature coming soon!')
}

onMounted(() => {
  fetchScenario()
})

// Styles
const pageContainer = {
  maxW: '4xl',
  mx: 'auto',
  px: '6',
  py: '8',
}

const headerSection = {
  mb: '8',
  pb: '8',
  borderBottom: '2px solid',
  borderColor: 'gray.200',
}

const backButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
  py: '2',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'gray.700',
  bg: 'gray.100',
  borderRadius: 'md',
  cursor: 'pointer',
  border: 'none',
  _hover: { bg: 'gray.200' },
}

const baseStoryBadge = {
  display: 'inline-block',
  px: '3',
  py: '1',
  fontSize: '0.875rem',
  fontWeight: '500',
  bg: 'blue.100',
  color: 'blue.800',
  borderRadius: 'full',
}

const scenarioTypeBadge = {
  display: 'inline-block',
  px: '3',
  py: '1',
  fontSize: '0.875rem',
  fontWeight: '500',
  bg: 'purple.100',
  color: 'purple.800',
  borderRadius: 'full',
}

const forkedBadge = {
  display: 'inline-block',
  px: '3',
  py: '1',
  fontSize: '0.875rem',
  fontWeight: '500',
  bg: 'orange.100',
  color: 'orange.800',
  borderRadius: 'full',
}

const statsRow = {
  display: 'flex',
  gap: '6',
  flexWrap: 'wrap' as const,
}

const statItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontSize: '1rem',
  color: 'gray.700',
}

const primaryButton = {
  px: '6',
  py: '3',
  fontSize: '1rem',
  fontWeight: '600',
  bg: 'blue.600',
  color: 'white',
  borderRadius: 'md',
  cursor: 'pointer',
  border: 'none',
  _hover: { bg: 'blue.700' },
  _disabled: {
    bg: 'gray.400',
    cursor: 'not-allowed',
  },
}

const secondaryButton = {
  px: '6',
  py: '3',
  fontSize: '1rem',
  fontWeight: '600',
  bg: 'white',
  color: 'blue.600',
  border: '2px solid',
  borderColor: 'blue.600',
  borderRadius: 'md',
  cursor: 'pointer',
  _hover: {
    bg: 'blue.50',
  },
}

const parametersSection = {
  mb: '8',
}

const sectionTitle = {
  fontSize: '1.5rem',
  fontWeight: '600',
  color: 'gray.900',
  mb: '4',
}

const parameterGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '4',
  bg: 'gray.50',
  p: '4',
  borderRadius: 'md',
}

const parameterItem = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1',
}

const lineageSection = {
  mb: '8',
}

const creatorSection = {
  mb: '8',
}

const avatar = {
  w: '12',
  h: '12',
  borderRadius: 'full',
  bg: 'blue.600',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  fontWeight: '600',
}
</script>
