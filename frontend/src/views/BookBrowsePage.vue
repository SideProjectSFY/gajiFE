<template>
  <div class="book-browse-page">
    <div class="page-header">
      <h1 class="page-title">
        Browse Books
      </h1>
      <p class="page-subtitle">
        Discover your next adventure
      </p>
    </div>

    <BookFilterBar
      :initial-genre="currentFilters.genre"
      :initial-sort="currentFilters.sort"
      @filter-change="handleFilterChange"
    />

    <BookGrid
      :books="books"
      :loading="loading"
      :empty-message="emptyMessage"
      @book-click="handleBookClick"
    />

    <PaginationControls
      v-if="!loading && books.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :page-size="pageSize"
      @page-change="handlePageChange"
    />
  </div>
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
  } catch (error) {
    console.error('Failed to fetch books:', error)
    books.value = []
    emptyMessage.value = 'Failed to load books. Please try again later.'
  } finally {
    loading.value = false
  }
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
}
</style>
