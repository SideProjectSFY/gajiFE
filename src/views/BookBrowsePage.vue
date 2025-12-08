<template>
  <main
    class="book-browse-page"
    role="main"
    aria-label="Browse Books"
  >
    <header class="page-header">
      <h1 class="page-title">
        Browse Books
      </h1>
      <p class="page-subtitle">
        Discover your next adventure
      </p>
    </header>

    <BookFilterBar
      :initial-genre="currentFilters.genre"
      :initial-sort="currentFilters.sort"
      @filter-change="handleFilterChange"
    />

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
      @bookmark="handleBookmark"
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BookFilterBar from '@/components/book/BookFilterBar.vue'
import BookGrid from '@/components/book/BookGrid.vue'
import PaginationControls from '@/components/book/PaginationControls.vue'
import { bookApi } from '@/services/bookApi'
import type { Book, BookSortOption } from '@/types/book'

const router = useRouter()
const route = useRoute()

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
  sort: 'scenarios',
})

const emptyMessage = ref('No books available yet. Check back soon!')

// Initialize from URL query params
const initializeFromQuery = (): void => {
  const page = parseInt(route.query.page as string) || 0
  const genre = (route.query.genre as string) || ''
  const sort = (route.query.sort as BookSortOption) || 'scenarios'

  currentPage.value = page
  currentFilters.value = { genre, sort }
}

// Fetch books from API
const fetchBooks = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    // TEMPORARY: Use mock data for testing buttons
    // TODO: Uncomment real API call when backend is ready
    /*
    const response = await bookApi.getBooks({
      page: currentPage.value,
      size: pageSize.value,
      genre: currentFilters.value.genre || undefined,
      sort: currentFilters.value.sort,
    })

    books.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
    */

    // Mock data for testing
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

    books.value = [
      {
        id: '1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic',
        coverImageUrl: '',
        scenarioCount: 12,
        conversationCount: 45,
      },
      {
        id: '2',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        coverImageUrl: '',
        scenarioCount: 8,
        conversationCount: 32,
      },
      {
        id: '3',
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        coverImageUrl: '',
        scenarioCount: 15,
        conversationCount: 67,
      },
      {
        id: '4',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Classic',
        coverImageUrl: '',
        scenarioCount: 10,
        conversationCount: 28,
      },
      {
        id: '5',
        title: "Harry Potter and the Sorcerer's Stone",
        author: 'J.K. Rowling',
        genre: 'Fantasy',
        coverImageUrl: '',
        scenarioCount: 25,
        conversationCount: 134,
      },
      {
        id: '6',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        coverImageUrl: '',
        scenarioCount: 18,
        conversationCount: 89,
      },
    ]

    totalPages.value = 1
    totalElements.value = books.value.length

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
  if (currentFilters.value.sort !== 'scenarios') {
    query.sort = currentFilters.value.sort
  }

  router.push({ query })
}

// Event handlers
const handleFilterChange = (filters: { genre: string; sort: BookSortOption }): void => {
  currentFilters.value = filters
  currentPage.value = 0 // Reset to first page on filter change
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

const handleBookmark = async (bookId: string, isBookmarked: boolean): Promise<void> => {
  try {
    if (isBookmarked) {
      await bookApi.bookmarkBook(bookId)
      console.log(`Book ${bookId} bookmarked`)
    } else {
      await bookApi.unbookmarkBook(bookId)
      console.log(`Book ${bookId} unbookmarked`)
    }
  } catch (err) {
    console.error('Failed to update bookmark status:', err)
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
.book-browse-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
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

/* Error State */
.error-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
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
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.retry-button:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.retry-button:active {
  transform: translateY(0);
}

.retry-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .book-browse-page {
    padding: 1rem 0.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .error-container {
    padding: 2rem 1rem;
  }
}
</style>
