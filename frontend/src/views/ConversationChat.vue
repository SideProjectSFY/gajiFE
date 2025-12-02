<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { css } from '../../styled-system/css'
import { useConversationStore, type Conversation } from '@/stores/conversation'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import ForkConversationModal from '@/components/chat/ForkConversationModal.vue'
import ForkNavigationWidget from '@/components/chat/ForkNavigationWidget.vue'
import MemoEditor from '@/components/chat/MemoEditor.vue'
import type { ForkRelationship } from '@/components/chat/ForkNavigationWidget.vue'
import { getForkRelationship } from '@/services/conversationApi'

const route = useRoute()
const router = useRouter()
const conversationStore = useConversationStore()

// Computed property for route param
const conversationId = computed(() => route.params.id as string)

// Refs
const messagesContainerRef = ref<HTMLDivElement | null>(null)
const isLoadingConversation = ref(true)
const showForkModal = ref(false)
const forkRelationship = ref<ForkRelationship | null>(null)
const isLoadingForkRelationship = ref(false)
const forkRelationshipError = ref(false)

// Computed states from store
const conversation = computed(() => conversationStore.currentConversation)
const messages = computed(() => conversation.value?.messages || [])
const isPolling = computed(() => conversationStore.pollingStatus === 'polling')
const hasError = computed(() => conversationStore.pollingStatus === 'error')
const errorMessage = computed(() => conversationStore.error)
const isInputDisabled = computed(() => isPolling.value || isLoadingConversation.value)

// Fork button visibility logic
const canShowForkButton = computed(() => {
  return conversation.value?.isRoot === true
})

const isForkButtonDisabled = computed(() => {
  return conversation.value?.hasBeenForked === true
})

const forkButtonTooltip = computed(() => {
  if (isForkButtonDisabled.value) {
    return '이미 분기된 대화입니다'
  }
  return '대화 분기 생성'
})

// Forked conversation indicators
const isForkedConversation = computed(() => {
  return conversation.value?.isRoot === false && conversation.value?.parentId
})

const forkBadgeText = computed(() => {
  if (!isForkedConversation.value) return ''
  const depth = conversation.value?.forkDepth || 1
  return `분기 (깊이 ${depth})`
})

// Show typing indicator when polling and last message is empty AI message
const showTypingIndicator = computed(() => {
  if (!isPolling.value) return false

  const lastMessage = messages.value[messages.value.length - 1]
  return lastMessage?.role === 'assistant' && !lastMessage.content
})

// Auto-scroll to bottom
function scrollToBottom(): void {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

// Watch for new messages
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// Handle send message
async function handleSendMessage(content: string): Promise<void> {
  try {
    await conversationStore.sendMessage(content)
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

// Handle retry
function handleRetry(): void {
  conversationStore.retryPolling()
}

// Handle fork button click
function handleForkClick(): void {
  if (!isForkButtonDisabled.value) {
    showForkModal.value = true
  }
}

// Handle fork creation
async function handleFork(description: string): Promise<void> {
  try {
    const newConversation = await conversationStore.forkConversation(
      conversationId.value,
      description
    )

    // Close modal
    showForkModal.value = false

    // Navigate to new forked conversation
    router.push(`/conversations/${newConversation.id}`)
  } catch (error: unknown) {
    console.error('Failed to fork conversation:', error)

    // Show error toast based on status code
    let errorMsg = '대화 분기를 생성할 수 없습니다'
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 403) {
        errorMsg = '이 대화를 분기할 권한이 없습니다'
      } else if (axiosError.response?.status === 409) {
        errorMsg = '이 대화는 이미 분기되었습니다'
      }
    }

    // You can implement a toast notification here
    alert(errorMsg)

    // Close modal on error
    showForkModal.value = false
  }
}

// Load fork relationship
async function loadForkRelationship(): Promise<void> {
  // Reset states
  isLoadingForkRelationship.value = true
  forkRelationshipError.value = false

  try {
    const result = await getForkRelationship(conversationId.value)

    if (result === null) {
      // API returned null (error occurred but handled gracefully)
      forkRelationshipError.value = true
      forkRelationship.value = null
    } else {
      forkRelationship.value = result
      forkRelationshipError.value = false
    }
  } catch (error) {
    console.error('Failed to load fork relationship:', error)
    forkRelationshipError.value = true
    forkRelationship.value = null
  } finally {
    isLoadingForkRelationship.value = false
  }
}

// Load conversation on mount
onMounted(async (): Promise<void> => {
  isLoadingConversation.value = true

  try {
    // TODO: Fetch conversation from API
    // For now, create a mock conversation
    const mockConversation: Conversation = {
      id: conversationId.value,
      scenarioId: 'scenario-1',
      title: '대화방',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRoot: true,
      hasBeenForked: false,
      forkDepth: 0,
    }

    conversationStore.setCurrentConversation(mockConversation)

    // Load fork relationship
    await loadForkRelationship()
  } catch (error) {
    console.error('Failed to load conversation:', error)
  } finally {
    isLoadingConversation.value = false
    scrollToBottom()
  }
})

// Watch for conversation ID changes to reload fork relationship
watch(conversationId, async () => {
  await loadForkRelationship()
})

// Static style definitions
const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'neutral.50',
  }),
  mainContent: css({
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  }),
  chatSection: css({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }),
  sidebarSection: css({
    width: '350px',
    borderLeft: '1px solid',
    borderColor: 'neutral.200',
    backgroundColor: 'white',
    overflowY: 'auto',
    padding: '1rem',
  }),
  header: css({
    padding: '1rem 1.5rem',
    backgroundColor: 'white',
    borderBottom: '1px solid',
    borderColor: 'neutral.200',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  }),
  headerContent: css({
    maxWidth: '1200px',
    margin: '0 auto',
  }),
  title: css({
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'neutral.900',
  }),
  headerActions: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  }),
  forkButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'blue.600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover:not(:disabled)': {
      backgroundColor: 'blue.700',
    },
    '&:disabled': {
      backgroundColor: 'neutral.300',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  }),
  forkBadge: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'purple.700',
    backgroundColor: 'purple.100',
    borderRadius: '9999px',
  }),
  breadcrumb: css({
    fontSize: '0.875rem',
    color: 'neutral.600',
    marginTop: '0.25rem',
  }),
  breadcrumbLink: css({
    color: 'blue.600',
    textDecoration: 'underline',
    cursor: 'pointer',
    '&:hover': {
      color: 'blue.700',
    },
  }),
  forkPlaceholder: css({
    padding: '0.5rem',
    backgroundColor: 'blue.50',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: 'blue.700',
    textAlign: 'center',
  }),
  messagesWrapper: css({
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  }),
  messagesContainer: css({
    maxWidth: '900px',
    margin: '0 auto',
  }),
  loadingState: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: 'neutral.500',
  }),
  emptyState: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: 'neutral.500',
    gap: '1rem',
  }),
  emptyIcon: css({
    fontSize: '3rem',
  }),
  emptyText: css({
    fontSize: '1.1rem',
  }),
  errorBanner: css({
    padding: '1rem',
    backgroundColor: 'red.50',
    borderLeft: '4px solid',
    borderColor: 'red.500',
    marginBottom: '1rem',
  }),
  errorContent: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto',
  }),
  errorText: css({
    color: 'red.700',
    fontSize: '0.9rem',
  }),
  retryButton: css({
    padding: '0.5rem 1rem',
    backgroundColor: 'red.500',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'red.600',
    },
  }),
  inputContainer: css({
    backgroundColor: 'white',
    borderTop: '1px solid',
    borderColor: 'neutral.200',
  }),
  inputWrapper: css({
    maxWidth: '900px',
    margin: '0 auto',
  }),
}
</script>

<template>
  <div :class="styles.container">
    <!-- Header -->
    <div :class="styles.header">
      <div :class="styles.headerContent">
        <h1 :class="styles.title">
          {{ conversation?.title || '대화' }}
        </h1>

        <!-- Fork Navigation Widget (Sticky - shows parent/child relationships) -->
        <ForkNavigationWidget
          :conversation-id="conversationId"
          :fork-relationship="forkRelationship"
          :is-loading="isLoadingForkRelationship"
          :has-error="forkRelationshipError"
        />

        <!-- Header Actions (Fork Button & Badges) -->
        <div :class="styles.headerActions">
          <!-- Fork Button (only for root conversations) -->
          <button
            v-if="canShowForkButton"
            :class="styles.forkButton"
            :disabled="isForkButtonDisabled"
            :title="forkButtonTooltip"
            @click="handleForkClick"
          >
            🔀 분기 생성
          </button>

          <!-- Forked Badge (only for forked conversations) -->
          <span
            v-if="isForkedConversation"
            :class="styles.forkBadge"
          >
            {{ forkBadgeText }}
          </span>
        </div>

        <!-- Breadcrumb (for forked conversations) -->
        <div
          v-if="isForkedConversation && conversation?.parentId"
          :class="styles.breadcrumb"
        >
          분기됨:
          <span
            :class="styles.breadcrumbLink"
            @click="router.push(`/conversations/${conversation.parentId}`)"
          >
            원본 대화
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content Area (Chat + Sidebar) -->
    <div :class="styles.mainContent">
      <!-- Chat Section -->
      <div :class="styles.chatSection">
        <!-- Error Banner -->
        <div
          v-if="hasError && errorMessage"
          :class="styles.errorBanner"
        >
          <div :class="styles.errorContent">
            <span :class="styles.errorText">{{ errorMessage }}</span>
            <button
              :class="styles.retryButton"
              @click="handleRetry"
            >
              다시 시도
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div
          ref="messagesContainerRef"
          :class="styles.messagesWrapper"
        >
          <div :class="styles.messagesContainer">
            <!-- Loading State -->
            <div
              v-if="isLoadingConversation"
              :class="styles.loadingState"
            >
              대화를 불러오는 중...
            </div>

            <!-- Empty State -->
            <div
              v-else-if="messages.length === 0"
              :class="styles.emptyState"
            >
              <div :class="styles.emptyIcon">
                💬
              </div>
              <div :class="styles.emptyText">
                첫 메시지를 보내서 대화를 시작하세요
              </div>
            </div>

            <!-- Messages -->
            <template v-else>
              <ChatMessage
                v-for="message in messages"
                :key="message.id"
                :message="message"
              />

              <!-- Typing Indicator -->
              <TypingIndicator v-if="showTypingIndicator" />
            </template>
          </div>
        </div>

        <!-- Input Area -->
        <div :class="styles.inputContainer">
          <div :class="styles.inputWrapper">
            <ChatInput
              :disabled="isInputDisabled"
              @send="handleSendMessage"
            />
          </div>
        </div>
      </div>

      <!-- Sidebar (Memo Editor) -->
      <div :class="styles.sidebarSection">
        <MemoEditor
          v-if="conversationId"
          :conversation-id="conversationId"
        />
      </div>
    </div>

    <!-- Fork Conversation Modal -->
    <ForkConversationModal
      v-model="showForkModal"
      :messages="messages"
      @fork="handleFork"
    />
  </div>
</template>
