<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      data-testid="fork-conversation-modal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">🔀 대화 분기 생성</h2>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="closeModal">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <!-- Message Preview Info -->
          <div
            data-testid="fork-message-preview-info"
            class="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <p class="text-sm text-blue-800">
              {{ messagePreviewText }}
            </p>
          </div>

          <!-- Warning -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <p class="text-sm text-yellow-800">
                <strong>주의:</strong> 원본 대화는 한 번만 분기할 수 있습니다.
              </p>
            </div>
          </div>

          <!-- No messages warning -->
          <div
            v-if="messages.length === 0"
            data-testid="fork-warning"
            class="bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
            aria-live="polite"
          >
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <p class="text-sm text-red-800">
                <strong>경고:</strong> 메시지가 없는 대화는 분기할 수 없습니다. 먼저 메시지를
                작성해주세요.
              </p>
            </div>
          </div>

          <!-- Message Preview (scrollable) -->
          <div class="border border-gray-200 rounded-lg">
            <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 class="text-sm font-medium text-gray-700">복사될 메시지 미리보기</h3>
            </div>
            <div class="max-h-64 overflow-y-auto p-4 space-y-3">
              <div
                v-for="(message, index) in previewMessages"
                :key="index"
                class="flex items-start space-x-2"
              >
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  "
                >
                  {{ message.role === 'user' ? '나' : 'AI' }}
                </div>
                <div class="flex-1 bg-gray-50 rounded-lg p-3">
                  <p class="text-sm text-gray-800 line-clamp-3">
                    {{ message.content }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Optional Description Input -->
          <div>
            <label for="fork-description" class="block text-sm font-medium text-gray-700 mb-2">
              분기 설명 (선택사항)
            </label>
            <textarea
              id="fork-description"
              data-testid="fork-description-input"
              v-model="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="이 분기에 대한 설명을 입력하세요..."
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            data-testid="cancel-fork-button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            취소
          </button>
          <button
            data-testid="confirm-fork-button"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            :disabled="isSubmitting"
            @click="handleFork"
          >
            <span v-if="isSubmitting" class="mr-2">
              <svg
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            {{ isSubmitting ? '생성 중...' : '분기 생성' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Message } from '@/stores/conversation'

interface Props {
  modelValue: boolean
  messages: Message[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'fork', description: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const description = ref('')
const isSubmitting = ref(false)

// Compute preview messages (last 6 or all if less than 6)
const previewMessages = computed(() => {
  const messagesToShow = props.messages.length >= 6 ? 6 : props.messages.length
  return props.messages.slice(-messagesToShow)
})

// Compute message preview text
const messagePreviewText = computed(() => {
  const totalMessages = props.messages.length
  if (totalMessages >= 6) {
    return `마지막 6개의 메시지가 새 대화에 복사됩니다.`
  } else {
    return `모든 ${totalMessages}개의 메시지가 복사됩니다.`
  }
})

const closeModal = (): void => {
  if (!isSubmitting.value) {
    emit('update:modelValue', false)
    description.value = ''
  }
}

const handleFork = async (): Promise<void> => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    emit('fork', description.value)
  } finally {
    // Reset submitting state after a short delay to prevent double submission
    setTimeout(() => {
      isSubmitting.value = false
    }, 1000)
  }
}
</script>
