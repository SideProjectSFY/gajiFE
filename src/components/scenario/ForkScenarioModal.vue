<template>
  <div
    v-if="isOpen"
    class="fork-modal-overlay"
    data-testid="scenario-modal"
    @click.self="handleClose"
  >
    <div :class="css({ ...modalContent, animation: 'fadeIn 0.2s ease-out' })">
      <!-- Header -->
      <div :class="css(modalHeader)">
        <h2 :class="css({ fontSize: '1.5rem', fontWeight: '600', color: 'gray.900' })">
          Fork Scenario
        </h2>
        <button :class="css(closeButton)" aria-label="Close modal" @click="handleClose">✕</button>
      </div>

      <!-- Review Parent -->
      <div :class="css(stepContainer)">
        `
        <div :class="css(parentCard)">
          <div :class="css({ mb: '3' })">
            <span :class="css(baseStoryBadge)">
              {{ parentScenario.base_story }}
            </span>
            <span :class="css(scenarioTypeBadge)">
              {{ scenarioTypeLabel }}
            </span>
          </div>

          <p :class="css({ fontSize: '1.125rem', fontWeight: '500', mb: '4', color: 'gray.800' })">
            {{ parentScenario.whatIfQuestion || parentPreview }}
          </p>

          <div :class="css({ bg: 'gray.50', p: '3', borderRadius: 'md', mb: '4' })">
            <h4
              :class="css({ fontSize: '0.875rem', fontWeight: '600', mb: '2', color: 'gray.700' })"
            >
              Current Setup:
            </h4>
            <div :class="css({ fontSize: '0.875rem', color: 'gray.600', spaceY: '1' })">
              <p v-if="parentScenario.title"><strong>Title:</strong> {{ parentScenario.title }}</p>
              <p v-if="parentScenario.description">
                <strong>Description:</strong> {{ parentScenario.description }}
              </p>
            </div>
          </div>

          <!-- Read-only scenario details -->
          <div :class="css(readOnlySection)">
            <h4 :class="css(readOnlySectionTitle)">📖 Original Scenario Details (Read-only)</h4>

            <div :class="css(readOnlyField)">
              <label :class="css(readOnlyLabel)">Character Properties</label>
              <div :class="css(readOnlyContent)">
                {{ parentScenario.parameters?.character_changes || 'Not specified' }}
              </div>
            </div>

            <div :class="css(readOnlyField)">
              <label :class="css(readOnlyLabel)">Event Alterations</label>
              <div :class="css(readOnlyContent)">
                {{ parentScenario.parameters?.event_alterations || 'Not specified' }}
              </div>
            </div>

            <div :class="css(readOnlyField)">
              <label :class="css(readOnlyLabel)">Setting Modifications</label>
              <div :class="css(readOnlyContent)">
                {{ parentScenario.parameters?.setting_modifications || 'Not specified' }}
              </div>
            </div>
          </div>
        </div>

        <div :class="css(infoBox)">
          <p :class="css({ mb: '2' })">
            🍴 <strong>Forking</strong> creates a new scenario based on this one. You can customize
            the title, description, and "What If" question to explore a different direction.
          </p>
          <p :class="css({ fontSize: '0.875rem', color: 'blue.700', fontStyle: 'italic' })">
            Example: "What if Hermione was in Slytherin?" → "What if Hermione was in Slytherin AND
            became Head Girl?"
          </p>
        </div>

        <div :class="css({ display: 'flex', gap: '3', justifyContent: 'flex-end' })">
          <button type="button" :class="css(secondaryButton)" @click="handleClose">Cancel</button>
          <button
            type="button"
            :class="css(primaryButton)"
            data-testid="submit-scenario-button"
            :disabled="isSubmitting"
            @click="handleForkSubmit"
          >
            {{ isSubmitting ? 'Creating Fork...' : '🍴 Create Fork' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { css } from '../../../styled-system/css'
import { useToast } from '@/composables/useToast'
import type { BrowseScenario, ForkScenarioRequest } from '@/types'
import api from '@/services/api'

interface Props {
  parentScenario: BrowseScenario
  isOpen: boolean
}

interface ForkEmitData {
  id: string
  [key: string]: unknown
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  forked: [scenario: ForkEmitData]
}>()

const router = useRouter()
const { success, error: showError } = useToast()

const isSubmitting = ref(false)

const scenarioTypeLabel = computed(() => {
  const labels = {
    CHARACTER_CHANGE: 'Character',
    EVENT_ALTERATION: 'Event',
    SETTING_MODIFICATION: 'Setting',
  }
  return labels[props.parentScenario.scenario_type] || props.parentScenario.scenario_type
})

const parentPreview = computed(() => {
  const { scenario_type, parameters, base_story } = props.parentScenario

  if (scenario_type === 'CHARACTER_CHANGE') {
    return `What if ${parameters.character} was ${parameters.new_property} instead of ${parameters.original_property}?`
  } else if (scenario_type === 'EVENT_ALTERATION') {
    return `What if ${parameters.event_name} had a different outcome in ${base_story}?`
  } else {
    return `What if ${base_story} took place in ${parameters.new_setting}?`
  }
})

const handleClose = (): void => {
  emit('close')
}

const handleForkSubmit = async (): Promise<void> => {
  isSubmitting.value = true

  try {
    // Fork the scenario
    const payload: ForkScenarioRequest = {
      isPrivate: false,
    }

    const forkResponse = await api.post(`/scenarios/${props.parentScenario.id}/fork`, payload, {
      headers: {
        'X-User-Id': 'test-user-id', // TODO: Replace with actual user ID from auth
      },
    })

    const forkedScenarioId = forkResponse.data.id

    // Create conversation for the forked scenario
    const conversationPayload = {
      scenarioId: forkedScenarioId,
      title: `Forked: ${props.parentScenario.title || props.parentScenario.base_story}`,
    }

    const conversationResponse = await api.post('/conversations', conversationPayload)
    const conversationId = conversationResponse.data.id

    emit('forked', { id: forkedScenarioId, conversationId })
    handleClose()

    success('🍴 Scenario forked! Starting conversation...')

    // Navigate to conversation page
    router.push(`/conversations/${conversationId}`)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    console.error('Failed to fork scenario:', error)
    const errorMsg = err.response?.data?.message || 'Failed to fork scenario'
    showError(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

// Styles
const modalContent = {
  position: 'relative' as const,
  bg: 'white',
  borderRadius: 'lg',
  p: '6',
  maxW: 'xl',
  w: '85%',
  maxH: '85vh',
  overflowY: 'auto' as const,
  boxShadow: '2xl',
}

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: '6',
  pb: '4',
  borderBottom: '1px solid',
  borderColor: 'gray.200',
}

const closeButton = {
  fontSize: '1.5rem',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: { color: 'gray.700' },
  bg: 'transparent',
  border: 'none',
}

const stepContainer = {
  spaceY: '4',
}

const parentCard = {
  bg: 'gray.50',
  p: '4',
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'gray.200',
}

const baseStoryBadge = {
  display: 'inline-block',
  px: '2',
  py: '1',
  mr: '2',
  fontSize: '0.75rem',
  fontWeight: '500',
  bg: 'blue.100',
  color: 'blue.800',
  borderRadius: 'md',
}

const scenarioTypeBadge = {
  display: 'inline-block',
  px: '2',
  py: '1',
  fontSize: '0.75rem',
  fontWeight: '500',
  bg: 'purple.100',
  color: 'purple.800',
  borderRadius: 'md',
}

const infoBox = {
  bg: 'blue.50',
  border: '1px solid',
  borderColor: 'blue.200',
  p: '4',
  borderRadius: 'md',
  fontSize: '0.875rem',
  color: 'blue.900',
}

const primaryButton = {
  w: 'full',
  px: '4',
  py: '2',
  bg: 'blue.600',
  color: 'white',
  fontWeight: '500',
  borderRadius: 'md',
  cursor: 'pointer',
  _hover: { bg: 'blue.700' },
  _disabled: {
    bg: 'gray.400',
    cursor: 'not-allowed',
  },
}

const secondaryButton = {
  px: '4',
  py: '2',
  bg: 'gray.200',
  color: 'gray.700',
  fontWeight: '500',
  borderRadius: 'md',
  cursor: 'pointer',
  _hover: { bg: 'gray.300' },
}

const readOnlySection = {
  bg: 'gray.50',
  border: '2px solid',
  borderColor: 'gray.300',
  p: '4',
  borderRadius: 'md',
  mb: '4',
  spaceY: '3',
}

const readOnlySectionTitle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.700',
  mb: '3',
  pb: '2',
  borderBottom: '1px solid',
  borderColor: 'gray.300',
}

const readOnlyField = {
  spaceY: '1',
}

const readOnlyLabel = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: 'gray.600',
  textTransform: 'uppercase' as const,
  letterSpacing: 'wide',
}

const readOnlyContent = {
  bg: 'white',
  p: '2.5',
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'gray.200',
  fontSize: '0.875rem',
  color: 'gray.700',
  minH: '10',
}
</script>

<style scoped>
.fork-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
