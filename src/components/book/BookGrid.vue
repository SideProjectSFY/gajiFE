<template>
  <div class="book-grid">
    <!-- Loading State -->
    <output v-if="loading" class="book-grid__skeleton" aria-label="Loading books">
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="skeleton-card"
        :aria-label="`Loading book ${i}`"
      >
        <div class="skeleton-cover" aria-hidden="true" />
        <div class="skeleton-content">
          <div class="skeleton-title" aria-hidden="true" />
          <div class="skeleton-author" aria-hidden="true" />
          <div class="skeleton-meta" aria-hidden="true" />
        </div>
      </div>
      <span class="sr-only">Loading books, please wait...</span>
    </output>

    <!-- Books Grid -->
    <div v-else-if="books.length > 0" class="book-grid__content">
      <BookCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        @click="handleBookClick"
        @like="handleLike"
      />
    </div>

    <!-- Empty State -->
    <output v-else class="book-grid__empty" aria-live="polite">
      <i class="pi pi-inbox" style="font-size: 3rem; color: #ccc" aria-hidden="true" />
      <p>{{ emptyMessage }}</p>
    </output>
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
  like: [bookId: string, isLiked: boolean]
}>()

const handleBookClick = (book: Book): void => {
  emit('bookClick', book)
}

const handleLike = (bookId: string, isLiked: boolean): void => {
  emit('like', bookId, isLiked)
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
  min-height: 300px;
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
  animation: loading 1.5s infinite ease-in-out;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-title,
.skeleton-author,
.skeleton-meta {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite ease-in-out;
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

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Responsive Grid */
@media (max-width: 768px) {
  .book-grid__content,
  .book-grid__skeleton {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .book-grid__empty {
    padding: 2rem 1rem;
    min-height: 200px;
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

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .skeleton-cover,
  .skeleton-title,
  .skeleton-author,
  .skeleton-meta {
    animation: none;
    background: #f0f0f0;
  }
}
</style>
