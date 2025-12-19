<template>
  <div class="book-browse-layout">
    <AppHeader />

    <main class="book-browse-page" role="main" aria-label="Browse Books">
      <header class="page-header">
        <h1 class="page-title">📚 Browse Books</h1>
        <p class="page-subtitle">Discover your next adventure in classic literature</p>
      </header>

      <!-- Filter and Sort Section -->
      <div class="filter-section">
        <div class="filter-chips">
          <button
            v-for="genre in genres"
            :key="genre.value"
            :class="['filter-chip', { active: currentFilters.genre === genre.value }]"
            @click="handleGenreFilter(genre.value)"
          >
            {{ genre.label }}
          </button>
        </div>

        <div class="sort-controls">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            :class="['sort-button', { active: currentFilters.sort === option.value }]"
            @click="handleSortChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div v-if="!loading && !error" class="results-info">
        <p class="results-count">
          {{ totalElements }} book{{ totalElements !== 1 ? 's' : '' }} found
        </p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-container" role="alert" aria-live="polite">
        <div class="error-content">
          <i class="pi pi-exclamation-triangle" aria-hidden="true" />
          <p class="error-message">{{ error }}</p>
          <button class="retry-button" aria-label="Retry loading books" @click="retryFetch">
            <i class="pi pi-refresh" aria-hidden="true" />
            Retry
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

// Genre options matching the design
const genres = [
  { label: 'All Genres', value: '' },
  { label: 'Romance', value: 'Romance' },
  { label: 'Fantasy', value: 'Fantasy' },
  { label: 'Mystery', value: 'Mystery' },
  { label: 'Sci-Fi', value: 'Sci-Fi' },
  { label: 'Horror', value: 'Horror' },
  { label: 'Adventure', value: 'Adventure' },
  { label: 'Historical', value: 'Historical' },
]

// Sort options
const sortOptions: { label: string; value: BookSortOption }[] = [
  { label: 'Latest', value: 'latest' },
  { label: 'Recommended', value: 'recommended' },
  { label: 'Popular', value: 'popular' },
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

const emptyMessage = ref('No books available yet. Check back soon!')

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

    books.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements

    // Update empty message based on filters
    if (currentFilters.value.genre) {
      emptyMessage.value = `No books found for ${currentFilters.value.genre}. Try another filter.`
    } else {
      emptyMessage.value = 'No books available yet. Check back soon!'
    }
  } catch (err) {
    console.error('Failed to fetch books:', err)
    books.value = []
    error.value = 'Failed to load books. Please try again.'
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

<style scoped>
.book-browse-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.book-browse-page {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 5rem 1rem 2rem;
  min-height: 100vh;
  background: #f8f9fa;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
  padding: 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
}

/* Filter Section */
.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.filter-chip {
  padding: 0.5rem 1.25rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: #4caf50;
  color: #4caf50;
  background: #f1f8f4;
}

.filter-chip.active {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.sort-button {
  padding: 0.5rem 1.5rem;
  border: none;
  background: #e0e0e0;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-button:hover {
  background: #d0d0d0;
  color: #333;
}

.sort-button.active {
  background: #4caf50;
  color: white;
}

/* Results Info */
.results-info {
  margin-bottom: 1.5rem;
  text-align: center;
}

.results-count {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  margin: 2rem 0;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  max-width: 400px;
}

.error-content .pi-exclamation-triangle {
  font-size: 3rem;
  color: #ef4444;
}

.error-message {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .book-browse-page {
    padding: 4rem 0.5rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .filter-section {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-chips {
    gap: 0.5rem;
    justify-content: flex-start;
  }

  .filter-chip {
    padding: 0.375rem 1rem;
    font-size: 0.8125rem;
  }

  .sort-controls {
    justify-content: flex-end;
  }

  .error-container {
    padding: 2rem 1rem;
  }
}
</style>
