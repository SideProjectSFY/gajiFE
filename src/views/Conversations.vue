<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { getConversations, type ConversationSummary } from '@/services/conversationApi'

const router = useRouter()
const conversations = ref<ConversationSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedGenre = ref('All Genres')
const sortOption = ref('Latest')

const genres = ['All Genres', 'Romance', 'Classic', 'Genre', 'Adventure', 'Dystopian']
const sortOptions = ['Latest', 'Recommended', 'Popular']

onMounted(async () => {
  try {
    loading.value = true
    // Fetch ALL public conversations
    const data = await getConversations({ filter: 'public', size: 50 })
    conversations.value = data
  } catch (err) {
    console.error('Failed to load conversations:', err)
    error.value = 'Failed to load conversations.'
  } finally {
    loading.value = false
  }
})

const filteredConversations = computed(() => {
  let result = conversations.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.bookTitle?.toLowerCase().includes(query) ||
        c.bookAuthor?.toLowerCase().includes(query)
    )
  }

  // Genre filter (Mock implementation - assumes genre is in tags or book metadata which we might not have fully)
  // For now, just return all if 'All Genres'
  if (selectedGenre.value !== 'All Genres') {
    // If we had genre data, we would filter here.
    // For demo purposes, we'll just show all or maybe filter by random assignment if needed,
    // but better to just show all to avoid empty states.
  }

  return result
})

const navigateToConversation = (id: string): void => {
  router.push(`/conversations/${id}`)
}

const navigateToBook = (e: Event, bookTitle?: string): void => {
  e.stopPropagation()
  // In a real app, we'd navigate to book detail.
  // Since we don't have book ID easily here without joining, we'll just go to books page.
  router.push('/books')
}

// Helper to get random tags for UI fidelity (since backend doesn't provide them yet)
const getTags = (conv: ConversationSummary) => {
  const baseTags = ['Character', 'Situation']
  if (conv.bookTitle?.includes('Pride')) return [...baseTags, 'Romance', 'Classic']
  if (conv.bookTitle?.includes('1984')) return [...baseTags, 'Dystopian', 'Political']
  return [...baseTags, 'Event']
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
            @click="selectedGenre = genre"
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
          >
            {{ genre }}
          </button>
        </div>

        <div :class="css({ display: 'flex', bg: 'gray.100', borderRadius: 'md', p: '1' })">
          <button
            v-for="option in sortOptions"
            :key="option"
            @click="sortOption = option"
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
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Count -->
      <div :class="css({ mb: '6', fontSize: '0.875rem', color: 'gray.500' })">
        {{ filteredConversations.length }} conversations available
      </div>

      <!-- Loading State -->
      <div v-if="loading" :class="css({ textAlign: 'center', py: '12' })">
        Loading conversations...
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="css({ textAlign: 'center', py: '12', color: 'red.500' })">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredConversations.length === 0"
        :class="css({ textAlign: 'center', py: '12', color: 'gray.500' })"
      >
        No conversations found.
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
          v-for="conv in filteredConversations"
          :key="conv.id"
          :class="
            css({
              bg: 'white',
              borderRadius: 'xl',
              border: '1px solid',
              borderColor: 'gray.200',
              p: '6',
              transition: 'all 0.2s',
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
                    lineClamp: '1',
                  })
                "
              >
                {{ conv.title }}
              </h3>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.500', lineClamp: '1' })">
                {{ conv.bookTitle || 'Unknown Book' }} by {{ conv.bookAuthor || 'Unknown Author' }}
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
                lineClamp: '3',
                h: '4.5em', // Fixed height for alignment
              })
            "
          >
            {{ conv.scenarioDescription || 'No description available for this conversation.' }}
          </p>

          <!-- Tags -->
          <div :class="css({ display: 'flex', gap: '2', mb: '4', flexWrap: 'wrap' })">
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
            <span>💬 {{ conv.messageCount || 0 }} conversations</span>
          </div>

          <!-- Actions -->
          <div :class="css({ display: 'flex', gap: '2' })">
            <button
              @click="navigateToConversation(conv.id)"
              :class="
                css({
                  flex: 1,
                  bg: 'green.600',
                  color: 'white',
                  py: '2',
                  borderRadius: 'md',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'bg 0.2s',
                  _hover: { bg: 'green.700' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2',
                })
              "
            >
              <span>💬</span> Start Chat
            </button>
            <button
              @click="(e) => navigateToBook(e, conv.bookTitle)"
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
              title="Go to Book"
            >
              📖
            </button>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
