<template>
  <div :class="pageClass">
    <div :class="headerClass">
      <h1 :class="titleClass">
        Explore What If Scenarios
      </h1>
      <router-link
        to="/scenarios/create"
        :class="createButtonClass"
      >
        Create New Scenario
      </router-link>
    </div>

    <div :class="contentLayoutClass">
      <!-- Filter Sidebar -->
      <aside :class="sidebarClass">
        <h3 :class="sidebarTitleClass">
          Filters
        </h3>

        <div :class="filterGroupClass">
          <label :class="filterLabelClass">Base Story</label>
          <select
            v-model="filters.baseStory"
            multiple
            :class="selectClass"
            @change="applyFilters"
          >
            <option value="">
              All Stories
            </option>
            <option
              v-for="story in baseStories"
              :key="story"
              :value="story"
            >
              {{ story }}
            </option>
          </select>
        </div>

        <div :class="filterGroupClass">
          <label :class="filterLabelClass">Scenario Type</label>
          <div :class="checkboxGroupClass">
            <label :class="checkboxLabelClass">
              <input
                v-model="filters.scenarioTypes"
                type="checkbox"
                value="CHARACTER_CHANGE"
                :class="checkboxClass"
                @change="applyFilters"
              >
              Character Change
            </label>
            <label :class="checkboxLabelClass">
              <input
                v-model="filters.scenarioTypes"
                type="checkbox"
                value="EVENT_ALTERATION"
                :class="checkboxClass"
                @change="applyFilters"
              >
              Event Alteration
            </label>
            <label :class="checkboxLabelClass">
              <input
                v-model="filters.scenarioTypes"
                type="checkbox"
                value="SETTING_MODIFICATION"
                :class="checkboxClass"
                @change="applyFilters"
              >
              Setting Modification
            </label>
          </div>
        </div>

        <div :class="filterGroupClass">
          <label :class="filterLabelClass">Minimum Quality Score</label>
          <input
            v-model.number="filters.minQuality"
            type="range"
            min="0"
            max="10"
            step="0.5"
            :class="rangeClass"
            @change="applyFilters"
          >
          <span :class="rangeValueClass">{{ filters.minQuality }}/10</span>
        </div>

        <div :class="filterGroupClass">
          <label :class="filterLabelClass">Sort By</label>
          <select
            v-model="filters.sortBy"
            :class="selectClass"
            @change="applyFilters"
          >
            <option value="popular">
              Most Popular
            </option>
            <option value="quality">
              Highest Quality
            </option>
            <option value="newest">
              Newest
            </option>
          </select>
        </div>

        <button
          :class="resetButtonClass"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </aside>

      <!-- Scenario Grid -->
      <main :class="gridContainerClass">
        <template v-if="isLoading && scenarios.length === 0">
          <div :class="skeletonGridClass">
            <SkeletonCard
              v-for="n in 6"
              :key="n"
            />
          </div>
        </template>

        <template v-else-if="scenarios.length === 0">
          <div :class="emptyStateClass">
            <p :class="emptyTextClass">
              No scenarios found matching your filters.
            </p>
            <router-link
              to="/scenarios/create"
              :class="createButtonClass"
            >
              Create Your First Scenario
            </router-link>
          </div>
        </template>

        <template v-else>
          <div :class="scenarioGridClass">
            <ScenarioBrowseCard
              v-for="scenario in scenarios"
              :key="scenario.id"
              :scenario="scenario"
              @click="navigateToDetail"
            />
          </div>

          <!-- Infinite Scroll Trigger -->
          <div
            v-if="hasMore && !isLoading"
            ref="loadMoreTrigger"
            :class="loadMoreClass"
          >
            Loading more scenarios...
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { css } from '@/../styled-system/css'
import api from '@/services/api'
import type { BrowseScenario, BrowseFilters, ScenarioBrowseResponse } from '@/types'
import ScenarioBrowseCard from '@/components/scenario/ScenarioBrowseCard.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'

const router = useRouter()

const scenarios = ref<BrowseScenario[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)

const filters = ref<BrowseFilters>({
  baseStory: [],
  scenarioTypes: [],
  minQuality: 0,
  sortBy: 'popular',
})

const baseStories = ref<string[]>([
  'Harry Potter',
  'Game of Thrones',
  'Lord of the Rings',
  'Star Wars',
  'Marvel Universe',
  'Percy Jackson',
])

const loadMoreTrigger = ref<HTMLElement | null>(null)

const applyFilters = async (): Promise<void> => {
  currentPage.value = 0
  scenarios.value = []
  hasMore.value = true
  await loadScenarios()
}

const loadScenarios = async (): Promise<void> => {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      size: 20,
    }

    if (filters.value.baseStory.length > 0) {
      params.base_story = filters.value.baseStory.join(',')
    }
    if (filters.value.scenarioTypes.length > 0) {
      params.scenario_type = filters.value.scenarioTypes.join(',')
    }
    if (filters.value.minQuality > 0) {
      params.min_quality = filters.value.minQuality
    }
    params.sort = filters.value.sortBy

    const response = await api.get<ScenarioBrowseResponse>('/scenarios', { params })

    if (currentPage.value === 0) {
      scenarios.value = response.data.content
    } else {
      scenarios.value.push(...response.data.content)
    }

    hasMore.value = !response.data.last
    currentPage.value++
  } catch (error) {
    console.error('Failed to load scenarios:', error)
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}

const resetFilters = (): void => {
  filters.value = {
    baseStory: [],
    scenarioTypes: [],
    minQuality: 0,
    sortBy: 'popular',
  }
  applyFilters()
}

const navigateToDetail = (scenarioId: string): void => {
  router.push(`/scenarios/${scenarioId}`)
}

// Infinite scroll setup
const { stop } = useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value && !isLoading.value) {
      loadScenarios()
    }
  },
  {
    threshold: 0.5,
  }
)

onMounted(() => {
  loadScenarios()
})

onUnmounted(() => {
  stop()
})

// PandaCSS classes
const pageClass = css({
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '24px',
  '@media (max-width: 767px)': {
    padding: '16px',
  },
})

const headerClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 767px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
})

const titleClass = css({
  fontSize: '32px',
  fontWeight: '700',
  color: '#111827',
  margin: 0,
  '@media (max-width: 767px)': {
    fontSize: '24px',
  },
})

const createButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  backgroundColor: '#4f46e5',
  color: 'white',
  borderRadius: '8px',
  fontWeight: '600',
  textDecoration: 'none',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: '#4338ca',
  },
})

const contentLayoutClass = css({
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: '32px',
  '@media (max-width: 1023px)': {
    gridTemplateColumns: '1fr',
  },
})

const sidebarClass = css({
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  height: 'fit-content',
  position: 'sticky',
  top: '24px',
  '@media (max-width: 1023px)': {
    position: 'static',
  },
})

const sidebarTitleClass = css({
  fontSize: '20px',
  fontWeight: '700',
  color: '#111827',
  marginBottom: '24px',
})

const filterGroupClass = css({
  marginBottom: '24px',
})

const filterLabelClass = css({
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '8px',
})

const selectClass = css({
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  color: '#374151',
  backgroundColor: 'white',
  cursor: 'pointer',
  _focus: {
    outline: 'none',
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
  },
})

const checkboxGroupClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
})

const checkboxLabelClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#374151',
  cursor: 'pointer',
})

const checkboxClass = css({
  width: '16px',
  height: '16px',
  cursor: 'pointer',
})

const rangeClass = css({
  width: '100%',
  marginBottom: '8px',
})

const rangeValueClass = css({
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#4f46e5',
  textAlign: 'center',
})

const resetButtonClass = css({
  width: '100%',
  padding: '10px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  borderRadius: '6px',
  border: 'none',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  _hover: {
    backgroundColor: '#e5e7eb',
  },
})

const gridContainerClass = css({
  minHeight: '400px',
})

const skeletonGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
  '@media (max-width: 1279px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
  },
})

const emptyStateClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '64px 24px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
})

const emptyTextClass = css({
  fontSize: '18px',
  color: '#6b7280',
  marginBottom: '24px',
})

const scenarioGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
  '@media (max-width: 1279px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
  },
})

const loadMoreClass = css({
  textAlign: 'center',
  padding: '24px',
  color: '#6b7280',
  fontSize: '14px',
})
</script>
