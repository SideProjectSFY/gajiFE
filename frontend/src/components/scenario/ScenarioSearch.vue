<template>
  <div :class="css({ padding: '24px', maxWidth: '1200px', margin: '0 auto' })">
    <!-- Search Bar -->
    <div
      :class="
        css({
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        })
      "
    >
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search scenarios by keywords, characters, events..."
        :class="
          css({
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            _focus: {
              borderColor: '#4A90E2',
              boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)',
            },
          })
        "
        @input="handleSearchInput"
      >
      <button
        :class="
          css({
            padding: '12px 24px',
            background: filtersVisible ? '#4A90E2' : 'white',
            color: filtersVisible ? 'white' : '#333',
            border: '1px solid #4A90E2',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s',
            _hover: {
              background: filtersVisible ? '#3A7BC8' : '#f5f5f5',
            },
          })
        "
        @click="toggleFilters"
      >
        {{ filtersVisible ? 'Hide' : 'Show' }} Filters
      </button>
    </div>

    <!-- Advanced Filters -->
    <transition name="slide-down">
      <div
        v-if="filtersVisible"
        :class="
          css({
            padding: '20px',
            background: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e0e0e0',
          })
        "
      >
        <div
          :class="
            css({
              display: 'grid',
              gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
              gap: '16px',
              marginBottom: '16px',
            })
          "
        >
          <!-- Scenario Category Filter -->
          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '8px' })">
            <label :class="css({ fontWeight: '600', fontSize: '14px', color: '#555' })">
              Scenario Category
            </label>
            <select
              v-model="filters.category"
              :class="
                css({
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                })
              "
            >
              <option value="">
                All Categories
              </option>
              <option value="CHARACTER_CHANGE">
                Character Change
              </option>
              <option value="EVENT_ALTERATION">
                Event Alteration
              </option>
              <option value="SETTING_MODIFICATION">
                Setting Modification
              </option>
              <option value="MIXED">
                Mixed
              </option>
            </select>
          </div>

          <!-- Minimum Quality Score Filter -->
          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '8px' })">
            <label :class="css({ fontWeight: '600', fontSize: '14px', color: '#555' })">
              Minimum Quality Score: {{ filters.minQualityScore }}
            </label>
            <input
              v-model.number="filters.minQualityScore"
              type="range"
              min="0"
              max="10"
              step="0.5"
              :class="
                css({
                  width: '100%',
                  cursor: 'pointer',
                })
              "
            >
          </div>
        </div>

        <!-- Filter Actions -->
        <div :class="css({ display: 'flex', gap: '12px', justifyContent: 'flex-end' })">
          <button
            :class="
              css({
                padding: '10px 24px',
                background: '#4A90E2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                _hover: { background: '#3A7BC8' },
              })
            "
            @click="applyFilters"
          >
            Apply Filters
          </button>
          <button
            :class="
              css({
                padding: '10px 24px',
                background: 'white',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                _hover: { background: '#f5f5f5' },
              })
            "
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>
    </transition>

    <!-- Search Results -->
    <div>
      <!-- Loading State -->
      <div
        v-if="isSearching"
        :class="
          css({
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
          })
        "
      >
        <div
          :class="
            css({
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4A90E2',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            })
          "
        />
        <p :class="css({ fontSize: '16px' })">
          Searching...
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="results.length === 0"
        :class="
          css({
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
          })
        "
      >
        <div :class="css({ fontSize: '48px', marginBottom: '16px' })">
          🔍
        </div>
        <p :class="css({ fontSize: '18px', fontWeight: '500', marginBottom: '8px' })">
          No scenarios match your search
        </p>
        <p :class="css({ fontSize: '14px', color: '#999' })">
          Try different keywords or adjust your filters
        </p>
      </div>

      <!-- Results List -->
      <div v-else>
        <!-- Results Header -->
        <div
          :class="
            css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e0e0e0',
            })
          "
        >
          <p :class="css({ fontSize: '16px', fontWeight: '500', color: '#333' })">
            {{ totalResults }} scenario{{ totalResults !== 1 ? 's' : '' }} found
          </p>
          <select
            v-model="sortBy"
            :class="
              css({
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              })
            "
            @change="handleSortChange"
          >
            <option value="relevance">
              Most Relevant
            </option>
            <option value="newest">
              Newest First
            </option>
            <option value="popular">
              Most Popular
            </option>
            <option value="quality">
              Highest Quality
            </option>
          </select>
        </div>

        <!-- Scenario Cards -->
        <div :class="css({ display: 'flex', flexDirection: 'column', gap: '16px' })">
          <div
            v-for="scenario in results"
            :key="scenario.id"
            :class="
              css({
                padding: '20px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  borderColor: '#4A90E2',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)',
                },
              })
            "
            @click="navigateToScenario(scenario.id)"
          >
            <!-- Scenario Header -->
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                })
              "
            >
              <div>
                <span
                  :class="
                    css({
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: getCategoryColor(scenario.scenario_type),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px',
                    })
                  "
                >
                  {{ getCategoryLabel(scenario.scenario_type) }}
                </span>
                <h3
                  :class="
                    css({
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px',
                    })
                  "
                  v-html="highlightQuery(scenario.base_story)"
                />
              </div>
            </div>

            <!-- Scenario Preview -->
            <p
              :class="
                css({
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '12px',
                })
              "
              v-html="highlightQuery(scenario.scenario_preview)"
            />

            <!-- Scenario Stats -->
            <div
              :class="
                css({
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#999',
                })
              "
            >
              <span>🍴 {{ scenario.fork_count }} forks</span>
              <span>👤 {{ scenario.creator_username }}</span>
              <span>📅 {{ formatDate(scenario.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          :class="
            css({
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '32px',
            })
          "
        >
          <button
            :disabled="currentPage === 0"
            :class="
              css({
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                _hover: { background: '#f5f5f5' },
              })
            "
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>
          <span
            :class="
              css({
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                color: '#666',
              })
            "
          >
            Page {{ currentPage + 1 }} of {{ totalPages }}
          </span>
          <button
            :disabled="currentPage >= totalPages - 1"
            :class="
              css({
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                _hover: { background: '#f5f5f5' },
              })
            "
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import { scenarioApi } from '@/services/scenarioApi'
import type { ScenarioSearchResult, ScenarioSearchFilters } from '@/types'

const router = useRouter()

// State
const searchQuery = ref('')
const filtersVisible = ref(false)
const isSearching = ref(false)
const results = ref<ScenarioSearchResult[]>([])
const totalResults = ref(0)
const currentPage = ref(0)
const totalPages = ref(0)
const sortBy = ref('relevance')

// Filters
const filters = reactive({
  category: '',
  minQualityScore: 0,
})

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Methods
const handleSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performSearch()
  }, 300) // 300ms debounce
}

const performSearch = async () => {
  isSearching.value = true

  try {
    const searchFilters: ScenarioSearchFilters = {
      query: searchQuery.value || undefined,
      category: filters.category
        ? (filters.category as ScenarioSearchFilters['category'])
        : undefined,
      minQualityScore: filters.minQualityScore,
      page: currentPage.value,
      size: 20,
      sort: sortBy.value,
    }

    const response = await scenarioApi.searchScenarios(searchFilters)

    results.value = response.content
    totalResults.value = response.page.totalElements
    totalPages.value = response.page.totalPages
  } catch (error) {
    console.error('Search failed:', error)
    alert('Search failed. Please try again.')
  } finally {
    isSearching.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 0
  performSearch()
}

const resetFilters = () => {
  filters.category = ''
  filters.minQualityScore = 0
  searchQuery.value = ''
  currentPage.value = 0
  performSearch()
}

const toggleFilters = () => {
  filtersVisible.value = !filtersVisible.value
}

const handleSortChange = () => {
  currentPage.value = 0
  performSearch()
}

const goToPage = (page: number) => {
  currentPage.value = page
  performSearch()
}

const navigateToScenario = (id: string) => {
  router.push(`/scenarios/${id}`)
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    CHARACTER_CHANGE: 'Character',
    EVENT_ALTERATION: 'Event',
    SETTING_MODIFICATION: 'Setting',
    MIXED: 'Mixed',
  }
  return labels[category] || category
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    CHARACTER_CHANGE: '#10B981',
    EVENT_ALTERATION: '#F59E0B',
    SETTING_MODIFICATION: '#8B5CF6',
    MIXED: '#6B7280',
  }
  return colors[category] || '#6B7280'
}

const highlightQuery = (text: string): string => {
  if (!searchQuery.value) return text

  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark style="background: #FEF3C7; padding: 2px 4px;">$1</mark>')
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

// Initial search on mount (empty query shows all)
performSearch()
</script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
