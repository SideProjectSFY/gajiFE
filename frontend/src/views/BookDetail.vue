<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { css } from 'styled-system/css'
import ScenarioCreationModal from '@/components/ScenarioCreationModal.vue'

const route = useRoute()
const bookId = route.params.id as string

// Mock book data - will be replaced with API call
const book = ref({
  id: bookId,
  title: 'Harry Potter and the Philosopher\'s Stone',
  author: 'J.K. Rowling',
  description: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.',
  coverUrl: 'https://via.placeholder.com/200x300',
  publishedYear: 1997,
})

// Modal state
const showCreateModal = ref(false)

const handleOpenModal = (): void => {
  showCreateModal.value = true
}

const handleCloseModal = (): void => {
  showCreateModal.value = false
}

const handleScenarioCreated = (scenarioId: string): void => {
  console.log('Scenario created:', scenarioId)
  showCreateModal.value = false
  // Navigation is handled by the modal component
}

onMounted(() => {
  // TODO: Fetch book details from API
  console.log('Fetching book details for:', bookId)
})

const styles = {
  container: css({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }),
  header: css({
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    '@media (max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'center',
    },
  }),
  coverImage: css({
    width: '200px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: 'lg',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }),
  bookInfo: css({
    flex: 1,
  }),
  title: css({
    fontSize: '2rem',
    fontWeight: '700',
    color: 'neutral.900',
    marginBottom: '0.5rem',
  }),
  author: css({
    fontSize: '1.125rem',
    color: 'neutral.600',
    marginBottom: '1rem',
  }),
  year: css({
    fontSize: '0.875rem',
    color: 'neutral.500',
    marginBottom: '1rem',
  }),
  description: css({
    fontSize: '1rem',
    color: 'neutral.700',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  }),
  createButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'primary.600',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '500',
    border: 'none',
    borderRadius: 'lg',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'primary.700',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
  plusIcon: css({
    fontSize: '1.25rem',
    fontWeight: '700',
  }),
  section: css({
    marginTop: '2rem',
  }),
  sectionTitle: css({
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'neutral.800',
    marginBottom: '1rem',
  }),
  emptyState: css({
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'neutral.50',
    borderRadius: 'lg',
    color: 'neutral.500',
  }),
}
</script>

<template>
  <div :class="styles.container">
    <!-- Book Header -->
    <div :class="styles.header">
      <img
        :src="book.coverUrl"
        :alt="book.title"
        :class="styles.coverImage"
      >
      <div :class="styles.bookInfo">
        <h1 :class="styles.title">
          {{ book.title }}
        </h1>
        <p :class="styles.author">
          by {{ book.author }}
        </p>
        <p :class="styles.year">
          Published {{ book.publishedYear }}
        </p>
        <p :class="styles.description">
          {{ book.description }}
        </p>
        <button
          :class="styles.createButton"
          @click="handleOpenModal"
        >
          <span :class="styles.plusIcon">+</span>
          Create Scenario
        </button>
      </div>
    </div>

    <!-- Scenarios Section -->
    <div :class="styles.section">
      <h2 :class="styles.sectionTitle">
        What If Scenarios
      </h2>
      <div :class="styles.emptyState">
        <p>No scenarios yet. Be the first to create a "What If" scenario for this book!</p>
      </div>
    </div>

    <!-- Scenario Creation Modal -->
    <ScenarioCreationModal
      v-if="showCreateModal"
      :book-id="book.id"
      :book-title="book.title"
      @close="handleCloseModal"
      @created="handleScenarioCreated"
    />
  </div>
</template>
