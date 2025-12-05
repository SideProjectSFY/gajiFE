<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const router = useRouter()
const selectedMoods = ref<string[]>([])
const searchQuery = ref('')
const showForkModal = ref(false)
const selectedCharacter = ref<any>(null)

const moods = ['Romantic', 'Humorous', 'Analytical', 'Philosophical', 'Inspirational']

const characters = ref([
  {
    id: 1,
    name: 'Elizabeth Bennet',
    book: 'Pride and Prejudice',
    bookId: 1,
    author: 'Jane Austen',
    description: 'The spirited and intelligent second daughter of the Bennet family',
    tags: ['Charming', 'Witty', 'Smart'],
    conversations: 1524,
    image: '/characters/elizabeth.jpg',
  },
  {
    id: 2,
    name: 'Jay Gatsby',
    book: 'The Great Gatsby',
    bookId: 2,
    author: 'F. Scott Fitzgerald',
    description: 'A mysterious millionaire with a vision and an obsession',
    tags: ['Mysterious', 'Romantic', 'Ambitious'],
    conversations: 892,
    image: '/characters/gatsby.jpg',
  },
  {
    id: 3,
    name: 'Captain Ahab',
    book: 'Moby Dick',
    bookId: 3,
    author: 'Herman Melville',
    description: 'The monomaniacal captain of the whaling ship Pequod',
    tags: ['Determined', 'Dark mood', 'Vengeful'],
    conversations: 456,
    image: '/characters/ahab.jpg',
  },
  {
    id: 4,
    name: 'Heathcliff',
    book: 'Wuthering Heights',
    bookId: 4,
    author: 'Emily Brontë',
    description: 'A man haunted by a turbulent childhood and lost love',
    tags: ['Passionate', 'Brooding', 'Complex'],
    conversations: 723,
    image: '/characters/heathcliff.jpg',
  },
  {
    id: 5,
    name: 'Winston Smith',
    book: 'Nineteen Eighty-Four',
    bookId: 5,
    author: 'George Orwell',
    description: 'A man secretly rebelling in the face of the Party who longs for truth',
    tags: ['Defiant', 'Thoughtful', 'Fearful'],
    conversations: 634,
    image: '/characters/winston.jpg',
  },
  {
    id: 6,
    name: 'Jane Eyre',
    book: 'Jane Eyre',
    bookId: 6,
    author: 'Charlotte Brontë',
    description: 'An orphan who longs for social acceptance and seeks her own sense of morality',
    tags: ['Principled', 'Eccentric', 'Independent'],
    conversations: 891,
    image: '/characters/jane.jpg',
  },
  {
    id: 7,
    name: 'Mr Fitzwilliam Darcy',
    book: 'Pride and Prejudice',
    bookId: 1,
    author: 'Jane Austen',
    description: 'A wealthy gentleman and proud and distant at first before he becomes an ally',
    tags: ['Proud', 'Generous', 'Honorable'],
    conversations: 1327,
    image: '/characters/darcy.jpg',
  },
  {
    id: 8,
    name: 'Nick Carraway',
    book: 'The Great Gatsby',
    bookId: 2,
    author: 'F. Scott Fitzgerald',
    description: "Upper-class Yale grad who observes and narrates the fallacy's tragedy",
    tags: ['Observant', 'Honest', 'Thoughtful'],
    conversations: 543,
    image: '/characters/nick.jpg',
  },
  {
    id: 9,
    name: 'Catherine Earnshaw',
    book: 'Wuthering Heights',
    bookId: 4,
    author: 'Emily Brontë',
    description: 'A high-spirited woman torn between her upbringing and social status',
    tags: ['Wild', 'Passionate', 'Conflicted'],
    conversations: 612,
    image: '/characters/catherine.jpg',
  },
])

const toggleMood = (mood: string) => {
  const index = selectedMoods.value.indexOf(mood)
  if (index > -1) {
    selectedMoods.value.splice(index, 1)
  } else {
    selectedMoods.value.push(mood)
  }
}

const clearFilters = () => {
  selectedMoods.value = []
  searchQuery.value = ''
}

const goToBookDetail = (bookId: number) => {
  router.push({ name: 'BookDetail', params: { id: bookId.toString() } })
}

const openForkModal = (character: any) => {
  selectedCharacter.value = character
  showForkModal.value = true
}

const closeForkModal = () => {
  showForkModal.value = false
  selectedCharacter.value = null
}

const startForkChat = () => {
  console.log('Starting fork chat with character:', selectedCharacter.value)
  // TODO: Implement fork chat logic
  closeForkModal()
}

const filteredCharacters = computed(() => {
  return characters.value.filter((character) => {
    // 검색어 필터링
    const matchesSearch =
      searchQuery.value === '' ||
      character.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      character.book.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      character.author.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      character.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    // 무드 필터링 (선택된 무드가 없으면 모두 표시)
    const matchesMood =
      selectedMoods.value.length === 0 ||
      selectedMoods.value.some((mood) =>
        character.tags.some((tag) => tag.toLowerCase().includes(mood.toLowerCase()))
      )

    return matchesSearch && matchesMood
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
          All Characters
        </h1>
        <p :class="css({ fontSize: '1rem', color: 'gray.600' })">
          {{ filteredCharacters.length }} conversations available
        </p>
      </div>

      <!-- Search Bar -->
      <div :class="css({ mb: '6' })">
        <div :class="css({ position: 'relative', maxW: '600px' })">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by character, book, or author..."
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
            🎭 Mood Filters:
          </span>
          <button
            v-for="mood in moods"
            :key="mood"
            :class="
              css({
                px: '4',
                py: '1.5',
                bg: selectedMoods.includes(mood) ? 'green.500' : 'white',
                color: selectedMoods.includes(mood) ? 'white' : 'gray.700',
                border: '1px solid',
                borderColor: selectedMoods.includes(mood) ? 'green.500' : 'gray.300',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: {
                  bg: selectedMoods.includes(mood) ? 'green.600' : 'gray.50',
                },
              })
            "
            @click="toggleMood(mood)"
          >
            {{ mood }}
          </button>
          <button
            v-if="selectedMoods.length > 0 || searchQuery"
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

      <!-- Characters Grid -->
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
          v-for="character in filteredCharacters"
          :key="character.id"
          :class="
            css({
              bg: 'white',
              borderRadius: '0.75rem',
              p: '6',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              _hover: {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)',
              },
            })
          "
        >
          <!-- Character Avatar -->
          <div :class="css({ display: 'flex', alignItems: 'flex-start', gap: '4', mb: '4' })">
            <div
              :class="
                css({
                  w: '16',
                  h: '16',
                  flexShrink: 0,
                  borderRadius: 'full',
                  bg: 'gray.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                })
              "
            >
              👤
            </div>
            <div :class="css({ flex: 1 })">
              <h3
                :class="
                  css({
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: 'gray.900',
                    mb: '1',
                  })
                "
              >
                {{ character.name }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '0.5' })">
                {{ character.book }}
              </p>
              <p :class="css({ fontSize: '0.75rem', color: 'gray.500' })">
                by {{ character.author }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <p
            :class="
              css({
                fontSize: '0.875rem',
                color: 'gray.600',
                lineHeight: '1.6',
                mb: '4',
              })
            "
          >
            {{ character.description }}
          </p>

          <!-- Tags -->
          <div :class="css({ display: 'flex', gap: '2', flexWrap: 'wrap', mb: '4' })">
            <span
              v-for="tag in character.tags"
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

          <!-- Conversations Count -->
          <p
            :class="
              css({
                fontSize: '0.75rem',
                color: 'gray.500',
                mb: '4',
              })
            "
          >
            💬 {{ character.conversations.toLocaleString() }} conversations
          </p>

          <!-- Action Buttons -->
          <div :class="css({ display: 'flex', gap: '2' })">
            <button
              :class="
                css({
                  flex: 1,
                  px: '4',
                  py: '2',
                  bg: 'green.500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2',
                  _hover: { bg: 'green.600' },
                })
              "
              @click="openForkModal(character)"
            >
              🔀 Fork Chat
            </button>
            <button
              :class="
                css({
                  px: '4',
                  py: '2',
                  bg: 'white',
                  color: 'gray.700',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  _hover: { bg: 'gray.50' },
                })
              "
              @click="goToBookDetail(character.bookId)"
            >
              📚
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Fork Chat Modal -->
    <div
      v-if="showForkModal"
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
      @click="closeForkModal"
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
            Fork Conversation
          </h2>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
            Review the parent scenario settings before forking
          </p>
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
                {{ selectedCharacter.name }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
                {{ selectedCharacter.book }}
              </p>
            </div>
          </div>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.6' })">
            {{ selectedCharacter.description }}
          </p>
        </div>

        <!-- Fork Changes -->
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
            What will change in this fork?
          </h3>

          <!-- Character Property Changes -->
          <div
            :class="
              css({
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                p: '3',
                mb: '3',
              })
            "
          >
            <h4
              :class="css({ fontSize: '0.9375rem', fontWeight: '600', color: 'gray.900', mb: '2' })"
            >
              Character Property
            </h4>
            <textarea
              :class="
                css({
                  w: 'full',
                  px: '3',
                  py: '2',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  minH: '16',
                  outline: 'none',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
              placeholder="e.g., Change from reserved to outgoing"
            />
          </div>

          <!-- Event Alterations Changes -->
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
            <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
              Event Alterations
            </h4>
            <textarea
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
              placeholder="e.g., Character survives the confrontation"
            />
          </div>

          <!-- Setting Modifications Changes -->
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
            <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
              Setting Modifications
            </h4>
            <textarea
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
              placeholder="e.g., Story takes place in modern times"
            />
          </div>
        </div>

        <!-- Description -->
        <div :class="css({ mb: '5' })">
          <label
            for="fork-description"
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
            Fork Description (Optional)
          </label>
          <textarea
            id="fork-description"
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
            placeholder="Describe your fork or add notes..."
          />
        </div>

        <!-- Action Buttons -->
        <div :class="css({ display: 'flex', gap: '3' })">
          <button
            :class="
              css({
                flex: 1,
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
            @click="startForkChat"
          >
            Start Fork
          </button>
          <button
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
            @click="closeForkModal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
