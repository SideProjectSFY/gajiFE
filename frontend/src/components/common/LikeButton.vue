<template>
  <button
    :disabled="isLoading || !isAuthenticated"
    class="like-button"
    :class="{ liked: isLiked, animating: isAnimating }"
    :aria-label="isLiked ? 'Unlike' : 'Like'"
    @click.stop="handleLikeToggle"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      class="heart-icon"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        :fill="isLiked ? '#e63946' : 'none'"
        :stroke="isLiked ? '#e63946' : '#666'"
        stroke-width="2"
      />
    </svg>

    <span
      v-if="displayCount"
      class="like-count"
    >{{ displayCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const props = defineProps<{
  conversationId: string
  initialLikeCount?: number
}>()

const emit = defineEmits<{
  'like-change': [{ isLiked: boolean; likeCount: number }]
}>()

const authStore = useAuthStore()
const { error: showError, info: showToast } = useToast()

const isLiked = ref(false)
const likeCount = ref(props.initialLikeCount || 0)
const isLoading = ref(false)
const isAnimating = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const displayCount = computed(() => {
  if (likeCount.value === 0) return ''
  if (likeCount.value >= 1000) {
    return `${(likeCount.value / 1000).toFixed(1)}k`
  }
  return likeCount.value.toString()
})

onMounted(async (): Promise<void> => {
  if (isAuthenticated.value) {
    await checkLikeStatus()
  }
})

const checkLikeStatus = async (): Promise<void> => {
  try {
    const response = await api.get(`/conversations/${props.conversationId}/liked`)
    isLiked.value = response.data.isLiked
    likeCount.value = response.data.likeCount
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const handleLikeToggle = async () => {
  if (!isAuthenticated.value) {
    showToast('Please log in to like conversations')
    return
  }

  // Trigger animation
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 300)

  // Optimistic update
  const previousLiked = isLiked.value
  const previousCount = likeCount.value

  isLiked.value = !isLiked.value
  likeCount.value = isLiked.value ? likeCount.value + 1 : Math.max(0, likeCount.value - 1)

  isLoading.value = true

  try {
    const endpoint = isLiked.value
      ? `/conversations/${props.conversationId}/like`
      : `/conversations/${props.conversationId}/unlike`

    const method = isLiked.value ? 'post' : 'delete'

    const response = await api[method](endpoint)

    // Update from server response
    isLiked.value = response.data.isLiked
    likeCount.value = response.data.likeCount

    emit('like-change', {
      isLiked: isLiked.value,
      likeCount: likeCount.value,
    })
  } catch (error) {
    // Rollback on error
    isLiked.value = previousLiked
    likeCount.value = previousCount

    console.error('Failed to toggle like:', error)
    showError('Failed to update like')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.like-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.like-button:hover:not(:disabled) {
  background: rgba(230, 57, 70, 0.1);
}

.like-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.heart-icon {
  transition: transform 0.2s ease;
}

.like-button.animating .heart-icon {
  animation: heartbeat 0.3s ease;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(1.1);
  }
  75% {
    transform: scale(1.2);
  }
}

.like-button.liked .heart-icon {
  filter: drop-shadow(0 0 4px rgba(230, 57, 70, 0.5));
}

.like-count {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  min-width: 20px;
  text-align: left;
}

.like-button.liked .like-count {
  color: #e63946;
}
</style>
