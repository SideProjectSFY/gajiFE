<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { css } from 'styled-system/css'
import ScenarioCreationModal from '@/components/ScenarioCreationModal.vue'
import ScenarioCard from '@/components/book/ScenarioCard.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import api from '@/services/api'
import type { BookDetail, Scenario, ScenarioFilterType, ScenarioSortOption } from '@/types'

const route = useRoute()
const router = useRouter()
const bookId = route.params.id as string

// State
const book = ref<BookDetail | null>(null)
const scenarios = ref<Scenario[]>([])
const isLoading = ref(false)
const isLoadingBook = ref(true)
const hasMore = ref(true)
const page = ref(1)

const descriptionExpanded = ref(false)
const showCreateModal = ref(false)

const filterType = ref<ScenarioFilterType>('all')
const sortOption = ref<ScenarioSortOption>('most_conversations')

// Filter and Sort Options
const filterOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Character Changes', value: 'character_changes' },
  { label: 'Event Alterations', value: 'event_alterations' },
  { label: 'Setting Modifications', value: 'setting_modifications' },
]

const sortOptions = [
  { label: 'Most Conversations', value: 'most_conversations' },
  { label: 'Most Forks', value: 'most_forks' },
  { label: 'Newest', value: 'newest' },
  { label: 'Most Liked', value: 'most_liked' },
]

// Computed
const emptyStateMessage = computed(() => {
  if (filterType.value !== 'all') {
    return 'No scenarios match the selected type.'
  }
  return 'No scenarios created yet. Be the first!'
})

const shouldShowDescription = computed(() => {
  if (!book.value?.description) return false
  return book.value.description.length > 300
})

// API Calls
const fetchBook = async (): Promise<void> => {
  isLoadingBook.value = true
  try {
    const response = await api.get(`/books/${bookId}`)
    book.value = response.data
  } catch (error) {
    console.error('Failed to fetch book:', error)
    router.push('/books') // Redirect if book not found
  } finally {
    isLoadingBook.value = false
  }
}

const fetchScenarios = async (reset = false): Promise<void> => {
  if (isLoading.value || (!hasMore.value && !reset)) return

  isLoading.value = true

  try {
    const params: Record<string, string | number> = {
      page: reset ? 1 : page.value,
      limit: 20,
      sort: sortOption.value,
    }

    if (filterType.value !== 'all') {
      params.type = filterType.value
    }

    const response = await api.get(`/books/${bookId}/scenarios`, { params })

    if (reset) {
      scenarios.value = response.data.scenarios
      page.value = 1
    } else {
      scenarios.value.push(...response.data.scenarios)
    }

    hasMore.value = response.data.pagination.has_next
    page.value++
  } catch (error) {
    console.error('Failed to fetch scenarios:', error)
  } finally {
    isLoading.value = false
  }
}

// Handlers
const handleOpenModal = (): void => {
  showCreateModal.value = true
}

const handleCloseModal = (): void => {
  showCreateModal.value = false
}

const handleScenarioCreated = async (scenarioId: string): Promise<void> => {
  showCreateModal.value = false

  // Refresh book statistics
  await fetchBook()

  // Refresh scenario list
  await fetchScenarios(true)

  // Navigate to new scenario detail page
  router.push(`/books/${bookId}/scenarios/${scenarioId}`)
}

const handleFilter = (): void => {
  fetchScenarios(true)
}

const handleSort = (): void => {
  fetchScenarios(true)
}

const navigateToScenario = (scenarioId: string): void => {
  router.push(`/books/${bookId}/scenarios/${scenarioId}`)
}

const navigateToBooks = (): void => {
  router.push('/books')
}

const toggleDescription = (): void => {
  descriptionExpanded.value = !descriptionExpanded.value
}

// Infinite scroll setup
const loadMoreTrigger = ref<HTMLElement | null>(null)
useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value && !isLoading.value) {
      fetchScenarios()
    }
  },
  { threshold: 0.5 }
)

onMounted(async () => {
  await fetchBook()
  await fetchScenarios(true)
})

const styles = {
  container: css({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }),
  breadcrumb: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '14px',
    color: '#6b7280',
  }),
  breadcrumbLink: css({
    color: '#4f46e5',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  breadcrumbSeparator: css({
    color: '#d1d5db',
  }),
  header: css({
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '2rem',
    marginBottom: '2rem',
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
    },
  }),
  coverImage: css({
    width: '200px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 767px)': {
      width: '150px',
      height: '225px',
      margin: '0 auto',
    },
  }),
  coverPlaceholder: css({
    width: '200px',
    height: '300px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4rem',
    color: '#d1d5db',
    '@media (max-width: 767px)': {
      width: '150px',
      height: '225px',
      margin: '0 auto',
    },
  }),
  bookInfo: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }),
  title: css({
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    '@media (max-width: 767px)': {
      fontSize: '24px',
    },
  }),
  author: css({
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
  }),
  genreBadges: css({
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  }),
  genreBadge: css({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
  }),
  yearBadge: css({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
  }),
  description: css({
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    maxHeight: '80px',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  }),
  descriptionExpanded: css({
    maxHeight: 'none',
  }),
  expandBtn: css({
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    fontSize: '14px',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  statisticsSection: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
    },
  }),
  statCard: css({
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }),
  statIcon: css({
    fontSize: '2rem',
  }),
  statContent: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  statValue: css({
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  }),
  statLabel: css({
    fontSize: '14px',
    color: '#6b7280',
  }),
  ctaSection: css({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3rem',
  }),
  createButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#4338ca',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }),
  scenarioListSection: css({
    marginTop: '2rem',
  }),
  sectionHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    '@media (max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1rem',
    },
  }),
  sectionTitle: css({
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
  }),
  controls: css({
    display: 'flex',
    gap: '0.75rem',
    '@media (max-width: 767px)': {
      width: '100%',
      flexDirection: 'column',
    },
  }),
  select: css({
    padding: '0.5rem 1rem',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#9ca3af',
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    },
    '@media (max-width: 767px)': {
      width: '100%',
    },
  }),
  scenarioGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
    },
  }),
  emptyState: css({
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  }),
  emptyIcon: css({
    fontSize: '3rem',
    color: '#d1d5db',
  }),
  loadMoreTrigger: css({
    height: '50px',
    marginTop: '2rem',
  }),
}
</script>

<template>
  <div :class="styles.container">
    <!-- Breadcrumb -->
    <nav :class="styles.breadcrumb">
      <span
        :class="styles.breadcrumbLink"
        @click="navigateToBooks"
      > ← Back to Books </span>
    </nav>

    <!-- Loading State for Book -->
    <div v-if="isLoadingBook">
      <div :class="styles.header">
        <div :class="styles.coverPlaceholder">
          📚
        </div>
        <div :class="styles.bookInfo">
          <div
            style="
              height: 32px;
              width: 200px;
              background: #e5e7eb;
              border-radius: 8px;
              margin-bottom: 1rem;
            "
          />
          <div
            style="
              height: 18px;
              width: 150px;
              background: #e5e7eb;
              border-radius: 8px;
              margin-bottom: 1rem;
            "
          />
        </div>
      </div>
    </div>

    <!-- Book Header -->
    <div
      v-else-if="book"
      :class="styles.header"
    >
      <img
        v-if="book.cover_image_url"
        :src="book.cover_image_url"
        :alt="book.title"
        :class="styles.coverImage"
      >
      <div
        v-else
        :class="styles.coverPlaceholder"
      >
        📚
      </div>

      <div :class="styles.bookInfo">
        <h1 :class="styles.title">
          {{ book.title }}
        </h1>
        <p :class="styles.author">
          by {{ book.author }}
        </p>

        <div :class="styles.genreBadges">
          <span :class="styles.genreBadge">{{ book.genre }}</span>
          <span
            v-if="book.publication_year"
            :class="styles.yearBadge"
          >
            {{ book.publication_year }}
          </span>
        </div>

        <p :class="[styles.description, descriptionExpanded && styles.descriptionExpanded]">
          {{ book.description }}
        </p>
        <button
          v-if="shouldShowDescription"
          :class="styles.expandBtn"
          @click="toggleDescription"
        >
          {{ descriptionExpanded ? 'Show Less' : 'Read More' }}
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div
      v-if="book"
      :class="styles.statisticsSection"
    >
      <div :class="styles.statCard">
        <span :class="styles.statIcon">📝</span>
        <div :class="styles.statContent">
          <span :class="styles.statValue">{{ book.statistics.scenario_count }}</span>
          <span :class="styles.statLabel">Scenarios Created</span>
        </div>
      </div>

      <div :class="styles.statCard">
        <span :class="styles.statIcon">💬</span>
        <div :class="styles.statContent">
          <span :class="styles.statValue">{{ book.statistics.conversation_count }}</span>
          <span :class="styles.statLabel">Total Conversations</span>
        </div>
      </div>
    </div>

    <!-- Primary CTA -->
    <div
      v-if="book"
      :class="styles.ctaSection"
    >
      <button
        :class="styles.createButton"
        @click="handleOpenModal"
      >
        <span style="font-size: 20px; font-weight: 700">+</span>
        Create Scenario
      </button>
    </div>

    <!-- Scenario List -->
    <div
      v-if="book"
      :class="styles.scenarioListSection"
    >
      <div :class="styles.sectionHeader">
        <h2 :class="styles.sectionTitle">
          Scenarios ({{ book.statistics.scenario_count }})
        </h2>

        <div :class="styles.controls">
          <select
            v-model="filterType"
            :class="styles.select"
            @change="handleFilter"
          >
            <option
              v-for="option in filterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <select
            v-model="sortOption"
            :class="styles.select"
            @change="handleSort"
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

      <!-- Scenario Grid -->
      <div :class="styles.scenarioGrid">
        <ScenarioCard
          v-for="scenario in scenarios"
          :key="scenario.id"
          :scenario="scenario"
          @click="navigateToScenario(scenario.id)"
        />

        <!-- Loading Skeletons -->
        <template v-if="isLoading">
          <SkeletonCard
            v-for="i in 4"
            :key="`skeleton-${i}`"
          />
        </template>
      </div>

      <!-- Empty State -->
      <div
        v-if="scenarios.length === 0 && !isLoading"
        :class="styles.emptyState"
      >
        <span :class="styles.emptyIcon">📭</span>
        <p>{{ emptyStateMessage }}</p>
        <button
          :class="styles.createButton"
          @click="handleOpenModal"
        >
          <span style="font-size: 20px; font-weight: 700">+</span>
          Create First Scenario
        </button>
      </div>

      <!-- Load More Trigger -->
      <div
        ref="loadMoreTrigger"
        :class="styles.loadMoreTrigger"
      />
    </div>

    <!-- Scenario Creation Modal -->
    <ScenarioCreationModal
      v-if="showCreateModal && book"
      :book-id="book.id"
      :book-title="book.title"
      @close="handleCloseModal"
      @created="handleScenarioCreated"
    />
  </div>
</template>
