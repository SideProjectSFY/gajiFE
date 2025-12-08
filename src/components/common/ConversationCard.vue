<template>
  <div
    class="conversation-card"
    @click="navigateToConversation"
  >
    <div class="card-header">
      <h3>{{ conversation.title }}</h3>
      <LikeButton
        :conversation-id="conversation.id"
        :initial-like-count="conversation.likeCount"
        @like-change="handleLikeChange"
      />
    </div>

    <p class="description">
      {{ conversation.description }}
    </p>

    <div class="card-footer">
      <span class="message-count">{{ conversation.messageCount }} messages</span>
      <span class="created-date">{{ formatDate(conversation.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import LikeButton from '@/components/common/LikeButton.vue'

interface Conversation {
  id: string
  title: string
  description: string
  messageCount: number
  likeCount: number
  createdAt: string
}

const props = defineProps<{
  conversation: Conversation
}>()

const emit = defineEmits<{
  'like-change': [{ isLiked: boolean; likeCount: number }]
}>()

const router = useRouter()

const formatDate = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const navigateToConversation = (): void => {
  router.push(`/conversations/${props.conversation.id}`)
}

const handleLikeChange = (event: { isLiked: boolean; likeCount: number }): void => {
  emit('like-change', event)
}
</script>

<style scoped>
.conversation-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.conversation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 18px;
  flex: 1;
  margin-right: 1rem;
  margin: 0;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  margin: 0 0 1rem 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #999;
}

.message-count,
.created-date {
  margin: 0;
}
</style>
