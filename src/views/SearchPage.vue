<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error: showErrorToast } = useToast()
const { trackSearch } = useAnalytics()
const searchQuery = ref('')
const activeTab = ref<'all' | 'book' | 'conversation' | 'user'>('all')
const isLoading = ref(false)
const hasSearched = ref(false)
const showForkModal = ref(false)
const selectedScenario = ref<any>(null)

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
    return {
      books: searchResults.value.books,
      conversations: searchResults.value.conversations,
      users: searchResults.value.users,
    }
  }
  return {
    books: activeTab.value === 'book' ? searchResults.value.books : [],
    conversations: activeTab.value === 'conversation' ? searchResults.value.conversations : [],
    users: activeTab.value === 'user' ? searchResults.value.users : [],
  }
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

  try {
    const response = await searchApi.search(searchQuery.value.trim())

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
  } finally {
    isLoading.value = false
  }
}

const handleForkChat = async (scenarioId: string) => {
  if (!authStore.isAuthenticated) {
    showErrorToast('Please login to fork a scenario')
    router.push('/login')
    return
  }

  try {
    const response = await api.get(`/scenarios/${scenarioId}`)
    selectedScenario.value = response.data
    showForkModal.value = true
  } catch (err) {
    console.error('Failed to load scenario for forking:', err)
    showErrorToast('Failed to load scenario details')
  }
}

const handleForked = (forkedScenario: { id: string }) => {
  showForkModal.value = false
  success('🍴 Scenario forked! Redirecting...', 3000)
  router.push(`/scenarios/${forkedScenario.id}`)
}

const toggleFollow = async (user: any) => {
  if (!authStore.user) {
    alert('Please login to follow users')
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

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      searchQuery.value = newQuery
      performSearch()
    }
  }
)

onMounted(() => {
  // URL query parameter에서 검색어 가져오기
  const query = route.query.q as string
  if (query) {
    searchQuery.value = query
    performSearch()
  }
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
              placeholder="Search for books, characters, conversations..."
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
          </div>
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
            All
          </button>
          <button
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
            Book({{ bookCount }})
          </button>
          <button
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
            Conversation({{ conversationCount }}+)
          </button>
          <button
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
            User({{ userCount }}+)
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
            Book <span :class="css({ color: 'gray.400', fontWeight: '400' })">Loading...</span>
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
              Book
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
              Conversation
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
              User
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
                  @click.stop="toggleFollow(user)"
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
                >
                  {{ user.isFollowing ? 'Unfollow' : 'Follow' }}
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
            No results found
          </h3>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
              })
            "
          >
            Try searching with different keywords
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
            Start searching
          </h3>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
              })
            "
          >
            Search for books, characters, or conversations
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
