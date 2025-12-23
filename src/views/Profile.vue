<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { bookApi } from '@/services/bookApi'
import { userApi } from '@/services/userApi'
import { getConversations } from '@/services/conversationApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { trackProfileViewed } = useAnalytics()
const authStore = useAuthStore()
const { success: showSuccessToast, error: showErrorToast } = useToast()

// User profile data
const userProfile = ref({
  id: '',
  username: '',
  bio: '',
  avatarUrl: '👤',
  joinedAt: '',
})

const isFollowing = ref(false)

// GA4: 프로필 조회 추적 & Data Fetching
onMounted(async () => {
  const username = Array.isArray(route.params.username)
    ? route.params.username[0]
    : route.params.username || 'johndoe'

  const isOwnProfile = authStore.user?.username === username
  trackProfileViewed(username, isOwnProfile)

  try {
    // 1. Fetch User Profile
    console.log('[Profile] Fetching user profile for:', username)
    const user = await userApi.getUserProfile(username)
    console.log('[Profile] User profile fetched:', user.id)
    userProfile.value = {
      id: user.id,
      username: user.username,
      bio: user.bio || 'No bio available.',
      avatarUrl: '👤',
      joinedAt: 'January 2024', // Placeholder
    }

    // 2. Fetch Lists using userId
    const userId = user.id

    // Check if following
    if (authStore.user && authStore.user.id !== userId) {
      try {
        console.log('[Profile] Checking following status')
        const myFollowing = await userApi.getFollowing(authStore.user.id)
        isFollowing.value = myFollowing.some((u: any) => u.id === userId)
      } catch (e) {
        console.error('Failed to check following status', e)
      }
    }

    // Liked Books - fetch first page only
    console.log('[Profile] Fetching liked books')
    const booksResponse = await bookApi.getLikedBooks(userId, 0, itemsPerPage)
    console.log('[Profile] Liked books fetched')
    totalLikedBooks.value = booksResponse.totalElements || booksResponse.content.length
    allLikedBooks.value = booksResponse.content.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.coverUrl || '📚',
    }))
    likedBooks.value = allLikedBooks.value.slice(0, 3)

    // Liked Conversations
    console.log('[Profile] Fetching liked conversations')
    const likedConversationsResponse = await getConversations({
      userId,
      filter: 'liked',
      size: 100,
    })
    console.log('[Profile] Liked conversations fetched')
    totalLikedConversations.value = likedConversationsResponse.length
    allLikedConversations.value = likedConversationsResponse.map((c: any) => ({
      id: c.id,
      title: c.title,
      book: c.bookTitle || 'Unknown Book',
      character: 'Unknown',
      preview: c.scenarioDescription || 'No description',
      likeCount: c.likeCount || 0,
      timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      cover: '📘',
    }))
    likedConversations.value = allLikedConversations.value.slice(0, 3)

    // Following
    console.log('[Profile] Fetching following')
    const following = await userApi.getFollowing(userId)
    console.log('[Profile] Following fetched:', following.length)
    totalFollowing.value = following.length
    allFollowing.value = following.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: '👤',
    }))

    // Followers
    console.log('[Profile] Fetching followers')
    const followers = await userApi.getFollowers(userId)
    console.log('[Profile] Followers fetched:', followers.length)
    totalFollowers.value = followers.length
    allFollowers.value = followers.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: '👤',
    }))

    // My Conversations
    console.log('[Profile] Fetching my conversations')
    const conversations = await getConversations({ userId, size: 100 })
    console.log('[Profile] My conversations fetched')
    totalMyConversations.value = conversations.length
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

// Liked conversations
const likedConversations = ref<
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
const showLikedConversationsModal = ref(false)
const showFollowingModal = ref(false)
const showFollowersModal = ref(false)
const showMyConversationsModal = ref(false)
const showEditBioModal = ref(false)

// Edit bio state
const editingBio = ref('')
const isSavingBio = ref(false)

// Delete confirmation modal state
const showDeleteConfirm = ref(false)
const deleteTarget = ref<{ type: string; id: string | number; title?: string } | null>(null)

// Pagination states
const likedBooksPage = ref(1)
const likedConversationsPage = ref(1)
const followingPage = ref(1)
const followersPage = ref(1)
const myConversationsPage = ref(1)
const itemsPerPage = 12

// Loading states for pagination
const isLoadingLikedBooks = ref(false)
const isLoadingLikedConversations = ref(false)
const isLoadingFollowing = ref(false)
const isLoadingFollowers = ref(false)
const isLoadingMyConversations = ref(false)

// Total counts for pagination
const totalLikedBooks = ref(0)
const totalLikedConversations = ref(0)
const totalFollowing = ref(0)
const totalFollowers = ref(0)
const totalMyConversations = ref(0)

// Data for modals
const allLikedBooks = ref<
  Array<{ id: string | number; title: string; author: string; cover: string }>
>([])

const allLikedConversations = ref<
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

const toggleProfileFollow = async () => {
  if (!authStore.user) {
    showErrorToast(t('profile.loginRequired'))
    return
  }

  const userId = userProfile.value.id
  try {
    if (isFollowing.value) {
      await userApi.unfollowUser(userId)
      isFollowing.value = false
    } else {
      await userApi.followUser(userId)
      isFollowing.value = true
    }
  } catch (error) {
    console.error('Failed to toggle follow', error)
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

const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) return

  const { type, id } = deleteTarget.value

  try {
    if (type === 'likedBook') {
      await handleUnlikeBook(id)
      showSuccessToast(t('profile.unlikeSuccess'))
    } else if (type === 'following') {
      await handleUnfollowUser(String(id))
      showSuccessToast(t('profile.unfollowSuccess'))
    } else if (type === 'myConversation') {
      // Import deleteConversation API
      const { deleteConversation } = await import('@/services/conversationApi')
      await deleteConversation(String(id))
      const index = allMyConversations.value.findIndex((conv) => conv.id === id)
      if (index > -1) {
        allMyConversations.value.splice(index, 1)
        // Update displayed myConversations slice
        myConversations.value = allMyConversations.value.slice(0, 3)
      }
      showSuccessToast(t('profile.deleteSuccess'))
      console.log('[Profile] Deleted conversation:', id)
    }
  } catch (error) {
    console.error('[Profile] Failed to delete:', error)
    showErrorToast(t('profile.deleteFailed'))
  } finally {
    showDeleteConfirm.value = false
    deleteTarget.value = null
  }
}

const closeModal = (): void => {
  showLikedBooksModal.value = false
  showLikedConversationsModal.value = false
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

// Load more data from backend when page changes
const loadLikedBooksPage = async (page: number) => {
  if (isLoadingLikedBooks.value || page === likedBooksPage.value) return

  isLoadingLikedBooks.value = true
  try {
    // Fetch data from backend with pagination
    const response = await bookApi.getLikedBooks(userProfile.value.id, page - 1, itemsPerPage)
    const newBooks = response.content.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.coverUrl || '📚',
    }))

    // Merge with existing data
    const existingIds = new Set(allLikedBooks.value.map((b) => b.id))
    const uniqueNewBooks = newBooks.filter((b: any) => !existingIds.has(b.id))
    allLikedBooks.value = [...allLikedBooks.value, ...uniqueNewBooks]

    totalLikedBooks.value = response.totalElements || response.content.length
    likedBooksPage.value = page
  } catch (error) {
    console.error('Failed to load liked books:', error)
  } finally {
    isLoadingLikedBooks.value = false
  }
}

const loadLikedConversationsPage = async (page: number) => {
  if (isLoadingLikedConversations.value || page === likedConversationsPage.value) return

  isLoadingLikedConversations.value = true
  try {
    const neededItems = page * itemsPerPage
    if (allLikedConversations.value.length < neededItems) {
      const conversations = await getConversations({
        userId: userProfile.value.id,
        filter: 'liked',
        size: 100,
      })
      allLikedConversations.value = conversations.map((c: any) => ({
        id: c.id,
        title: c.title,
        book: c.bookTitle || 'Unknown Book',
        character: 'Unknown',
        preview: c.scenarioDescription || 'No description',
        likeCount: c.likeCount || 0,
        timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        cover: '📘',
      }))
      totalLikedConversations.value = conversations.length
    }
    likedConversationsPage.value = page
  } catch (error) {
    console.error('Failed to load liked conversations:', error)
  } finally {
    isLoadingLikedConversations.value = false
  }
}

const loadFollowingPage = async (page: number) => {
  if (isLoadingFollowing.value || page === followingPage.value) return

  isLoadingFollowing.value = true
  try {
    const neededItems = page * itemsPerPage
    if (allFollowing.value.length < neededItems) {
      const following = await userApi.getFollowing(userProfile.value.id)
      allFollowing.value = following.map((u: any) => ({
        id: u.id,
        username: u.username,
        avatar: '👤',
      }))
      totalFollowing.value = following.length
    }
    followingPage.value = page
  } catch (error) {
    console.error('Failed to load following:', error)
  } finally {
    isLoadingFollowing.value = false
  }
}

const loadFollowersPage = async (page: number) => {
  if (isLoadingFollowers.value || page === followersPage.value) return

  isLoadingFollowers.value = true
  try {
    const neededItems = page * itemsPerPage
    if (allFollowers.value.length < neededItems) {
      const followers = await userApi.getFollowers(userProfile.value.id)
      allFollowers.value = followers.map((u: any) => ({
        id: u.id,
        username: u.username,
        avatar: '👤',
      }))
      totalFollowers.value = followers.length
    }
    followersPage.value = page
  } catch (error) {
    console.error('Failed to load followers:', error)
  } finally {
    isLoadingFollowers.value = false
  }
}

const loadMyConversationsPage = async (page: number) => {
  if (isLoadingMyConversations.value || page === myConversationsPage.value) return

  isLoadingMyConversations.value = true
  try {
    const neededItems = page * itemsPerPage
    if (allMyConversations.value.length < neededItems) {
      const conversations = await getConversations({
        userId: userProfile.value.id,
        size: 100,
      })
      allMyConversations.value = conversations.map((c: any) => ({
        id: c.id,
        title: c.title,
        book: 'Unknown Book',
        character: 'Unknown',
        preview: 'No preview',
        likeCount: c.likeCount || 0,
        timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        cover: '📘',
      }))
      totalMyConversations.value = conversations.length
    }
    myConversationsPage.value = page
  } catch (error) {
    console.error('Failed to load my conversations:', error)
  } finally {
    isLoadingMyConversations.value = false
  }
}

const openEditBioModal = () => {
  editingBio.value = userProfile.value.bio
  showEditBioModal.value = true
}

const closeEditBioModal = () => {
  showEditBioModal.value = false
  editingBio.value = ''
}

const saveBio = async () => {
  if (!authStore.user) return

  try {
    isSavingBio.value = true
    // Use authStore.user.id to ensure it matches the X-User-Id header
    await userApi.updateProfile(authStore.user.id, { bio: editingBio.value })
    userProfile.value.bio = editingBio.value
    showSuccessToast(t('profile.bioUpdateSuccess'))
    closeEditBioModal()
  } catch (error) {
    console.error('Failed to update bio:', error)
    showErrorToast(t('profile.bioUpdateFailed'))
  } finally {
    isSavingBio.value = false
  }
}
</script>

<template>
  <div :class="css({ display: 'flex', flexDirection: 'column', minH: '100vh', bg: 'gray.50' })">
    <AppHeader />

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
            {{ t('nav.profile') }}
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

          <!-- Edit Profile Button (only for own profile) -->
          <button
            v-if="authStore.user && authStore.user.username === userProfile.username"
            :class="
              css({
                mt: '4',
                px: '6',
                py: '2',
                borderRadius: 'full',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: 'green.600',
                color: 'white',
                border: 'none',
                _hover: {
                  bg: 'green.700',
                },
              })
            "
            @click="openEditBioModal"
          >
            {{ t('profile.editProfile') }}
          </button>

          <!-- Follow Button -->
          <button
            v-if="authStore.user && authStore.user.username !== userProfile.username"
            :class="
              css({
                mt: '4',
                px: '6',
                py: '2',
                borderRadius: 'full',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: isFollowing ? 'gray.100' : 'green.600',
                color: isFollowing ? 'gray.700' : 'white',
                _hover: {
                  bg: isFollowing ? 'gray.200' : 'green.700',
                },
              })
            "
            @click="toggleProfileFollow"
          >
            {{ isFollowing ? t('profile.unfollow') : t('profile.follow') }}
          </button>
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
                {{ t('profile.likedBooks') }}
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
                {{ t('profile.viewAll') }}
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

          <!-- Like Conversation List -->
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
                {{ t('profile.likedConversations') }}
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
                @click="showLikedConversationsModal = true"
              >
                {{ t('profile.viewAll') }}
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '4', overflowX: 'auto', pb: '2' })">
              <div
                v-for="conv in likedConversations"
                :key="conv.id"
                :class="
                  css({
                    minW: '48',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '4',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: { bg: 'gray.200' },
                  })
                "
                @click="goToConversation(conv.id)"
              >
                <div :class="css({ fontSize: '2rem', mb: '2', textAlign: 'center' })">
                  {{ conv.cover }}
                </div>
                <p
                  :class="
                    css({
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'gray.900',
                      mb: '1',
                      lineClamp: 1,
                    })
                  "
                >
                  {{ conv.title }}
                </p>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.600', lineClamp: 1 })">
                  {{ conv.book }}
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
                {{ t('profile.following') }}
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
                {{ t('profile.viewAll') }}
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
                {{ t('profile.followers') }}
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
                @click="showFollowersModal = true"
              >
                {{ t('profile.viewAll') }}
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
            {{ t('profile.myConversations') }}
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
            {{ t('profile.viewAll') }}
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
            @click="loadLikedBooksPage(page)"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Liked Conversations Modal -->
    <div
      v-if="showLikedConversationsModal"
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
            All Liked Conversations
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
            @click="showLikedConversationsModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })">
            <div
              v-for="conv in getPaginatedItems(allLikedConversations, likedConversationsPage)"
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
            v-for="page in getTotalPages(allLikedConversations.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: likedConversationsPage === page ? 'green.500' : 'gray.200',
                color: likedConversationsPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="loadLikedConversationsPage(page)"
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
            @click="loadFollowingPage(page)"
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
            All Followers
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
            @click="loadFollowersPage(page)"
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
            {{ t('profile.allMyConversations') }}
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
            @click="loadMyConversationsPage(page)"
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
              ? t('profile.unfollowUser')
              : deleteTarget?.type === 'likedBook'
                ? t('profile.unlikeBook')
                : t('profile.deleteConfirmation')
          }}
        </h3>
        <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2', textAlign: 'center' })">
          {{
            deleteTarget?.type === 'following'
              ? t('profile.unfollowMessage')
              : deleteTarget?.type === 'likedBook'
                ? t('profile.unlikeMessage')
                : t('profile.deleteMessage')
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
            {{ t('profile.cancel') }}
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
            {{
              deleteTarget?.type === 'following'
                ? t('profile.unfollow')
                : deleteTarget?.type === 'likedBook'
                  ? t('profile.unlike')
                  : t('profile.delete')
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Bio Modal -->
    <div
      v-if="showEditBioModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          p: '4',
        })
      "
      @click.self="closeEditBioModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            maxW: '500px',
            w: 'full',
            p: '6',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
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
          <h2 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            {{ t('profile.editProfile') }}
          </h2>
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
            aria-label="Close"
            @click="closeEditBioModal"
          >
            ×
          </button>
        </div>

        <div :class="css({ mb: '4' })">
          <label
            for="bio-textarea"
            :class="
              css({
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'gray.700',
                mb: '2',
              })
            "
          >
            {{ t('profile.bio') }}
          </label>
          <textarea
            id="bio-textarea"
            v-model="editingBio"
            :placeholder="t('profile.bioPlaceholder')"
            :class="
              css({
                w: 'full',
                px: '4',
                py: '3',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                minH: '120px',
                _focus: {
                  outline: 'none',
                  borderColor: 'green.500',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                },
              })
            "
            maxlength="500"
          />
          <p :class="css({ fontSize: '0.75rem', color: 'gray.500', mt: '1', textAlign: 'right' })">
            {{ editingBio.length }} / 500
          </p>
        </div>

        <div :class="css({ display: 'flex', gap: '3', justifyContent: 'flex-end' })">
          <button
            :class="
              css({
                px: '4',
                py: '2',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                bg: 'gray.100',
                color: 'gray.700',
                border: 'none',
                _hover: { bg: 'gray.200' },
              })
            "
            @click="closeEditBioModal"
          >
            {{ t('profile.cancel') }}
          </button>
          <button
            :disabled="isSavingBio"
            :class="
              css({
                px: '4',
                py: '2',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSavingBio ? 'not-allowed' : 'pointer',
                bg: 'green.600',
                color: 'white',
                border: 'none',
                opacity: isSavingBio ? 0.6 : 1,
                _hover: { bg: isSavingBio ? 'green.600' : 'green.700' },
              })
            "
            @click="saveBio"
          >
            {{ isSavingBio ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
