<template>
  <div
    v-if="isOpen"
    class="scenario-modal-overlay"
    data-testid="create-scenario-modal"
    @click.self="handleClose"
  >
    <div :class="css(modalContent)">
      <!-- Header -->
      <div :class="css(modalHeader)">
        <h2 :class="css({ fontSize: '1.5rem', fontWeight: '600', color: 'gray.900' })">
          Create New Scenario
        </h2>
        <button :class="css(closeButton)" aria-label="Close modal" @click="handleClose">✕</button>
      </div>

      <!-- Book Info -->
      <div :class="css(bookInfoCard)">
        <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
          Creating scenario for: <strong>{{ bookTitle }}</strong>
        </p>
      </div>

      <!-- Form -->
      <form :class="css({ spaceY: '5' })" @submit.prevent="handleSubmit">
        <!-- Character Properties -->
        <div :class="css(formGroup)">
          <label :class="css(formLabel)">
            Character Properties
            <span :class="css(requiredMark)">*</span>
          </label>
          <textarea
            v-model="formData.characterChanges"
            :class="css(formTextarea)"
            rows="4"
            placeholder="Describe character changes (e.g., 'What if Hermione was sorted into Slytherin?')"
            data-testid="character-changes-input"
          />
          <div :class="css(validationRow)">
            <p v-if="!isCharacterChangesValid" :class="css(errorText)">
              Must be at least {{ MIN_CHARS }} characters
            </p>
            <p :class="css(charCount)">{{ getCharCount(formData.characterChanges) }} characters</p>
          </div>
        </div>

        <!-- Event Alterations -->
        <div :class="css(formGroup)">
          <label :class="css(formLabel)">
            Event Alterations
            <span :class="css(requiredMark)">*</span>
          </label>
          <textarea
            v-model="formData.eventAlterations"
            :class="css(formTextarea)"
            rows="4"
            placeholder="Describe event changes (e.g., 'What if Harry Potter lost in the first task of the Triwizard Tournament?')"
            data-testid="event-alterations-input"
          />
          <div :class="css(validationRow)">
            <p v-if="!isEventAlterationsValid" :class="css(errorText)">
              Must be at least {{ MIN_CHARS }} characters
            </p>
            <p :class="css(charCount)">{{ getCharCount(formData.eventAlterations) }} characters</p>
          </div>
        </div>

        <!-- Setting Modifications -->
        <div :class="css(formGroup)">
          <label :class="css(formLabel)">
            Setting Modifications
            <span :class="css(requiredMark)">*</span>
          </label>
          <textarea
            v-model="formData.settingModifications"
            :class="css(formTextarea)"
            rows="4"
            placeholder="Describe setting changes (e.g., 'What if Hogwarts was located in Japan?')"
            data-testid="setting-modifications-input"
          />
          <div :class="css(validationRow)">
            <p v-if="!isSettingModificationsValid" :class="css(errorText)">
              Must be at least {{ MIN_CHARS }} characters
            </p>
            <p :class="css(charCount)">
              {{ getCharCount(formData.settingModifications) }} characters
            </p>
          </div>
        </div>

        <!-- Description -->
        <div :class="css(formGroup)">
          <label :class="css(formLabel)">Description (optional)</label>
          <textarea
            v-model="formData.description"
            :class="css(formTextarea)"
            rows="3"
            placeholder="Add additional details about your scenario..."
            data-testid="description-input"
          />
        </div>

        <!-- Validation Message -->
        <div v-if="showValidationError" :class="css(validationMessage)">
          <p>
            ⚠️ At least one field (Character, Event, or Setting) must have {{ MIN_CHARS }}+
            characters
          </p>
        </div>

        <!-- Actions -->
        <div :class="css(actionButtons)">
          <button type="button" :class="css(secondaryButton)" @click="handleClose">Cancel</button>
          <button
            type="submit"
            :class="css(primaryButton)"
            :disabled="!isFormValid || isSubmitting"
            data-testid="create-scenario-button"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Scenario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

interface CreateScenarioForm {
  characterChanges: string
  eventAlterations: string
  settingModifications: string
  description: string
}

interface Props {
  isOpen: boolean
  bookTitle: string
  bookId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'created', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()
const { success, error: showError } = useToast()

const MIN_CHARS = 10
const isSubmitting = ref(false)

const formData = ref<CreateScenarioForm>({
  characterChanges: '',
  eventAlterations: '',
  settingModifications: '',
  description: '',
})

// Validation
const isCharacterChangesValid = computed(() => {
  const length = formData.value.characterChanges.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isEventAlterationsValid = computed(() => {
  const length = formData.value.eventAlterations.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isSettingModificationsValid = computed(() => {
  const length = formData.value.settingModifications.trim().length
  return length === 0 || length >= MIN_CHARS
})

const hasAtLeastOneValidType = computed(() => {
  return (
    formData.value.characterChanges.trim().length >= MIN_CHARS ||
    formData.value.eventAlterations.trim().length >= MIN_CHARS ||
    formData.value.settingModifications.trim().length >= MIN_CHARS
  )
})

const isFormValid = computed(() => {
  return (
    isCharacterChangesValid.value &&
    isEventAlterationsValid.value &&
    isSettingModificationsValid.value &&
    hasAtLeastOneValidType.value
  )
})

const showValidationError = computed(() => {
  const hasTyped =
    formData.value.characterChanges.length > 0 ||
    formData.value.eventAlterations.length > 0 ||
    formData.value.settingModifications.length > 0
  return hasTyped && !hasAtLeastOneValidType.value
})

const getCharCount = (text: string) => {
  return text.trim().length
}

const handleClose = () => {
  formData.value = {
    characterChanges: '',
    eventAlterations: '',
    settingModifications: '',
    description: '',
  }
  emit('close')
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    // Create scenario via API
    const payload = {
      bookId: parseInt(props.bookId),
      title: `New Scenario for ${props.bookTitle}`,
      description: formData.value.description,
      parameters: {
        character_changes: formData.value.characterChanges,
        event_alterations: formData.value.eventAlterations,
        setting_modifications: formData.value.settingModifications,
      },
      scenarioType: determineScenarioType(),
      isPrivate: false,
    }

    const scenarioResponse = await api.post('/scenarios', payload)
    const scenarioId = scenarioResponse.data.id

    // Create conversation for this scenario
    const conversationPayload = {
      scenarioId: scenarioId,
      title: `Conversation: ${props.bookTitle}`,
    }

    const conversationResponse = await api.post('/conversations', conversationPayload)
    const conversationId = conversationResponse.data.id

    success('✨ Scenario created successfully!')
    emit('created', { scenarioId, conversationId })
    handleClose()

    // Navigate to conversation page
    router.push(`/conversations/${conversationId}`)
  } catch (error: any) {
    console.error('Failed to create scenario:', error)
    showError(error.response?.data?.message || 'Failed to create scenario')
  } finally {
    isSubmitting.value = false
  }
}

// Determine scenario type based on which field has content
const determineScenarioType = () => {
  if (formData.value.characterChanges.trim().length >= MIN_CHARS) {
    return 'CHARACTER_CHANGE'
  } else if (formData.value.eventAlterations.trim().length >= MIN_CHARS) {
    return 'EVENT_ALTERATION'
  } else if (formData.value.settingModifications.trim().length >= MIN_CHARS) {
    return 'SETTING_MODIFICATION'
  }
  return 'CHARACTER_CHANGE' // Default
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
  mb: '5',
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

const bookInfoCard = {
  bg: 'blue.50',
  p: '3',
  borderRadius: 'md',
  mb: '5',
}

const formGroup = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '2',
}

const formLabel = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.700',
}

const requiredMark = {
  color: 'red.500',
  ml: '1',
}

const formTextarea = {
  w: 'full',
  p: '3',
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

const validationRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const errorText = {
  fontSize: '0.75rem',
  color: 'red.600',
}

const charCount = {
  fontSize: '0.75rem',
  color: 'gray.500',
}

const validationMessage = {
  bg: 'orange.50',
  border: '1px solid',
  borderColor: 'orange.300',
  p: '3',
  borderRadius: 'md',
  fontSize: '0.875rem',
  color: 'orange.800',
}

const actionButtons = {
  display: 'flex',
  gap: '3',
  justifyContent: 'flex-end',
  pt: '4',
  borderTop: '1px solid',
  borderColor: 'gray.200',
}

const secondaryButton = {
  px: '4',
  py: '2',
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'gray.700',
  cursor: 'pointer',
  _hover: {
    bg: 'gray.50',
  },
}

const primaryButton = {
  px: '4',
  py: '2',
  bg: 'blue.600',
  color: 'white',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  border: 'none',
  _hover: {
    bg: 'blue.700',
  },
  _disabled: {
    bg: 'gray.300',
    cursor: 'not-allowed',
  },
}
</script>

<style scoped>
.scenario-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>
