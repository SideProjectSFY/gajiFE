<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { css } from '../../../styled-system/css'

interface Props {
  userId: string
  username: string
}

interface Emits {
  (e: 'follow-change', data: { isFollowing: boolean; followerCount: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isFollowing = ref(false)
const isMutual = ref(false)
const isLoading = ref(false)
const showUnfollowModal = ref(false)

onMounted(async () => {
  await checkFollowStatus()
})

const checkFollowStatus = async (): Promise<void> => {
  try {
    const response = await api.get(`/users/${props.userId}/is-following`)
    isFollowing.value = response.data.isFollowing
    isMutual.value = response.data.isMutual
  } catch (error) {
    console.error('Failed to check follow status:', error)
  }
}

const handleFollow = async (): Promise<void> => {
  // Optimistic update
  isFollowing.value = true
  isLoading.value = true

  try {
    const response = await api.post(`/users/${props.userId}/follow`)

    // Update from server response
    isFollowing.value = response.data.isFollowing
    isMutual.value = response.data.isMutual

    emit('follow-change', {
      isFollowing: true,
      followerCount: response.data.followerCount,
    })

    showToast(`You are now following @${props.username}`)
  } catch (error) {
    // Rollback on error
    isFollowing.value = false
    console.error('Failed to follow user:', error)
    showError('Failed to follow user')
  } finally {
    isLoading.value = false
  }
}

const handleUnfollow = async (): Promise<void> => {
  showUnfollowModal.value = false

  // Optimistic update
  isFollowing.value = false
  isMutual.value = false
  isLoading.value = true

  try {
    const response = await api.delete(`/users/${props.userId}/unfollow`)

    emit('follow-change', {
      isFollowing: false,
      followerCount: response.data.followerCount,
    })

    showToast(`Unfollowed @${props.username}`)
  } catch (error) {
    // Rollback on error
    isFollowing.value = true
    console.error('Failed to unfollow user:', error)
    showError('Failed to unfollow user')
  } finally {
    isLoading.value = false
  }
}

const showToast = (message: string): void => {
  // TODO: Implement toast notification system
  console.log('Toast:', message)
}

const showError = (message: string): void => {
  // TODO: Implement error notification system
  console.error('Error:', message)
}

// Static style definitions
const styles = {
  wrapper: css({
    position: 'relative',
  }),
  btnFollow: css({
    background: 'primary.500',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1.5rem',
    borderRadius: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    _hover: {
      background: 'primary.600',
    },
    _disabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  }),
  btnFollowing: css({
    background: 'white',
    color: 'primary.500',
    border: '2px solid',
    borderColor: 'primary.500',
    padding: '0.5rem 1.5rem',
    borderRadius: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _hover: {
      background: 'neutral.50',
    },
    _disabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  }),
  mutualBadge: css({
    marginRight: '0.5rem',
    fontSize: '14px',
  }),
  modalOverlay: css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }),
  modal: css({
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  }),
  modalTitle: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  }),
  modalText: css({
    color: 'neutral.600',
    marginBottom: '1.5rem',
  }),
  modalActions: css({
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  }),
  btnDanger: css({
    padding: '0.5rem 1.5rem',
    background: 'red.500',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    _hover: {
      background: 'red.600',
    },
  }),
  btnSecondary: css({
    padding: '0.5rem 1.5rem',
    background: 'neutral.200',
    color: 'neutral.700',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    _hover: {
      background: 'neutral.300',
    },
  }),
}
</script>

<template>
  <div :class="styles.wrapper">
    <button
      v-if="!isFollowing"
      :disabled="isLoading"
      :class="styles.btnFollow"
      @click="handleFollow"
    >
      {{ isLoading ? 'Following...' : 'Follow' }}
    </button>

    <button
      v-else
      :disabled="isLoading"
      :class="styles.btnFollowing"
      @click="showUnfollowModal = true"
    >
      <span
        v-if="isMutual"
        :class="styles.mutualBadge"
      >↔</span>
      Following
    </button>

    <!-- Unfollow Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showUnfollowModal"
        :class="styles.modalOverlay"
        @click="showUnfollowModal = false"
      >
        <div
          :class="styles.modal"
          @click.stop
        >
          <h3 :class="styles.modalTitle">
            Unfollow @{{ username }}?
          </h3>
          <p :class="styles.modalText">
            You will no longer see their scenarios in your feed.
          </p>
          <div :class="styles.modalActions">
            <button
              :class="styles.btnDanger"
              @click="handleUnfollow"
            >
              Unfollow
            </button>
            <button
              :class="styles.btnSecondary"
              @click="showUnfollowModal = false"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
