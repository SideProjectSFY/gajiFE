<template>
  <section
    class="book-filter-bar"
    role="search"
    aria-label="Book filters"
  >
    <div class="filter-section">
      <label
        for="genre-filter"
        class="filter-label"
      >Genre:</label>
      <select
        id="genre-filter"
        v-model="selectedGenre"
        class="filter-select"
        aria-label="Filter books by genre"
        @change="handleGenreChange"
      >
        <option value="">
          All Genres
        </option>
        <option
          v-for="genre in genres"
          :key="genre"
          :value="genre"
        >
          {{ genre }}
        </option>
      </select>
    </div>

    <div class="filter-section">
      <label
        for="sort-filter"
        class="filter-label"
      >Sort by:</label>
      <select
        id="sort-filter"
        v-model="selectedSort"
        class="filter-select"
        aria-label="Sort books by"
        @change="handleSortChange"
      >
        <option
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Active filter count and clear button -->
    <div
      v-if="activeFilterCount > 0"
      class="filter-actions"
    >
      <output
        class="filter-count"
        aria-live="polite"
      >
        {{ activeFilterCount }} {{ activeFilterCount === 1 ? 'filter' : 'filters' }} active
      </output>
      <button
        class="clear-filters-button"
        aria-label="Clear all filters"
        @click="clearAllFilters"
      >
        <i
          class="pi pi-times"
          aria-hidden="true"
        />
        Clear All
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BOOK_GENRES, BOOK_SORT_OPTIONS, type BookSortOption } from '@/types/book'

interface Props {
  initialGenre?: string
  initialSort?: BookSortOption
}

const props = withDefaults(defineProps<Props>(), {
  initialGenre: '',
  initialSort: 'scenarios',
})

const emit = defineEmits<{
  filterChange: [filters: { genre: string; sort: BookSortOption }]
}>()

const selectedGenre = ref(props.initialGenre)
const selectedSort = ref<BookSortOption>(props.initialSort)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

// Filter out 'All' from genres list (it's handled by empty string)
const genres = BOOK_GENRES.filter((g) => g !== 'All')
const sortOptions = BOOK_SORT_OPTIONS

// Active filter count for accessibility announcement
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedGenre.value) count++
  if (selectedSort.value !== 'scenarios') count++
  return count
})

const handleGenreChange = (): void => {
  debouncedEmitFilters()
}

const handleSortChange = (): void => {
  debouncedEmitFilters()
}

// Debounced emit to avoid excessive API calls
const debouncedEmitFilters = (): void => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    emitFilters()
  }, 300)
}

const emitFilters = (): void => {
  emit('filterChange', {
    genre: selectedGenre.value,
    sort: selectedSort.value,
  })
}

// Clear all filters
const clearAllFilters = (): void => {
  selectedGenre.value = ''
  selectedSort.value = 'scenarios'
  emitFilters()
}

// Watch for prop changes (URL sync)
watch(
  () => props.initialGenre,
  (newGenre) => {
    selectedGenre.value = newGenre
  }
)

watch(
  () => props.initialSort,
  (newSort) => {
    selectedSort.value = newSort
  }
)
</script>

<style scoped>
.book-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  min-width: 150px;
  min-height: 44px;
}

.filter-select:hover {
  border-color: #1976d2;
}

.filter-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

/* Filter actions */
.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.filter-count {
  font-size: 0.875rem;
  color: #1976d2;
  font-weight: 500;
}

.clear-filters-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px;
}

.clear-filters-button:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.clear-filters-button:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
}

.clear-filters-button i {
  font-size: 0.75rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .book-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-section {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: 0;
  }

  .filter-actions {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }

  .clear-filters-button {
    flex: 1;
    justify-content: center;
  }
}
</style>
