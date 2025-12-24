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
const isLiked = ref(false)
const isLiking = ref(false)

// Scenario form state
const showScenarioModal = ref(false)

// Mock characters data (temporary until backend provides this)
const characters = ref<any[]>([])
const relationships = ref<any[]>([])
const selectedCharacter = ref<number | null>(null)

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

    // Check like status
    if (authStore.isAuthenticated && authStore.user?.id) {
      try {
        const likedBooks = await bookApi.getLikedBooks(authStore.user.id)
        isLiked.value = likedBooks.content.some((b: any) => b.id === bookId)
      } catch (e) {
        console.error('Failed to check like status', e)
      }
    }

    // Track book view
    try {
      trackBookViewed(String(data.id), data.title)
      console.log('[BookDetailPage] trackBookViewed success')
    } catch (trackErr) {
      console.error('[BookDetailPage] trackBookViewed failed:', trackErr)
    }

    // Fetch characters from backend
    try {
      const fetchedCharacters = await bookApi.getCharactersByBookId(bookId)
      
      // Transform backend response to UI format
      const transformedCharacters = (fetchedCharacters || []).map((char: any) => {
        // Get full persona (Ko > En > description)
        let fullDescription = char.personaKo || char.personaEn || char.description || 'No description available'
        
        // Extract first sentence for card display (한국어: 마침표/느낌표/물음표, 영어: period)
        let shortDescription = fullDescription
        const firstSentenceMatch = fullDescription.match(/^[^.!?。]+[.!?。]/)
        if (firstSentenceMatch) {
          shortDescription = firstSentenceMatch[0].trim()
        } else {
          // If no sentence ending found, take first 100 characters
          shortDescription = fullDescription.substring(0, 100) + (fullDescription.length > 100 ? '...' : '')
        }
        
        return {
          id: char.id,
          name: char.commonName || 'Unknown',
          isFeatured: char.isMainCharacter || false,
          description: shortDescription,
          vectordbCharacterId: char.vectordbCharacterId, // CRITICAL: For AI chat
          tags: [], // Backend doesn't provide tags yet
          conversations: 0 // Backend doesn't provide conversation count yet
        }
      })
      
      characters.value = transformedCharacters
      if (characters.value.length > 0) {
        selectedCharacter.value = characters.value[0].id
      }
    } catch (charErr: any) {
      console.error('[BookDetailPage] Failed to fetch characters:', charErr)
      // Don't fail the whole page if characters fail to load
      characters.value = []
    }
    console.log('[BookDetailPage] Book loaded successfully')

    // Initialize graph after data is loaded
    initializeGraph()
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

const handleLike = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (isLiking.value) return

  isLiking.value = true
  const previousState = isLiked.value

  try {
    // Optimistic update
    isLiked.value = !previousState

    if (previousState) {
      await bookApi.unlikeBook(bookId)
      if (book.value) book.value.likeCount = (book.value.likeCount || 0) - 1
    } else {
      await bookApi.likeBook(bookId)
      if (book.value) book.value.likeCount = (book.value.likeCount || 0) + 1
    }
  } catch (err) {
    console.error('Failed to toggle like:', err)
    isLiked.value = previousState // Revert
    // Revert count
    if (book.value) {
      book.value.likeCount = previousState
        ? (book.value.likeCount || 0) + 1
        : (book.value.likeCount || 0) - 1
    }
  } finally {
    isLiking.value = false
  }
}

// Load book data on mount
onMounted(() => {
  fetchBook()
})

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
      type: (book.value as any)?.characters?.find((c: any) => c.name === name)?.isFeatured
        ? 'main'
        : 'minor',
    }
  })

  edges.value = relationships.value
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
  console.log('[BookDetailPage] toggleCharacterSelection called with:', characterId)
  console.log('[BookDetailPage] authStore.isAuthenticated:', authStore.isAuthenticated)

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    console.log('[BookDetailPage] User not authenticated, redirecting...')
    // Redirect to login page
    router.push('/login')
    return
  }

  if (selectedCharacter.value === characterId) {
    selectedCharacter.value = null
  } else {
    selectedCharacter.value = characterId
  }
  console.log('[BookDetailPage] selectedCharacter:', selectedCharacter.value)
}

const openScenarioModal = () => {
  if (selectedCharacter.value === null) return
  showScenarioModal.value = true
}

const closeScenarioModal = () => {
  showScenarioModal.value = false
}

const handleScenarioCreated = (data: any) => {
  console.log('Scenario created:', data)
  closeScenarioModal()
}
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'gray.50' })">
    <AppHeader />

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
                  {{ book.conversationCount?.toLocaleString() ?? 0 }}
                </div>
              </div>
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  ❤️ {{ t('books.stats.likes') }}
                </div>
                <div :class="css({ display: 'flex', alignItems: 'center', gap: '2' })">
                  <div
                    :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })"
                  >
                    {{ book.likeCount ?? 0 }}
                  </div>
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
                  data-testid="character-card"
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
    <CreateScenarioModal
      v-if="showScenarioModal"
      :is-open="showScenarioModal"
      :book-title="book?.title || ''"
      :book-id="bookId"
      :selected-character-vectordb-id="characters.find(c => c.id === selectedCharacter)?.vectordbCharacterId"
      @close="closeScenarioModal"
      @created="handleScenarioCreated"
    />

    <AppFooter />
  </div>
</template>
