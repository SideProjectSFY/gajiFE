<!-- Conversations Sidebar Component -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from '../../../styled-system/css'

interface Conversation {
  id: string
  scenarioTitle: string
  bookTitle: string
  lastMessage: string
  lastMessageAt: string
  messageCount: number
  type: 'ROOT' | 'FORKED'
}

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', conversationId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const conversations = ref<Conversation[]>([])
const isLoading = ref(false)

const currentConversationId = computed(() => {
  return route.params.id as string
})

onMounted(async () => {
  await loadConversations()
})

async function loadConversations(): Promise<void> {
  try {
    console.log('[ConversationsSidebar] Loading conversations...')
    isLoading.value = true

    // Import API function
    const { listConversations } = await import('@/services/conversationApi')
    const { scenarioApi } = await import('@/services/scenarioApi')

    // Fetch actual conversations from API
    console.log('[ConversationsSidebar] Calling listConversations')
    const conversationList = await listConversations(0, 20)
    console.log('[ConversationsSidebar] listConversations returned:', conversationList.length)

    // Transform to component format
    conversations.value = await Promise.all(
      conversationList.map(async (conv) => {
        try {
          const scenario = await scenarioApi.getScenario(conv.scenarioId)
          return {
            id: conv.id,
            scenarioTitle: scenario.whatIfQuestion || scenario.title,
            bookTitle: scenario.bookTitle || t('chat.unknownBook'),
            lastMessage: t('chat.clickToViewMessages'),
            lastMessageAt: conv.updatedAt || conv.createdAt,
            messageCount: conv.messageCount || 0,
            type: conv.isRoot ? ('ROOT' as const) : ('FORKED' as const),
          }
        } catch (error) {
          console.error('Failed to load scenario:', error)
          return {
            id: conv.id,
            scenarioTitle: conv.title,
            bookTitle: t('chat.unknownBook'),
            lastMessage: t('chat.clickToViewMessages'),
            lastMessageAt: conv.updatedAt || conv.createdAt,
            messageCount: conv.messageCount || 0,
            type: conv.isRoot ? ('ROOT' as const) : ('FORKED' as const),
          }
        }
      })
    )
    console.log('[ConversationsSidebar] Conversations loaded:', conversations.value.length)
  } catch (error) {
    console.error('Failed to load conversations:', error)
    // Fallback to empty array on error
    conversations.value = []
  } finally {
    isLoading.value = false
  }
}

function selectConversation(conversationId: string): void {
  router.push(`/conversations/${conversationId}`)
  emit('update:visible', false)
  emit('select', conversationId)
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function closeSidebar(): void {
  emit('update:visible', false)
}

function handleKeydown(event: KeyboardEvent, conversationId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectConversation(conversationId)
  }
}

const styles = {
  overlay: css({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
    transition: 'opacity 0.3s',
  }),
  sidebar: css({
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: { base: '85vw', md: '400px' },
    backgroundColor: 'white',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.3s ease-out',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid',
    borderColor: 'neutral.200',
  }),
  title: css({
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'neutral.800',
  }),
  closeButton: css({
    padding: '0.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    fontSize: '1.5rem',
    color: 'neutral.500',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'neutral.100',
      color: 'neutral.700',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
  }),
  content: css({
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
  }),
  loadingContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: 'neutral.500',
    gap: '1rem',
  }),
  spinner: css({
    width: '32px',
    height: '32px',
    border: '3px solid',
    borderColor: 'neutral.200',
    borderTopColor: 'blue.500',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }),
  emptyContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center',
    color: 'neutral.500',
    gap: '1rem',
  }),
  emptyIcon: css({
    fontSize: '3rem',
  }),
  emptyText: css({
    fontSize: '0.95rem',
  }),
  newChatButton: css({
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1F7D51',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#186642',
    },
  }),
  conversationList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  conversationItem: css({
    marginBottom: '0.5rem',
  }),
  conversationButton: css({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '1rem',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: 'neutral.100',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
  }),
  activeItem: css({
    backgroundColor: 'blue.50',
    borderLeftColor: 'blue.500',
  }),
  itemHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    gap: '0.5rem',
  }),
  itemTitle: css({
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'neutral.800',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  timestamp: css({
    fontSize: '0.75rem',
    color: 'neutral.500',
    flexShrink: 0,
  }),
  bookTitle: css({
    fontSize: '0.8rem',
    color: 'neutral.500',
    marginBottom: '0.5rem',
  }),
  lastMessage: css({
    fontSize: '0.85rem',
    color: 'neutral.600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '0.5rem',
  }),
  metaRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: 'neutral.500',
  }),
  metaItem: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  }),
  forkedBadge: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.5rem',
    backgroundColor: 'purple.100',
    color: 'purple.700',
    borderRadius: '9999px',
    fontSize: '0.7rem',
  }),
}
</script>

<template>
  <div>
    <Teleport to="body">
      <!-- Overlay -->
      <Transition name="fade">
        <div v-if="visible" :class="styles.overlay" aria-hidden="true" @click="closeSidebar" />
      </Transition>

      <!-- Sidebar -->
      <Transition name="slide">
        <aside
          v-if="visible"
          :class="styles.sidebar"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-title"
          data-testid="conversations-sidebar"
        >
          <!-- Header -->
          <header :class="styles.header">
            <h2 id="sidebar-title" :class="styles.title">대화 목록</h2>
            <button :class="styles.closeButton" aria-label="사이드바 닫기" @click="closeSidebar">
              ✕
            </button>
          </header>

          <!-- Content -->
          <div :class="styles.content">
            <!-- Loading State -->
            <div v-if="isLoading" :class="styles.loadingContainer">
              <div :class="styles.spinner" />
              <p>불러오는 중...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="conversations.length === 0" :class="styles.emptyContainer">
              <span :class="styles.emptyIcon">📭</span>
              <p :class="styles.emptyText">아직 대화가 없습니다</p>
              <button :class="styles.newChatButton" @click="router.push('/books')">
                <span>➕</span>
                새 대화 시작
              </button>
            </div>

            <!-- Conversations List -->
            <ul
              v-else
              data-testid="conversations-list"
              :class="styles.conversationList"
              aria-label="대화 목록"
            >
              <li
                v-for="conversation in conversations"
                :key="conversation.id"
                :class="[
                  styles.conversationItem,
                  conversation.id === currentConversationId && styles.activeItem,
                ]"
                :data-active="conversation.id === currentConversationId"
                :data-testid="`conversation-item-${conversation.id}`"
              >
                <button
                  :class="styles.conversationButton"
                  @click="selectConversation(conversation.id)"
                  @keydown="handleKeydown($event, conversation.id)"
                >
                  <!-- Header Row -->
                  <div :class="styles.itemHeader">
                    <h3 :class="styles.itemTitle">
                      {{ conversation.scenarioTitle }}
                    </h3>
                    <span :class="styles.timestamp">
                      {{ formatTimestamp(conversation.lastMessageAt) }}
                    </span>
                  </div>

                  <!-- Book Title -->
                  <p :class="styles.bookTitle">📚 {{ conversation.bookTitle }}</p>

                  <!-- Last Message Preview -->
                  <p :class="styles.lastMessage">
                    {{ conversation.lastMessage || '메시지가 없습니다' }}
                  </p>

                  <!-- Meta Row -->
                  <div :class="styles.metaRow">
                    <span :class="styles.metaItem"> 💬 {{ conversation.messageCount }} </span>
                    <span v-if="conversation.type === 'FORKED'" :class="styles.forkedBadge">
                      🔀 포크됨
                    </span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </Transition>
    </Teleport>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
