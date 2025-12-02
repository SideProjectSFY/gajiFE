<template>
  <div class="book-grid">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="book-grid__skeleton"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="skeleton-card"
      >
        <div class="skeleton-cover" />
        <div class="skeleton-content">
          <div class="skeleton-title" />
          <div class="skeleton-author" />
          <div class="skeleton-meta" />
        </div>
      </div>
    </div>

    <!-- Books Grid -->
    <div
      v-else-if="books.length > 0"
      class="book-grid__content"
    >
      <BookCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        @click="handleBookClick"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="book-grid__empty"
    >
      <i
        class="pi pi-inbox"
        style="font-size: 3rem; color: #ccc"
      />
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import BookCard from './BookCard.vue'
import type { Book } from '@/types/book'

interface Props {
  books: Book[]
  loading?: boolean
  emptyMessage?: string
  skeletonCount?: number
}

withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No books available yet. Check back soon!',
  skeletonCount: 6,
})

const emit = defineEmits<{
  bookClick: [book: Book]
}>()

const handleBookClick = (book: Book): void => {
  emit('bookClick', book)
}
</script>

<style scoped>
.book-grid {
  width: 100%;
}

.book-grid__content,
.book-grid__skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.book-grid__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.book-grid__empty p {
  margin-top: 1rem;
  color: #666;
  font-size: 1rem;
}

/* Skeleton Styles */
.skeleton-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-cover {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-title,
.skeleton-author,
.skeleton-meta {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 1.5rem;
  width: 80%;
  margin-bottom: 0.5rem;
}

.skeleton-author {
  height: 1rem;
  width: 60%;
  margin-bottom: 1rem;
}

.skeleton-meta {
  height: 1rem;
  width: 40%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive Grid */
@media (max-width: 768px) {
  .book-grid__content,
  .book-grid__skeleton {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .book-grid__content,
  .book-grid__skeleton {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .book-grid__content,
  .book-grid__skeleton {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>
