<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { css } from '../../../styled-system/css'
import { useMemoStore } from '@/stores/memo'
import CharCounter from '@/components/CharCounter.vue'

const props = defineProps<{
  conversationId: string
}>()

const emit = defineEmits<{
  saved: []
  deleted: []
}>()

const memoStore = useMemoStore()

// State
const isCollapsed = ref(true)
const memoContent = ref('')
const isDirty = ref(false)
const isSaving = ref(false)
const showDeleteConfirm = ref(false)

// Constants
const MAX_LENGTH = 2000
const DRAFT_KEY_PREFIX = 'memo_draft_'

// Computed
const hasExistingMemo = computed(() => memoStore.hasMemo(props.conversationId))
const canSave = computed(() => isDirty.value && memoContent.value.trim().length > 0)
const draftKey = computed(() => `${DRAFT_KEY_PREFIX}${props.conversationId}`)

// Load memo on mount
onMounted(async () => {
  await loadMemo()
})

// Watch for changes to auto-save draft
watch(memoContent, (newValue) => {
  // Save to localStorage
  if (newValue.trim()) {
    localStorage.setItem(draftKey.value, newValue)
  } else {
    localStorage.removeItem(draftKey.value)
  }
  isDirty.value = true
})

// Load memo from store or localStorage
async function loadMemo(): Promise<void> {
  // Try to fetch from backend
  const memo = await memoStore.fetchMemo(props.conversationId)

  if (memo) {
    memoContent.value = memo.content
    isDirty.value = false
    // Clear draft if backend data exists
    localStorage.removeItem(draftKey.value)
  } else {
    // Try to load from localStorage draft
    const draft = localStorage.getItem(draftKey.value)
    if (draft) {
      memoContent.value = draft
      isDirty.value = true
    }
  }
}

// Toggle collapse
function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value
}

// Save memo
async function handleSave(): Promise<void> {
  if (!canSave.value) return

  isSaving.value = true
  try {
    await memoStore.saveMemo(props.conversationId, memoContent.value.trim())
    isDirty.value = false
    // Clear draft on successful save
    localStorage.removeItem(draftKey.value)
    showToast('메모가 저장되었습니다')
    emit('saved')
  } catch (error) {
    console.error('Failed to save memo:', error)
    showToast('메모 저장에 실패했습니다', 'error')
  } finally {
    isSaving.value = false
  }
}

// Delete memo
function confirmDelete(): void {
  showDeleteConfirm.value = true
}

async function handleDelete(): Promise<void> {
  try {
    await memoStore.deleteMemo(props.conversationId)
    memoContent.value = ''
    isDirty.value = false
    localStorage.removeItem(draftKey.value)
    showDeleteConfirm.value = false
    showToast('메모가 삭제되었습니다')
    emit('deleted')
  } catch (error) {
    console.error('Failed to delete memo:', error)
    showToast('메모 삭제에 실패했습니다', 'error')
  }
}

function cancelDelete(): void {
  showDeleteConfirm.value = false
}

// Simple toast notification (you can replace with a proper toast component)
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  // Simple implementation - can be replaced with a proper toast library
  const toastDiv = document.createElement('div')
  toastDiv.textContent = message
  toastDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `
  document.body.appendChild(toastDiv)

  setTimeout(() => {
    toastDiv.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => document.body.removeChild(toastDiv), 300)
  }, 3000)
}

// Warn before leaving if unsaved changes
onUnmounted(() => {
  if (isDirty.value && memoContent.value.trim()) {
    // Draft is already saved to localStorage
    console.log('Unsaved memo draft preserved in localStorage')
  }
})

// Warn before navigation (optional)
function handleBeforeUnload(e: BeforeUnloadEvent): void {
  if (isDirty.value && memoContent.value.trim()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div :class="memoEditorContainer">
    <!-- Header -->
    <button
      :class="headerButton"
      type="button"
      @click="toggleCollapse"
    >
      <span :class="headerTitle">
        <span>내 노트 📝</span>
        <span
          v-if="hasExistingMemo && isCollapsed"
          :class="hasMemoBadge"
        >•</span>
      </span>
      <span :class="collapseIcon">{{ isCollapsed ? '▼' : '▲' }}</span>
    </button>

    <!-- Editor Content -->
    <div
      v-if="!isCollapsed"
      :class="editorContent"
    >
      <textarea
        v-model="memoContent"
        :class="textarea"
        :maxlength="MAX_LENGTH"
        placeholder="대화에 대한 메모를 작성하세요..."
        :disabled="isSaving"
      />

      <!-- Character Counter -->
      <div :class="counterContainer">
        <CharCounter
          :text="memoContent"
          :max="MAX_LENGTH"
        />
        <span
          v-if="isDirty"
          :class="unsavedBadge"
        >저장 안 됨</span>
      </div>

      <!-- Actions -->
      <div :class="actionButtons">
        <button
          :class="[saveButton, { [saveButtonDisabled]: !canSave || isSaving }]"
          :disabled="!canSave || isSaving"
          type="button"
          @click="handleSave"
        >
          {{ isSaving ? '저장 중...' : '저장' }}
        </button>

        <button
          v-if="hasExistingMemo"
          :class="deleteButton"
          :disabled="isSaving"
          type="button"
          @click="confirmDelete"
        >
          삭제
        </button>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        :class="modalOverlay"
        @click="cancelDelete"
      >
        <div
          :class="modalContent"
          @click.stop
        >
          <h3 :class="modalTitle">
            메모 삭제
          </h3>
          <p :class="modalText">
            정말로 이 메모를 삭제하시겠습니까?
          </p>
          <div :class="modalActions">
            <button
              :class="modalCancelButton"
              type="button"
              @click="cancelDelete"
            >
              취소
            </button>
            <button
              :class="modalDeleteButton"
              type="button"
              @click="handleDelete"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Styles using Panda CSS
const memoEditorContainer = css({
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'white',
  marginBottom: '16px',
})

const headerButton = css({
  width: '100%',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'gray.50',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: 'gray.100',
  },
})

const headerTitle = css({
  fontSize: '16px',
  fontWeight: 'semibold',
  color: 'gray.800',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})

const hasMemoBadge = css({
  color: 'blue.500',
  fontSize: '20px',
  lineHeight: '1',
})

const collapseIcon = css({
  color: 'gray.500',
  fontSize: '12px',
})

const editorContent = css({
  padding: '16px',
})

const textarea = css({
  width: '100%',
  minHeight: '120px',
  padding: '12px',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: '6px',
  resize: 'vertical',
  fontSize: '14px',
  lineHeight: '1.5',
  fontFamily: 'inherit',
  _focus: {
    outline: 'none',
    borderColor: 'blue.500',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  _disabled: {
    backgroundColor: 'gray.50',
    cursor: 'not-allowed',
  },
})

const counterContainer = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '8px',
  marginBottom: '12px',
})

const unsavedBadge = css({
  fontSize: '12px',
  color: 'orange.600',
  fontWeight: 'medium',
})

const actionButtons = css({
  display: 'flex',
  gap: '8px',
})

const saveButton = css({
  padding: '8px 16px',
  backgroundColor: 'blue.500',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: 'blue.600',
  },
})

const saveButtonDisabled = css({
  backgroundColor: 'gray.300',
  cursor: 'not-allowed',
  _hover: {
    backgroundColor: 'gray.300',
  },
})

const deleteButton = css({
  padding: '8px 16px',
  backgroundColor: 'white',
  color: 'red.600',
  border: '1px solid',
  borderColor: 'red.300',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    backgroundColor: 'red.50',
    borderColor: 'red.400',
  },
})

const modalOverlay = css({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
})

const modalContent = css({
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '400px',
  width: '90%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
})

const modalTitle = css({
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
  color: 'gray.900',
})

const modalText = css({
  fontSize: '14px',
  color: 'gray.600',
  marginBottom: '20px',
})

const modalActions = css({
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
})

const modalCancelButton = css({
  padding: '8px 16px',
  backgroundColor: 'white',
  color: 'gray.700',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    backgroundColor: 'gray.50',
  },
})

const modalDeleteButton = css({
  padding: '8px 16px',
  backgroundColor: 'red.600',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: 'red.700',
  },
})
</script>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
