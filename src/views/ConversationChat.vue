<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { css } from '../../styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import ChatMessage from '../components/chat/ChatMessage.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import TypingIndicator from '../components/chat/TypingIndicator.vue'
import ConversationsSidebar from '../components/chat/ConversationsSidebar.vue'
import ForkNavigationWidget from '../components/chat/ForkNavigationWidget.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import type { Message } from '@/stores/conversation'
import {
  getConversation,
  getForkRelationship,
  likeConversation,
  unlikeConversation,
  checkConversationLiked,
} from '@/services/conversationApi'
import { scenarioApi } from '@/services/scenarioApi'
import type { CreateScenarioResponse } from '@/types'
import type { ForkRelationship } from '../components/chat/ForkNavigationWidget.vue'

const router = useRouter()
const route = useRoute()
const { trackConversationStarted, trackMessageSent } = useAnalytics()

// Loading states
const isLoading = ref(true)
const isTyping = ref(false)
const showSidebar = ref(false)
const isLiked = ref(false)

// Scenario info from API
const scenarioInfo = ref<CreateScenarioResponse | null>(null)
const conversationDepth = ref<number>(0)
const isRootConversation = ref<boolean>(true)
const hasBeenForked = ref<boolean>(false)
const forkRelationship = ref<ForkRelationship | null>(null)

// Messages state - typed properly
const messages = ref<Message[]>([])

const messagesContainer = ref<HTMLDivElement | null>(null)

// Computed for empty state
const isEmpty = computed(() => messages.value.length === 0 && !isLoading.value)

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  })
}

// Watch for new messages and scroll
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// Watch for typing indicator
watch(isTyping, () => {
  scrollToBottom()
})

const handleSendMessage = async (messageContent: string) => {
  if (!messageContent.trim()) return

  // Add user message
  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    conversationId: route.params.id as string,
    role: 'user',
    content: messageContent,
    timestamp: new Date().toISOString(),
  }
  messages.value.push(userMessage)

  // GA4: 메시지 전송 추적
  const conversationId = route.params.id as string
  trackMessageSent(conversationId, messageContent.length)

  scrollToBottom()

  // Send message to API and get AI response
  isTyping.value = true

  try {
    // Import sendMessage API
    const { sendMessage } = await import('@/services/conversationApi')

    // Call actual API
    const response = await sendMessage(route.params.id as string, messageContent)

    // Add assistant response to messages
    const assistantMessage: Message = {
      id: response.assistantMessage.id,
      conversationId: response.assistantMessage.conversationId,
      role: 'assistant',
      content: response.assistantMessage.content,
      timestamp: response.assistantMessage.timestamp,
    }
    messages.value.push(assistantMessage)
    isTyping.value = false
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
    isTyping.value = false
    // TODO: Show error toast to user
  }
}

const goBackToList = () => {
  router.push('/conversations')
}

const toggleLike = async () => {
  const conversationId = route.params.id as string
  try {
    if (isLiked.value) {
      await unlikeConversation(conversationId)
      isLiked.value = false
    } else {
      await likeConversation(conversationId)
      isLiked.value = true
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

// Load conversation data
const loadConversation = async (conversationId: string) => {
  isLoading.value = true
  try {
    // Fetch conversation data with messages
    const conversation = await getConversation(conversationId)
    messages.value = conversation.messages
    conversationDepth.value = conversation.depth
    isRootConversation.value = conversation.isRoot
    hasBeenForked.value = conversation.hasBeenForked

    // Check if liked
    isLiked.value = await checkConversationLiked(conversationId)

    // Fetch scenario data
    scenarioInfo.value = await scenarioApi.getScenario(conversation.scenarioId)

    // Fetch fork relationship (optional - may not be implemented in backend yet)
    try {
      forkRelationship.value = await getForkRelationship(conversationId)
    } catch (error) {
      // Fork relationship API may not be available yet, continue without it
      console.warn('Fork relationship API not available:', error)
      forkRelationship.value = null
    }

    // GA4: 대화 시작 추적
    trackConversationStarted({
      scenarioId: conversation.scenarioId,
      isFork: !conversation.isRoot,
    })
  } catch (error) {
    console.error('Failed to load conversation:', error)
    // TODO: Show error message to user
  } finally {
    isLoading.value = false
    scrollToBottom(false)
  }
}

// Load initial messages
onMounted(async () => {
  const conversationId = route.params.id as string
  await loadConversation(conversationId)
})

// Watch route changes to reload conversation when navigating between conversations
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadConversation(newId as string)
    }
  }
)
</script>

<template>
  <div
    data-testid="conversation-page"
    :data-is-root="String(isRootConversation)"
    :data-depth="String(conversationDepth)"
    :data-has-been-forked="String(hasBeenForked)"
    :class="css({ display: 'flex', flexDirection: 'column', minH: '100vh', bg: 'gray.50' })"
  >
    <AppHeader />
    <div :class="css({ h: '16' })" />

    <!-- Conversations Sidebar -->
    <ConversationsSidebar
      v-model:visible="showSidebar"
      data-testid="conversations-list"
      @select="(id) => console.log('Selected conversation:', id)"
    />

    <!-- Main Chat Container -->
    <div
      :class="
        css({
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          maxW: '1920px',
          w: 'full',
          mx: 'auto',
          gap: '0',
        })
      "
    >
      <!-- Left Sidebar - Scenario Info -->
      <div
        data-testid="scenario-context"
        :class="
          css({
            w: '320px',
            bg: 'white',
            borderRight: '1px solid',
            borderColor: 'gray.200',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          })
        "
      >
        <!-- Back Button & Sidebar Toggle -->
        <div
          :class="
            css({
              p: '4',
              borderColor: 'gray.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            })
          "
        >
          <button
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                color: 'gray.700',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'green.600' },
              })
            "
            @click="goBackToList"
          >
            <span>←</span>
            <span>Back to List</span>
          </button>
          <button
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                color: 'gray.600',
                fontSize: '1.25rem',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                transition: 'all 0.2s',
                _hover: { bg: 'gray.100', color: 'gray.800' },
              })
            "
            aria-label="대화 목록 열기"
            data-testid="sidebar-toggle"
            @click="showSidebar = true"
          >
            ☰
          </button>
        </div>

        <!-- Book Cover -->
        <div
          :class="
            css({
              p: '6',
              display: 'flex',
              justifyContent: 'center',
            })
          "
        >
          <div
            :class="
              css({
                w: '48',
                h: '64',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              })
            "
          >
            📚
          </div>
        </div>

        <!-- Book Info -->
        <div v-if="scenarioInfo" :class="css({ px: '6', pb: '6' })">
          <h2
            :class="
              css({
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '2',
                textAlign: 'center',
              })
            "
          >
            📚 {{ scenarioInfo.title }}
          </h2>
          <p
            :class="css({ fontSize: '0.875rem', color: 'gray.600', textAlign: 'center', mb: '4' })"
          >
            {{ scenarioInfo.bookTitle }}
          </p>

          <button
            @click="toggleLike"
            :class="
              css({
                w: 'full',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2',
                py: '2',
                px: '4',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: isLiked ? 'red.200' : 'gray.200',
                bg: isLiked ? 'red.50' : 'white',
                color: isLiked ? 'red.600' : 'gray.600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: isLiked ? 'red.100' : 'gray.50',
                  borderColor: isLiked ? 'red.300' : 'gray.300',
                },
              })
            "
          >
            <span>{{ isLiked ? '❤️' : '🤍' }}</span>
            <span :class="css({ fontSize: '0.875rem', fontWeight: '600' })">
              {{ isLiked ? 'Liked' : 'Like' }}
            </span>
          </button>
        </div>

        <!-- Scenario Details -->
        <div
          :class="
            css({
              flex: 1,
              px: '6',
              pb: '6',
              overflowY: 'auto',
            })
          "
        >
          <div v-if="scenarioInfo" :class="css({ mb: '4' })">
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              Title
            </h3>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.700' })">
              {{ scenarioInfo.title }}
            </p>
          </div>

          <div v-if="scenarioInfo" :class="css({ mb: '4' })">
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              What If...
            </h3>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.6' })">
              {{ scenarioInfo.whatIfQuestion }}
            </p>
          </div>

          <div>
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              Forked From
            </h3>
            <div
              :data-is-root="String(isRootConversation)"
              :class="
                css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  p: '3',
                  bg: 'gray.50',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  borderColor: 'gray.200',
                })
              "
            >
              <span v-if="scenarioInfo" :class="css({ fontSize: '0.75rem', color: 'gray.600' })">
                {{ scenarioInfo.characterName }}
              </span>
            </div>
            <div
              data-testid="has-been-forked"
              :data-forked="String(hasBeenForked)"
              style="display: none"
            />
            <div
              data-testid="conversation-depth"
              :data-depth="String(conversationDepth)"
              style="display: none"
            />
            <div
              data-testid="is-root-conversation"
              :data-is-root="String(isRootConversation)"
              style="display: none"
            />
            <div
              v-if="hasBeenForked"
              data-testid="already-forked-indicator"
              :class="
                css({
                  mt: '4',
                  p: '3',
                  bg: 'yellow.50',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  borderColor: 'yellow.200',
                })
              "
            >
              <p :class="css({ fontSize: '0.875rem', color: 'yellow.800', textAlign: 'center' })">
                ⚠️ 이미 분기된 대화입니다
              </p>
            </div>
            <div
              v-if="!isRootConversation"
              data-testid="fork-depth-indicator"
              :class="
                css({
                  mt: '4',
                  p: '3',
                  bg: 'purple.50',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  borderColor: 'purple.200',
                })
              "
            >
              <p :class="css({ fontSize: '0.875rem', color: 'purple.800', textAlign: 'center' })">
                🔀 분기된 대화 (깊이: {{ conversationDepth }})
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div
        :class="
          css({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bg: 'white',
          })
        "
      >
        <!-- Fork Navigation Widget -->
        <div
          v-if="!isRootConversation && (forkRelationship || conversationDepth > 0)"
          data-testid="fork-navigation-widget"
          :class="
            css({
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              px: '6',
              py: '3',
              bg: 'purple.50',
            })
          "
        >
          <div v-if="forkRelationship">
            <ForkNavigationWidget
              :conversation-id="route.params.id as string"
              :fork-relationship="forkRelationship"
              :is-loading="false"
              :has-error="false"
            />
          </div>
          <div
            v-else
            :class="css({ fontSize: '0.875rem', color: 'purple.800', textAlign: 'center' })"
          >
            🔀 Forked Conversation (Depth: {{ conversationDepth }})
          </div>
        </div>

        <!-- Messages Container -->
        <div
          ref="messagesContainer"
          :class="
            css({
              flex: 1,
              overflowY: 'auto',
              px: '6',
              py: '6',
              bg: 'gray.50',
              scrollBehavior: 'smooth',
            })
          "
          data-testid="messages-container"
          aria-label="대화 메시지 목록"
        >
          <div :class="css({ maxW: '900px', mx: 'auto' })">
            <!-- Loading State -->
            <div
              v-if="isLoading"
              :class="
                css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12',
                  color: 'gray.500',
                  gap: '4',
                })
              "
              data-testid="loading-state"
            >
              <div
                :class="
                  css({
                    width: '40px',
                    height: '40px',
                    border: '3px solid',
                    borderColor: 'gray.200',
                    borderTopColor: 'blue.500',
                    borderRadius: 'full',
                    animation: 'spin 1s linear infinite',
                  })
                "
              />
              <p>메시지를 불러오는 중...</p>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="isEmpty"
              :class="
                css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12',
                  color: 'gray.500',
                  gap: '4',
                  minHeight: '300px',
                })
              "
              data-testid="empty-state"
            >
              <span :class="css({ fontSize: '3rem' })">💬</span>
              <p :class="css({ fontSize: '1rem' })">대화를 시작해보세요</p>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.400' })">
                캐릭터에게 무엇이든 물어보세요
              </p>
            </div>

            <!-- Messages List -->
            <template v-else>
              <ChatMessage
                v-for="(message, index) in messages"
                :key="message.id"
                :message="message"
                :is-latest="index === messages.length - 1"
              />
            </template>

            <!-- Typing Indicator -->
            <TypingIndicator v-if="isTyping" />
          </div>
        </div>

        <!-- Input Area using ChatInput component -->
        <ChatInput :disabled="isLoading" :loading="isTyping" @send="handleSendMessage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
