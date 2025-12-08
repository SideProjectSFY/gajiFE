<template>
  <div class="liked-feed-page">
    <div class="page-header">
      <h1>Liked Conversations</h1>
      <p>{{ totalLiked }} conversations you've liked</p>
    </div>

    <div
      v-if="isLoading"
      class="loading-state"
    >
      <Spinner size="large" />
      <span>Loading liked conversations...</span>
    </div>

    <div
      v-else-if="conversations.length === 0"
      class="empty-state"
    >
      <svg
        class="empty-icon"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <h2>No liked conversations yet</h2>
      <p>Like conversations to save them here for quick access</p>
      <router-link
        to="/scenarios"
        class="btn-primary"
      >
        Discover Conversations
      </router-link>
    </div>

    <div
      v-else
      class="conversation-grid"
    >
      <ConversationCard
        v-for="conversation in conversations"
        :key="conversation.id"
        :conversation="conversation"
        @like-change="handleLikeChange(conversation.id, $event)"
      />

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import ConversationCard from '@/components/common/ConversationCard.vue'
import Spinner from '@/components/common/Spinner.vue'
import Pagination from '@/components/common/Pagination.vue'

interface Conversation {
  id: string
  title: string
  description: string
  messageCount: number
  likeCount: number
  createdAt: string
}

const router = useRouter()
const authStore = useAuthStore()
const { error: showError } = useToast()

const conversations = ref<Conversation[]>([])
const totalLiked = ref(0)
const currentPage = ref(0)
const totalPages = ref(0)
const isLoading = ref(true)

onMounted(async (): Promise<void> => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  await loadLikedConversations()
})

const loadLikedConversations = async (): Promise<void> => {
  isLoading.value = true

  try {
    const response = await api.get('/users/me/liked-conversations', {
      params: { page: currentPage.value, size: 20 },
    })

    conversations.value = response.data.content
    totalLiked.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('Failed to load liked conversations:', error)
    showError('Failed to load liked conversations')
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number): void => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadLikedConversations()
}

const handleLikeChange = (conversationId: string, event: { isLiked: boolean }): void => {
  if (!event.isLiked) {
    // Remove from list if unliked
    conversations.value = conversations.value.filter((c) => c.id !== conversationId)
    totalLiked.value = Math.max(0, totalLiked.value - 1)
  }
}
</script>

<style scoped>
.liked-feed-page {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 32px;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #ccc;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 0.5rem;
  color: #333;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #5568d3;
}

.conversation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .conversation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
