<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import CharCounter from '@/components/CharCounter.vue'
import api from '@/services/api'
import type { ScenarioFormState, CreateScenarioResponse } from '@/types'

// Props
const props = defineProps<{
  bookId: string
  bookTitle: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', scenarioId: string): void
}>()

const router = useRouter()

// State
const showModal = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const form = ref<ScenarioFormState>({
  title: '',
  character_changes: '',
  event_alterations: '',
  setting_modifications: '',
})

// Constants
const MIN_CHARS = 10
const MAX_TITLE_CHARS = 100

// Validation computed properties
const isTitleValid = computed(() => form.value.title.trim().length > 0)

const isCharacterChangesValid = computed(() => {
  const length = form.value.character_changes.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isEventAlterationsValid = computed(() => {
  const length = form.value.event_alterations.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isSettingModificationsValid = computed(() => {
  const length = form.value.setting_modifications.trim().length
  return length === 0 || length >= MIN_CHARS
})

// Check if at least one scenario type has valid content (≥10 chars)
const hasAtLeastOneValidType = computed(() => {
  return (
    form.value.character_changes.trim().length >= MIN_CHARS ||
    form.value.event_alterations.trim().length >= MIN_CHARS ||
    form.value.setting_modifications.trim().length >= MIN_CHARS
  )
})

// Overall form validation
const isFormValid = computed(() => {
  return (
    isTitleValid.value &&
    isCharacterChangesValid.value &&
    isEventAlterationsValid.value &&
    isSettingModificationsValid.value &&
    hasAtLeastOneValidType.value
  )
})

const showValidationError = computed(() => {
  // Show error if user has typed something but validation fails
  const hasTyped =
    form.value.character_changes.length > 0 ||
    form.value.event_alterations.length > 0 ||
    form.value.setting_modifications.length > 0

  return hasTyped && !hasAtLeastOneValidType.value
})

const isFormDirty = computed(() => {
  return (
    form.value.title.length > 0 ||
    form.value.character_changes.length > 0 ||
    form.value.event_alterations.length > 0 ||
    form.value.setting_modifications.length > 0
  )
})

const modalTitle = computed(() => `Create Scenario for ${props.bookTitle}`)

// Handlers
const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const response = await api.post<CreateScenarioResponse>('/scenarios', {
      book_id: props.bookId,
      scenario_title: form.value.title.trim(),
      character_changes: form.value.character_changes.trim() || null,
      event_alterations: form.value.event_alterations.trim() || null,
      setting_modifications: form.value.setting_modifications.trim() || null,
    })

    const scenarioId = response.data.id

    emit('created', scenarioId)
    router.push(`/books/${props.bookId}/scenarios/${scenarioId}`)
  } catch (error: unknown) {
    console.error('Failed to create scenario:', error)

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      errorMessage.value =
        axiosError.response?.data?.message || 'Failed to create scenario. Please try again.'
    } else {
      errorMessage.value = 'Failed to create scenario. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = (): void => {
  if (isFormDirty.value) {
    const confirmed = confirm('Discard scenario creation?')
    if (!confirmed) return
  }

  showModal.value = false
  emit('close')
}

const handleBackdropClick = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

const handleKeyDown = (event: KeyboardEvent): void => {
  // Escape key closes modal
  if (event.key === 'Escape') {
    handleCancel()
  }
  // Cmd/Ctrl + Enter submits form
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    if (isFormValid.value) {
      handleSubmit()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  // Auto-focus title field
  const titleInput = document.getElementById('scenario-title')
  titleInput?.focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Styles
const styles = {
  overlay: css({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  }),
  modal: css({
    backgroundColor: 'white',
    borderRadius: 'lg',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  }),
  modalFullscreen: css({
    '@media (max-width: 767px)': {
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: 0,
      height: '100%',
    },
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid',
    borderColor: 'neutral.200',
  }),
  headerTitle: css({
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'neutral.800',
    margin: 0,
  }),
  closeButton: css({
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    color: 'neutral.500',
    borderRadius: 'md',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'neutral.100',
      color: 'neutral.700',
    },
  }),
  content: css({
    padding: '1.5rem',
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  formGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  label: css({
    fontWeight: '600',
    fontSize: '14px',
    color: 'neutral.700',
  }),
  required: css({
    '&::after': {
      content: '" *"',
      color: 'error',
    },
  }),
  optional: css({
    fontWeight: '400',
    fontSize: '12px',
    color: 'neutral.400',
    marginLeft: '0.5rem',
  }),
  input: css({
    width: '100%',
    padding: '0.75rem',
    fontSize: '14px',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: 'md',
    transition: 'all 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.500',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
    },
    '&::placeholder': {
      color: 'neutral.400',
    },
  }),
  inputInvalid: css({
    borderColor: 'error',
    '&:focus': {
      borderColor: 'error',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
  }),
  textarea: css({
    width: '100%',
    padding: '0.75rem',
    fontSize: '14px',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: 'md',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.500',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
    },
    '&::placeholder': {
      color: 'neutral.400',
    },
  }),
  textareaInvalid: css({
    borderColor: 'error',
    '&:focus': {
      borderColor: 'error',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
  }),
  errorMessage: css({
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 'md',
    padding: '0.75rem 1rem',
    color: 'error',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  actions: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
    '@media (max-width: 767px)': {
      flexDirection: 'column-reverse',
    },
  }),
  button: css({
    padding: '0.75rem 1.5rem',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: 'md',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '@media (max-width: 767px)': {
      width: '100%',
    },
  }),
  buttonSecondary: css({
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: 'neutral.300',
    color: 'neutral.700',
    '&:hover': {
      backgroundColor: 'neutral.50',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  }),
  buttonPrimary: css({
    backgroundColor: 'primary.600',
    border: 'none',
    color: 'white',
    '&:hover': {
      backgroundColor: 'primary.700',
    },
    '&:disabled': {
      backgroundColor: 'neutral.300',
      cursor: 'not-allowed',
    },
  }),
  spinner: css({
    display: 'inline-block',
    width: '1rem',
    height: '1rem',
    border: '2px solid white',
    borderTopColor: 'transparent',
    borderRadius: 'full',
    animation: 'spin 0.6s linear infinite',
  }),
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      :class="styles.overlay"
      @click="handleBackdropClick"
    >
      <div
        data-testid="scenario-creation-modal"
        :class="[styles.modal, styles.modalFullscreen]"
        @click.stop
      >
        <!-- Header -->
        <div :class="styles.header">
          <h2
            :id="'modal-title-' + props.bookId"
            :class="styles.headerTitle"
          >
            {{ modalTitle }}
          </h2>
          <button
            :class="styles.closeButton"
            type="button"
            aria-label="Close"
            @click="handleCancel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div :class="styles.content">
          <form
            :class="styles.form"
            @submit.prevent="handleSubmit"
          >
            <!-- Scenario Title (Required) -->
            <div :class="styles.formGroup">
              <label
                for="scenario-title"
                :class="[styles.label, styles.required]"
              >
                Scenario Title
              </label>
              <input
                id="scenario-title"
                v-model="form.title"
                data-testid="scenario-title-input"
                type="text"
                :class="[
                  styles.input,
                  !isTitleValid && form.title.length > 0 && styles.inputInvalid,
                ]"
                placeholder="e.g., Hermione in Slytherin"
                :maxlength="MAX_TITLE_CHARS"
                aria-required="true"
                aria-describedby="title-counter"
              >
              <CharCounter
                id="title-counter"
                :text="form.title"
                :max="MAX_TITLE_CHARS"
                label="chars"
              />
            </div>

            <!-- Character Changes (Optional) -->
            <div :class="styles.formGroup">
              <label
                for="character-changes"
                :class="styles.label"
              >
                Character Changes
                <span :class="styles.optional">(Optional)</span>
              </label>
              <textarea
                id="character-changes"
                v-model="form.character_changes"
                data-testid="character-changes-textarea"
                :class="[
                  styles.textarea,
                  !isCharacterChangesValid &&
                    form.character_changes.length > 0 &&
                    styles.textareaInvalid,
                ]"
                placeholder="e.g., Hermione sorted into Slytherin instead of Gryffindor"
                rows="3"
                aria-describedby="character-changes-counter"
                :aria-invalid="!isCharacterChangesValid && form.character_changes.length > 0"
              />
              <CharCounter
                id="character-changes-counter"
                :text="form.character_changes"
                :min="MIN_CHARS"
                label="character"
              />
            </div>

            <!-- Event Alterations (Optional) -->
            <div :class="styles.formGroup">
              <label
                for="event-alterations"
                :class="styles.label"
              >
                Event Alterations
                <span :class="styles.optional">(Optional)</span>
              </label>
              <textarea
                id="event-alterations"
                v-model="form.event_alterations"
                :class="[
                  styles.textarea,
                  !isEventAlterationsValid &&
                    form.event_alterations.length > 0 &&
                    styles.textareaInvalid,
                ]"
                placeholder="e.g., Troll incident: saved by Draco instead of Harry"
                rows="3"
                aria-describedby="event-alterations-counter"
                :aria-invalid="!isEventAlterationsValid && form.event_alterations.length > 0"
              />
              <CharCounter
                id="event-alterations-counter"
                :text="form.event_alterations"
                :min="MIN_CHARS"
                label="event"
              />
            </div>

            <!-- Setting Modifications (Optional) -->
            <div :class="styles.formGroup">
              <label
                for="setting-modifications"
                :class="styles.label"
              >
                Setting Modifications
                <span :class="styles.optional">(Optional)</span>
              </label>
              <textarea
                id="setting-modifications"
                v-model="form.setting_modifications"
                :class="[
                  styles.textarea,
                  !isSettingModificationsValid &&
                    form.setting_modifications.length > 0 &&
                    styles.textareaInvalid,
                ]"
                placeholder="e.g., Set in modern-day Seoul instead of 1990s Britain"
                rows="3"
                aria-describedby="setting-modifications-counter"
                :aria-invalid="
                  !isSettingModificationsValid && form.setting_modifications.length > 0
                "
              />
              <CharCounter
                id="setting-modifications-counter"
                :text="form.setting_modifications"
                :min="MIN_CHARS"
                label="setting"
              />
            </div>

            <!-- Validation Error Message -->
            <div
              v-if="showValidationError"
              :class="styles.errorMessage"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM7 4h2v5H7V4zm0 6h2v2H7v-2z"
                />
              </svg>
              Please provide at least one scenario type with 10+ characters
            </div>

            <!-- API Error Message -->
            <div
              v-if="errorMessage"
              :class="styles.errorMessage"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM7 4h2v5H7V4zm0 6h2v2H7v-2z"
                />
              </svg>
              {{ errorMessage }}
            </div>

            <!-- Submit Buttons -->
            <div :class="styles.actions">
              <button
                type="button"
                data-testid="cancel-button"
                :class="[styles.button, styles.buttonSecondary]"
                :disabled="isSubmitting"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-button"
                :class="[styles.button, styles.buttonPrimary]"
                :disabled="!isFormValid || isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  :class="styles.spinner"
                />
                <span v-else>Create Scenario</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
