<template>
  <nav class="pagination-controls" role="navigation" aria-label="Pagination">
    <output class="pagination-info" aria-live="polite">
      {{ t('pagination.showing') }} {{ startItem }}-{{ endItem }} {{ t('pagination.of') }}
      {{ totalElements }} {{ t('pagination.books') }}
    </output>

    <div class="pagination-buttons">
      <button
        class="pagination-button"
        :disabled="currentPage === 0"
        :aria-disabled="currentPage === 0"
        aria-label="Go to previous page"
        @click="handlePageChange(currentPage - 1)"
      >
        <i class="pi pi-chevron-left" aria-hidden="true" />
        {{ t('pagination.prev') }}
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination-button page-number"
        :class="{ active: page === currentPage + 1 }"
        :aria-label="`Go to page ${page}`"
        :aria-current="page === currentPage + 1 ? 'page' : undefined"
        @click="handlePageChange(page - 1)"
      >
        {{ page }}
      </button>

      <button
        class="pagination-button"
        :disabled="currentPage === totalPages - 1"
        :aria-disabled="currentPage === totalPages - 1"
        @click="handlePageChange(currentPage + 1)"
      >
        {{ t('pagination.next') }}
        <i class="pi pi-chevron-right" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  flex-wrap: wrap;
  justify-content: center;
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
  min-height: 44px;
  justify-content: center;
  font-weight: 500;
}

.pagination-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #1f7d51;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-button:focus-visible {
  outline: 2px solid #1f7d51;
  outline-offset: 2px;
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f9f9f9;
}

.pagination-button.page-number {
  min-width: 44px;
  padding: 0.5rem;
}

.pagination-button.active {
  background: #1f7d51;
  color: white;
  border-color: #1f7d51;
  font-weight: 600;
}

.pagination-button.active:hover {
  background: #17613e;
  border-color: #17613e;
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
    min-width: 40px;
    min-height: 40px;
  }

  .pagination-button.page-number {
    min-width: 40px;
    padding: 0.5rem 0.25rem;
  }

  /* Hide some page numbers on mobile for compact layout */
  .pagination-button.page-number:not(.active):nth-child(n + 6) {
    display: none;
  }
}

/* Tablet responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .pagination-button {
    min-width: 42px;
    min-height: 42px;
  }
}
</style>
