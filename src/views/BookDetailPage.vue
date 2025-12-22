<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
import BookComments from '../components/book/BookComments.vue'
import CreateScenarioModal from '../components/scenario/CreateScenarioModal.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useAuthStore } from '@/stores/auth'
import { bookApi } from '@/services/bookApi'
import api from '@/services/api'
import type { BooksResponse } from '@/types/book'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { trackBookViewed } = useAnalytics()
const authStore = useAuthStore()

// State
const loading = ref(true)
const error = ref('')
const book = ref<BooksResponse['content'][0] | null>(null)
const bookId = route.params.id as string

// Scenario form state
const MIN_CHARS = 10
const scenarioForm = ref({
  scenarioTitle: '',
  whatIfQuestion: '',
  characterChanges: '',
  eventAlterations: '',
  settingModifications: '',
  description: '',
})

const scenarioError = ref('')
const isSubmittingScenario = ref(false)

// Mock characters data (temporary until backend provides this)
const characters = ref<any[]>([])
const relationships = ref<any[]>([])
const selectedCharacter = ref<number | null>(null)
const showScenarioModal = ref(false)

// Validation computed properties
const isCharacterChangesValid = computed(() => {
  const length = scenarioForm.value.characterChanges.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isEventAlterationsValid = computed(() => {
  const length = scenarioForm.value.eventAlterations.trim().length
  return length === 0 || length >= MIN_CHARS
})

const isSettingModificationsValid = computed(() => {
  const length = scenarioForm.value.settingModifications.trim().length
  return length === 0 || length >= MIN_CHARS
})

const hasAtLeastOneValidType = computed(() => {
  return (
    scenarioForm.value.characterChanges.trim().length >= MIN_CHARS ||
    scenarioForm.value.eventAlterations.trim().length >= MIN_CHARS ||
    scenarioForm.value.settingModifications.trim().length >= MIN_CHARS ||
    isWhatIfValid.value
  )
})

const isWhatIfValid = computed(() => {
  return scenarioForm.value.whatIfQuestion.trim().length >= MIN_CHARS
})

const whatIfCharCount = computed(() => scenarioForm.value.whatIfQuestion.trim().length)

const isFormValid = computed(() => {
  return (
    scenarioForm.value.scenarioTitle.trim().length > 0 &&
    isWhatIfValid.value &&
    isCharacterChangesValid.value &&
    isEventAlterationsValid.value &&
    isSettingModificationsValid.value &&
    hasAtLeastOneValidType.value
  )
})

const showValidationError = computed(() => {
  const hasTyped =
    scenarioForm.value.characterChanges.length > 0 ||
    scenarioForm.value.eventAlterations.length > 0 ||
    scenarioForm.value.settingModifications.length > 0
  return hasTyped && !hasAtLeastOneValidType.value
})

const determineScenarioType = () => {
  if (scenarioForm.value.characterChanges.trim().length >= MIN_CHARS) {
    return 'CHARACTER_CHANGE'
  }
  if (scenarioForm.value.eventAlterations.trim().length >= MIN_CHARS) {
    return 'EVENT_ALTERATION'
  }
  if (scenarioForm.value.settingModifications.trim().length >= MIN_CHARS) {
    return 'SETTING_MODIFICATION'
  }
  return 'CHARACTER_CHANGE'
}

const getCharCount = (text: string) => {
  return text.trim().length
}

// Fetch book data from API
const fetchBook = async () => {
  console.log('[BookDetailPage] START fetchBook, bookId:', bookId)
  try {
    loading.value = true
    error.value = ''
    console.log('[BookDetailPage] About to call API')
    const data = await bookApi.getBookById(bookId)
    console.log('[BookDetailPage] API response:', JSON.stringify(data))
    book.value = data
    console.log('[BookDetailPage] book.value set:', book.value)

    // Track book view
    try {
      trackBookViewed(String(data.id), data.title)
      console.log('[BookDetailPage] trackBookViewed success')
    } catch (trackErr) {
      console.error('[BookDetailPage] trackBookViewed failed:', trackErr)
    }

    // TODO: Fetch characters and relationships from backend
    // For now, using mock data for testing
    characters.value = [
      {
        id: 1,
        name: 'Harry Potter',
        description: 'The Boy Who Lived',
        isFeatured: true,
        tags: ['Brave', 'Wizard'],
        conversations: 150,
      },
      {
        id: 2,
        name: 'Hermione Granger',
        description: 'Brightest witch of her age',
        isFeatured: true,
        tags: ['Intelligent', 'Loyal'],
        conversations: 120,
      },
    ]
    relationships.value = []
    if (characters.value.length > 0) {
      selectedCharacter.value = characters.value[0].id
    }
    console.log('[BookDetailPage] Book loaded successfully')
  } catch (err: any) {
    console.error('[BookDetailPage] Failed to fetch book:', err, err.message, err.stack)
    if (err?.response?.status === 404 || err?.response?.status === 400) {
      error.value = 'Book not found or does not exist (404)'
    } else {
      error.value = 'Failed to load book details'
    }
  } finally {
    loading.value = false
    console.log(
      '[BookDetailPage] FINALLY - loading:',
      loading.value,
      ', book:',
      !!book.value,
      ', error:',
      error.value
    )
  }
}

// Load book data on mount
onMounted(() => {
  fetchBook()
})

const getCharCountDisplay = (text: string, fieldName: string) => {
  const count = getCharCount(text)
  const isValid = count === 0 || count >= MIN_CHARS
  return {
    text: `${count}/${MIN_CHARS}`,
    isValid,
    showCheck: count >= MIN_CHARS,
  }
}

// SVG Graph State
const svgWidth = 400
const svgHeight = 400
const nodes = ref<Array<{ id: string; x: number; y: number; type: 'main' | 'minor' }>>([])
const edges = ref<Array<{ from: string; to: string; type: string; label: string }>>([])

// Initialize graph layout
onMounted(() => {
  initializeGraph()
})

const initializeGraph = () => {
  // Define node positions manually for better layout
  const characterNames = [
    ...new Set([
      ...relationships.value.map((r) => r.from),
      ...relationships.value.map((r) => r.to),
    ]),
  ]

  const centerX = svgWidth / 2
  const centerY = svgHeight / 2
  const radius = 120

  nodes.value = characterNames.map((name, index) => {
    const angle = (index * 2 * Math.PI) / characterNames.length - Math.PI / 2
    return {
      id: name,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      type: book.value.characters.find((c) => c.name === name)?.isFeatured ? 'main' : 'minor',
    }
  })

  edges.value = relationships
}

const getNodePosition = (nodeName: string) => {
  return nodes.value.find((n) => n.id === nodeName) || { x: 0, y: 0 }
}

const getEdgeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    love: '#ef4444',
    friend: '#10b981',
    married: '#3b82f6',
    cousin: '#06b6d4',
    conflict: '#ef4444',
    sister: '#8b5cf6',
    oppressor: '#f59e0b',
  }
  return colorMap[type] || '#10b981'
}

const getEdgeLabel = (label: string) => {
  return label || ''
}

const toggleCharacterSelection = (characterId: number) => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Redirect to login page
    router.push('/login')
    return
  }

  if (selectedCharacter.value === characterId) {
    selectedCharacter.value = null
  } else {
    selectedCharacter.value = characterId
  }
}

const openScenarioModal = () => {
  if (selectedCharacter.value === null) return
  scenarioError.value = ''
  showScenarioModal.value = true
}

const closeScenarioModal = () => {
  showScenarioModal.value = false
  scenarioError.value = ''
  resetScenarioForm()
}

const handleScenarioCreated = (data: any) => {
  console.log('Scenario created:', data)
  // TODO: Navigate to conversation or refresh scenarios
}

const resetScenarioForm = () => {
  scenarioForm.value = {
    scenarioTitle: '',
    whatIfQuestion: '',
    characterChanges: '',
    eventAlterations: '',
    settingModifications: '',
    description: '',
  }
}

const createScenario = async () => {
  if (!isFormValid.value || !book.value) return

  scenarioError.value = ''
  isSubmittingScenario.value = true

  try {
    const payload = {
      novelId: bookId,
      scenarioTitle: scenarioForm.value.scenarioTitle,
      whatIfQuestion: scenarioForm.value.whatIfQuestion,
      characterChanges: scenarioForm.value.characterChanges,
      eventAlterations: scenarioForm.value.eventAlterations,
      settingModifications: scenarioForm.value.settingModifications,
      scenarioType: determineScenarioType(),
      isPrivate: false,
    }

    await api.post('/scenarios', payload)

    // Optional: keep the modal open for edge-case tests but clear the form
    resetScenarioForm()
  } catch (err: any) {
    const message =
      err?.response?.data?.message || 'Network error while creating scenario. Please try again.'
    scenarioError.value = message
  } finally {
    isSubmittingScenario.value = false
  }
}
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          maxW: '1200px',
          w: 'full',
          mx: 'auto',
          px: { base: '4', md: '8' },
          py: '8',
        })
      "
    >
      <!-- Breadcrumb -->
      <div :class="css({ mb: '6' })">
        <div
          :class="
            css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              fontSize: '0.875rem',
              color: 'gray.600',
            })
          "
        >
          <router-link
            to="/books"
            :class="
              css({ color: 'gray.600', textDecoration: 'none', _hover: { color: 'green.500' } })
            "
          >
            ← {{ t('books.detail.backToBookList') }}
          </router-link>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '12',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          })
        "
      >
        <p :class="css({ color: 'gray.600' })">
          {{ t('books.detail.loading') }}
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '12',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          })
        "
      >
        <p :class="css({ color: 'red.600', mb: '4' })">
          {{ error }}
        </p>
        <button
          :class="
            css({
              px: '4',
              py: '2',
              bg: 'green.500',
              color: 'white',
              borderRadius: '0.375rem',
              _hover: { bg: 'green.600' },
            })
          "
          @click="fetchBook"
        >
          Retry
        </button>
      </div>

      <!-- Book Header Section -->
      <div
        v-else-if="book"
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '6',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            mb: '6',
          })
        "
      >
        <div
          :class="css({ display: 'flex', flexDirection: { base: 'column', md: 'row' }, gap: '6' })"
        >
          <!-- Book Cover -->
          <div :class="css({ flexShrink: 0 })">
            <div
              :class="
                css({
                  w: { base: 'full', md: '48' },
                  h: { base: '64', md: '72' },
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                })
              "
            >
              <span :class="css({ fontSize: '4rem' })">📚</span>
            </div>
          </div>

          <!-- Book Info -->
          <div :class="css({ flex: 1 })">
            <!-- Tags -->
            <div
              v-if="book.tags && book.tags.length"
              :class="css({ display: 'flex', gap: '2', mb: '3' })"
            >
              <span
                v-for="tag in book.tags"
                :key="tag"
                :class="
                  css({
                    px: '3',
                    py: '1',
                    bg: 'green.500',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '0.375rem',
                  })
                "
              >
                {{ t(tag) }}
              </span>
            </div>

            <!-- Title -->
            <h1
              :class="
                css({
                  fontSize: { base: '1.875rem', md: '2.25rem' },
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              {{ book.title }}
            </h1>

            <!-- Author & Genre -->
            <p :class="css({ fontSize: '1rem', color: 'gray.600', mb: '4' })">
              {{ t('books.detail.byAuthorGenre', { author: book.author, genre: book.genre }) }}
            </p>

            <!-- Description -->
            <p
              v-if="book.description"
              :class="
                css({
                  fontSize: '0.875rem',
                  color: 'gray.700',
                  lineHeight: '1.7',
                  mb: '4',
                })
              "
            >
              {{ book.description }}
            </p>

            <!-- Stats -->
            <div :class="css({ display: 'flex', gap: '6', mb: '0' })">
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  📝 {{ t('books.stats.scenarios') }}
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.scenarioCount }}
                </div>
              </div>
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  💬 {{ t('books.stats.conversations') }}
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.conversationCount.toLocaleString() }}
                </div>
              </div>
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  ❤️ {{ t('books.stats.likes') }}
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.likeCount ?? 0 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Book Content Container -->
      <template v-if="book">
        <!-- Main Content: Graph + Characters -->
        <div
          :class="
            css({
              display: 'grid',
              gridTemplateColumns: { base: '1fr', lg: '400px 1fr' },
              gap: '6',
            })
          "
        >
          <!-- Left: Relationship Graph -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                h: 'fit-content',
              })
            "
          >
            <h2
              :class="
                css({
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '4',
                })
              "
            >
              🔗 {{ t('books.detail.searchCharacters') }}
            </h2>

            <!-- SVG Graph -->
            <div
              :class="
                css({
                  w: 'full',
                  bg: 'gray.50',
                  borderRadius: '0.5rem',
                  p: '4',
                  mb: '4',
                })
              "
            >
              <svg :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
                <!-- Edges -->
                <g v-for="(edge, idx) in edges" :key="`edge-${idx}`">
                  <line
                    :x1="getNodePosition(edge.from).x"
                    :y1="getNodePosition(edge.from).y"
                    :x2="getNodePosition(edge.to).x"
                    :y2="getNodePosition(edge.to).y"
                    :stroke="getEdgeColor(edge.type)"
                    :stroke-width="edge.label === 'Main Story' ? 3 : 2"
                    stroke-linecap="round"
                  />
                  <text
                    v-if="edge.label"
                    :x="(getNodePosition(edge.from).x + getNodePosition(edge.to).x) / 2"
                    :y="(getNodePosition(edge.from).y + getNodePosition(edge.to).y) / 2"
                    :class="css({ fontSize: '0.625rem', fill: 'gray.600' })"
                    text-anchor="middle"
                  >
                    {{ getEdgeLabel(edge.label) }}
                  </text>
                </g>

                <!-- Nodes -->
                <g v-for="node in nodes" :key="node.id">
                  <circle
                    :cx="node.x"
                    :cy="node.y"
                    :r="node.type === 'main' ? 35 : 30"
                    :fill="node.type === 'main' ? '#ef4444' : '#3b82f6'"
                    stroke="white"
                    stroke-width="3"
                  />
                  <text
                    :x="node.x"
                    :y="node.y + 50"
                    :class="
                      css({
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fill: 'gray.900',
                        textAlign: 'center',
                      })
                    "
                    text-anchor="middle"
                  >
                    {{ node.id.split(' ')[0] }}
                  </text>
                  <text
                    :x="node.x"
                    :y="node.y + 65"
                    :class="
                      css({
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fill: 'gray.900',
                      })
                    "
                    text-anchor="middle"
                  >
                    {{ node.id.split(' ').slice(1).join(' ') }}
                  </text>
                </g>
              </svg>
            </div>

            <!-- Legend -->
            <div>
              <div :class="css({ display: 'flex', flexDirection: 'column', gap: '2' })">
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="
                      css({
                        w: '3',
                        h: '3',
                        bg: 'red.500',
                        borderRadius: 'full',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{
                    t('books.detail.legend.mainCharacter')
                  }}</span>
                </div>
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="
                      css({
                        w: '3',
                        h: '3',
                        bg: 'blue.500',
                        borderRadius: 'full',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{
                    t('books.detail.legend.minorCharacter')
                  }}</span>
                </div>
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="
                      css({
                        w: '6',
                        h: '0.5',
                        bg: 'green.500',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{
                    t('books.detail.legend.strongBond')
                  }}</span>
                </div>
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="
                      css({
                        w: '6',
                        h: '0.5',
                        bg: 'cyan.500',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{
                    t('books.detail.legend.weakConnect')
                  }}</span>
                </div>
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="
                      css({
                        w: '6',
                        h: '0.5',
                        bg: 'red.500',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{
                    t('books.detail.legend.meanConflict')
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Characters List -->
          <div>
            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '6',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  maxH: '800px',
                  overflowY: 'auto',
                })
              "
            >
              <h2
                :class="
                  css({
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'gray.900',
                    mb: '4',
                  })
                "
              >
                {{ t('books.detail.allCharacters') }}
              </h2>
              <div :class="css({ display: 'flex', flexDirection: 'column', gap: '3' })">
                <div
                  v-for="character in characters"
                  :key="character.id"
                  :class="
                    css({
                      borderRadius: '0.5rem',
                      p: '4',
                      border: '2px solid',
                      borderColor: selectedCharacter === character.id ? 'green.500' : 'gray.200',
                      bg: selectedCharacter === character.id ? 'green.50' : 'white',
                      _hover: { borderColor: 'green.500', boxShadow: 'sm' },
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    })
                  "
                  @click="toggleCharacterSelection(character.id)"
                >
                  <div
                    :class="css({ display: 'flex', alignItems: 'flex-start', gap: '3', mb: '3' })"
                  >
                    <h3
                      :class="
                        css({
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          color: 'gray.900',
                          flex: 1,
                        })
                      "
                    >
                      {{ character.name }}
                    </h3>
                    <span
                      v-if="character.isFeatured"
                      :class="
                        css({
                          px: '2',
                          py: '0.5',
                          bg: 'red.500',
                          color: 'white',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          borderRadius: '0.25rem',
                        })
                      "
                    >
                      {{ t('books.detail.featured') }}
                    </span>
                  </div>
                  <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '3' })">
                    {{ character.description }}
                  </p>
                  <div :class="css({ display: 'flex', gap: '2', flexWrap: 'wrap', mb: '3' })">
                    <span
                      v-for="tag in character.tags"
                      :key="tag"
                      :class="
                        css({
                          px: '2',
                          py: '0.5',
                          bg: 'gray.100',
                          color: 'gray.700',
                          fontSize: '0.625rem',
                          borderRadius: '9999px',
                        })
                      "
                    >
                      {{ t(tag) }}
                    </span>
                  </div>
                  <p :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '3' })">
                    💬
                    {{
                      t('books.detail.conversationsStarted', {
                        count: character.conversations.toLocaleString(),
                      })
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Any Button -->
        <div :class="css({ mt: '8', textAlign: 'center' })">
          <button
            data-testid="create-scenario-button"
            :disabled="selectedCharacter === null"
            :class="
              css({
                px: '12',
                py: '3',
                bg: selectedCharacter === null ? 'gray.300' : 'green.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: selectedCharacter === null ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: selectedCharacter === null ? 0.6 : 1,
                _hover:
                  selectedCharacter !== null
                    ? { bg: 'green.600', transform: 'translateY(-2px)' }
                    : {},
              })
            "
            @click="openScenarioModal"
          >
            {{
              selectedCharacter === null
                ? t('books.detail.selectCharacterButton')
                : t('books.detail.createCharacterScenario', {
                    name: characters.find((c) => c.id === selectedCharacter)?.name,
                  })
            }}
          </button>
        </div>

        <!-- Section Divider -->
        <div
          :class="
            css({
              h: '1px',
              bg: 'gray.200',
              my: '12',
            })
          "
        />

        <!-- Comments Section -->
        <section
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              p: '6',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            })
          "
        >
          <BookComments :book-id="bookId" />
        </section>
      </template>
    </main>

    <!-- Scenario Creation Modal -->
    <div
      v-if="showScenarioModal"
      :class="
        css({
          position: 'fixed',
          inset: 0,
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 50,
          px: '4',
          pt: '24',
          overflowY: 'auto',
        })
      "
      data-testid="scenario-modal"
      @click="closeScenarioModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '1rem',
            p: '5',
            maxW: 'xl',
            w: 'full',
            overflowY: 'hidden',
          })
        "
        @click.stop
      >
        <!-- Modal Header -->
        <div :class="css({ mb: '5' })">
          <h2
            :class="
              css({
                fontSize: '1.375rem',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '2',
              })
            "
          >
            {{ t('books.scenario.createTitle') }}
          </h2>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
            {{ t('books.scenario.createSubtitle') }}
          </p>
        </div>

        <div
          v-if="scenarioError"
          :class="
            css({
              mb: '4',
              p: '3',
              borderRadius: '0.5rem',
              border: '1px solid',
              borderColor: 'red.200',
              bg: 'red.50',
              color: 'red.700',
              fontSize: '0.875rem',
            })
          "
          data-testid="toast-error"
        >
          {{ scenarioError }}
        </div>

        <!-- Scenario Basics -->
        <div :class="css({ mb: '5', display: 'grid', gap: '3' })">
          <div>
            <label
              for="scenario-title"
              :class="css({ display: 'block', fontWeight: '600', mb: '2' })"
            >
              {{ t('books.scenario.titleLabel') || 'Scenario Title' }}
            </label>
            <input
              id="scenario-title"
              v-model="scenarioForm.scenarioTitle"
              data-testid="scenario-title-input"
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
              :placeholder="t('books.scenario.titlePlaceholder') || 'Enter scenario title'"
            />
          </div>

          <div>
            <div :class="css({ display: 'flex', justifyContent: 'space-between', mb: '2' })">
              <label for="what-if-question" :class="css({ display: 'block', fontWeight: '600' })">
                {{ t('books.scenario.whatIfLabel') || 'What if?' }}
              </label>
              <span
                :class="
                  css({
                    fontSize: '0.8125rem',
                    color: whatIfCharCount >= MIN_CHARS ? 'green.600' : 'gray.600',
                  })
                "
                data-testid="char-counter"
              >
                {{ whatIfCharCount }}/{{ MIN_CHARS }}
              </span>
            </div>
            <textarea
              id="what-if-question"
              v-model="scenarioForm.whatIfQuestion"
              data-testid="what-if-question-input"
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: isWhatIfValid ? 'gray.300' : 'red.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  minH: '16',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
              :placeholder="
                t('books.scenario.whatIfPlaceholder') || 'Describe your what-if question'
              "
            />
            <div
              v-if="scenarioForm.whatIfQuestion && !isWhatIfValid"
              :class="
                css({
                  mt: '2',
                  color: 'red.600',
                  fontSize: '0.875rem',
                })
              "
              data-testid="what-if-error"
            >
              {{ t('books.scenario.whatIfValidation') || 'Please enter at least 10 characters' }}
            </div>
          </div>
        </div>

        <!-- Character Info -->
        <div
          v-if="selectedCharacter"
          :class="
            css({
              bg: 'gray.50',
              borderRadius: '0.5rem',
              p: '3',
              mb: '4',
            })
          "
        >
          <div :class="css({ display: 'flex', alignItems: 'center', gap: '3', mb: '3' })">
            <div
              :class="
                css({
                  w: '12',
                  h: '12',
                  borderRadius: 'full',
                  bg: 'gray.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                })
              "
            >
              👤
            </div>
            <div>
              <h3 :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                {{ characters.find((c) => c.id === selectedCharacter)?.name }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
                {{ book.title }} by {{ book.author }}
              </p>
            </div>
          </div>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.6' })">
            {{ characters.find((c) => c.id === selectedCharacter)?.description }}
          </p>
        </div>

        <!-- Scenario Settings -->
        <div :class="css({ mb: '5' })">
          <h3
            :class="
              css({
                fontSize: '1rem',
                fontWeight: '600',
                color: 'gray.900',
                mb: '3',
              })
            "
          >
            {{ t('books.scenario.changesTitle') }}
          </h3>

          <!-- Character Property -->
          <div
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
                mb: '3',
              })
            "
          >
            <div :class="css({ display: 'flex', justifyContent: 'space-between', mb: '2' })">
              <h4
                :class="
                  css({ fontSize: '0.9375rem', fontWeight: '600', color: 'gray.900', mb: '2' })
                "
              >
                {{ t('books.scenario.characterProperty') }}
              </h4>
              <span
                :class="
                  css({
                    fontSize: '0.75rem',
                    color: getCharCountDisplay(scenarioForm.characterChanges, 'characterChanges')
                      .isValid
                      ? 'gray.500'
                      : 'red.500',
                  })
                "
              >
                {{ getCharCountDisplay(scenarioForm.characterChanges, 'characterChanges').text }}
                <span
                  v-if="
                    getCharCountDisplay(scenarioForm.characterChanges, 'characterChanges').showCheck
                  "
                  :class="css({ color: 'green.500', ml: '1' })"
                >
                  ✓
                </span>
              </span>
            </div>
            <textarea
              v-model="scenarioForm.characterChanges"
              data-testid="character-changes-input"
              placeholder="e.g., Change personality from reserved to outgoing"
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: isCharacterChangesValid ? 'gray.300' : 'red.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  minH: '16',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
            />
          </div>

          <!-- Event Alterations -->
          <div
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
                mb: '3',
              })
            "
          >
            <div :class="css({ display: 'flex', justifyContent: 'space-between', mb: '2' })">
              <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
                {{ t('books.scenario.eventAlterations') }}
              </h4>
              <span
                :class="
                  css({
                    fontSize: '0.75rem',
                    color: getCharCountDisplay(scenarioForm.eventAlterations, 'eventAlterations')
                      .isValid
                      ? 'gray.500'
                      : 'red.500',
                  })
                "
              >
                {{ getCharCountDisplay(scenarioForm.eventAlterations, 'eventAlterations').text }}
                <span
                  v-if="
                    getCharCountDisplay(scenarioForm.eventAlterations, 'eventAlterations').showCheck
                  "
                  :class="css({ color: 'green.500', ml: '1' })"
                >
                  ✓
                </span>
              </span>
            </div>
            <textarea
              v-model="scenarioForm.eventAlterations"
              data-testid="event-changes-input"
              placeholder="e.g., Character survives the confrontation"
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: isEventAlterationsValid ? 'gray.300' : 'red.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  minH: '20',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
            />
          </div>

          <!-- Setting Modifications -->
          <div
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
              })
            "
          >
            <div :class="css({ display: 'flex', justifyContent: 'space-between', mb: '2' })">
              <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
                {{ t('books.scenario.settingModifications') }}
              </h4>
              <span
                :class="
                  css({
                    fontSize: '0.75rem',
                    color: getCharCountDisplay(
                      scenarioForm.settingModifications,
                      'settingModifications'
                    ).isValid
                      ? 'gray.500'
                      : 'red.500',
                  })
                "
              >
                {{
                  getCharCountDisplay(scenarioForm.settingModifications, 'settingModifications')
                    .text
                }}
                <span
                  v-if="
                    getCharCountDisplay(scenarioForm.settingModifications, 'settingModifications')
                      .showCheck
                  "
                  :class="css({ color: 'green.500', ml: '1' })"
                >
                  ✓
                </span>
              </span>
            </div>
            <textarea
              v-model="scenarioForm.settingModifications"
              data-testid="setting-changes-input"
              placeholder="e.g., Story takes place in modern times instead of 1920s"
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: isSettingModificationsValid ? 'gray.300' : 'red.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  minH: '20',
                  outline: 'none',
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
            />
          </div>

          <!-- Validation Error Message -->
          <div
            v-if="showValidationError"
            :class="
              css({
                mt: '3',
                p: '3',
                bg: 'red.50',
                border: '1px solid',
                borderColor: 'red.200',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'red.700',
              })
            "
          >
            {{ t('books.scenario.validationError') }}
          </div>
        </div>

        <!-- Description -->
        <div :class="css({ mb: '5' })">
          <label
            for="scenario-description"
            :class="
              css({
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: '500',
                color: 'gray.700',
                mb: '2',
              })
            "
          >
            {{ t('books.scenario.descriptionLabel') }}
          </label>
          <textarea
            id="scenario-description"
            v-model="scenarioForm.description"
            data-testid="scenario-description-textarea"
            :class="
              css({
                w: 'full',
                px: '3',
                py: '2',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                minH: '20',
                outline: 'none',
                _focus: {
                  borderColor: 'green.500',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                },
              })
            "
            :placeholder="t('books.scenario.descriptionPlaceholder')"
          />
        </div>

        <!-- Action Buttons -->
        <div :class="css({ display: 'flex', gap: '3' })">
          <button
            data-testid="submit-scenario-button"
            :disabled="!isFormValid"
            :class="
              css({
                flex: 1,
                px: '4',
                py: '2.5',
                bg: isFormValid ? 'green.500' : 'gray.300',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                _hover: isFormValid ? { bg: 'green.600' } : {},
                opacity: isFormValid ? '1' : '0.6',
              })
            "
            @click="createScenario"
          >
            {{ t('books.detail.createScenario') }}
          </button>
          <button
            data-testid="cancel-button"
            :class="
              css({
                flex: 1,
                px: '4',
                py: '2.5',
                bg: 'white',
                color: 'gray.700',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: { bg: 'gray.50' },
              })
            "
            @click="closeScenarioModal"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
