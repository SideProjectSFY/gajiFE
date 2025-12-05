<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const router = useRouter()

const selectedGenres = ref<string[]>([])
const searchQuery = ref('')

const genres = ['Romance', 'Classic', 'Social Commentary', 'Historical', 'Drama']

const viewCharacters = (bookId: number) => {
  console.log('=== viewCharacters START ===')
  console.log('bookId:', bookId)
  console.log('router:', router)
  console.log('Navigating to:', `/books/${bookId}`)

  try {
    router.push(`/books/${bookId}`)
    console.log('router.push called successfully')
  } catch (error) {
    console.error('Error in router.push:', error)
  }

  console.log('=== viewCharacters END ===')
}

const books = ref([
  {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald, 1925',
    description: 'A story of decadence, idealism, and the American Dream in the Jazz Age',
    tags: ['Classic', 'Drama', 'Historical'],
    image: '/book-covers/great-gatsby.jpg',
  },
  {
    id: 2,
    title: 'Pride and Prejudice',
    author: 'Jane Austen, 1813',
    description: 'A romantic novel of manners set in Georgian England',
    tags: ['Romance', 'Classic', 'Social Commentary'],
    image: '/book-covers/pride-prejudice.jpg',
  },
  {
    id: 3,
    title: '1984',
    author: 'George Orwell, 1949',
    description: 'A dystopian novel about totalitarianism and surveillance',
    tags: ['Classic', 'Drama', 'Social Commentary'],
    image: '/book-covers/1984.jpg',
  },
  {
    id: 4,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee, 1960',
    description: 'A story of racial injustice and childhood innocence in the American South',
    tags: ['Classic', 'Drama', 'Social Commentary'],
    image: '/book-covers/mockingbird.jpg',
  },
  {
    id: 5,
    title: 'Jane Eyre',
    author: 'Charlotte Brontë, 1847',
    description: 'A coming-of-age story of an orphaned girl who becomes a governess',
    tags: ['Romance', 'Classic', 'Drama'],
    image: '/book-covers/jane-eyre.jpg',
  },
  {
    id: 6,
    title: 'Wuthering Heights',
    author: 'Emily Brontë, 1847',
    description: 'A tale of passionate and destructive love on the Yorkshire moors',
    tags: ['Romance', 'Classic', 'Drama'],
    image: '/book-covers/wuthering-heights.jpg',
  },
])

const toggleGenre = (genre: string) => {
  const index = selectedGenres.value.indexOf(genre)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(genre)
  }
}

const clearFilters = () => {
  selectedGenres.value = []
  searchQuery.value = ''
}

const filteredBooks = computed(() => {
  return books.value.filter((book) => {
    // 검색어 필터링
    const matchesSearch =
      searchQuery.value === '' ||
      book.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    // 장르 필터링 (선택된 장르가 없으면 모두 표시)
    const matchesGenre =
      selectedGenres.value.length === 0 ||
      selectedGenres.value.some((genre) => book.tags.includes(genre))

    return matchesSearch && matchesGenre
  })
})
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
      <!-- Header -->
      <div :class="css({ mb: '8' })">
        <h1
          :class="
            css({
              fontSize: { base: '2rem', md: '2.5rem' },
              fontWeight: 'bold',
              color: 'gray.900',
              mb: '2',
            })
          "
        >
          All Books
        </h1>
        <p :class="css({ fontSize: '1rem', color: 'gray.600' })">
          {{ filteredBooks.length }} books available
        </p>
      </div>

      <!-- Search Bar -->
      <div :class="css({ mb: '6' })">
        <div :class="css({ position: 'relative', maxW: '600px' })">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title, author, or description..."
            :class="
              css({
                w: 'full',
                px: '4',
                py: '3',
                pl: '12',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                _focus: {
                  borderColor: 'green.500',
                  boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                },
              })
            "
          />
          <span
            :class="
              css({
                position: 'absolute',
                left: '4',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.25rem',
              })
            "
          >
            🔍
          </span>
        </div>
      </div>

      <!-- Filters -->
      <div :class="css({ mb: '8' })">
        <div
          :class="
            css({ display: 'flex', alignItems: 'center', gap: '3', mb: '4', flexWrap: 'wrap' })
          "
        >
          <span :class="css({ fontSize: '1rem', fontWeight: '500', color: 'gray.700' })">
            📚 Genre Filters:
          </span>
          <button
            v-for="genre in genres"
            :key="genre"
            :class="
              css({
                px: '4',
                py: '1.5',
                bg: selectedGenres.includes(genre) ? 'green.500' : 'white',
                color: selectedGenres.includes(genre) ? 'white' : 'gray.700',
                border: '1px solid',
                borderColor: selectedGenres.includes(genre) ? 'green.500' : 'gray.300',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: selectedGenres.includes(genre) ? 'green.600' : 'gray.50',
                },
              })
            "
            @click="toggleGenre(genre)"
          >
            {{ genre }}
          </button>
          <button
            v-if="selectedGenres.length > 0 || searchQuery"
            :class="
              css({
                px: '4',
                py: '1.5',
                bg: 'gray.200',
                color: 'gray.700',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: { bg: 'gray.300' },
              })
            "
            @click="clearFilters"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Books Grid -->
      <div
        :class="
          css({
            display: 'grid',
            gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: '6',
          })
        "
      >
        <div
          v-for="book in filteredBooks"
          :key="book.id"
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              _hover: {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)',
              },
            })
          "
        >
          <!-- Book Cover -->
          <div
            :class="
              css({
                w: 'full',
                h: '80',
                bg: 'gray.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid',
                borderColor: 'gray.200',
              })
            "
          >
            <span :class="css({ fontSize: '4rem' })">📚</span>
          </div>

          <!-- Book Info -->
          <div :class="css({ p: '6' })">
            <h3
              :class="
                css({
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              {{ book.title }}
            </h3>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '3' })">
              {{ book.author }}
            </p>
            <p
              :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6', mb: '4' })"
            >
              {{ book.description }}
            </p>

            <!-- Tags -->
            <div :class="css({ display: 'flex', gap: '2', flexWrap: 'wrap', mb: '4' })">
              <span
                v-for="tag in book.tags"
                :key="tag"
                :class="
                  css({
                    px: '3',
                    py: '1',
                    bg: 'gray.100',
                    color: 'gray.700',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                  })
                "
              >
                {{ tag }}
              </span>
            </div>

            <!-- View Characters Button -->
            <button
              type="button"
              :class="
                css({
                  w: 'full',
                  px: '4',
                  py: '2.5',
                  bg: 'green.500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: { bg: 'green.600' },
                })
              "
              @click.stop="viewCharacters(book.id)"
            >
              View Characters
            </button>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
