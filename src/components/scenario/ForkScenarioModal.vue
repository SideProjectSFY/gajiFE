<template>
  <div
    v-if="isOpen"
    class="scenario-modal-overlay"
    data-testid="fork-scenario-modal"
    @click.self="handleClose"
  >
    <div :class="css(modalContent)">
      <!-- Header -->
      <div :class="css(modalHeader)">
        <h2 :class="css({ fontSize: '1.5rem', fontWeight: '600', color: 'gray.900' })">
          Fork Scenario
        </h2>
        <button :class="css(closeButton)" aria-label="Close modal" @click="handleClose">✕</button>
      </div>

      <!-- Scenario Info -->
      <div :class="css(bookInfoCard)">
        <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
          Forking scenario: <strong>{{ parentScenario.title }}</strong>
        </p>
      </div>

      <!-- Form -->
      <form :class="css({ spaceY: '5' })" @submit.prevent="handleSubmit">
        <!-- Character Properties -->
        <div :class="css(formGroup)">
          <label for="character-changes" :class="css(formLabel)"> Character Properties </label>
          <textarea
            id="character-changes"
            :value="characterChanges"
            :class="css(formTextarea)"
            rows="4"
            readonly
            disabled
          />
        </div>

        <!-- Event Alterations -->
        <div :class="css(formGroup)">
          <label for="event-alterations" :class="css(formLabel)"> Event Alterations </label>
          <textarea
            id="event-alterations"
            :value="eventAlterations"
            :class="css(formTextarea)"
            rows="4"
            readonly
            disabled
          />
        </div>

        <!-- Setting Modifications -->
        <div :class="css(formGroup)">
          <label for="setting-modifications" :class="css(formLabel)"> Setting Modifications </label>
          <textarea
            id="setting-modifications"
            :value="settingModifications"
            :class="css(formTextarea)"
            rows="4"
            readonly
            disabled
          />
        </div>

        <!-- Description -->
        <div :class="css(formGroup)">
          <label for="description" :class="css(formLabel)">Description</label>
          <textarea
            id="description"
            :value="parentScenario.description"
            :class="css(formTextarea)"
            rows="3"
            readonly
            disabled
          />
        </div>

        <!-- Actions -->
        <div :class="css(actionButtons)">
          <button type="button" :class="css(secondaryButton)" @click="handleClose">Cancel</button>
          <button
            type="submit"
            :class="css(primaryButton)"
            :disabled="isSubmitting"
            data-testid="fork-scenario-button"
          >
            {{ isSubmitting ? 'Forking...' : 'Fork Scenario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { css } from 'styled-system/css'
import api from '@/services/api'
import type { BrowseScenario } from '@/types'

interface Props {
  isOpen: boolean
  parentScenario: BrowseScenario
}

interface Emits {
  (e: 'close'): void
  (e: 'forked', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSubmitting = ref(false)

// Computed properties to safely access parameters
const characterChanges = computed(() => {
  const params = props.parentScenario.parameters as any
  return params?.character_changes || params?.character || ''
})

const eventAlterations = computed(() => {
  const params = props.parentScenario.parameters as any
  return params?.event_alterations || params?.event_name || ''
})

const settingModifications = computed(() => {
  const params = props.parentScenario.parameters as any
  return params?.setting_modifications || params?.new_setting || ''
})

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await api.post(`/scenarios/${props.parentScenario.id}/fork`, {
      title: `Fork of ${props.parentScenario.title}`,
    })

    emit('forked', response.data)
    handleClose()
  } catch (error: any) {
    console.error('Failed to fork scenario:', error)
    // You might want to show a toast here if you have useToast
  } finally {
    isSubmitting.value = false
  }
}

// Styles (Copied from CreateScenarioModal.vue)
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
  scrollbarWidth: 'none' as const,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
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

const formTextarea = {
  w: 'full',
  p: '3',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  bg: 'gray.50', // Read-only style
  color: 'gray.600',
  cursor: 'not-allowed',
  _focus: {
    outline: 'none',
  },
}

const actionButtons = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
  mt: '4',
}

const secondaryButton = {
  px: '4',
  py: '2',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.300',
  color: 'gray.700',
  cursor: 'pointer',
  _hover: { bg: 'gray.50' },
}

const primaryButton = {
  px: '4',
  py: '2',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  bg: 'green.500',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  _hover: { bg: 'green.600' },
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
</style>
