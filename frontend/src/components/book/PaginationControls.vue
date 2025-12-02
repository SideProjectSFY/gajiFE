<template>
  <div class="pagination-controls">
    <div class="pagination-info">
      <span> Showing {{ startItem }}-{{ endItem }} of {{ totalElements }} books </span>
    </div>

    <div class="pagination-buttons">
      <button
        class="pagination-button"
        :disabled="currentPage === 0"
        @click="handlePageChange(currentPage - 1)"
      >
        <i class="pi pi-chevron-left" />
        Prev
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination-button page-number"
        :class="{ active: page === currentPage + 1 }"
        @click="handlePageChange(page - 1)"
      >
        {{ page }}
      </button>

      <button
        class="pagination-button"
        :disabled="currentPage === totalPages - 1"
        @click="handlePageChange(currentPage + 1)"
      >
        Next
        <i class="pi pi-chevron-right" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const startItem = computed(() => {
  return props.currentPage * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min((props.currentPage + 1) * props.pageSize, props.totalElements)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const halfVisible = Math.floor(maxVisible / 2)

  let startPage = Math.max(1, props.currentPage + 1 - halfVisible)
  let endPage = Math.min(props.totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

const handlePageChange = (page: number): void => {
  if (page >= 0 && page < props.totalPages) {
    emit('pageChange', page)
  }
}
</script>

<style scoped>
.pagination-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: #666;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #1976d2;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button.page-number {
  min-width: 40px;
  padding: 0.5rem;
}

.pagination-button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.pagination-button i {
  font-size: 0.75rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .pagination-controls {
    padding: 0.5rem;
  }

  .pagination-buttons {
    gap: 0.25rem;
  }

  .pagination-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .pagination-button.page-number {
    min-width: 36px;
    padding: 0.5rem 0.25rem;
  }
}
</style>
