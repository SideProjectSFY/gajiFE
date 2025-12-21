<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'white' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          maxW: '1200px',
          w: 'full',
          mx: 'auto',
          px: { base: '4', md: '8' },
          py: '8',
        })
      "
      role="main"
      aria-label="Browse Books"
    >
      <!-- Filter and Sort Section -->
      <div
        :class="
          css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '8',
            flexWrap: 'wrap',
            gap: '4',
          })
        "
      >
        <div :class="css({ display: 'flex', gap: '2', flexWrap: 'wrap' })">
          <button
            v-for="genre in genres"
            :key="genre.value"
            :class="
              css({
                px: '4',
                py: '1.5',
                borderRadius: 'full',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: currentFilters.genre === genre.value ? 'green.600' : 'gray.100',
                color: currentFilters.genre === genre.value ? 'white' : 'gray.700',
                _hover: {
                  bg: currentFilters.genre === genre.value ? 'green.700' : 'gray.200',
                },
              })
            "
            @click="handleGenreFilter(genre.value)"
          >
            {{ genre.label }}
          </button>
        </div>

        <div :class="css({ display: 'flex', bg: 'gray.100', borderRadius: 'md', p: '1' })">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            :class="
              css({
                px: '3',
                py: '1',
                borderRadius: 'sm',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: currentFilters.sort === option.value ? 'green.600' : 'transparent',
                color: currentFilters.sort === option.value ? 'white' : 'gray.500',
              })
            "
            @click="handleSortChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div
        v-if="!loading && !error"
        :class="css({ mb: '6', fontSize: '0.875rem', color: 'gray.500' })"
      >
        {{ totalElements }}
        {{ totalElements !== 1 ? t('books.count.available') : t('books.count.single') }}
      </div>

      <!-- Error State -->
      <div
        v-if="error"
        class="error-container"
        role="alert"
        aria-live="polite"
      >
        <div class="error-content">
          <i
            class="pi pi-exclamation-triangle"
            aria-hidden="true"
          />
          <p class="error-message">
            {{ error }}
          </p>
          <button
            class="retry-button"
            aria-label="Retry loading books"
            @click="retryFetch"
          >
            <i
              class="pi pi-refresh"
              aria-hidden="true"
            />
            {{ t('books.error.retry') }}
          </button>
        </div>
      </div>

      <BookGrid
        v-else
        :books="books"
        :loading="loading"
        :empty-message="emptyMessage"
        @book-click="handleBookClick"
        @like="handleLike"
      />

      <PaginationControls
        v-if="!loading && !error && books.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-elements="totalElements"
        :page-size="pageSize"
        @page-change="handlePageChange"
      />
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import BookGrid from '@/components/book/BookGrid.vue'
import PaginationControls from '@/components/book/PaginationControls.vue'
import { bookApi } from '@/services/bookApi'
import type { Book, BookSortOption } from '@/types/book'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Genre options matching the design
const genres = [
  { label: t('books.filters.allGenres'), value: '' },
  { label: t('books.filters.romance'), value: 'Romance' },
  { label: t('books.filters.fantasy'), value: 'Fantasy' },
  { label: t('books.filters.mystery'), value: 'Mystery' },
  { label: t('books.filters.sciFi'), value: 'Sci-Fi' },
  { label: t('books.filters.horror'), value: 'Horror' },
  { label: t('books.filters.adventure'), value: 'Adventure' },
  { label: t('books.filters.historical'), value: 'Historical' },
]

// Sort options
const sortOptions: { label: string; value: BookSortOption }[] = [
  { label: t('books.sort.latest'), value: 'latest' },
  { label: t('books.sort.recommended'), value: 'recommended' },
  { label: t('books.sort.popular'), value: 'popular' },
]

// State
const books = ref<Book[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

const currentFilters = ref<{
  genre: string
  sort: BookSortOption
}>({
  genre: '',
  sort: 'latest',
})

const emptyMessage = ref(t('books.empty'))

// Initialize from URL query params
const initializeFromQuery = (): void => {
  const page = parseInt(route.query.page as string) || 0
  const genre = (route.query.genre as string) || ''
  const sort = (route.query.sort as BookSortOption) || 'latest'

  currentPage.value = page
  currentFilters.value = { genre, sort }
}

// Fetch books from API
const fetchBooks = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    const response = await bookApi.getBooks({
      page: currentPage.value,
      size: pageSize.value,
      genre: currentFilters.value.genre || undefined,
      sort: currentFilters.value.sort,
    })

    let fetchedBooks = response.content

    // Check for liked books if user is authenticated
    if (authStore.user?.id) {
      try {
        const likedBooksResponse = await bookApi.getLikedBooks(authStore.user.id)
        const likedBookIds = new Set(likedBooksResponse.content.map((b: any) => b.id))

        fetchedBooks = fetchedBooks.map((book) => ({
          ...book,
          isLiked: likedBookIds.has(book.id),
        }))
      } catch (e) {
        console.error('Failed to fetch liked books', e)
      }
    }

    books.value = fetchedBooks
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements

    // Update empty message based on filters
    if (currentFilters.value.genre) {
      emptyMessage.value = t('books.emptyFiltered')
    } else {
      emptyMessage.value = t('books.empty')
    }
  } catch (err) {
    console.error('Failed to fetch books:', err)
    books.value = []
    error.value = t('books.error.failed')
  } finally {
    loading.value = false
  }
}

// Retry mechanism
const retryFetch = (): void => {
  fetchBooks()
}

// Update URL query params
const updateUrl = (): void => {
  const query: Record<string, string> = {}

  if (currentPage.value > 0) {
    query.page = currentPage.value.toString()
  }
  if (currentFilters.value.genre) {
    query.genre = currentFilters.value.genre
  }
  if (currentFilters.value.sort !== 'latest') {
    query.sort = currentFilters.value.sort
  }

  router.push({ query })
}

// Event handlers
const handleGenreFilter = (genre: string): void => {
  currentFilters.value.genre = genre
  currentPage.value = 0
  updateUrl()
  fetchBooks()
}

const handleSortChange = (sortValue: BookSortOption): void => {
  currentFilters.value.sort = sortValue
  currentPage.value = 0
  updateUrl()
  fetchBooks()
}

const handlePageChange = (page: number): void => {
  currentPage.value = page
  updateUrl()
  fetchBooks()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleBookClick = (book: Book): void => {
  router.push(`/books/${book.id}`)
}

const handleLike = async (bookId: string, isLiked: boolean): Promise<void> => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isLiked) {
      await bookApi.likeBook(bookId)
      console.log(`Book ${bookId} liked`)
    } else {
      await bookApi.unlikeBook(bookId)
      console.log(`Book ${bookId} unliked`)
    }
  } catch (err) {
    console.error('Failed to update like status:', err)
    throw err
  }
}

// Lifecycle
onMounted(() => {
  initializeFromQuery()
  fetchBooks()
})

// Watch for route changes (browser back/forward)
watch(
  () => route.query,
  () => {
    initializeFromQuery()
    fetchBooks()
  }
)
</script>
