<template>
  <article class="book-card">
    <!-- 클릭 가능한 영역: div로 변경하여 내부에 버튼을 중첩하지 않음 -->
    <div
      class="book-card__clickable"
      role="button"
      tabindex="0"
      :aria-label="`View details for ${book.title} by ${book.author}`"
      @click="handleClick"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <div class="book-card__cover">
        <img
          v-if="book.coverImageUrl"
          :src="book.coverImageUrl"
          :alt="`${book.title} book cover`"
          class="book-card__image"
          loading="lazy"
        />
        <div v-else class="book-card__placeholder" aria-label="No cover image available">
          <i class="pi pi-book" style="font-size: 3rem; color: #ccc" aria-hidden="true" />
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
          <span class="book-card__genre" :aria-label="`Genre: ${book.genre}`">{{
            t(`books.filters.${book.genre.toLowerCase()}`, book.genre)
          }}</span>
          <div class="book-card__stats" aria-label="Book statistics">
            <span class="stat">
              <i class="pi pi-list" aria-hidden="true" />
              <span class="sr-only">Scenarios:</span>
              {{ book.scenarioCount }} {{ t('books.stats.scenarios') }}
            </span>
            <span class="stat">
              <i class="pi pi-comments" aria-hidden="true" />
              <span class="sr-only">Conversations:</span>
              {{ book.conversationCount }} {{ t('books.stats.conversations') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons: 외부에 배치하여 중첩 버튼 문제 해결 -->
    <div class="book-card__actions" data-test="book-card-actions">
      <button
        class="action-button"
        :class="{ active: isLiked, loading: isLiking }"
        :disabled="isLiking"
        :aria-label="
          isLiked
            ? `${t('books.actions.unlike')} ${book.title}`
            : `${t('books.actions.like')} ${book.title}`
        "
        :aria-pressed="isLiked"
        @click="handleLike"
      >
        <i
          v-if="!isLiking"
          :class="isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'"
          aria-hidden="true"
        />
        <i v-else class="pi pi-spin pi-spinner" aria-hidden="true" />
        <span>{{ isLiked ? t('books.actions.unlike') : t('books.actions.like') }}</span>
      </button>

      <button
        class="action-button view-book"
        :aria-label="`${t('books.actions.viewBook')} ${book.title}`"
        @click="handleClick"
      >
        <i class="pi pi-eye" aria-hidden="true" />
        <span>{{ t('books.actions.viewBook') }}</span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Book } from '@/types/book'

const { t } = useI18n()

interface Props {
  book: Book
  initialLiked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialLiked: false,
})

const emit = defineEmits<{
  click: [book: Book]
  like: [bookId: string, isLiked: boolean]
}>()

// State
const isLiked = ref(props.initialLiked)
const isLiking = ref(false)

const handleClick = (): void => {
  emit('click', props.book)
}

const handleLike = async (): Promise<void> => {
  if (isLiking.value) return

  isLiking.value = true
  const newLikedState = !isLiked.value

  try {
    // Optimistic update
    isLiked.value = newLikedState

    // Emit event for parent to handle API call
    emit('like', props.book.id, newLikedState)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
  } catch (error) {
    // Revert on error
    isLiked.value = !newLikedState
    console.error('Failed to update like status:', error)
  } finally {
    isLiking.value = false
  }
}
</script>

<style scoped>
.book-card {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 120px;
  will-change: transform;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.book-card__clickable {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.book-card__clickable:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
}

.book-card:has(.book-card__clickable:focus-visible) {
  transform: translateY(-2px);
}

.book-card__clickable:active {
  transform: scale(0.98);
}

.book-card__cover {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.book-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.book-card:hover .book-card__image {
  transform: scale(1.05);
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
  padding-bottom: 0.5rem;
}

.book-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8rem;
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

/* Action Buttons */
.book-card__actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.action-button:hover:not(:disabled) {
  border-color: #1976d2;
  color: #1976d2;
  background: #f5f9ff;
  transform: translateY(-1px);
}

.action-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.action-button:active:not(:disabled) {
  transform: translateY(0);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.action-button.active {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.action-button.active:hover:not(:disabled) {
  border-color: #dc2626;
  color: #dc2626;
  background: #fee2e2;
}

.action-button.view-book {
  background: #1f7d51;
  color: white;
  border: 2px solid #1f7d51;
}

.action-button.view-book:hover:not(:disabled) {
  background: #17613e;
  border-color: #17613e;
  color: white;
  transform: translateY(-1px);
}

.action-button.view-book i {
  color: white;
}

.action-button.loading {
  pointer-events: none;
}

.action-button i {
  font-size: 1rem;
  transition: transform 0.2s;
}

.action-button:hover:not(:disabled) i:not(.pi-spinner) {
  transform: scale(1.1);
}

.action-button .pi-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
    padding-bottom: 0.5rem;
  }

  .book-card__title {
    font-size: 1rem;
  }

  .book-card__actions {
    padding: 0.5rem 0.75rem 0.75rem;
  }

  .action-button {
    padding: 0.5rem;
    min-height: 44px;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-card__image,
  .action-button,
  .action-button i {
    transition: none;
  }

  .book-card:hover {
    transform: none;
  }

  .action-button .pi-spinner {
    animation: none;
  }
}
</style>
