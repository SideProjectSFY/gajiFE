<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useAuthStore } from '@/stores/auth'
import { bookApi } from '@/services/bookApi'
import { userApi } from '@/services/userApi'
import { getConversations } from '@/services/conversationApi'

const route = useRoute()
const router = useRouter()
const { trackProfileViewed } = useAnalytics()
const authStore = useAuthStore()

// User profile data
const userProfile = ref({
  id: '',
  username: '',
  bio: '',
  avatarUrl: '👤',
  joinedAt: '',
})

// GA4: 프로필 조회 추적 & Data Fetching
onMounted(async () => {
  const username = Array.isArray(route.params.username)
    ? route.params.username[0]
    : route.params.username || 'johndoe'

  const isOwnProfile = authStore.user?.username === username
  trackProfileViewed(username, isOwnProfile)

  try {
    // 1. Fetch User Profile
    const user = await userApi.getUserProfile(username)
    userProfile.value = {
      id: user.id,
      username: user.username,
      bio: user.bio || 'No bio available.',
      avatarUrl: user.avatarUrl || '👤',
      joinedAt: 'January 2024', // Placeholder
    }

    // 2. Fetch Lists using userId
    const userId = user.id

    // Liked Books
    const booksResponse = await bookApi.getLikedBooks(userId)
    allLikedBooks.value = booksResponse.content.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.coverUrl || '📚',
    }))
    likedBooks.value = allLikedBooks.value.slice(0, 3)

    // Following
    const following = await userApi.getFollowing(userId)
    allFollowing.value = following.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatarUrl || '👤',
    }))

    // Followers
    const followers = await userApi.getFollowers(userId)
    allFollowers.value = followers.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatarUrl || '👤',
    }))

    // My Conversations
    const conversations = await getConversations({ userId })
    allMyConversations.value = conversations.map((c: any) => ({
      id: c.id,
      title: c.title,
      book: 'Unknown Book', // Placeholder
      character: 'Unknown', // Placeholder
      preview: 'No preview', // Placeholder
      likeCount: c.likeCount || 0,
      timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      cover: '📘',
    }))
    myConversations.value = allMyConversations.value.slice(0, 3)
  } catch (error) {
    console.error('Failed to load profile data:', error)
  }
})

// Liked books
const likedBooks = ref<
  Array<{ id: string | number; title: string; author: string; cover: string }>
>([])

// My conversations
const myConversations = ref<
  Array<{
    id: string | number
    title: string
    book: string
    character: string
    preview: string
    likeCount: number
    timestamp: string
    cover: string
  }>
>([])

// Modal states
const showLikedBooksModal = ref(false)
const showFollowingModal = ref(false)
const showFollowersModal = ref(false)
const showMyConversationsModal = ref(false)

// Delete confirmation modal state
const showDeleteConfirm = ref(false)
const deleteTarget = ref<{ type: string; id: string | number; title?: string } | null>(null)

// Pagination states
const likedBooksPage = ref(1)
const followingPage = ref(1)
const followersPage = ref(1)
const myConversationsPage = ref(1)
const itemsPerPage = 12

// Data for modals
const allLikedBooks = ref<
  Array<{ id: string | number; title: string; author: string; cover: string }>
>([])

const allFollowing = ref<Array<{ id: string; username: string; avatar: string }>>([])

const allFollowers = ref<Array<{ id: string; username: string; avatar: string }>>([])

const allMyConversations = ref<
  Array<{
    id: string | number
    title: string
    book: string
    character: string
    preview: string
    likeCount: number
    timestamp: string
    cover: string
  }>
>([])

const goToConversation = (id: string | number): void => {
  router.push(`/conversations/${id}`)
}

const requestDelete = (type: string, id: string | number, title?: string): void => {
  deleteTarget.value = { type, id, title }
  showDeleteConfirm.value = true
}

// API integration functions
const handleLikeBook = async (bookId: string | number): Promise<void> => {
  try {
    await bookApi.likeBook(String(bookId))
    console.log(`Book ${bookId} liked`)
  } catch (error) {
    console.error('Failed to like book:', error)
    throw error
  }
}

const handleUnlikeBook = async (bookId: string | number): Promise<void> => {
  try {
    await bookApi.unlikeBook(String(bookId))
    const index = allLikedBooks.value.findIndex((book) => book.id === bookId)
    if (index > -1) allLikedBooks.value.splice(index, 1)
    console.log(`Book ${bookId} unliked`)
  } catch (error) {
    console.error('Failed to unlike book:', error)
    throw error
  }
}

const handleFollowUser = async (userId: string): Promise<void> => {
  try {
    await userApi.followUser(userId)
    console.log(`User ${userId} followed`)
  } catch (error) {
    console.error('Failed to follow user:', error)
    throw error
  }
}

const handleUnfollowUser = async (userId: string): Promise<void> => {
  try {
    await userApi.unfollowUser(userId)
    const index = allFollowing.value.findIndex((user) => user.id === userId)
    if (index > -1) allFollowing.value.splice(index, 1)
    console.log(`User ${userId} unfollowed`)
  } catch (error) {
    console.error('Failed to unfollow user:', error)
    throw error
  }
}

const confirmDelete = (): void => {
  if (!deleteTarget.value) return

  const { type, id } = deleteTarget.value

  if (type === 'likedBook') {
    handleUnlikeBook(id)
  } else if (type === 'following') {
    handleUnfollowUser(String(id))
  } else if (type === 'myConversation') {
    const index = allMyConversations.value.findIndex((conv) => conv.id === id)
    if (index > -1) allMyConversations.value.splice(index, 1)
  }

  showDeleteConfirm.value = false
  deleteTarget.value = null
}

const closeModal = (): void => {
  showLikedBooksModal.value = false
  showFollowingModal.value = false
  showFollowersModal.value = false
  showMyConversationsModal.value = false
}

const cancelDelete = (): void => {
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

// Pagination helpers
interface PaginatedItem {
  id: string | number
  [key: string]: unknown
}

const getPaginatedItems = (items: PaginatedItem[], page: number): PaginatedItem[] => {
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  return items.slice(start, end)
}

const getTotalPages = (totalItems: number): number => {
  return Math.ceil(totalItems / itemsPerPage)
}
</script>

<template>
  <div :class="css({ display: 'flex', flexDirection: 'column', minH: '100vh', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <!-- Main Content -->
    <main
      :class="css({ flex: 1, maxW: '1400px', w: 'full', mx: 'auto', px: '6', py: '8' })"
      aria-label="프로필 페이지"
    >
      <!-- Top Section: Profile + Like Lists -->
      <div
        :class="
          css({
            display: 'grid',
            gridTemplateColumns: { base: '1fr', lg: '1fr 2fr' },
            gap: '6',
            mb: '8',
          })
        "
      >
        <!-- Profile Card -->
        <section
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              p: '6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            })
          "
          aria-labelledby="profile-heading"
        >
          <h2
            id="profile-heading"
            :class="
              css({
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '6',
                alignSelf: 'flex-start',
              })
            "
          >
            Profile
          </h2>

          <!-- Avatar -->
          <div
            :class="
              css({
                w: '32',
                h: '32',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                mb: '6',
              })
            "
          >
            {{ userProfile.avatarUrl }}
          </div>

          <!-- Info Section -->
          <div
            :class="
              css({
                w: 'full',
                bg: 'gray.100',
                borderRadius: '0.5rem',
                p: '4',
                textAlign: 'center',
              })
            "
          >
            <p :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '2' })">
              @{{ userProfile.username }}
            </p>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.5' })">
              {{ userProfile.bio }}
            </p>
          </div>
        </section>

        <!-- Like Lists Container -->
        <div :class="css({ display: 'flex', flexDirection: 'column', gap: '6' })">
          <!-- Like Book List -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              })
            "
          >
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '4',
                })
              "
            >
              <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
                Like Book List
              </h2>
              <button
                :class="
                  css({
                    px: '3',
                    py: '1.5',
                    bg: 'green.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    _hover: { bg: 'green.600' },
                  })
                "
                @click="showLikedBooksModal = true"
              >
                View All
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '4', overflowX: 'auto', pb: '2' })">
              <div
                v-for="book in likedBooks"
                :key="book.id"
                :class="
                  css({
                    minW: '32',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '4',
                    textAlign: 'center',

                    pointerEvents: 'none',
                  })
                "
              >
                <div :class="css({ fontSize: '3rem', mb: '2' })">
                  {{ book.cover }}
                </div>
                <p :class="css({ fontSize: '0.875rem', fontWeight: '600', color: 'gray.900' })">
                  {{ book.title }}
                </p>
              </div>
            </div>
          </div>

          <!-- Following List -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              })
            "
          >
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '4',
                })
              "
            >
              <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
                Following List
              </h2>
              <button
                :class="
                  css({
                    px: '3',
                    py: '1.5',
                    bg: 'green.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    _hover: { bg: 'green.600' },
                  })
                "
                @click="showFollowingModal = true"
              >
                View All
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '3', overflowX: 'auto', pb: '2' })">
              <div
                v-for="user in allFollowing.slice(0, 5)"
                :key="user.id"
                :class="
                  css({
                    minW: '20',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '3',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  })
                "
              >
                <div :class="css({ fontSize: '2rem', mb: '1' })">
                  {{ user.avatar }}
                </div>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">
                  {{ user.username }}
                </p>
              </div>
            </div>
          </div>

          <!-- Follower List (New) -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              })
            "
          >
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '4',
                })
              "
            >
              <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
                Follower List
              </h2>
              <button
                :class="
                  css({
                    px: '3',
                    py: '1.5',
                    bg: 'gray.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    _hover: { bg: 'gray.600' },
                  })
                "
                @click="showFollowersModal = true"
              >
                View All
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '3', overflowX: 'auto', pb: '2' })">
              <div
                v-for="follower in allFollowers.slice(0, 5)"
                :key="follower.id"
                :class="
                  css({
                    minW: '20',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '3',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  })
                "
              >
                <div :class="css({ fontSize: '2rem', mb: '1' })">
                  {{ follower.avatar }}
                </div>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">
                  {{ follower.username }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- My Conversations -->
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          })
        "
      >
        <div
          :class="
            css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '4' })
          "
        >
          <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
            My Conversations
          </h2>
          <button
            :class="
              css({
                px: '4',
                py: '2',
                bg: 'green.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'green.600' },
              })
            "
            @click="showMyConversationsModal = true"
          >
            View All Conversations
          </button>
        </div>

        <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })">
          <div
            v-for="conv in myConversations"
            :key="conv.id"
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
                cursor: 'pointer',
                _hover: { borderColor: 'green.500', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' },
              })
            "
            @click="goToConversation(conv.id)"
          >
            <div :class="css({ display: 'flex', gap: '3', mb: '3' })">
              <div
                :class="
                  css({
                    w: '16',
                    h: '20',
                    bg: 'gray.200',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                  })
                "
              >
                {{ conv.cover }}
              </div>
              <div :class="css({ flex: 1, minW: 0 })">
                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      mb: '1',
                    })
                  "
                >
                  <span
                    :class="
                      css({
                        w: '2',
                        h: '2',
                        bg: 'green.500',
                        borderRadius: 'full',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{
                    conv.character
                  }}</span>
                </div>
                <h3
                  :class="
                    css({
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'gray.900',
                      mb: '1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    })
                  "
                >
                  {{ conv.title }}
                </h3>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">
                  {{ conv.book }}
                </p>
              </div>
            </div>

            <p
              :class="
                css({
                  fontSize: '0.875rem',
                  color: 'gray.700',
                  lineHeight: '1.5',
                  mb: '3',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                })
              "
            >
              {{ conv.preview }}
            </p>

            <div
              :class="
                css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
              "
            >
              <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })"
                >♥ {{ conv.likeCount }}</span
              >
              <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })">{{
                conv.timestamp
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <!-- Liked Books Modal -->
    <div
      v-if="showLikedBooksModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '4xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Liked Books
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showLikedBooksModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4' })">
            <div
              v-for="book in getPaginatedItems(allLikedBooks, likedBooksPage)"
              :key="book.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  p: '4',
                  textAlign: 'center',
                  cursor: 'pointer',
                  _hover: { bg: 'gray.200' },
                })
              "
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '2',
                    right: '2',
                    w: '8',
                    h: '8',
                    bg: 'red.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'red.600' },
                  })
                "
                title="Unlike this book"
                @click.stop="requestDelete('likedBook', book.id, book.title)"
              >
                ❤️
              </button>
              <div :class="css({ fontSize: '4rem', mb: '2' })">
                {{ book.cover }}
              </div>
              <p :class="css({ fontSize: '0.875rem', fontWeight: '600', color: 'gray.900' })">
                {{ book.title }}
              </p>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">
                {{ book.author }}
              </p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allLikedBooks.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: likedBooksPage === page ? 'green.500' : 'gray.200',
                color: likedBooksPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="likedBooksPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Following Modal -->
    <div
      v-if="showFollowingModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '4xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Following
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showFollowingModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4' })">
            <div
              v-for="user in getPaginatedItems(allFollowing, followingPage)"
              :key="user.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  p: '3',
                  textAlign: 'center',
                  cursor: 'pointer',
                  _hover: { bg: 'gray.200' },
                })
              "
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '1',
                    right: '1',
                    w: '6',
                    h: '6',
                    bg: 'blue.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'blue.600' },
                  })
                "
                title="Unfollow this user"
                @click.stop="requestDelete('following', String(user.id), user.username)"
              >
                ✓
              </button>
              <div :class="css({ fontSize: '2.5rem', mb: '1' })">
                {{ user.avatar }}
              </div>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">
                {{ user.username }}
              </p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allFollowing.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: followingPage === page ? 'green.500' : 'gray.200',
                color: followingPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="followingPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Followers Modal (Read-only) -->
    <div
      v-if="showFollowersModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '5xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Followers (Read-only)
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showFollowersModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4' })">
            <div
              v-for="follower in getPaginatedItems(allFollowers, followersPage)"
              :key="follower.id"
              :class="
                css({
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  p: '3',
                  textAlign: 'center',
                  cursor: 'default',
                  opacity: 0.8,
                })
              "
            >
              <div :class="css({ fontSize: '2.5rem', mb: '1' })">
                {{ follower.avatar }}
              </div>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">
                {{ follower.username }}
              </p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allFollowers.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: followersPage === page ? 'gray.500' : 'gray.200',
                color: followersPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="followersPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- My Conversations Modal -->
    <div
      v-if="showMyConversationsModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '6xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All My Conversations
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showMyConversationsModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })">
            <div
              v-for="conv in getPaginatedItems(allMyConversations, myConversationsPage)"
              :key="conv.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'white',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: '0.5rem',
                  p: '4',
                  cursor: 'pointer',
                  _hover: { borderColor: 'green.500', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' },
                })
              "
              @click="goToConversation(conv.id)"
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '2',
                    right: '2',
                    w: '8',
                    h: '8',
                    bg: 'red.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'red.600' },
                  })
                "
                title="Delete this conversation"
                @click.stop="requestDelete('myConversation', String(conv.id), String(conv.title))"
              >
                🗑️
              </button>
              <div :class="css({ display: 'flex', gap: '3', mb: '3' })">
                <div
                  :class="
                    css({
                      w: '16',
                      h: '20',
                      bg: 'gray.200',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    })
                  "
                >
                  {{ conv.cover }}
                </div>
                <div :class="css({ flex: 1, minW: 0 })">
                  <div
                    :class="
                      css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        mb: '1',
                      })
                    "
                  >
                    <span
                      :class="
                        css({
                          w: '2',
                          h: '2',
                          bg: 'green.500',
                          borderRadius: 'full',
                        })
                      "
                    />
                    <span :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{
                      conv.character
                    }}</span>
                  </div>
                  <h3
                    :class="
                      css({
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'gray.900',
                        mb: '1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      })
                    "
                  >
                    {{ conv.title }}
                  </h3>
                  <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">
                    {{ conv.book }}
                  </p>
                </div>
              </div>

              <p
                :class="
                  css({
                    fontSize: '0.875rem',
                    color: 'gray.700',
                    lineHeight: '1.5',
                    mb: '3',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  })
                "
              >
                {{ conv.preview }}
              </p>

              <div
                :class="
                  css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
                "
              >
                <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })"
                  >♥ {{ conv.likeCount }}</span
                >
                <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })">{{
                  conv.timestamp
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allMyConversations.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: myConversationsPage === page ? 'green.500' : 'gray.200',
                color: myConversationsPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="myConversationsPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '60',
        })
      "
      @click="cancelDelete"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: 'md',
            p: '6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          })
        "
        @click.stop
      >
        <h3
          :class="
            css({
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'gray.900',
              mb: '4',
              textAlign: 'center',
            })
          "
        >
          {{
            deleteTarget?.type === 'following'
              ? 'Unfollow User'
              : deleteTarget?.type === 'likedBook'
                ? 'Unlike Book'
                : 'Delete Confirmation'
          }}
        </h3>
        <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2', textAlign: 'center' })">
          {{
            deleteTarget?.type === 'following'
              ? 'Are you sure you want to unfollow this user?'
              : deleteTarget?.type === 'likedBook'
                ? 'Are you sure you want to unlike this book?'
                : 'Are you sure you want to delete this item?'
          }}
        </p>
        <p
          v-if="deleteTarget?.title"
          :class="
            css({
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'gray.900',
              mb: '6',
              textAlign: 'center',
            })
          "
        >
          "{{ deleteTarget.title }}"
        </p>
        <div :class="css({ display: 'flex', gap: '3', justifyContent: 'center' })">
          <button
            :class="
              css({
                px: '6',
                py: '2.5',
                bg: 'gray.200',
                color: 'gray.700',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'gray.300' },
              })
            "
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            :class="
              css({
                px: '6',
                py: '2.5',
                bg: 'red.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'red.600' },
              })
            "
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
