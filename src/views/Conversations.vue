<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ForkScenarioModal from '@/components/scenario/ForkScenarioModal.vue'
import { getConversations, type ConversationSummary } from '@/services/conversationApi'
import type { BrowseScenario } from '@/types'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const { success, error: showErrorToast } = useToast()
const authStore = useAuthStore()
const conversations = ref<ConversationSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedGenre = ref(t('conversations.filters.allGenres'))
const sortOption = ref(t('conversations.sort.latest'))
const showForkModal = ref(false)
const selectedScenario = ref<BrowseScenario | null>(null)

const genres = [
  t('conversations.filters.allGenres'),
  t('conversations.filters.romance'),
  t('conversations.filters.classic'),
  t('conversations.filters.genre'),
  t('conversations.filters.adventure'),
  t('conversations.filters.dystopian'),
]
const sortOptions = [
  t('conversations.sort.latest'),
  t('conversations.sort.recommended'),
  t('conversations.sort.popular'),
]

// Map display values to API values
const genreToApiValue = (displayValue: string): string | undefined => {
  const genreMap: Record<string, string | undefined> = {
    [t('conversations.filters.allGenres')]: undefined,
    [t('conversations.filters.romance')]: 'Romance',
    [t('conversations.filters.classic')]: 'Classic',
    [t('conversations.filters.genre')]: 'Genre',
    [t('conversations.filters.adventure')]: 'Adventure',
    [t('conversations.filters.dystopian')]: 'Dystopian',
  }
  return genreMap[displayValue]
}

const sortToApiValue = (displayValue: string): string => {
  const sortMap: Record<string, string> = {
    [t('conversations.sort.latest')]: 'latest',
    [t('conversations.sort.recommended')]: 'recommended',
    [t('conversations.sort.popular')]: 'popular',
  }
  return sortMap[displayValue] || 'latest'
}

const fetchConversations = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await getConversations({
      filter: 'public',
      search: searchQuery.value,
      genre: genreToApiValue(selectedGenre.value),
      sort: sortToApiValue(sortOption.value),
      size: 50,
    })
    conversations.value = data.filter((c) => c.isRoot)
  } catch (err) {
    console.error('Failed to load conversations:', err)
    error.value = t('conversations.error')
  } finally {
    loading.value = false
  }
}

watch([searchQuery, selectedGenre, sortOption], () => {
  // Debounce search if needed, but for now direct call
  fetchConversations()
})

onMounted(() => {
  fetchConversations()
})

const navigateToConversation = (id: string): void => {
  router.push(`/conversations/${id}`)
}

const navigateToBook = (e: Event, bookId?: string): void => {
  e.stopPropagation()
  if (bookId) {
    router.push(`/books/${bookId}`)
  } else {
    router.push('/books')
  }
}

// Helper to get random tags for UI fidelity (since backend doesn't provide them yet)
const getTags = (conv: ConversationSummary) => {
  const baseTags = [t('conversations.tags.character'), t('conversations.tags.situation')]
  if (conv.bookTitle?.includes('Pride'))
    return [...baseTags, t('conversations.tags.romance'), t('conversations.tags.classic')]
  if (conv.bookTitle?.includes('1984'))
    return [...baseTags, t('conversations.tags.dystopian'), t('conversations.tags.political')]
  return [...baseTags, t('conversations.tags.event')]
}

const handleForkChat = async (scenarioId: string) => {
  if (!authStore.isAuthenticated) {
    showErrorToast('Please login to fork a scenario')
    router.push('/login')
    return
  }

  try {
    const response = await api.get(`/scenarios/${scenarioId}`)
    selectedScenario.value = response.data
    showForkModal.value = true
  } catch (err) {
    console.error('Failed to load scenario for forking:', err)
    showErrorToast('Failed to load scenario details')
  }
}

const handleForked = (forkedConversation: { id: string }) => {
  showForkModal.value = false
  success('🍴 Scenario forked! Starting conversation...', 3000)
  router.push(`/conversations/${forkedConversation.id}`)
}
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'white' })">
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
      <!-- Filters & Sort -->
      <div
        :class="
          css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '8',
            flexWrap: 'wrap',
            gap: '4',
          })
        "
      >
        <div :class="css({ display: 'flex', gap: '2', flexWrap: 'wrap' })">
          <button
            v-for="genre in genres"
            :key="genre"
            :class="
              css({
                px: '4',
                py: '1.5',
                borderRadius: 'full',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: selectedGenre === genre ? 'green.600' : 'gray.100',
                color: selectedGenre === genre ? 'white' : 'gray.700',
                _hover: {
                  bg: selectedGenre === genre ? 'green.700' : 'gray.200',
                },
              })
            "
            @click="selectedGenre = genre"
          >
            {{ genre }}
          </button>
        </div>

        <div :class="css({ display: 'flex', bg: 'gray.100', borderRadius: 'md', p: '1' })">
          <button
            v-for="option in sortOptions"
            :key="option"
            :class="
              css({
                px: '3',
                py: '1',
                borderRadius: 'sm',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bg: sortOption === option ? 'green.600' : 'transparent',
                color: sortOption === option ? 'white' : 'gray.500',
              })
            "
            @click="sortOption = option"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Count -->
      <div :class="css({ mb: '6', fontSize: '0.875rem', color: 'gray.500' })">
        {{ conversations.length }} {{ t('conversations.count.available') }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" :class="css({ textAlign: 'center', py: '12' })">
        {{ t('conversations.loading') }}
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="css({ textAlign: 'center', py: '12', color: 'red.500' })">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="conversations.length === 0"
        :class="css({ textAlign: 'center', py: '12', color: 'gray.500' })"
      >
        {{ t('conversations.empty') }}
      </div>

      <!-- Conversations Grid -->
      <div
        v-else
        :class="
          css({
            display: 'grid',
            gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: '6',
          })
        "
      >
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="
            css({
              bg: 'white',
              borderRadius: 'xl',
              border: '1px solid',
              borderColor: 'gray.200',
              p: '6',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              _hover: {
                borderColor: 'green.500',
                boxShadow: 'md',
              },
            })
          "
        >
          <!-- Card Header -->
          <div :class="css({ display: 'flex', gap: '4', mb: '4' })">
            <!-- Avatar -->
            <div
              :class="
                css({
                  w: '12',
                  h: '12',
                  flexShrink: 0,
                  borderRadius: 'full',
                  overflow: 'hidden',
                  bg: 'gray.200',
                })
              "
            >
              <img
                v-if="conv.bookCoverUrl"
                :src="conv.bookCoverUrl"
                :alt="conv.title"
                :class="css({ w: 'full', h: 'full', objectFit: 'cover' })"
              />
              <div
                v-else
                :class="
                  css({
                    w: 'full',
                    h: 'full',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                👤
              </div>
            </div>

            <!-- Title & Subtitle -->
            <div :class="css({ flex: 1, minW: 0 })">
              <h3
                :class="
                  css({
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: 'gray.900',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })
                "
              >
                {{ conv.title }}
              </h3>
              <p
                :class="
                  css({
                    fontSize: '0.75rem',
                    color: 'gray.500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  })
                "
              >
                {{ conv.bookTitle || t('conversations.unknown.book') }} {{ t('conversations.by') }}
                {{ conv.bookAuthor || t('conversations.unknown.author') }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <p
            :class="
              css({
                fontSize: '0.875rem',
                color: 'gray.600',
                mb: '4',
                h: '2.5em',
                lineHeight: '1.25em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              })
            "
            :style="{
              display: '-webkit-box',
              '-webkit-line-clamp': '2',
              '-webkit-box-orient': 'vertical',
            }"
          >
            {{ conv.scenarioDescription || t('conversations.noDescription') }}
          </p>

          <!-- Tags -->
          <div
            :class="css({ display: 'flex', gap: '2', mb: '3', flexWrap: 'wrap', minH: '1.5rem' })"
          >
            <span
              v-for="tag in getTags(conv)"
              :key="tag"
              :class="
                css({
                  px: '2',
                  py: '0.5',
                  bg: 'gray.100',
                  color: 'gray.600',
                  borderRadius: 'md',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                })
              "
            >
              {{ tag }}
            </span>
          </div>

          <!-- Stats -->
          <div
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                mb: '4',
                fontSize: '0.75rem',
                color: 'gray.500',
              })
            "
          >
            <span>💬 {{ conv.messageCount || 0 }} {{ t('conversations.messageCount') }}</span>
          </div>

          <!-- Spacer to push actions to bottom -->
          <div :class="css({ flex: 1 })" />

          <!-- Actions -->
          <div :class="css({ display: 'flex', gap: '2' })">
            <button
              :class="
                css({
                  flex: 1,
                  bg: 'green.500',
                  color: 'white',
                  py: '2',
                  borderRadius: 'md',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'bg 0.2s',
                  _hover: { bg: 'green.600' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2',
                })
              "
              @click="handleForkChat(conv.scenarioId)"
            >
              <span>🍴</span> {{ t('conversations.actions.forkChat') }}
            </button>
            <button
              :class="
                css({
                  px: '3',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: 'md',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: { bg: 'gray.50' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                })
              "
              :title="t('conversations.actions.goToBook')"
              @click="(e) => navigateToBook(e, conv.bookId)"
            >
              📖
            </button>
          </div>
        </div>
      </div>
    </main>

    <ForkScenarioModal
      v-if="showForkModal && selectedScenario"
      :parent-scenario="selectedScenario"
      :is-open="showForkModal"
      @close="showForkModal = false"
      @forked="handleForked"
    />

    <AppFooter />
  </div>
</template>
