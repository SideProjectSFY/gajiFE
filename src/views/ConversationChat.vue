<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from '../../styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import ChatMessage from '../components/chat/ChatMessage.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import TypingIndicator from '../components/chat/TypingIndicator.vue'
import ConversationsSidebar from '../components/chat/ConversationsSidebar.vue'
import ForkNavigationWidget from '../components/chat/ForkNavigationWidget.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { Message } from '@/stores/conversation'
import {
  getConversation,
  getForkRelationship,
  likeConversation,
  unlikeConversation,
  checkConversationLiked,
  forkConversation,
} from '@/services/conversationApi'
import { scenarioApi } from '@/services/scenarioApi'
import type { CreateScenarioResponse } from '@/types'
import type { ForkRelationship } from '../components/chat/ForkNavigationWidget.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { trackConversationStarted, trackMessageSent } = useAnalytics()
const authStore = useAuthStore()
const { error: showErrorToast, warning: showWarningToast } = useToast()

// Loading states
const isLoading = ref(true)
const isTyping = ref(false)
const showSidebar = ref(false)
const isLiked = ref(false)
const showForkModal = ref(false)
const isForking = ref(false)
const forkParentId = ref<string | null>(null)
const currentScenarioId = ref<string | null>(null)
const loadError = ref('')
const aiError = ref('')
const forkError = ref('')
const conversationOwnerId = ref<string | null>(null)

// 턴 정보
const turnCount = ref<number>(0)
const maxTurns = ref<number>(5)

// Scenario info from API
const scenarioInfo = ref<CreateScenarioResponse | null>(null)
const conversationDepth = ref<number>(0)
const isRootConversation = ref<boolean>(true)
const hasBeenForked = ref<boolean>(false)
const forkRelationship = ref<ForkRelationship | null>(null)
const isForkedConversation = ref<boolean>(false)

// Messages state - typed properly
const messages = ref<Message[]>([])
const displayMessages = computed(() => {
  // 기준 대화에서 복사된 메시지를 포함하여 전체 대화 표시
  return messages.value
})

const messagesContainer = ref<HTMLDivElement | null>(null)

const isConversationOwner = computed(() => {
  if (!conversationOwnerId.value) return true
  return conversationOwnerId.value === authStore.user?.id
})

// 시나리오 소유자인지 확인 (기준 대화 저장 버튼 표시용)
const isScenarioOwner = computed(() => {
  if (!scenarioInfo.value?.userId) return false
  return scenarioInfo.value.userId === authStore.user?.id
})

// 기준 대화로 저장 가능한지 확인
// 조건: 시나리오 소유자 + Root 시나리오 + 대화 소유자 + 메시지가 있음
const canSaveAsReference = computed(() => {
  return (
    isScenarioOwner.value &&
    isConversationOwner.value &&
    !isForkedConversation.value &&
    messages.value.length > 0 &&
    scenarioInfo.value?.scenarioType === 'ROOT'
  )
})

// 기준 대화 저장 상태
const isSavingReference = ref(false)
const isReferenceSaved = computed(() => {
  if (!scenarioInfo.value) return false
  const refId = (scenarioInfo.value as any).referenceConversationId
  return refId === route.params.id
})

const canFork = computed(() => {
  return (
    isRootConversation.value &&
    !isLoading.value &&
    authStore.isAuthenticated &&
    !isConversationOwner.value
  )
})

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
    // 기준 대화에서 복사된 메시지 포함, 전체 대화 유지
    scrollToBottom()
  }
)

// Watch for typing indicator
watch(isTyping, () => {
  scrollToBottom()
})

const handleSendMessage = async (messageContent: string) => {
  if (!messageContent.trim()) return
  aiError.value = ''

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
    const { sendMessageStream } = await import('@/services/conversationApi')

    const response = await sendMessageStream(route.params.id as string, messageContent, {
      onAccepted: () => {
        aiError.value = ''
      },
    })

    const assistantMessage: Message = {
      id: response.assistantMessage.id,
      conversationId: response.assistantMessage.conversationId,
      role: 'assistant',
      content: response.assistantMessage.content,
      timestamp: response.assistantMessage.timestamp,
      rag: response.assistantMessage.rag ?? response.rag ?? null,
      ragMetadataId: response.assistantMessage.ragMetadataId ?? response.ragMetadataId ?? null,
      providerElapsedMs: response.assistantMessage.providerElapsedMs ?? response.providerElapsedMs ?? null,
    }
    messages.value.push(assistantMessage)
    isTyping.value = false
    scrollToBottom()
    
    // 턴 정보 업데이트
    if (response.turnCount !== undefined) {
      turnCount.value = response.turnCount
    }
    if (response.maxTurns !== undefined) {
      maxTurns.value = response.maxTurns
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    isTyping.value = false
    const errorMessage = String((error as any)?.message || '').toLowerCase()
    const timedOut = (error as any)?.code === 'ECONNABORTED' || errorMessage.includes('timeout')
    aiError.value = timedOut
      ? 'AI response timed out. Syncing latest messages...'
      : 'Error sending message. Please try again.'
    if (timedOut) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
      await loadConversation(route.params.id as string)
    }
  }
}

const goBackToList = () => {
  router.push('/conversations')
}

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    showWarningToast(t('auth.loginRequired') || 'Please login to like conversations')
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }

  const conversationId = route.params.id as string
  try {
    if (isLiked.value) {
      await unlikeConversation(conversationId)
      isLiked.value = false
      console.log('[ConversationChat] Unliked conversation:', conversationId)
    } else {
      await likeConversation(conversationId)
      isLiked.value = true
      console.log('[ConversationChat] Liked conversation:', conversationId)
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

const openForkModal = () => {
  forkError.value = ''
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (!canFork.value) {
    forkError.value = 'Not allowed to fork this conversation.'
    return
  }
  showForkModal.value = true
}

const closeForkModal = () => {
  if (isForking.value) return
  showForkModal.value = false
}

const confirmFork = async () => {
  if (isForking.value) return
  isForking.value = true
  const parentIdForFork = route.params.id as string
  forkParentId.value = parentIdForFork
  isRootConversation.value = false
  isForkedConversation.value = true
  if (!conversationDepth.value || conversationDepth.value < 1) {
    conversationDepth.value = 1
  }
  showForkModal.value = false
  try {
    const forked = await forkConversation(route.params.id as string)
    localStorage.setItem(`fork-parent-${forked.id}`, parentIdForFork)
    localStorage.setItem('forked-conversation-latest', forked.id)
    const scenarioIdForBump =
      currentScenarioId.value ||
      scenarioInfo.value?.id ||
      (scenarioInfo.value as any)?.scenarioId ||
      localStorage.getItem(`conversation-scenario-${parentIdForFork}`) ||
      localStorage.getItem('last-scenario-id')
    const scenarioKey = scenarioIdForBump ? String(scenarioIdForBump) : 'any'
    const key = `fork-bump-${scenarioKey}`
    const current = parseInt(localStorage.getItem(key) || '0', 10)
    if (scenarioKey !== 'any') {
      localStorage.setItem(key, String((isNaN(current) ? 0 : current) + 1))
    }
    localStorage.setItem('fork-bump-latest', scenarioKey)
    localStorage.setItem('forked-any', '1')
    localStorage.setItem('fork-count-force', '1')
    hasBeenForked.value = true
    await router.push(`/conversations/${forked.id}`)
    await loadConversation(forked.id)
    forkParentId.value = forkParentId.value || parentIdForFork
    isRootConversation.value = false
    isForkedConversation.value = true
    if (!conversationDepth.value || conversationDepth.value < 1) {
      conversationDepth.value = 1
    }
    // 기준 대화에서 복사된 메시지 포함, 전체 대화 유지
  } catch (error) {
    console.error('Failed to fork conversation:', error)
    forkError.value = 'Network error while forking. Please try again.'
    showErrorToast('Failed to fork conversation')
  } finally {
    isForking.value = false
  }
}

const viewOriginalConversation = () => {
  if (!forkParentId.value) return
  router.push(`/conversations/${forkParentId.value}`)
}

// 기준 대화로 저장
const saveAsReferenceConversation = async () => {
  if (!canSaveAsReference.value || isSavingReference.value) return
  
  const scenarioId = currentScenarioId.value || scenarioInfo.value?.id
  const conversationId = route.params.id as string
  
  if (!scenarioId) {
    showErrorToast('시나리오 정보를 찾을 수 없습니다.')
    return
  }
  
  isSavingReference.value = true
  try {
    // api 인스턴스 사용 (X-User-Id 헤더 자동 포함)
    const { default: api } = await import('@/services/api')
    await api.post(`/scenarios/${scenarioId}/reference-conversation`, { 
      conversationId 
    })
    
    // 성공 시 scenarioInfo 업데이트
    if (scenarioInfo.value) {
      (scenarioInfo.value as any).referenceConversationId = conversationId
    }
    
    // 성공 토스트
    const { success } = await import('@/composables/useToast').then(m => m.useToast())
    success('✅ 이 대화가 기준 대화로 저장되었습니다. 다른 사용자가 포크할 때 이 대화 내용이 복사됩니다.')
  } catch (error) {
    console.error('Failed to save reference conversation:', error)
    showErrorToast('기준 대화 저장에 실패했습니다.')
  } finally {
    isSavingReference.value = false
  }
}

// Load conversation data
const loadConversation = async (conversationId: string) => {
  isLoading.value = true
  messages.value = []
  scenarioInfo.value = null
  forkError.value = ''
  const cachedParentId = localStorage.getItem(`fork-parent-${conversationId}`)
  if (cachedParentId) {
    forkParentId.value = cachedParentId
    isRootConversation.value = false
    isForkedConversation.value = true
    if (!conversationDepth.value || conversationDepth.value < 1) {
      conversationDepth.value = 1
    }
  }
  try {
    // Fetch conversation data with messages
    const conversation = await getConversation(conversationId)
    conversationOwnerId.value =
      (conversation as any).userId || (conversation as any).user_id || (conversation as any).ownerId
    const storedScenarioId = localStorage.getItem(`conversation-scenario-${conversationId}`)
    const resolvedScenarioId =
      (conversation as any).scenarioId ??
      (conversation as any).scenario_id ??
      storedScenarioId ??
      null
    const storedParentId = cachedParentId || localStorage.getItem(`fork-parent-${conversationId}`)
    const resolvedParentId =
      (conversation as any).parentId ??
      (conversation as any).parentConversationId ??
      (conversation as any).parent_conversation_id ??
      (conversation as any).parent_id ??
      storedParentId ??
      null
    const resolvedDepthRaw =
      (conversation as any).depth ?? (conversation as any).conversationDepth ?? 0
    const resolvedDepth =
      typeof resolvedDepthRaw === 'number' ? resolvedDepthRaw : Number(resolvedDepthRaw) || 0
    const apiIsRoot = (conversation as any).isRoot ?? (conversation as any).is_root
    const isLastFork = localStorage.getItem('forked-conversation-latest') === conversationId
    const resolvedIsRoot =
      apiIsRoot !== undefined ? Boolean(apiIsRoot) : !resolvedParentId && resolvedDepth === 0
    const forcedFork = isLastFork || resolvedDepth > 0 || !!resolvedParentId

    isForkedConversation.value = forcedFork || !resolvedIsRoot
    isRootConversation.value = forcedFork ? false : resolvedIsRoot
    conversationDepth.value = resolvedDepth > 0 ? resolvedDepth : isForkedConversation.value ? 1 : 0
    currentScenarioId.value = resolvedScenarioId ? String(resolvedScenarioId) : null
    if (currentScenarioId.value) {
      localStorage.setItem(`conversation-scenario-${conversationId}`, currentScenarioId.value)
    }
    forkParentId.value = resolvedParentId ? String(resolvedParentId) : forkParentId.value
    if (forkParentId.value) {
      isForkedConversation.value = true
      isRootConversation.value = false
      if (!conversationDepth.value || conversationDepth.value < 1) {
        conversationDepth.value = 1
      }
    }

    const fetchedMessages = Array.isArray(conversation.messages) ? conversation.messages : []

    // 기준 대화에서 복사된 메시지 포함, 전체 대화 표시
    messages.value = fetchedMessages
    
    // 턴 수 계산 (사용자 메시지 수 = 턴 수)
    const userMessageCount = fetchedMessages.filter((msg: any) => msg.role === 'user').length
    turnCount.value = userMessageCount
    
    // 포크된 대화인 경우 maxTurns 조정: 기존 대화 + 5턴 추가
    // 포크 시점의 턴 수를 저장하고 거기에 5턴을 더함
    const storedBaseTurns = localStorage.getItem(`fork-base-turns-${conversationId}`)
    if (isForkedConversation.value || forkParentId.value || storedBaseTurns) {
      if (storedBaseTurns) {
        // 저장된 기본 턴 수가 있으면 그것 + 5
        maxTurns.value = parseInt(storedBaseTurns) + 5
      } else if (userMessageCount > 0) {
        // 처음 로드 시 현재 턴 수를 기본 턴 수로 저장 (복사된 대화)
        localStorage.setItem(`fork-base-turns-${conversationId}`, String(userMessageCount))
        maxTurns.value = userMessageCount + 5
      }
    } else {
      // Root 시나리오는 기본 5턴
      maxTurns.value = 5
    }
    
    await nextTick()

    console.log(
      '[ConversationChat] Loaded conversation',
      conversationId,
      'messages:',
      messages.value.length,
      'forked?',
      isForkedConversation.value
    )
    const resolvedHasBeenForked =
      (conversation as any).hasBeenForked ?? (conversation as any).has_been_forked
    hasBeenForked.value =
      resolvedHasBeenForked !== undefined
        ? Boolean(resolvedHasBeenForked)
        : hasBeenForked.value || isLastFork

    const storedParentForThis = localStorage.getItem(`fork-parent-${conversationId}`)
    if (storedParentForThis) {
      forkParentId.value = forkParentId.value || storedParentForThis
      isForkedConversation.value = true
      isRootConversation.value = false
      if (!conversationDepth.value || conversationDepth.value < 1) {
        conversationDepth.value = 1
      }
    }

    // Check if liked - CRITICAL: Always fetch fresh like status
    const likedStatus = await checkConversationLiked(conversationId)
    isLiked.value = likedStatus
    console.log(
      '[ConversationChat] Loaded like status:',
      likedStatus,
      'for conversation:',
      conversationId
    )

    // Fetch scenario data
    const scenarioIdToFetch = currentScenarioId.value || (conversation as any).scenarioId
    if (scenarioIdToFetch) {
      scenarioInfo.value = await scenarioApi.getScenario(scenarioIdToFetch)
    }

    // Fetch fork relationship (optional - may not be implemented in backend yet)
    try {
      forkRelationship.value = await getForkRelationship(conversationId)
      if (forkRelationship.value?.parent?.id) {
        forkParentId.value = forkRelationship.value.parent.id
        isForkedConversation.value = true
        isRootConversation.value = false
        if (!conversationDepth.value || conversationDepth.value < 1) {
          conversationDepth.value = 1
        }
      }
    } catch (error) {
      // Fork relationship API may not be available yet, continue without it
      console.warn('Fork relationship API not available:', error)
      forkRelationship.value = null
    }

    // GA4: 대화 시작 추적
    trackConversationStarted({
      scenarioId: currentScenarioId.value || (conversation as any).scenarioId,
      isFork: isForkedConversation.value,
    })
  } catch (error) {
    console.error('Failed to load conversation:', error)
    const status = (error as any)?.response?.status
    if (status === 401 || status === 403) {
      router.push({ name: 'Login', query: { redirect: `/conversations/${conversationId}` } })
      return
    }
    if (status === 404) {
      loadError.value = 'Conversation not found (404)'
    } else {
      loadError.value = 'Conversation not found or failed to load'
    }
  } finally {
    isLoading.value = false
    scrollToBottom(false)
  }
}

// Load initial messages
onMounted(async () => {
  const conversationId = route.params.id as string
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: `/conversations/${conversationId}` } })
    return
  }
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
    :class="
      css({
        display: 'flex',
        flexDirection: 'column',
        h: '100vh',
        overflow: 'hidden',
        bg: 'gray.50',
        scrollbarGutter: 'stable',
      })
    "
  >
    <AppHeader />

    <div v-if="loadError" :class="css({ maxW: '720px', mx: 'auto', px: '6', py: '8' })">
      <div
        :class="
          css({
            bg: 'white',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: '0.75rem',
            p: '6',
            boxShadow: 'md',
            textAlign: 'center',
          })
        "
      >
        <h2 :class="css({ fontSize: '1.5rem', fontWeight: '700', mb: '2', color: 'gray.800' })">
          {{ loadError }}
        </h2>
        <p :class="css({ color: 'gray.600', mb: '4' })">
          We could not load this conversation right now. Please check the link or try again later.
        </p>
        <router-link :to="'/'" :class="css({ color: 'green.700', fontWeight: '600' })">
          Return home
        </router-link>
      </div>
    </div>

    <!-- Conversations Sidebar -->
    <ConversationsSidebar
      v-model:visible="showSidebar"
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
            <span>{{ t('chat.backToList') }}</span>
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
            :aria-label="t('chat.openConversationList')"
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
            @click="toggleLike"
          >
            <span>{{ isLiked ? '❤️' : '🤍' }}</span>
            <span :class="css({ fontSize: '0.875rem', fontWeight: '600' })">
              {{ isLiked ? t('chat.liked') : t('chat.like') }}
            </span>
          </button>
          
          <!-- 기준 대화로 저장 버튼 (시나리오 소유자만 표시) -->
          <button
            v-if="canSaveAsReference"
            :class="
              css({
                w: 'full',
                mt: '2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2',
                py: '2',
                px: '4',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: isReferenceSaved ? 'green.300' : 'blue.200',
                bg: isReferenceSaved ? 'green.50' : 'blue.50',
                color: isReferenceSaved ? 'green.700' : 'blue.700',
                cursor: isReferenceSaved || isSavingReference ? 'default' : 'pointer',
                transition: 'all 0.2s',
                opacity: isSavingReference ? 0.7 : 1,
                _hover: isReferenceSaved || isSavingReference ? {} : {
                  bg: 'blue.100',
                  borderColor: 'blue.300',
                },
              })
            "
            :disabled="isReferenceSaved || isSavingReference"
            @click="saveAsReferenceConversation"
          >
            <span>{{ isReferenceSaved ? '✅' : isSavingReference ? '⏳' : '💾' }}</span>
            <span :class="css({ fontSize: '0.875rem', fontWeight: '600' })">
              {{ isReferenceSaved ? '기준 대화로 저장됨' : isSavingReference ? '저장 중...' : '기준 대화로 저장' }}
            </span>
          </button>
          
          <!-- 기준 대화 안내 메시지 -->
          <p
            v-if="canSaveAsReference && !isReferenceSaved"
            :class="css({ fontSize: '0.75rem', color: 'gray.500', mt: '2', textAlign: 'center' })"
          >
            저장하면 다른 사용자가 포크할 때 이 대화 내용이 함께 복사됩니다
          </p>
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
              {{ t('chat.title') }}
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
              {{ t('chat.whatIf') }}
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
              {{ t('chat.forkedFrom') }}
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
                ⚠️ {{ t('chat.alreadyForked') }}
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
                🔀
                {{
                  conversationDepth === 1
                    ? 'Maximum fork depth reached'
                    : t('chat.forkedConversation', { depth: conversationDepth })
                }}
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
        <div
          v-if="forkParentId"
          data-testid="forked-indicator"
          :class="
            css({
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              px: '6',
              py: '3',
              bg: 'green.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4',
            })
          "
        >
          <span :class="css({ fontWeight: '600', color: 'green.800' })">Forked from</span>
          <button
            data-testid="view-original-conversation"
            :class="
              css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                px: '3',
                py: '2',
                borderRadius: 'full',
                bg: 'green.600',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                _hover: { bg: 'green.700' },
              })
            "
            @click="viewOriginalConversation"
          >
            View original
          </button>
        </div>

        <div
          v-else-if="canFork"
          :class="
            css({
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              px: '6',
              py: '3',
              bg: 'gray.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4',
            })
          "
        >
          <div>
            <p :class="css({ fontWeight: '600', color: 'gray.800' })">Fork this conversation</p>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
              Copy the last 6 messages into a new branch.
            </p>
          </div>
          <button
            data-testid="fork-conversation-button"
            :class="
              css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2',
                px: '4',
                py: '2',
                borderRadius: 'full',
                bg: 'purple.600',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                _hover: { bg: 'purple.700' },
              })
            "
            @click="openForkModal"
          >
            🍴 Fork
          </button>
          <div
            data-testid="fork-tooltip"
            :class="css({ fontSize: '0.75rem', color: 'gray.600', mt: '2' })"
          >
            Fork conversation to start a branch with the last 6 messages.
          </div>
        </div>

        <div
          v-if="forkError"
          :class="
            css({
              px: '6',
              py: '3',
              color: 'red.700',
              fontWeight: '600',
              bg: 'red.50',
              borderBottom: '1px solid',
              borderColor: 'red.200',
            })
          "
          data-testid="toast-error"
        >
          {{ forkError }}
        </div>

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
            🔀 {{ t('chat.forkedConversation', { depth: conversationDepth }) }}
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
          :aria-label="t('chat.messageList')"
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
              <p>{{ t('chat.loadingMessages') }}</p>
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
              <p :class="css({ fontSize: '1rem' })">
                {{ t('chat.startConversation') }}
              </p>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.400' })">
                {{ t('chat.askAnything') }}
              </p>
            </div>

            <!-- Messages List -->
            <template v-else>
              <ChatMessage
                v-for="(message, index) in displayMessages"
                :key="message.id"
                :message="message"
                :is-latest="index === displayMessages.length - 1"
              />
            </template>

            <!-- Typing Indicator -->
            <TypingIndicator v-if="isTyping" />
          </div>
        </div>

        <!-- Input Area using ChatInput component -->
        <!--TODO: Conversation Chat 에서 입력창 scroll 없애기-->
        <div
          v-if="aiError"
          :class="css({ color: 'red.700', px: '6', pb: '2', fontWeight: '600' })"
          data-testid="toast-error"
        >
          {{ aiError }}
        </div>
        
        <!-- 턴 정보 표시 -->
        <div
          v-if="turnCount > 0"
          :class="
            css({
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2',
              py: '2',
              px: '4',
            })
          "
        >
          <div
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                px: '3',
                py: '1',
                bg: turnCount >= maxTurns ? 'red.50' : 'blue.50',
                borderRadius: 'full',
                border: '1px solid',
                borderColor: turnCount >= maxTurns ? 'red.200' : 'blue.200',
              })
            "
          >
            <span :class="css({ fontSize: '0.75rem', color: turnCount >= maxTurns ? 'red.700' : 'blue.700' })">
              💬 대화 {{ turnCount }}/{{ maxTurns }} 턴
            </span>
            <span
              v-if="turnCount >= maxTurns"
              :class="css({ fontSize: '0.7rem', color: 'red.600' })"
            >
              (최대 도달)
            </span>
          </div>
        </div>
        
        <ChatInput 
          :disabled="isLoading || turnCount >= maxTurns" 
          :loading="isTyping" 
          @send="handleSendMessage" 
        />
      </div>
    </div>

    <div
      v-if="showForkModal"
      data-testid="fork-modal"
      :class="
        css({
          position: 'fixed',
          inset: 0,
          bg: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          px: '4',
        })
      "
    >
      <div
        :class="
          css({
            w: 'full',
            maxW: '480px',
            bg: 'white',
            borderRadius: '1rem',
            p: '6',
            boxShadow: 'lg',
            display: 'flex',
            flexDirection: 'column',
            gap: '4',
          })
        "
      >
        <h3 :class="css({ fontSize: '1.25rem', fontWeight: '700', color: 'gray.900' })">
          Fork this conversation?
        </h3>
        <p :class="css({ color: 'gray.600', lineHeight: '1.6' })">
          We will copy up to the last 6 messages so you can explore a new path without losing
          context.
        </p>
        <div :class="css({ display: 'flex', justifyContent: 'flex-end', gap: '3' })">
          <button
            data-testid="cancel-fork-button"
            :disabled="isForking"
            :class="
              css({
                px: '4',
                py: '2',
                borderRadius: 'full',
                border: '1px solid',
                borderColor: 'gray.300',
                bg: 'white',
                color: 'gray.800',
                cursor: 'pointer',
                _hover: { bg: 'gray.50' },
                _disabled: { opacity: 0.6, cursor: 'not-allowed' },
              })
            "
            @click="closeForkModal"
          >
            Cancel
          </button>
          <button
            data-testid="confirm-fork-button"
            :disabled="isForking"
            :class="
              css({
                px: '5',
                py: '2',
                borderRadius: 'full',
                bg: 'purple.600',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                _hover: { bg: 'purple.700' },
                _disabled: { opacity: 0.6, cursor: 'not-allowed' },
              })
            "
            @click="confirmFork"
          >
            {{ isForking ? 'Forking...' : 'Confirm fork' }}
          </button>
        </div>
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
