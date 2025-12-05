<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { css } from '../../styled-system/css'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { trackProfileViewed } = useAnalytics()
const authStore = useAuthStore()

// Mock user profile data
const userProfile = ref({
  username: route.params.username || 'johndoe',
  bio: 'Book lover and avid reader. Exploring alternative storylines in classic literature.',
  avatarUrl: '👤',
  joinedAt: 'January 2024',
})

// GA4: 프로필 조회 추적
onMounted(() => {
  const username = Array.isArray(route.params.username)
    ? route.params.username[0]
    : route.params.username || 'johndoe'
  const isOwnProfile = authStore.user?.username === username
  trackProfileViewed(username, isOwnProfile)
})

// Mock liked books
const likedBooks = ref([
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', cover: '📚' },
  { id: 2, title: 'Pride and Prejudice', author: 'Jane Austen', cover: '📕' },
  { id: 3, title: '1984', author: 'George Orwell', cover: '📘' },
])

// Mock liked conversations
const likedConversations = ref([
  {
    id: 1,
    title: "Exploring Gatsby's Symbolism",
    book: 'The Great Gatsby',
    preview: 'Oh, Ross Gannaway, our stories are sure to be finer compared...',
  },
  {
    id: 2,
    title: "Darcy's Pride Discussion",
    book: 'Pride and Prejudice',
    preview: 'My pride has been my constant companion...',
  },
  {
    id: 3,
    title: "Darcy's Pride Discussion",
    book: 'Pride and Prejudice',
    preview: 'My pride has been my constant companion...',
  },
])

// Mock my conversations
const myConversations = ref([
  {
    id: 1,
    title: "Exploring Gatsby's Symbolism",
    book: 'The Great Gatsby',
    character: 'Gatsby',
    preview: 'Oh, Ross Gannaway, our stories are sure to be finer compared...',
    likeCount: 45,
    timestamp: '5 days ago',
    cover: '📚',
  },
  {
    id: 2,
    title: "Darcy's Pride Discussion",
    book: 'Pride and Prejudice',
    character: 'Mr. Darcy',
    preview: 'My pride has been my constant companion...',
    likeCount: 32,
    timestamp: '2 hours ago',
    cover: '📕',
  },
  {
    id: 3,
    title: "Darcy's Pride Discussion",
    book: 'Pride and Prejudice',
    character: 'Elizabeth',
    preview: 'My pride has been my constant companion...',
    likeCount: 28,
    timestamp: '1 hours ago',
    cover: '📕',
  },
])

// Modal states
const showLikedBooksModal = ref(false)
const showFollowingModal = ref(false)
const showLikedConversationsModal = ref(false)
const showMyConversationsModal = ref(false)

// Delete confirmation modal state
const showDeleteConfirm = ref(false)
const deleteTarget = ref<{ type: string; id: number; title?: string } | null>(null)

// Pagination states
const likedBooksPage = ref(1)
const followingPage = ref(1)
const likedConversationsPage = ref(1)
const myConversationsPage = ref(1)
const itemsPerPage = 12

// Mock data for modals (더 많은 데이터)
const allLikedBooks = ref([
  ...likedBooks.value,
  { id: 4, title: 'To Kill a Mockingbird', author: 'Harper Lee', cover: '📗' },
  { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', cover: '📙' },
  { id: 6, title: 'Animal Farm', author: 'George Orwell', cover: '📔' },
  { id: 7, title: 'Lord of the Flies', author: 'William Golding', cover: '📓' },
  { id: 8, title: 'Brave New World', author: 'Aldous Huxley', cover: '📕' },
  { id: 9, title: 'Jane Eyre', author: 'Charlotte Brontë', cover: '📘' },
  { id: 10, title: 'Wuthering Heights', author: 'Emily Brontë', cover: '📚' },
])

const allFollowing = ref(
  Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    avatar: '👤',
  }))
)

const allLikedConversations = ref([
  ...likedConversations.value,
  { id: 4, title: "Winston's Rebellion", book: '1984', preview: 'The Party seeks power...' },
  {
    id: 5,
    title: "Scout's Perspective",
    book: 'To Kill a Mockingbird',
    preview: 'Atticus taught me...',
  },
])

const allMyConversations = ref([
  ...myConversations.value,
  {
    id: 4,
    title: 'Another Discussion',
    book: '1984',
    character: 'Winston',
    preview: 'Big Brother is watching...',
    likeCount: 20,
    timestamp: '3 days ago',
    cover: '📘',
  },
])

const goToConversation = (id: number) => {
  router.push(`/conversations/${id}`)
}

const requestDelete = (type: string, id: number, title?: string) => {
  deleteTarget.value = { type, id, title }
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  if (!deleteTarget.value) return

  const { type, id } = deleteTarget.value

  if (type === 'likedBook') {
    const index = allLikedBooks.value.findIndex((book) => book.id === id)
    if (index > -1) allLikedBooks.value.splice(index, 1)
  } else if (type === 'following') {
    const index = allFollowing.value.findIndex((user) => user.id === id)
    if (index > -1) allFollowing.value.splice(index, 1)
  } else if (type === 'likedConversation') {
    const index = allLikedConversations.value.findIndex((conv) => conv.id === id)
    if (index > -1) allLikedConversations.value.splice(index, 1)
  } else if (type === 'myConversation') {
    const index = allMyConversations.value.findIndex((conv) => conv.id === id)
    if (index > -1) allMyConversations.value.splice(index, 1)
  }

  showDeleteConfirm.value = false
  deleteTarget.value = null
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

// Pagination helpers
const getPaginatedItems = (items: any[], page: number) => {
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  return items.slice(start, end)
}

const getTotalPages = (totalItems: number) => {
  return Math.ceil(totalItems / itemsPerPage)
}
</script>

<template>
  <div :class="css({ display: 'flex', flexDirection: 'column', minH: '100vh', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <!-- Main Content -->
    <div :class="css({ flex: 1, maxW: '1400px', w: 'full', mx: 'auto', px: '6', py: '8' })">
      <!-- Top Section: Profile + Like Lists -->
      <div :class="css({ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '6', mb: '8' })">
        <!-- Profile Card -->
        <div
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              p: '6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            })
          "
        >
          <h2
            :class="
              css({
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '6',
                alignSelf: 'flex-start',
              })
            "
          >
            Profile
          </h2>

          <!-- Avatar -->
          <div
            :class="
              css({
                w: '32',
                h: '32',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                mb: '6',
              })
            "
          >
            {{ userProfile.avatarUrl }}
          </div>

          <!-- Info Section -->
          <div
            :class="
              css({
                w: 'full',
                bg: 'gray.100',
                borderRadius: '0.5rem',
                p: '4',
                textAlign: 'center',
              })
            "
          >
            <p :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '2' })">
              @{{ userProfile.username }}
            </p>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.5' })">
              {{ userProfile.bio }}
            </p>
          </div>
        </div>

        <!-- Like Lists Container -->
        <div :class="css({ display: 'flex', flexDirection: 'column', gap: '6' })">
          <!-- Like Book List -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              })
            "
          >
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '4',
                })
              "
            >
              <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
                Like Book List
              </h2>
              <button
                :class="
                  css({
                    px: '3',
                    py: '1.5',
                    bg: 'green.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    _hover: { bg: 'green.600' },
                  })
                "
                @click="showLikedBooksModal = true"
              >
                View All
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '4', overflowX: 'auto', pb: '2' })">
              <div
                v-for="book in likedBooks"
                :key="book.id"
                :class="
                  css({
                    minW: '32',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '4',
                    textAlign: 'center',

                    pointerEvents: 'none',
                  })
                "
              >
                <div :class="css({ fontSize: '3rem', mb: '2' })">{{ book.cover }}</div>
                <p :class="css({ fontSize: '0.875rem', fontWeight: '600', color: 'gray.900' })">
                  {{ book.title }}
                </p>
              </div>
            </div>
          </div>

          <!-- Following List (Right Side) -->
          <div
            :class="
              css({
                bg: 'white',
                borderRadius: '0.75rem',
                p: '6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              })
            "
          >
            <div
              :class="
                css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: '4',
                })
              "
            >
              <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
                Following List
              </h2>
              <button
                :class="
                  css({
                    px: '3',
                    py: '1.5',
                    bg: 'green.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    _hover: { bg: 'green.600' },
                  })
                "
                @click="showFollowingModal = true"
              >
                View All
              </button>
            </div>
            <div :class="css({ display: 'flex', gap: '3', overflowX: 'auto', pb: '2' })">
              <div
                v-for="i in 5"
                :key="i"
                :class="
                  css({
                    minW: '20',
                    bg: 'gray.100',
                    borderRadius: '0.5rem',
                    p: '3',
                    textAlign: 'center',

                    pointerEvents: 'none',
                  })
                "
              >
                <div :class="css({ fontSize: '2rem', mb: '1' })">👤</div>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">User {{ i }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Like Conversation List -->
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            mb: '8',
          })
        "
      >
        <div
          :class="
            css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '4' })
          "
        >
          <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
            Like Conversation List
          </h2>
          <button
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: 'green.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'green.600' },
              })
            "
            @click="showLikedConversationsModal = true"
          >
            View All
          </button>
        </div>
        <div :class="css({ display: 'flex', gap: '4', overflowX: 'auto', pb: '2' })">
          <div
            v-for="conv in likedConversations"
            :key="conv.id"
            :class="
              css({
                minW: '80',
                bg: 'gray.50',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
                pointerEvents: 'none',
              })
            "
          >
            <h3 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '2' })">
              {{ conv.title }}
            </h3>
            <p :class="css({ fontSize: '0.75rem', color: 'gray.600', mb: '2' })">{{ conv.book }}</p>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.5' })">
              {{ conv.preview }}
            </p>
          </div>
        </div>
      </div>

      <!-- My Conversations -->
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            p: '6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          })
        "
      >
        <div
          :class="
            css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '4' })
          "
        >
          <h2 :class="css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900' })">
            My Conversations
          </h2>
          <button
            :class="
              css({
                px: '4',
                py: '2',
                bg: 'green.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'green.600' },
              })
            "
            @click="showMyConversationsModal = true"
          >
            View All Conversations
          </button>
        </div>

        <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })">
          <div
            v-for="conv in myConversations"
            :key="conv.id"
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '4',
                cursor: 'pointer',
                _hover: { borderColor: 'green.500', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' },
              })
            "
            @click="goToConversation(conv.id)"
          >
            <div :class="css({ display: 'flex', gap: '3', mb: '3' })">
              <div
                :class="
                  css({
                    w: '16',
                    h: '20',
                    bg: 'gray.200',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                  })
                "
              >
                {{ conv.cover }}
              </div>
              <div :class="css({ flex: 1, minW: 0 })">
                <div
                  :class="
                    css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      mb: '1',
                    })
                  "
                >
                  <span
                    :class="
                      css({
                        w: '2',
                        h: '2',
                        bg: 'green.500',
                        borderRadius: 'full',
                      })
                    "
                  />
                  <span :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{
                    conv.character
                  }}</span>
                </div>
                <h3
                  :class="
                    css({
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'gray.900',
                      mb: '1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    })
                  "
                >
                  {{ conv.title }}
                </h3>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{ conv.book }}</p>
              </div>
            </div>

            <p
              :class="
                css({
                  fontSize: '0.875rem',
                  color: 'gray.700',
                  lineHeight: '1.5',
                  mb: '3',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                })
              "
            >
              {{ conv.preview }}
            </p>

            <div
              :class="
                css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
              "
            >
              <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })"
                >♥ {{ conv.likeCount }}</span
              >
              <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })">{{
                conv.timestamp
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Liked Books Modal -->
    <div
      v-if="showLikedBooksModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '4xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Liked Books
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showLikedBooksModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4' })">
            <div
              v-for="book in getPaginatedItems(allLikedBooks, likedBooksPage)"
              :key="book.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  p: '4',
                  textAlign: 'center',
                  cursor: 'pointer',
                  _hover: { bg: 'gray.200' },
                })
              "
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '2',
                    right: '2',
                    w: '6',
                    h: '6',
                    bg: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'gray.800' },
                  })
                "
                @click.stop="requestDelete('likedBook', book.id, book.title)"
              >
                ✕
              </button>
              <div :class="css({ fontSize: '4rem', mb: '2' })">{{ book.cover }}</div>
              <p :class="css({ fontSize: '0.875rem', fontWeight: '600', color: 'gray.900' })">
                {{ book.title }}
              </p>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{ book.author }}</p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allLikedBooks.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: likedBooksPage === page ? 'green.500' : 'gray.200',
                color: likedBooksPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="likedBooksPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Following Modal -->
    <div
      v-if="showFollowingModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '4xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Following
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showFollowingModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4' })">
            <div
              v-for="user in getPaginatedItems(allFollowing, followingPage)"
              :key="user.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'gray.100',
                  borderRadius: '0.5rem',
                  p: '3',
                  textAlign: 'center',
                  cursor: 'pointer',
                  _hover: { bg: 'gray.200' },
                })
              "
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '1',
                    right: '1',
                    w: '5',
                    h: '5',
                    bg: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.625rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'gray.800' },
                  })
                "
                @click.stop="requestDelete('following', user.id, user.username)"
              >
                ✕
              </button>
              <div :class="css({ fontSize: '2.5rem', mb: '1' })">{{ user.avatar }}</div>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.700' })">{{ user.username }}</p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allFollowing.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: followingPage === page ? 'green.500' : 'gray.200',
                color: followingPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="followingPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Liked Conversations Modal -->
    <div
      v-if="showLikedConversationsModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '5xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All Liked Conversations
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showLikedConversationsModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4' })">
            <div
              v-for="conv in getPaginatedItems(allLikedConversations, likedConversationsPage)"
              :key="conv.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'gray.50',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: '0.5rem',
                  p: '4',
                  cursor: 'pointer',
                  _hover: { borderColor: 'green.500', bg: 'green.50' },
                })
              "
              @click="goToConversation(conv.id)"
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '2',
                    right: '2',
                    w: '6',
                    h: '6',
                    bg: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'gray.800' },
                  })
                "
                @click.stop="requestDelete('likedConversation', conv.id, conv.title)"
              >
                ✕
              </button>
              <h3 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '2' })">
                {{ conv.title }}
              </h3>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.600', mb: '2' })">
                {{ conv.book }}
              </p>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.5' })">
                {{ conv.preview }}
              </p>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allLikedConversations.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: likedConversationsPage === page ? 'green.500' : 'gray.200',
                color: likedConversationsPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="likedConversationsPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- My Conversations Modal -->
    <div
      v-if="showMyConversationsModal"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
        })
      "
      @click="closeModal"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: '6xl',
            maxH: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          })
        "
        @click.stop
      >
        <div
          :class="
            css({
              p: '6',
              borderBottom: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })
          "
        >
          <h3 :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'gray.900' })">
            All My Conversations
          </h3>
          <button
            :class="
              css({
                fontSize: '1.5rem',
                color: 'gray.500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'gray.700' },
              })
            "
            @click="showMyConversationsModal = false"
          >
            ✕
          </button>
        </div>
        <div :class="css({ flex: 1, overflowY: 'auto', p: '6' })">
          <div :class="css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4' })">
            <div
              v-for="conv in getPaginatedItems(allMyConversations, myConversationsPage)"
              :key="conv.id"
              :class="
                css({
                  position: 'relative',
                  bg: 'white',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: '0.5rem',
                  p: '4',
                  cursor: 'pointer',
                  _hover: { borderColor: 'green.500', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' },
                })
              "
              @click="goToConversation(conv.id)"
            >
              <button
                :class="
                  css({
                    position: 'absolute',
                    top: '2',
                    right: '2',
                    w: '6',
                    h: '6',
                    bg: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    _hover: { bg: 'gray.800' },
                  })
                "
                @click.stop="requestDelete('myConversation', conv.id, conv.title)"
              >
                ✕
              </button>
              <div :class="css({ display: 'flex', gap: '3', mb: '3' })">
                <div
                  :class="
                    css({
                      w: '16',
                      h: '20',
                      bg: 'gray.200',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    })
                  "
                >
                  {{ conv.cover }}
                </div>
                <div :class="css({ flex: 1, minW: 0 })">
                  <div
                    :class="
                      css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2',
                        mb: '1',
                      })
                    "
                  >
                    <span
                      :class="
                        css({
                          w: '2',
                          h: '2',
                          bg: 'green.500',
                          borderRadius: 'full',
                        })
                      "
                    />
                    <span :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{
                      conv.character
                    }}</span>
                  </div>
                  <h3
                    :class="
                      css({
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'gray.900',
                        mb: '1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      })
                    "
                  >
                    {{ conv.title }}
                  </h3>
                  <p :class="css({ fontSize: '0.75rem', color: 'gray.600' })">{{ conv.book }}</p>
                </div>
              </div>

              <p
                :class="
                  css({
                    fontSize: '0.875rem',
                    color: 'gray.700',
                    lineHeight: '1.5',
                    mb: '3',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  })
                "
              >
                {{ conv.preview }}
              </p>

              <div
                :class="
                  css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
                "
              >
                <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })"
                  >♥ {{ conv.likeCount }}</span
                >
                <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })">{{
                  conv.timestamp
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          :class="
            css({
              p: '4',
              borderTop: '1px solid',
              borderColor: 'gray.200',
              display: 'flex',
              justifyContent: 'center',
              gap: '2',
            })
          "
        >
          <button
            v-for="page in getTotalPages(allMyConversations.length)"
            :key="page"
            :class="
              css({
                px: '3',
                py: '1.5',
                bg: myConversationsPage === page ? 'green.500' : 'gray.200',
                color: myConversationsPage === page ? 'white' : 'gray.700',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                _hover: { opacity: 0.8 },
              })
            "
            @click="myConversationsPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      :class="
        css({
          position: 'fixed',
          inset: '0',
          bg: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '60',
        })
      "
      @click="cancelDelete"
    >
      <div
        :class="
          css({
            bg: 'white',
            borderRadius: '0.75rem',
            w: 'full',
            maxW: 'md',
            p: '6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          })
        "
        @click.stop
      >
        <h3
          :class="
            css({
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'gray.900',
              mb: '4',
              textAlign: 'center',
            })
          "
        >
          Delete Confirmation
        </h3>
        <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2', textAlign: 'center' })">
          Are you sure you want to delete this item?
        </p>
        <p
          v-if="deleteTarget?.title"
          :class="
            css({
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'gray.900',
              mb: '6',
              textAlign: 'center',
            })
          "
        >
          "{{ deleteTarget.title }}"
        </p>
        <div :class="css({ display: 'flex', gap: '3', justifyContent: 'center' })">
          <button
            :class="
              css({
                px: '6',
                py: '2.5',
                bg: 'gray.200',
                color: 'gray.700',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'gray.300' },
              })
            "
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            :class="
              css({
                px: '6',
                py: '2.5',
                bg: 'red.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                _hover: { bg: 'red.600' },
              })
            "
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
