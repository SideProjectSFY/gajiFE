<template>
  <div class="book-filter-bar">
    <div class="filter-section">
      <label
        for="genre-filter"
        class="filter-label"
      >Genre:</label>
      <select
        id="genre-filter"
        v-model="selectedGenre"
        class="filter-select"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

// Filter out 'All' from genres list (it's handled by empty string)
const genres = BOOK_GENRES.filter((g) => g !== 'All')
const sortOptions = BOOK_SORT_OPTIONS

const handleGenreChange = (): void => {
  emitFilters()
}

const handleSortChange = (): void => {
  emitFilters()
}

const emitFilters = (): void => {
  emit('filterChange', {
    genre: selectedGenre.value,
    sort: selectedSort.value,
  })
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
  gap: 1.5rem;
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
  transition: border-color 0.2s;
  min-width: 150px;
}

.filter-select:hover {
  border-color: #1976d2;
}

.filter-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .book-filter-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-section {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: 0;
  }
}
</style>
