<template>
  <div v-if="isOpen" class="fork-modal-overlay" @click.self="handleClose">
    <div :class="css({ ...modalContent, animation: 'fadeIn 0.2s ease-out' })">
      <!-- Header -->
      <div :class="css(modalHeader)">
        <h2 :class="css({ fontSize: '1.5rem', fontWeight: '600', color: 'gray.900' })">
          {{ step === 1 ? 'Review Parent Scenario' : 'Create Your Fork' }}
        </h2>
        <button :class="css(closeButton)" aria-label="Close modal" @click="handleClose">✕</button>
      </div>

      <!-- Step 1: Review Parent -->
      <div v-if="step === 1" :class="css(stepContainer)">
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

        <button :class="css(primaryButton)" @click="step = 2">Continue to Customize →</button>
      </div>

      <!-- Step 2: Customize Fork -->
      <div v-if="step === 2" :class="css(stepContainer)">
        <div :class="css(lineageBreadcrumb)">
          <span>{{ parentScenario.base_story }}</span>
          <span :class="css({ mx: '2', color: 'gray.400' })">→</span>
          <span :class="css({ color: 'gray.600' })">{{ parentScenario.title }}</span>
          <span :class="css({ mx: '2', color: 'gray.400' })">→</span>
          <strong :class="css({ color: 'blue.600' })">Your Fork</strong>
        </div>

        <form :class="css({ spaceY: '4' })" @submit.prevent="handleSubmit">
          <div :class="css(formGroup)">
            <label :class="css(formLabel)">
              Fork Title
              <span :class="css({ fontSize: '0.875rem', color: 'gray.500', fontWeight: 'normal' })">
                (optional)
              </span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              :class="css(formInput)"
              placeholder="e.g., Hermione in Slytherin as Head Girl"
              maxlength="200"
            />
            <p :class="css(formHint)">Leave empty to use: "Fork of {{ parentScenario.title }}"</p>
          </div>

          <div :class="css(formGroup)">
            <label :class="css(formLabel)">
              Description
              <span :class="css({ fontSize: '0.875rem', color: 'gray.500', fontWeight: 'normal' })">
                (optional)
              </span>
            </label>
            <textarea
              v-model="formData.description"
              :class="css(formTextarea)"
              rows="3"
              placeholder="Describe what makes your fork unique..."
            />
          </div>

          <div :class="css(formGroup)">
            <label :class="css(formLabel)">
              What If Question
              <span :class="css({ fontSize: '0.875rem', color: 'gray.500', fontWeight: 'normal' })">
                (optional)
              </span>
            </label>
            <input
              v-model="formData.whatIfQuestion"
              type="text"
              :class="css(formInput)"
              placeholder="What if Hermione was in Slytherin AND became Head Girl?"
            />
            <p :class="css(formHint)">
              Leave empty to inherit: "{{ parentScenario.whatIfQuestion }}"
            </p>
          </div>

          <div :class="css(formGroup)">
            <label
              :class="css({ display: 'flex', alignItems: 'center', gap: '2', cursor: 'pointer' })"
            >
              <input
                v-model="formData.isPrivate"
                type="checkbox"
                :class="css({ w: '4', h: '4', cursor: 'pointer' })"
              />
              <span :class="css({ fontSize: '0.875rem', color: 'gray.700' })">
                Make this fork private
              </span>
            </label>
          </div>

          <div :class="css(previewPanel)">
            <h4
              :class="
                css({ fontSize: '0.875rem', fontWeight: '600', mb: '2', color: 'orange.800' })
              "
            >
              Preview
            </h4>
            <p :class="css({ fontSize: '1rem', fontWeight: '500', color: 'orange.900' })">
              {{ previewText }}
            </p>
          </div>

          <div :class="css({ display: 'flex', gap: '3', justifyContent: 'flex-end', mt: '6' })">
            <button type="button" :class="css(secondaryButton)" @click="step = 1">← Back</button>
            <button type="submit" :class="css(primaryButton)" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating Fork...' : 'Create Fork' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { css } from '../../../styled-system/css'
import { useToast } from '@/composables/useToast'
import type { BrowseScenario, ForkScenarioRequest } from '@/types'
import api from '@/services/api'

interface Props {
  parentScenario: BrowseScenario
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  forked: [scenario: any]
}>()

const { success, error: showError } = useToast()

const step = ref(1)
const isSubmitting = ref(false)

const formData = ref<ForkScenarioRequest>({
  title: '',
  description: '',
  whatIfQuestion: '',
  isPrivate: false,
})

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

const previewText = computed(() => {
  if (formData.value.whatIfQuestion && formData.value.whatIfQuestion.trim()) {
    return formData.value.whatIfQuestion
  }
  if (formData.value.title && formData.value.title.trim()) {
    return `What if... ${formData.value.title}`
  }
  return parentPreview.value
})

const handleClose = () => {
  step.value = 1
  formData.value = {
    title: '',
    description: '',
    whatIfQuestion: '',
    isPrivate: false,
  }
  emit('close')
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    const payload: ForkScenarioRequest = {}

    if (formData.value.title?.trim()) {
      payload.title = formData.value.title.trim()
    }
    if (formData.value.description?.trim()) {
      payload.description = formData.value.description.trim()
    }
    if (formData.value.whatIfQuestion?.trim()) {
      payload.whatIfQuestion = formData.value.whatIfQuestion.trim()
    }
    payload.isPrivate = formData.value.isPrivate

    const response = await api.post(`/scenarios/${props.parentScenario.id}/fork`, payload, {
      headers: {
        'X-User-Id': 'test-user-id', // TODO: Replace with actual user ID from auth
      },
    })

    emit('forked', response.data)
    handleClose()

    // Show success toast
    success('🍴 Scenario forked! Explore your meta-timeline.')
  } catch (error: any) {
    console.error('Failed to fork scenario:', error)
    const errorMsg = error.response?.data?.message || 'Failed to fork scenario'
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
  maxW: '2xl',
  w: '90vw',
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

const lineageBreadcrumb = {
  bg: 'gray.100',
  p: '3',
  borderRadius: 'md',
  fontSize: '0.875rem',
  mb: '4',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap' as const,
}

const formGroup = {
  spaceY: '2',
}

const formLabel = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.700',
}

const formInput = {
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  _focus: {
    outline: 'none',
    borderColor: 'blue.500',
    ring: '2px',
    ringColor: 'blue.200',
  },
}

const formTextarea = {
  w: 'full',
  px: '3',
  py: '2',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  _focus: {
    outline: 'none',
    borderColor: 'blue.500',
    ring: '2px',
    ringColor: 'blue.200',
  },
}

const formHint = {
  fontSize: '0.75rem',
  color: 'gray.500',
  mt: '1',
}

const previewPanel = {
  bg: 'orange.50',
  border: '1px solid',
  borderColor: 'orange.200',
  p: '4',
  borderRadius: 'md',
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
