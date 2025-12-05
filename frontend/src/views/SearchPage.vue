<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { css } from 'styled-system/css'
import { useRouter } from 'vue-router'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
import { useAnalytics } from '@/composables/useAnalytics'

const router = useRouter()
const { trackSearch } = useAnalytics()
const searchQuery = ref('')
const activeTab = ref<'all' | 'book' | 'story' | 'user'>('all')
const isLoading = ref(false)
const hasSearched = ref(false)

// Mock data - 이미지와 동일하게 6개의 Elizabeth Bennet 캐릭터
const searchResults = ref({
  books: [] as any[],
  stories: [] as any[],
  users: [] as any[],
})

const filteredResults = computed(() => {
  if (activeTab.value === 'all') {
    return {
      books: searchResults.value.books,
      stories: searchResults.value.stories,
      users: searchResults.value.users,
    }
  }
  return {
    books: activeTab.value === 'book' ? searchResults.value.books : [],
    stories: activeTab.value === 'story' ? searchResults.value.stories : [],
    users: activeTab.value === 'user' ? searchResults.value.users : [],
  }
})

const totalCount = computed(() => {
  const { books, stories, users } = filteredResults.value
  return books.length + stories.length + users.length
})

const bookCount = computed(() => searchResults.value.books.length)
const storyCount = computed(() => searchResults.value.stories.length)
const userCount = computed(() => searchResults.value.users.length)

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    hasSearched.value = false
    return
  }

  // URL 쿼리 파라미터 업데이트
  router.push({ path: '/search', query: { q: searchQuery.value.trim() } })

  isLoading.value = true
  hasSearched.value = true

  // TODO: API 호출로 실제 검색 구현
  // Mock data로 시뮬레이션
  setTimeout(() => {
    searchResults.value = {
      books: [
        {
          id: 1,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
        {
          id: 2,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
        {
          id: 3,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
        {
          id: 4,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
        {
          id: 5,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
        {
          id: 6,
          title: 'Elizabeth Bennet',
          subtitle: 'Pride and Prejudice',
          author: 'Jane Austen',
          description: 'The spirited and intelligent second daughter of the Bennet family.',
          trait: 'Witty',
        },
      ],
      stories: [],
      users: [],
    }

    // GA4: 검색 추적
    const totalResults =
      searchResults.value.books.length +
      searchResults.value.stories.length +
      searchResults.value.users.length
    trackSearch({
      searchTerm: searchQuery.value.trim(),
      searchType: 'integrated',
      resultsCount: totalResults,
    })

    isLoading.value = false
  }, 800)
}

const goToBookDetail = (bookId: number) => {
  router.push(`/books/${bookId}`)
}

onMounted(() => {
  // URL query parameter에서 검색어 가져오기
  const query = router.currentRoute.value.query.q as string
  if (query) {
    searchQuery.value = query
    handleSearch()
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
                borderColor: activeTab === 'story' ? 'green.600' : 'transparent',
                color: activeTab === 'story' ? 'green.600' : 'gray.500',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                mb: '-3px',
                _hover: { color: 'green.600' },
              })
            "
            @click="activeTab = 'story'"
          >
            Story({{ storyCount }}+)
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
          v-else-if="filteredResults.books.length > 0 && hasSearched"
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
            Book <span :class="css({ color: 'gray.400', fontWeight: '400' })">{{ bookCount }}</span>
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
                    })
                  "
                >
                  👤
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

    <AppFooter />
  </div>
</template>
