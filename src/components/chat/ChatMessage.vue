<!-- Chat Message Bubble Component -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { css } from '../../../styled-system/css'
import type { Message } from '@/stores/conversation'
import { getRagSources, type RagChatSourceResponse } from '@/services/conversationApi'

interface Props {
  message: Message
  isLatest?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLatest: false,
})

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')
const ragMetadata = computed(() => props.message.rag)
const citations = computed(() => (ragMetadata.value?.citations ?? []).slice(0, 4))
const hasCitations = computed(() => !isUser.value && citations.value.length > 0)
const showCopyFeedback = ref(false)
const sourceDrawerOpen = ref(false)
const sourceLoading = ref(false)
const sourceError = ref('')
const sourceResponse = ref<RagChatSourceResponse | null>(null)
const sourceCitations = computed(() => sourceResponse.value?.citations ?? [])

// Clipboard functionality
const { copy, isSupported: isClipboardSupported } = useClipboard()

// Format timestamp
const formattedTime = computed(() => {
  if (!props.message.timestamp) return ''
  const date = new Date(props.message.timestamp)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

// Copy message to clipboard
async function handleCopy(): Promise<void> {
  if (!isClipboardSupported.value) return

  try {
    await copy(props.message.content)
    showCopyFeedback.value = true
    setTimeout(() => {
      showCopyFeedback.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}

async function handleOpenSources(): Promise<void> {
  if (!hasCitations.value || sourceLoading.value) return
  sourceDrawerOpen.value = true
  if (sourceResponse.value) return

  sourceLoading.value = true
  sourceError.value = ''
  try {
    sourceResponse.value = await getRagSources(props.message.conversationId, props.message.id)
  } catch (error) {
    console.error('Failed to load RAG sources:', error)
    sourceError.value = '근거 passage를 불러오지 못했습니다.'
  } finally {
    sourceLoading.value = false
  }
}

function closeSources(): void {
  sourceDrawerOpen.value = false
}

function formatPassageId(passageId: string): string {
  if (!passageId) return ''
  if (passageId.length <= 18) return passageId
  return `${passageId.slice(0, 10)}...${passageId.slice(-6)}`
}

function formatGroundingStatus(status?: string): string {
  if (!status) return 'grounding unknown'
  return status.replace(/_/g, ' ')
}

// Static styles
const styles = {
  messageWrapper: css({
    display: 'flex',
    marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease-in',
    position: 'relative',
  }),
  userWrapper: css({
    justifyContent: 'flex-end',
  }),
  assistantWrapper: css({
    justifyContent: 'flex-start',
  }),
  bubbleContainer: css({
    position: 'relative',
    maxWidth: { base: '85%', md: '70%' },
    '&:hover .copy-button': {
      opacity: 1,
    },
  }),
  bubble: css({
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  }),
  userBubble: css({
    backgroundColor: '#1F7D51',
    color: 'white',
    borderBottomRightRadius: '0.25rem',
  }),
  assistantBubble: css({
    backgroundColor: 'neutral.100',
    color: 'neutral.900',
    borderBottomLeftRadius: '0.25rem',
  }),
  systemBubble: css({
    backgroundColor: 'gray.100',
    color: 'gray.700',
    borderRadius: '0.5rem',
    border: '1px solid',
    borderColor: 'gray.300',
    fontStyle: 'italic',
  }),
  content: css({
    fontSize: '0.95rem',
    lineHeight: '1.6',
  }),
  metaRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    gap: '0.5rem',
  }),
  timestamp: css({
    fontSize: '0.75rem',
    opacity: 0.7,
  }),
  copyButton: css({
    opacity: 0,
    transition: 'opacity 0.2s ease',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '&:focus-visible': {
      opacity: 1,
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px',
    },
  }),
  copyButtonUser: css({
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  }),
  copyButtonAssistant: css({
    color: 'neutral.600',
  }),
  copyFeedback: css({
    position: 'absolute',
    top: '-2rem',
    right: '0',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'green.500',
    color: 'white',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    animation: 'fadeIn 0.2s ease-in',
  }),
  citationBlock: css({
    mt: '0.75rem',
    pt: '0.625rem',
    borderTop: '1px solid',
    borderColor: 'neutral.200',
  }),
  citationMeta: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    alignItems: 'center',
    mb: '0.5rem',
    fontSize: '0.72rem',
    color: 'neutral.600',
  }),
  citationBadge: css({
    display: 'inline-flex',
    alignItems: 'center',
    minH: '1.5rem',
    px: '0.5rem',
    borderRadius: '999px',
    backgroundColor: 'white',
    border: '1px solid',
    borderColor: 'neutral.200',
    color: 'neutral.700',
    fontSize: '0.72rem',
    lineHeight: '1',
  }),
  citationList: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  }),
  citationPill: css({
    display: 'inline-flex',
    alignItems: 'center',
    maxW: '100%',
    minH: '1.625rem',
    px: '0.5rem',
    borderRadius: '999px',
    backgroundColor: 'rgba(31, 125, 81, 0.08)',
    border: '1px solid',
    borderColor: 'rgba(31, 125, 81, 0.22)',
    color: '#1F7D51',
    fontSize: '0.72rem',
    lineHeight: '1.1',
    cursor: 'pointer',
    _hover: {
      backgroundColor: 'rgba(31, 125, 81, 0.13)',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: '#1F7D51',
      outlineOffset: '2px',
    },
  }),
  sourceDrawer: css({
    mt: '0.75rem',
    pt: '0.75rem',
    borderTop: '1px solid',
    borderColor: 'neutral.200',
  }),
  sourceDrawerHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    mb: '0.625rem',
  }),
  sourceTitle: css({
    fontSize: '0.78rem',
    fontWeight: '700',
    color: 'neutral.800',
  }),
  sourceCloseButton: css({
    border: 'none',
    bg: 'transparent',
    color: 'neutral.600',
    cursor: 'pointer',
    minW: '1.75rem',
    minH: '1.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    _hover: {
      bg: 'neutral.200',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: '#1F7D51',
      outlineOffset: '2px',
    },
  }),
  sourceList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  }),
  sourceItem: css({
    border: '1px solid',
    borderColor: 'neutral.200',
    borderRadius: '0.5rem',
    bg: 'white',
    p: '0.75rem',
  }),
  sourceItemHeader: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    alignItems: 'center',
    mb: '0.5rem',
    color: 'neutral.600',
    fontSize: '0.72rem',
  }),
  sourceText: css({
    color: 'neutral.800',
    fontSize: '0.84rem',
    lineHeight: '1.55',
    whiteSpace: 'pre-wrap',
  }),
  sourceState: css({
    color: 'neutral.600',
    fontSize: '0.82rem',
    lineHeight: '1.5',
  }),
}
</script>

<template>
  <div
    :class="[
      styles.messageWrapper,
      isSystem ? '' : isUser ? styles.userWrapper : styles.assistantWrapper,
    ]"
    :data-role="message.role"
    data-testid="message-item"
    :aria-label="`${isSystem ? '시스템 메시지' : isUser ? '내 메시지' : 'AI 응답'}: ${message.content}`"
  >
    <div :class="styles.bubbleContainer">
      <!-- Copy feedback toast -->
      <output v-if="showCopyFeedback" :class="styles.copyFeedback" aria-live="polite">
        복사됨!
      </output>

      <div
        :class="[
          styles.bubble,
          isSystem ? styles.systemBubble : isUser ? styles.userBubble : styles.assistantBubble,
        ]"
        :data-testid="
          isSystem
            ? 'system-message'
            : message.role === 'assistant'
              ? 'assistant-message'
              : message.role === 'user'
                ? 'user-message'
                : `message-${message.role}`
        "
      >
        <div :class="styles.content">
          {{ message.content }}
        </div>
        <div v-if="hasCitations" :class="styles.citationBlock" data-testid="rag-citations">
          <div :class="styles.citationMeta">
            <span :class="styles.citationBadge" data-testid="rag-grounding-status">
              {{ formatGroundingStatus(ragMetadata?.grounding_status) }}
            </span>
            <span v-if="ragMetadata?.ranking_policy" :class="styles.citationBadge">
              {{ ragMetadata.ranking_policy }}
            </span>
          </div>
          <div :class="styles.citationList">
            <button
              v-for="(citation, index) in citations"
              :key="citation.passage_id"
              type="button"
              :class="styles.citationPill"
              :title="citation.passage_id"
              data-testid="rag-citation"
              @click="handleOpenSources"
            >
              [{{ citation.final_rank ?? index + 1 }}] {{ formatPassageId(citation.passage_id) }}
            </button>
          </div>
          <div v-if="sourceDrawerOpen" :class="styles.sourceDrawer" data-testid="rag-source-drawer">
            <div :class="styles.sourceDrawerHeader">
              <span :class="styles.sourceTitle">Source passages</span>
              <button
                type="button"
                :class="styles.sourceCloseButton"
                aria-label="근거 닫기"
                data-testid="rag-source-close"
                @click="closeSources"
              >
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </div>
            <div v-if="sourceLoading" :class="styles.sourceState" data-testid="rag-source-loading">
              Loading sources...
            </div>
            <div v-else-if="sourceError" :class="styles.sourceState" data-testid="rag-source-error">
              {{ sourceError }}
            </div>
            <div v-else :class="styles.sourceList">
              <article
                v-for="source in sourceCitations"
                :key="source.citationId ?? source.passageId"
                :class="styles.sourceItem"
                data-testid="rag-source-item"
              >
                <div :class="styles.sourceItemHeader">
                  <span>[{{ source.finalRank ?? '-' }}]</span>
                  <span>{{ source.chapter ? `Chapter ${source.chapter}` : 'Chapter unknown' }}</span>
                  <span>{{ formatPassageId(source.passageId) }}</span>
                </div>
                <p v-if="source.sourceAvailable && source.text" :class="styles.sourceText">
                  {{ source.text }}
                </p>
                <p v-else :class="styles.sourceState">Source unavailable.</p>
              </article>
            </div>
          </div>
        </div>
        <div :class="styles.metaRow">
          <span :class="styles.timestamp">
            {{ formattedTime }}
          </span>
          <button
            v-if="isClipboardSupported"
            :class="[
              styles.copyButton,
              isUser ? styles.copyButtonUser : styles.copyButtonAssistant,
              'copy-button',
            ]"
            :data-testid="`copy-button-${message.role}`"
            aria-label="메시지 복사"
            @click="handleCopy"
          >
            <i class="pi pi-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
