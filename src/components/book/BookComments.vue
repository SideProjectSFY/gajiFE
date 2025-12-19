<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { css } from 'styled-system/css'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { commentApi } from '@/services/commentApi'
import type { BookComment, CommentPage } from '@/types/comment'

interface Props {
  bookId: string
}

const props = defineProps<Props>()
const toast = useToast()
const authStore = useAuthStore()

// State
const comments = ref<BookComment[]>([])
const currentPage = ref(0)
const hasMorePages = ref(false)
const loading = ref(false)
const submitting = ref(false)
const newCommentContent = ref('')
const editingCommentId = ref<string | null>(null)
const editContent = ref('')
const showDeleteConfirm = ref(false)
const commentToDelete = ref<string | null>(null)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)
const characterCount = computed(() => newCommentContent.value.length)
const isContentValid = computed(() => characterCount.value >= 1 && characterCount.value <= 1000)
const editCharacterCount = computed(() => editContent.value.length)
const isEditContentValid = computed(
  () => editCharacterCount.value >= 1 && editCharacterCount.value <= 1000
)

// Methods
const loadComments = async (page: number = 0) => {
  try {
    loading.value = true
    const response: CommentPage = await commentApi.getComments(props.bookId, page)

    if (page === 0) {
      comments.value = response.content
    } else {
      comments.value.push(...response.content)
    }

    currentPage.value = page
    hasMorePages.value = !response.last
  } catch (error) {
    toast.error('Failed to load comments')
  } finally {
    loading.value = false
  }
}

const createComment = async () => {
  if (!isContentValid.value) {
    toast.warning('Comment must be between 1 and 1000 characters')
    return
  }

  try {
    submitting.value = true
    const newComment = await commentApi.createComment(props.bookId, {
      content: newCommentContent.value,
    })

    // Optimistic update: add to top of list
    comments.value.unshift(newComment)
    newCommentContent.value = ''

    toast.success('Comment posted successfully')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to post comment')
  } finally {
    submitting.value = false
  }
}

const startEdit = (comment: BookComment) => {
  editingCommentId.value = comment.id
  editContent.value = comment.content
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const saveEdit = async (commentId: string) => {
  if (!isEditContentValid.value) {
    toast.warning('Comment must be between 1 and 1000 characters')
    return
  }

  try {
    const updated = await commentApi.updateComment(commentId, {
      content: editContent.value,
    })

    // Update in list
    const index = comments.value.findIndex((c) => c.id === commentId)
    if (index !== -1) {
      comments.value[index] = updated
    }

    cancelEdit()

    toast.success('Comment updated successfully')
  } catch (error: any) {
    toast.success(error.response?.data?.message || 'Failed to update comment')
  }
}

const confirmDelete = (commentId: string) => {
  showDeleteConfirm.value = true
  commentToDelete.value = commentId
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  commentToDelete.value = null
}

const deleteComment = async () => {
  if (!commentToDelete.value) return
  const commentId = commentToDelete.value
  try {
    await commentApi.deleteComment(commentId)

    // Optimistic update: remove from list
    comments.value = comments.value.filter((c) => c.id !== commentId)

    cancelDelete()
    toast.success('Comment deleted successfully')
  } catch (error: any) {
    toast.success(error.response?.data?.message || 'Failed to delete comment')
  }
}

const loadMore = () => {
  loadComments(currentPage.value + 1)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`

  return date.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadComments()
})
</script>

<template>
  <div
    data-testid="book-comments"
    class="book-comments"
    :class="
      css({
        bg: 'white',
        borderRadius: '0.75rem',
        p: '6',
      })
    "
  >
    <h2
      :class="
        css({
          fontSize: '1.125rem',
          fontWeight: '600',
          mb: '4',
        })
      "
    >
      💬 Comments
    </h2>

    <!-- Comment Form - Only for authenticated users -->
    <div
      v-if="isAuthenticated"
      :class="
        css({
          borderRadius: '0.5rem',
          p: '4',
          mb: '6',
        })
      "
    >
      <textarea
        v-model="newCommentContent"
        data-testid="new-comment-textarea"
        placeholder="Share your thoughts about this book..."
        :maxlength="1000"
        :class="
          css({
            w: 'full',
            px: '3',
            py: '2',
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minH: '24',
            outline: 'none',
            resize: 'vertical',
            _focus: {
              borderColor: 'green.500',
              boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
            },
          })
        "
      />
      <div
        :class="
          css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: '3',
          })
        "
      >
        <span
          :class="
            css({
              fontSize: '0.875rem',
              color: characterCount > 1000 ? 'red.500' : 'gray.500',
            })
          "
        >
          {{ characterCount }} / 1000
        </span>
        <button
          data-testid="post-comment-button"
          :disabled="!isContentValid || submitting"
          :class="
            css({
              px: '4',
              py: '2',
              bg: !isContentValid || submitting ? 'gray.300' : 'green.500',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: !isContentValid || submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              _hover: !isContentValid || submitting ? {} : { bg: 'green.600' },
            })
          "
          @click="createComment"
        >
          {{ submitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && comments.length === 0"
      :class="
        css({
          textAlign: 'center',
          py: '8',
          color: 'gray.500',
        })
      "
    >
      <div :class="css({ fontSize: '2rem', mb: '2' })">⏳</div>
      <p>Loading comments...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="comments.length === 0"
      :class="
        css({
          textAlign: 'center',
          py: '8',
          color: 'gray.500',
        })
      "
    >
      <div :class="css({ fontSize: '3rem', mb: '2' })">💭</div>
      <p>No comments yet. Be the first to share your thoughts!</p>
    </div>

    <!-- Comments List -->
    <div v-else :class="css({ display: 'flex', flexDirection: 'column', gap: '4' })">
      <div
        v-for="comment in comments"
        :key="comment.id"
        data-testid="comment-item"
        class="comment-item"
        :class="
          css({
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: '0.5rem',
            p: '4',
            _hover: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' },
            transition: 'all 0.2s',
          })
        "
      >
        <div :class="css({ display: 'flex', gap: '3' })">
          <!-- Avatar -->
          <div
            :class="
              css({
                w: '10',
                h: '10',
                borderRadius: 'full',
                bg: 'gray.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'gray.600',
                flexShrink: 0,
              })
            "
          >
            {{ comment.username.charAt(0).toUpperCase() }}
          </div>

          <div :class="css({ flex: 1, minW: 0 })">
            <!-- Header -->
            <div
              :class="
                css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  mb: '2',
                  flexWrap: 'wrap',
                })
              "
            >
              <span :class="css({ fontWeight: '600', color: 'gray.900' })">
                {{ comment.username }}
              </span>
              <span :class="css({ fontSize: '0.875rem', color: 'gray.500' })">
                {{ formatDate(comment.createdAt) }}
              </span>
            </div>

            <!-- Edit Mode -->
            <div v-if="editingCommentId === comment.id">
              <textarea
                v-model="editContent"
                :maxlength="1000"
                :class="
                  css({
                    w: 'full',
                    px: '3',
                    py: '2',
                    border: '1px solid',
                    borderColor: 'gray.300',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    minH: '20',
                    outline: 'none',
                    resize: 'vertical',
                    mb: '2',
                    _focus: {
                      borderColor: 'green.500',
                      boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                    },
                  })
                "
              />
              <div
                :class="
                  css({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  })
                "
              >
                <span
                  :class="
                    css({
                      fontSize: '0.875rem',
                      color: editCharacterCount > 1000 ? 'red.500' : 'gray.500',
                    })
                  "
                >
                  {{ editCharacterCount }} / 1000
                </span>
                <div :class="css({ display: 'flex', gap: '2' })">
                  <button
                    :class="
                      css({
                        px: '3',
                        py: '1.5',
                        bg: 'white',
                        color: 'gray.700',
                        border: '1px solid',
                        borderColor: 'gray.300',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        _hover: { bg: 'gray.50' },
                      })
                    "
                    @click="cancelEdit"
                  >
                    Cancel
                  </button>
                  <button
                    :disabled="!isEditContentValid"
                    :class="
                      css({
                        px: '3',
                        py: '1.5',
                        bg: !isEditContentValid ? 'gray.300' : 'green.500',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: !isEditContentValid ? 'not-allowed' : 'pointer',
                        _hover: !isEditContentValid ? {} : { bg: 'green.600' },
                      })
                    "
                    @click="saveEdit(comment.id)"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <!-- View Mode -->
            <div v-else>
              <p
                :class="
                  css({
                    color: 'gray.700',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    mb: '3',
                  })
                "
              >
                {{ comment.content }}
              </p>

              <div v-if="comment.isAuthor" :class="css({ display: 'flex', gap: '2' })">
                <button
                  :class="
                    css({
                      px: '3',
                      py: '1.5',
                      bg: 'white',
                      color: 'gray.600',
                      border: '1px solid',
                      borderColor: 'gray.300',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      _hover: { bg: 'gray.50', color: 'gray.900' },
                    })
                  "
                  @click="startEdit(comment)"
                >
                  ✏️ Edit
                </button>
                <button
                  :class="
                    css({
                      px: '3',
                      py: '1.5',
                      bg: 'white',
                      color: 'red.600',
                      border: '1px solid',
                      borderColor: 'red.300',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      _hover: { bg: 'red.50' },
                    })
                  "
                  @click="confirmDelete(comment.id)"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div
      v-if="hasMorePages"
      :class="
        css({
          textAlign: 'center',
          mt: '6',
        })
      "
    >
      <button
        :disabled="loading"
        :class="
          css({
            px: '6',
            py: '2',
            bg: loading ? 'gray.300' : 'white',
            color: loading ? 'gray.500' : 'gray.700',
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            _hover: loading ? {} : { bg: 'gray.50' },
          })
        "
        @click="loadMore"
      >
        {{ loading ? 'Loading...' : '↓ Load More Comments' }}
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      :class="
        css({
          position: 'fixed',
          inset: 0,
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        })
      "
      @click="cancelDelete"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '6',
            maxW: 'md',
            w: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          })
        "
        @click.stop
      >
        <h3
          :class="
            css({
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'gray.900',
              mb: '3',
            })
          "
        >
          Delete Comment
        </h3>
        <p
          :class="
            css({
              color: 'gray.600',
              mb: '6',
              lineHeight: '1.5',
            })
          "
        >
          Are you sure you want to delete this comment? This action cannot be undone.
        </p>
        <div :class="css({ display: 'flex', justifyContent: 'flex-end', gap: '3' })">
          <button
            :class="
              css({
                px: '4',
                py: '2',
                bg: 'white',
                color: 'gray.700',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                _hover: { bg: 'gray.50' },
              })
            "
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            :class="
              css({
                px: '4',
                py: '2',
                bg: 'red.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                _hover: { bg: 'red.600' },
              })
            "
            @click="deleteComment"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
