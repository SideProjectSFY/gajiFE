<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { css } from 'styled-system/css'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
import ForkScenarioModal from '@/components/scenario/ForkScenarioModal.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { searchApi } from '@/services/searchApi'
import { userApi } from '@/services/userApi'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()
const { success, error: showErrorToast } = useToast()
const { trackSearch } = useAnalytics()
const searchQuery = ref('')
const activeTab = ref<'all' | 'book' | 'conversation' | 'user'>('all')
const isLoading = ref(false)
const hasSearched = ref(false)
const showForkModal = ref(false)
const selectedScenario = ref<any>(null)
const searchError = ref('')
let searchDebounce: number | undefined

// Pagination state for infinite scroll
const currentBookPage = ref(0)
const currentConversationPage = ref(0)
const currentUserPage = ref(0)
const isLoadingMore = ref(false)
const hasMoreBooks = ref(true)
const hasMoreConversations = ref(true)
const hasMoreUsers = ref(true)

interface SearchResult {
  id: string
  name?: string
  [key: string]: any
}

const searchResults = ref<{
  books: SearchResult[]
  conversations: SearchResult[]
  users: SearchResult[]
}>({
  books: [],
  conversations: [],
  users: [],
})

const filteredResults = computed(() => {
  if (activeTab.value === 'all') {
    return searchResults.value
  }
  if (activeTab.value === 'book') {
    return {
      books: searchResults.value.books,
      conversations: [],
      users: [],
    }
  }
  if (activeTab.value === 'conversation') {
    return {
      books: [],
      conversations: searchResults.value.conversations,
      users: [],
    }
  }
  if (activeTab.value === 'user') {
    return {
      books: [],
      conversations: [],
      users: searchResults.value.users,
    }
  }
  return {
    books: [],
    conversations: [],
    users: [],
  }
})

const hasMore = computed(() => {
  if (activeTab.value === 'all') {
    return hasMoreBooks.value || hasMoreConversations.value || hasMoreUsers.value
  }
  if (activeTab.value === 'book') {
    return hasMoreBooks.value
  }
  if (activeTab.value === 'conversation') {
    return hasMoreConversations.value
  }
  if (activeTab.value === 'user') {
    return hasMoreUsers.value
  }
  return false
})

const totalCount = computed(() => {
  const { books, conversations, users } = filteredResults.value
  return books.length + conversations.length + users.length
})

const bookCount = computed(() => searchResults.value.books.length)
const conversationCount = computed(() => searchResults.value.conversations.length)
const userCount = computed(() => searchResults.value.users.length)

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    hasSearched.value = false
    return
  }

  isLoading.value = true
  hasSearched.value = true
  searchError.value = ''

  // Reset pagination
  currentBookPage.value = 0
  currentConversationPage.value = 0
  currentUserPage.value = 0
  hasMoreBooks.value = true
  hasMoreConversations.value = true
  hasMoreUsers.value = true

  try {
    const response = await searchApi.search(searchQuery.value.trim(), 0, 6)

    // Fetch following list if user is logged in
    let followingIds = new Set<string>()
    if (authStore.user?.id) {
      try {
        const following = await userApi.getFollowing(authStore.user.id)
        following.forEach((u) => followingIds.add(u.id))
      } catch (e) {
        console.error('Failed to fetch following list', e)
      }
    }

    // Update hasMore flags based on response
    hasMoreBooks.value = response.books.length === 6
    hasMoreConversations.value = response.conversations.length === 6
    hasMoreUsers.value = response.users.length === 6

    searchResults.value = {
      books: response.books.map((book: any) => ({
        id: book.id,
        title: book.title,
        subtitle: book.genre,
        author: book.author,
        description: `Scenarios: ${book.scenarioCount}, Conversations: ${book.conversationCount}`,
        trait: book.genre,
        coverImageUrl: book.coverImageUrl,
      })),
      conversations: response.conversations
        .filter((conv: any) => conv.isRoot === true)
        .map((conv: any) => ({
          id: conv.id,
          scenarioId: conv.scenarioId,
          title: conv.title || 'Untitled Conversation',
          description: conv.scenarioDescription || conv.bookTitle || 'No description',
          author: 'Unknown',
          likes: conv.likeCount || 0,
        })),
      users: response.users
        .filter((user: any) => user.id !== authStore.user?.id)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          displayName: user.username,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          isFollowing: followingIds.has(user.id),
        })),
    }

    // GA4: 검색 추적
    const totalResults =
      searchResults.value.books.length +
      searchResults.value.conversations.length +
      searchResults.value.users.length
    trackSearch({
      searchTerm: searchQuery.value.trim(),
      searchType: 'integrated',
      resultsCount: totalResults,
    })
  } catch (error) {
    console.error('Search failed:', error)
    searchError.value = 'Search error: unable to search. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Auto-trigger search when the query changes to surface errors/empty states in tests
watch(searchQuery, (value) => {
  if (searchDebounce !== undefined) {
    window.clearTimeout(searchDebounce)
  }

  if (!value.trim()) {
    hasSearched.value = false
    searchResults.value = { books: [], conversations: [], users: [] }
    return
  }

  searchDebounce = window.setTimeout(() => {
    performSearch()
  }, 300)
})

const handleForkChat = async (scenarioId: string) => {
  if (!authStore.isAuthenticated) {
    showErrorToast(t('searchPage.loginToFork'))
    router.push('/login')
    return
  }

  try {
    const response = await api.get(`/scenarios/${scenarioId}`)
    selectedScenario.value = response.data
    showForkModal.value = true
  } catch (err) {
    console.error('Failed to load scenario for forking:', err)
    showErrorToast(t('searchPage.failedToLoadScenario'))
  }
}

const handleForked = (forkedConversation: { id: string }) => {
  showForkModal.value = false
  success(t('searchPage.scenarioForked'), 3000)
  router.push(`/conversations/${forkedConversation.id}`)
}

const toggleFollow = async (user: any) => {
  if (!authStore.user) {
    alert(t('searchPage.loginToFollow'))
    return
  }

  try {
    if (user.isFollowing) {
      await userApi.unfollowUser(user.id)
      user.isFollowing = false
    } else {
      await userApi.followUser(user.id)
      user.isFollowing = true
    }
  } catch (error) {
    console.error('Failed to toggle follow', error)
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
  }
}

const goToBookDetail = (bookId: string) => {
  router.push(`/books/${bookId}`)
}

// Infinite scroll handler
const handleScroll = () => {
  if (isLoadingMore.value || !hasMore.value) return

  const scrollPosition = window.innerHeight + window.scrollY
  const bottomPosition = document.documentElement.scrollHeight - 200

  if (scrollPosition >= bottomPosition) {
    loadMore()
  }
}

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true

  try {
    if (activeTab.value === 'all') {
      // Load more for all sections in parallel
      const promises = []

      if (hasMoreBooks.value) {
        currentBookPage.value++
        promises.push(searchApi.search(searchQuery.value.trim(), currentBookPage.value, 6))
      }
      if (hasMoreConversations.value) {
        currentConversationPage.value++
        promises.push(searchApi.search(searchQuery.value.trim(), currentConversationPage.value, 6))
      }
      if (hasMoreUsers.value) {
        currentUserPage.value++
        promises.push(searchApi.search(searchQuery.value.trim(), currentUserPage.value, 6))
      }

      const results = await Promise.all(promises)
      let resultIndex = 0

      if (hasMoreBooks.value && results[resultIndex]) {
        const newBooks = results[resultIndex].books
        hasMoreBooks.value = newBooks.length === 6
        searchResults.value.books.push(
          ...newBooks.map((book: any) => ({
            id: book.id,
            title: book.title,
            subtitle: book.genre,
            author: book.author,
            description: `Scenarios: ${book.scenarioCount}, Conversations: ${book.conversationCount}`,
            trait: book.genre,
            coverImageUrl: book.coverImageUrl,
          }))
        )
        resultIndex++
      }

      if (hasMoreConversations.value && results[resultIndex]) {
        const newConversations = results[resultIndex].conversations
        hasMoreConversations.value = newConversations.length === 6
        searchResults.value.conversations.push(
          ...newConversations
            .filter((conv: any) => conv.isRoot === true)
            .map((conv: any) => ({
              id: conv.id,
              scenarioId: conv.scenarioId,
              title: conv.title || 'Untitled Conversation',
              description: conv.scenarioDescription || conv.bookTitle || 'No description',
              author: 'Unknown',
              likes: conv.likeCount || 0,
            }))
        )
        resultIndex++
      }

      if (hasMoreUsers.value && results[resultIndex]) {
        const newUsers = results[resultIndex].users
        hasMoreUsers.value = newUsers.length === 6

        let followingIds = new Set<string>()
        if (authStore.user?.id) {
          try {
            const following = await userApi.getFollowing(authStore.user.id)
            following.forEach((u) => followingIds.add(u.id))
          } catch (e) {
            console.error('Failed to fetch following list', e)
          }
        }

        searchResults.value.users.push(
          ...newUsers
            .filter((user: any) => user.id !== authStore.user?.id)
            .map((user: any) => ({
              id: user.id,
              username: user.username,
              displayName: user.username,
              bio: user.bio,
              avatarUrl: user.avatarUrl,
              isFollowing: followingIds.has(user.id),
            }))
        )
      }
    } else if (activeTab.value === 'book' && hasMoreBooks.value) {
      currentBookPage.value++
      const response = await searchApi.search(searchQuery.value.trim(), currentBookPage.value, 6)
      hasMoreBooks.value = response.books.length === 6
      searchResults.value.books.push(
        ...response.books.map((book: any) => ({
          id: book.id,
          title: book.title,
          subtitle: book.genre,
          author: book.author,
          description: `Scenarios: ${book.scenarioCount}, Conversations: ${book.conversationCount}`,
          trait: book.genre,
          coverImageUrl: book.coverImageUrl,
        }))
      )
    } else if (activeTab.value === 'conversation' && hasMoreConversations.value) {
      currentConversationPage.value++
      const response = await searchApi.search(
        searchQuery.value.trim(),
        currentConversationPage.value,
        6
      )
      hasMoreConversations.value = response.conversations.length === 6
      searchResults.value.conversations.push(
        ...response.conversations
          .filter((conv: any) => conv.isRoot === true)
          .map((conv: any) => ({
            id: conv.id,
            scenarioId: conv.scenarioId,
            title: conv.title || 'Untitled Conversation',
            description: conv.scenarioDescription || conv.bookTitle || 'No description',
            author: 'Unknown',
            likes: conv.likeCount || 0,
          }))
      )
    } else if (activeTab.value === 'user' && hasMoreUsers.value) {
      currentUserPage.value++
      const response = await searchApi.search(searchQuery.value.trim(), currentUserPage.value, 6)
      hasMoreUsers.value = response.users.length === 6

      let followingIds = new Set<string>()
      if (authStore.user?.id) {
        try {
          const following = await userApi.getFollowing(authStore.user.id)
          following.forEach((u) => followingIds.add(u.id))
        } catch (e) {
          console.error('Failed to fetch following list', e)
        }
      }

      searchResults.value.users.push(
        ...response.users
          .filter((user: any) => user.id !== authStore.user?.id)
          .map((user: any) => ({
            id: user.id,
            username: user.username,
            displayName: user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            isFollowing: followingIds.has(user.id),
          }))
      )
    }
  } catch (error) {
    console.error('Failed to load more results:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// Reset pagination when tab changes
const resetPagination = () => {
  currentBookPage.value = 0
  currentConversationPage.value = 0
  currentUserPage.value = 0
  hasMoreBooks.value = true
  hasMoreConversations.value = true
  hasMoreUsers.value = true
}

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      searchQuery.value = newQuery
      performSearch()
    }
  }
)

// When tab changes, just reset the view (results are already loaded)
watch(activeTab, () => {
  // No need to reload data, just let filteredResults compute handle the display
})

onMounted(() => {
  // Check if user is logged in
  if (!authStore.isAuthenticated) {
    showErrorToast(t('searchPage.loginRequired'))
    router.push('/login')
    return
  }

  // URL query parameter에서 검색어 가져오기
  const query = route.query.q as string
  if (query) {
    searchQuery.value = query
    performSearch()
  }

  // Add scroll event listener for infinite scroll
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          bg: 'gray.50',
          pt: '8',
          pb: '16',
        })
      "
    >
      <div
        :class="
          css({
            maxW: '1280px',
            mx: 'auto',
            px: { base: '6', md: '10' },
          })
        "
      >
        <!-- Search Bar -->
        <div
          :class="
            css({
              mb: '8',
            })
          "
        >
          <div
            :class="
              css({
                position: 'relative',
                maxW: '800px',
                mx: 'auto',
              })
            "
          >
            <span
              :class="
                css({
                  position: 'absolute',
                  left: '4',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'gray.400',
                  fontSize: '1.25rem',
                  zIndex: 1,
                })
              "
              >🔍</span
            >
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('searchPage.searchPlaceholder')"
              data-testid="search-input"
              :class="
                css({
                  w: 'full',
                  pl: '12',
                  pr: '4',
                  py: '3.5',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  bg: 'white',
                  transition: 'all 0.2s',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
              @keyup.enter="handleSearch"
            />
            <div
              v-if="searchError"
              :class="css({ mt: '3', color: 'red.600', fontWeight: '600', textAlign: 'center' })"
              data-testid="toast-error"
            >
              {{ searchError }}
            </div>
          </div>
        </div>

        <div
          v-if="hasSearched && !isLoading && !searchError && totalCount === 0"
          :class="css({ textAlign: 'center', color: 'gray.600', fontWeight: '600', mb: '6' })"
          data-testid="empty-state"
        >
          No results found. Try different keywords.
        </div>

        <!-- Tabs -->
        <div
          :class="
            css({
              display: 'flex',
              gap: '8',
              mb: '8',
              pb: '3',
              borderBottom: '2px solid',
              borderColor: 'gray.200',
            })
          "
        >
          <button
            data-testid="tab-all"
            :class="
              css({
                pb: '3',
                bg: 'transparent',
                border: 'none',
                borderBottom: '3px solid',
                borderColor: activeTab === 'all' ? 'green.600' : 'transparent',
                color: activeTab === 'all' ? 'green.600' : 'gray.500',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: '-3px',
                _hover: { color: 'green.600' },
              })
            "
            @click="activeTab = 'all'"
          >
            {{ t('searchPage.tabs.all') }}
          </button>
          <button
            data-testid="tab-book"
            :class="
              css({
                pb: '3',
                bg: 'transparent',
                border: 'none',
                borderBottom: '3px solid',
                borderColor: activeTab === 'book' ? 'green.600' : 'transparent',
                color: activeTab === 'book' ? 'green.600' : 'gray.500',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: '-3px',
                _hover: { color: 'green.600' },
              })
            "
            @click="activeTab = 'book'"
          >
            {{ t('searchPage.tabs.book') }}({{ bookCount }})
          </button>
          <button
            data-testid="tab-conversation"
            :class="
              css({
                pb: '3',
                bg: 'transparent',
                border: 'none',
                borderBottom: '3px solid',
                borderColor: activeTab === 'conversation' ? 'green.600' : 'transparent',
                color: activeTab === 'conversation' ? 'green.600' : 'gray.500',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: '-3px',
                _hover: { color: 'green.600' },
              })
            "
            @click="activeTab = 'conversation'"
          >
            {{ t('searchPage.tabs.conversation') }}({{ conversationCount }}+)
          </button>
          <button
            data-testid="tab-user"
            :class="
              css({
                pb: '3',
                bg: 'transparent',
                border: 'none',
                borderBottom: '3px solid',
                borderColor: activeTab === 'user' ? 'green.600' : 'transparent',
                color: activeTab === 'user' ? 'green.600' : 'gray.500',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: '-3px',
                _hover: { color: 'green.600' },
              })
            "
            @click="activeTab = 'user'"
          >
            {{ t('searchPage.tabs.user') }}({{ userCount }}+)
          </button>
        </div>

        <!-- Loading Skeleton -->
        <div
          v-if="isLoading"
          :class="
            css({
              p: '6',
            })
          "
        >
          <h2
            :class="
              css({
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'green.600',
                mb: '6',
              })
            "
          >
            {{ t('searchPage.sections.book') }}
            <span :class="css({ color: 'gray.400', fontWeight: '400' })">{{
              t('searchPage.loading')
            }}</span>
          </h2>

          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: '6',
                mb: '12',
              })
            "
          >
            <div
              v-for="i in 6"
              :key="i"
              :class="
                css({
                  bg: 'white',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: '0.75rem',
                  p: '6',
                })
              "
            >
              <div
                :class="
                  css({
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '3',
                    mb: '4',
                  })
                "
              >
                <div
                  :class="
                    css({
                      w: '12',
                      h: '12',
                      borderRadius: 'full',
                      bg: 'gray.200',
                      flexShrink: '0',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
                <div :class="css({ flex: '1', minW: '0' })">
                  <div
                    :class="
                      css({
                        h: '4',
                        bg: 'gray.200',
                        borderRadius: '0.25rem',
                        mb: '2',
                        w: '3/4',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      })
                    "
                  />
                  <div
                    :class="
                      css({
                        h: '3',
                        bg: 'gray.200',
                        borderRadius: '0.25rem',
                        mb: '1',
                        w: '2/3',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      })
                    "
                  />
                  <div
                    :class="
                      css({
                        h: '3',
                        bg: 'gray.200',
                        borderRadius: '0.25rem',
                        w: '1/2',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      })
                    "
                  />
                </div>
              </div>
              <div
                :class="
                  css({
                    h: '16',
                    bg: 'gray.200',
                    borderRadius: '0.25rem',
                    mb: '4',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div
                :class="
                  css({
                    h: '8',
                    bg: 'gray.200',
                    borderRadius: '0.375rem',
                    w: '20',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div
          v-else-if="totalCount > 0 && hasSearched"
          data-testid="search-results"
          :class="
            css({
              p: '6',
            })
          "
        >
          <!-- Books -->
          <div v-if="filteredResults.books.length > 0" :class="css({ mb: '12' })">
            <h2
              :class="
                css({
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'green.600',
                  mb: '6',
                })
              "
            >
              {{ t('searchPage.sections.book') }}
              <span :class="css({ color: 'gray.400', fontWeight: '400' })">{{
                filteredResults.books.length
              }}</span>
            </h2>

            <div
              :class="
                css({
                  display: 'grid',
                  gridTemplateColumns: { base: '1', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: '6',
                })
              "
            >
              <div
                v-for="book in filteredResults.books"
                :key="book.id"
                data-testid="book-item"
                :class="
                  css({
                    bg: 'white',
                    border: '1px solid',
                    borderColor: 'gray.200',
                    borderRadius: '0.75rem',
                    p: '6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      borderColor: 'gray.300',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  })
                "
                @click="goToBookDetail(book.id)"
              >
                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '3',
                      mb: '4',
                    })
                  "
                >
                  <div
                    :class="
                      css({
                        w: '12',
                        h: '12',
                        borderRadius: 'full',
                        bg: 'gray.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        flexShrink: '0',
                        border: '2px solid',
                        borderColor: 'gray.200',
                        overflow: 'hidden',
                      })
                    "
                  >
                    <img
                      v-if="book.coverImageUrl"
                      :src="book.coverImageUrl"
                      :alt="book.title"
                      :class="css({ w: 'full', h: 'full', objectFit: 'cover' })"
                    />
                    <span v-else>📚</span>
                  </div>
                  <div :class="css({ flex: '1', minW: '0' })">
                    <h3
                      :class="
                        css({
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'gray.900',
                          mb: '0.5',
                          lineHeight: '1.4',
                        })
                      "
                    >
                      {{ book.title }}
                    </h3>
                    <p
                      :class="
                        css({
                          fontSize: '0.875rem',
                          color: 'gray.600',
                          mb: '0.5',
                        })
                      "
                    >
                      {{ book.subtitle }}
                    </p>
                    <p
                      :class="
                        css({
                          fontSize: '0.75rem',
                          color: 'gray.500',
                        })
                      "
                    >
                      by {{ book.author }}
                    </p>
                  </div>
                </div>
                <p
                  :class="
                    css({
                      fontSize: '0.875rem',
                      color: 'gray.700',
                      lineHeight: '1.5',
                      mb: '4',
                      lineClamp: 2,
                    })
                  "
                >
                  {{ book.description }}
                </p>
                <button
                  :class="
                    css({
                      px: '3',
                      py: '1.5',
                      bg: 'white',
                      border: '1px solid',
                      borderColor: 'gray.300',
                      color: 'gray.700',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      _hover: {
                        bg: 'gray.50',
                        borderColor: 'gray.400',
                      },
                    })
                  "
                >
                  {{ book.trait }}
                </button>
              </div>
            </div>
          </div>

          <!-- Conversations -->
          <div v-if="filteredResults.conversations.length > 0" :class="css({ mb: '12' })">
            <h2
              :class="
                css({
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'green.600',
                  mb: '6',
                })
              "
            >
              {{ t('searchPage.sections.conversation') }}
              <span :class="css({ color: 'gray.400', fontWeight: '400' })">{{
                filteredResults.conversations.length
              }}</span>
            </h2>

            <div
              :class="
                css({
                  display: 'grid',
                  gridTemplateColumns: { base: '1', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: '6',
                })
              "
            >
              <div
                v-for="conv in filteredResults.conversations"
                :key="conv.id"
                data-testid="conversation-item"
                :class="
                  css({
                    bg: 'white',
                    border: '1px solid',
                    borderColor: 'gray.200',
                    borderRadius: '0.75rem',
                    p: '6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      borderColor: 'gray.300',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  })
                "
                @click="handleForkChat(conv.scenarioId)"
              >
                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '3',
                      mb: '4',
                    })
                  "
                >
                  <div
                    :class="
                      css({
                        w: '12',
                        h: '12',
                        borderRadius: 'full',
                        bg: 'blue.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        flexShrink: '0',
                        border: '2px solid',
                        borderColor: 'blue.100',
                      })
                    "
                  >
                    💬
                  </div>
                  <div :class="css({ flex: '1', minW: '0' })">
                    <h3
                      :class="
                        css({
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'gray.900',
                          mb: '0.5',
                          lineHeight: '1.4',
                        })
                      "
                    >
                      {{ conv.title }}
                    </h3>
                    <p
                      :class="
                        css({
                          fontSize: '0.875rem',
                          color: 'gray.600',
                          lineClamp: 2,
                        })
                      "
                    >
                      {{ conv.description }}
                    </p>
                  </div>
                </div>
                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      fontSize: '0.875rem',
                      color: 'gray.500',
                    })
                  "
                >
                  <span>❤️ {{ conv.likes }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Users -->
          <div v-if="filteredResults.users.length > 0">
            <h2
              :class="
                css({
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'green.600',
                  mb: '6',
                })
              "
            >
              {{ t('searchPage.sections.user') }}
              <span :class="css({ color: 'gray.400', fontWeight: '400' })">{{
                filteredResults.users.length
              }}</span>
            </h2>

            <div
              :class="
                css({
                  display: 'grid',
                  gridTemplateColumns: { base: '1', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: '6',
                })
              "
            >
              <div
                v-for="user in filteredResults.users"
                :key="user.id"
                data-testid="user-item"
                :class="
                  css({
                    bg: 'white',
                    border: '1px solid',
                    borderColor: 'gray.200',
                    borderRadius: '0.75rem',
                    p: '6',
                    position: 'relative',
                  })
                "
              >
                <button
                  :class="
                    css({
                      position: 'absolute',
                      top: '6',
                      right: '6',
                      px: '3',
                      py: '1',
                      borderRadius: 'full',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      bg: user.isFollowing ? 'gray.100' : 'green.600',
                      color: user.isFollowing ? 'gray.700' : 'white',
                      _hover: {
                        bg: user.isFollowing ? 'gray.200' : 'green.700',
                      },
                    })
                  "
                  @click.stop="toggleFollow(user)"
                >
                  {{ user.isFollowing ? t('searchPage.unfollow') : t('searchPage.follow') }}
                </button>

                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3',
                      mb: '4',
                    })
                  "
                >
                  <div
                    :class="
                      css({
                        w: '12',
                        h: '12',
                        borderRadius: 'full',
                        bg: 'gray.100',
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: 'gray.200',
                      })
                    "
                  >
                    <img
                      v-if="user.avatarUrl"
                      :src="user.avatarUrl"
                      :alt="user.username"
                      :class="css({ w: 'full', h: 'full', objectFit: 'cover' })"
                    />
                    <div
                      v-else
                      :class="
                        css({
                          w: 'full',
                          h: 'full',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        })
                      "
                    >
                      👤
                    </div>
                  </div>
                  <div :class="css({ flex: '1', minW: '0' })">
                    <h3
                      :class="
                        css({
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'gray.900',
                          lineHeight: '1.4',
                        })
                      "
                    >
                      {{ user.displayName }}
                    </h3>
                    <p
                      :class="
                        css({
                          fontSize: '0.875rem',
                          color: 'gray.500',
                        })
                      "
                    >
                      @{{ user.username }}
                    </p>
                  </div>
                </div>
                <p
                  v-if="user.bio"
                  :class="
                    css({
                      fontSize: '0.875rem',
                      color: 'gray.700',
                      lineHeight: '1.5',
                      lineClamp: 2,
                    })
                  "
                >
                  {{ user.bio }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="totalCount === 0 && hasSearched && !isLoading"
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: 'gray.200',
              p: '20',
              textAlign: 'center',
              my: '6',
            })
          "
          data-testid="empty-state"
        >
          <div
            :class="
              css({
                fontSize: '4rem',
                mb: '4',
              })
            "
          >
            🔍
          </div>
          <h3
            :class="
              css({
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'gray.700',
                mb: '2',
              })
            "
          >
            {{ t('searchPage.noResults.title') }}
          </h3>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
              })
            "
          >
            {{ t('searchPage.noResults.description') }}
          </p>
          <p :class="css({ fontSize: '0.9375rem', color: 'gray.600', mt: '2' })">
            No results found. Try different keywords.
          </p>
        </div>

        <!-- Initial State -->
        <div
          v-else-if="!hasSearched && !isLoading"
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: 'gray.200',
              p: '20',
              textAlign: 'center',
              my: '6',
            })
          "
        >
          <div
            :class="
              css({
                fontSize: '4rem',
                mb: '4',
              })
            "
          >
            📚
          </div>
          <h3
            :class="
              css({
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'gray.700',
                mb: '2',
              })
            "
          >
            {{ t('searchPage.initialState.title') }}
          </h3>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
              })
            "
          >
            {{ t('searchPage.initialState.description') }}
          </p>
        </div>

        <!-- Loading More Indicator -->
        <div
          v-if="isLoadingMore"
          data-testid="loading-more"
          :class="
            css({
              textAlign: 'center',
              py: '8',
            })
          "
        >
          <div
            :class="
              css({
                display: 'inline-block',
                w: '8',
                h: '8',
                border: '3px solid',
                borderColor: 'gray.200',
                borderTopColor: 'green.600',
                borderRadius: 'full',
                animation: 'spin 1s linear infinite',
              })
            "
          />
          <p
            :class="
              css({
                mt: '2',
                fontSize: '0.875rem',
                color: 'gray.500',
              })
            "
          >
            {{ t('searchPage.loading') }}
          </p>
        </div>
      </div>
    </main>

    <ForkScenarioModal
      v-if="showForkModal && selectedScenario"
      :is-open="showForkModal"
      :parent-scenario="selectedScenario"
      @close="showForkModal = false"
      @forked="handleForked"
    />

    <AppFooter />
  </div>
</template>

<style>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
