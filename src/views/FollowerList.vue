<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import FollowButton from '@/components/common/FollowButton.vue'
import { css } from '../../styled-system/css'

interface User {
  id: string
  username: string
  bio?: string
  avatarUrl?: string
}

interface PageResponse {
  content: User[]
  totalElements: number
  totalPages: number
  number: number
}

const route = useRoute()
const authStore = useAuthStore()

const username = ref(route.params.username as string)
const followers = ref<User[]>([])
const totalFollowers = ref(0)
const currentPage = ref(0)
const totalPages = ref(0)
const isLoading = ref(true)

const currentUserId = computed(() => authStore.currentUser?.id)

onMounted(async () => {
  await loadFollowers()
})

const loadFollowers = async (): Promise<void> => {
  isLoading.value = true

  try {
    const response = await api.get<PageResponse>(`/users/${username.value}/followers`, {
      params: { page: currentPage.value, size: 20 },
    })

    followers.value = response.data.content
    totalFollowers.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('Failed to load followers:', error)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number): void => {
  currentPage.value = page
  loadFollowers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Static style definitions
const styles = {
  container: css({
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 1rem',
  }),
  pageHeader: css({
    marginBottom: '2rem',
  }),
  title: css({
    fontSize: '28px',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  }),
  subtitle: css({
    color: 'neutral.600',
  }),
  loadingState: css({
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'neutral.600',
  }),
  emptyState: css({
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'neutral.400',
  }),
  emptyIcon: css({
    fontSize: '48px',
    marginBottom: '1rem',
  }),
  userList: css({
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }),
  userItem: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid',
    borderColor: 'neutral.100',
    _last: {
      borderBottom: 'none',
    },
  }),
  userInfo: css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    textDecoration: 'none',
    color: 'inherit',
    flex: 1,
    _hover: {
      '& h3': {
        color: 'primary.500',
      },
    },
  }),
  avatar: css({
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'gray.200',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  }),
  username: css({
    fontSize: '16px',
    marginBottom: '0.25rem',
    fontWeight: '600',
  }),
  bio: css({
    fontSize: '14px',
    color: 'neutral.600',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  pagination: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
  }),
  pageButton: css({
    padding: '0.5rem 1rem',
    background: 'white',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: '6px',
    cursor: 'pointer',
    _hover: {
      background: 'neutral.50',
    },
    _disabled: {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  }),
  pageButtonActive: css({
    background: 'primary.500',
    color: 'white',
    borderColor: 'primary.500',
    _hover: {
      background: 'primary.600',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.pageHeader">
      <h1 :class="styles.title">
        {{ username }}'s Followers
      </h1>
      <p :class="styles.subtitle">
        {{ totalFollowers }} followers
      </p>
    </div>

    <div
      v-if="isLoading"
      :class="styles.loadingState"
    >
      <div>⏳</div>
      <p>Loading followers...</p>
    </div>

    <div
      v-else-if="followers.length === 0"
      :class="styles.emptyState"
    >
      <div :class="styles.emptyIcon">
        👥
      </div>
      <p>No followers yet</p>
    </div>

    <div
      v-else
      :class="styles.userList"
    >
      <div
        v-for="user in followers"
        :key="user.id"
        :class="styles.userItem"
      >
        <router-link
          :to="`/profile/${user.username}`"
          :class="styles.userInfo"
        >
          <div :class="styles.avatar">
            👤
          </div>
          <div>
            <h3 :class="styles.username">
              {{ user.username }}
            </h3>
            <p :class="styles.bio">
              {{ user.bio || 'No bio' }}
            </p>
          </div>
        </router-link>

        <FollowButton
          v-if="user.id !== currentUserId"
          :user-id="user.id"
          :username="user.username"
        />
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        :class="styles.pagination"
      >
        <button
          :disabled="currentPage === 0"
          :class="styles.pageButton"
          @click="handlePageChange(currentPage - 1)"
        >
          Previous
        </button>

        <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>

        <button
          :disabled="currentPage >= totalPages - 1"
          :class="styles.pageButton"
          @click="handlePageChange(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
