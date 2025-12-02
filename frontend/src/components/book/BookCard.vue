<template>
  <div
    class="book-card"
    @click="handleClick"
  >
    <div class="book-card__cover">
      <img
        v-if="book.coverImageUrl"
        :src="book.coverImageUrl"
        :alt="book.title"
        class="book-card__image"
        loading="lazy"
      >
      <div
        v-else
        class="book-card__placeholder"
      >
        <i
          class="pi pi-book"
          style="font-size: 3rem; color: #ccc"
        />
      </div>
    </div>

    <div class="book-card__content">
      <h3 class="book-card__title">
        {{ book.title }}
      </h3>
      <p class="book-card__author">
        {{ book.author }}
      </p>

      <div class="book-card__meta">
        <span class="book-card__genre">{{ book.genre }}</span>
        <div class="book-card__stats">
          <span class="stat">
            <i class="pi pi-list" />
            {{ book.scenarioCount }} scenarios
          </span>
          <span class="stat">
            <i class="pi pi-comments" />
            {{ book.conversationCount }} conversations
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '@/types/book'

interface Props {
  book: Book
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [book: Book]
}>()

const handleClick = (): void => {
  emit('click', props.book)
}
</script>

<style scoped>
.book-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  min-height: 120px;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.book-card__cover {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.book-card__content {
  padding: 1rem;
}

.book-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-card__author {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 1rem 0;
}

.book-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.book-card__genre {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
}

.book-card__stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.stat i {
  font-size: 0.875rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .book-card {
    min-height: 120px;
  }

  .book-card__cover {
    height: 160px;
  }

  .book-card__content {
    padding: 0.75rem;
  }
}
</style>
