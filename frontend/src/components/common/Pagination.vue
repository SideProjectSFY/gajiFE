<template>
  <nav
    class="pagination"
    aria-label="Pagination"
  >
    <button
      class="pagination-button"
      :disabled="currentPage === 0"
      aria-label="Previous page"
      @click="handlePageChange(currentPage - 1)"
    >
      ← Previous
    </button>

    <div class="pagination-pages">
      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination-page"
        :class="{ active: page === currentPage }"
        :aria-label="`Page ${page + 1}`"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="handlePageChange(page)"
      >
        {{ page + 1 }}
      </button>
    </div>

    <button
      class="pagination-button"
      :disabled="currentPage >= totalPages - 1"
      aria-label="Next page"
      @click="handlePageChange(currentPage + 1)"
    >
      Next →
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

const visiblePages = computed(() => {
  const maxVisible = 5
  const pages: number[] = []

  if (props.totalPages <= maxVisible) {
    // Show all pages
    for (let i = 0; i < props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Show first, last, and pages around current
    const start = Math.max(0, props.currentPage - 2)
    const end = Math.min(props.totalPages - 1, props.currentPage + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const handlePageChange = (page: number): void => {
  if (page >= 0 && page < props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.pagination-page {
  min-width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-page:hover {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.pagination-page.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.pagination-page.active:hover {
  background: #5568d3;
  border-color: #5568d3;
}
</style>
