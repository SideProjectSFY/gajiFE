<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
import { useAnalytics } from '@/composables/useAnalytics'

const route = useRoute()
const { trackBookViewed } = useAnalytics()

// Mock database - 실제로는 API에서 가져올 데이터
const booksDatabase = {
  '1': {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: '1925',
    description:
      "Set in the summer of 1922, the novel follows aspiring writer Nick Carraway and his interactions with the mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan. The story explores themes of decadence, idealism, social upheaval, and excess.",
    tags: ['Classic', 'Drama', 'American'],
    charactersCount: 6,
    conversationsCount: 1623,
    viewsCount: 3456,
    characters: [
      {
        id: 1,
        name: 'Jay Gatsby',
        description:
          'Mysterious millionaire known for lavish parties, obsessed with winning back Daisy',
        tags: ['Mysterious', 'Romantic', 'Ambitious'],
        conversations: 892,
        isFeatured: true,
      },
      {
        id: 2,
        name: 'Tom Buchanan',
        description:
          "Daisy's millionaire husband, arrogant and controlling with old money background",
        tags: ['Wealthy', 'Arrogant', 'Powerful'],
        conversations: 456,
        isFeatured: true,
      },
      {
        id: 3,
        name: 'Nick Carraway',
        description:
          'The narrator, a bond salesman who becomes entangled in the lives of his wealthy neighbors',
        tags: ['Observant', 'Honest', 'Thoughtful'],
        conversations: 543,
        isFeatured: false,
      },
      {
        id: 4,
        name: 'Daisy Buchanan',
        description:
          "Gatsby's former lover, now married to Tom, torn between old love and current comfort",
        tags: ['Charming', 'Conflicted', 'Beautiful'],
        conversations: 678,
        isFeatured: true,
      },
    ],
    relationships: [
      { from: 'Jay Gatsby', to: 'Daisy Buchanan', type: 'love', label: 'Main Story' },
      { from: 'Jay Gatsby', to: 'Nick Carraway', type: 'friend', label: 'Strong Bond' },
      { from: 'Tom Buchanan', to: 'Daisy Buchanan', type: 'married', label: 'Mean Conflict' },
      { from: 'Daisy Buchanan', to: 'Nick Carraway', type: 'cousin', label: '' },
    ],
  },
  '2': {
    id: 2,
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: '1813',
    description:
      'The novel follows the character development of Elizabeth Bennet, the protagonist of the book, who learns about the repercussions of hasty judgments and comes to appreciate the difference between superficial goodness and actual goodness.',
    tags: ['Romance', 'Classic', 'Social Commentary'],
    charactersCount: 8,
    conversationsCount: 2145,
    viewsCount: 4567,
    characters: [
      {
        id: 5,
        name: 'Elizabeth Bennet',
        description:
          'Witty and independent-minded second daughter, refuses to marry for convenience',
        tags: ['Witty', 'Independent', 'Principled'],
        conversations: 1234,
        isFeatured: true,
      },
      {
        id: 6,
        name: 'Mr. Darcy',
        description: 'Wealthy but proud gentleman who learns to overcome his initial prejudices',
        tags: ['Proud', 'Noble', 'Complex'],
        conversations: 1098,
        isFeatured: true,
      },
      {
        id: 7,
        name: 'Jane Bennet',
        description: "Elizabeth's beautiful and sweet-natured elder sister",
        tags: ['Kind', 'Beautiful', 'Gentle'],
        conversations: 456,
        isFeatured: false,
      },
      {
        id: 8,
        name: 'Mr. Bingley',
        description: "Darcy's good-natured friend who falls in love with Jane Bennet",
        tags: ['Friendly', 'Wealthy', 'Amiable'],
        conversations: 389,
        isFeatured: false,
      },
      {
        id: 9,
        name: 'Mr. Wickham',
        description: 'Charming militia officer with a dark past and connection to Darcy',
        tags: ['Charming', 'Deceptive', 'Opportunistic'],
        conversations: 267,
        isFeatured: false,
      },
    ],
    relationships: [
      { from: 'Elizabeth Bennet', to: 'Mr. Darcy', type: 'love', label: 'Main Story' },
      { from: 'Jane Bennet', to: 'Mr. Bingley', type: 'love', label: 'Strong Bond' },
      { from: 'Mr. Darcy', to: 'Mr. Bingley', type: 'friend', label: 'Strong Bond' },
      { from: 'Elizabeth Bennet', to: 'Jane Bennet', type: 'sister', label: '' },
      { from: 'Mr. Wickham', to: 'Mr. Darcy', type: 'conflict', label: 'Mean Conflict' },
    ],
  },
  '3': {
    id: 3,
    title: '1984',
    author: 'George Orwell',
    year: '1949',
    description:
      'A dystopian social science fiction novel that follows Winston Smith, a man who struggles with oppression in Oceania, a totalitarian state where the Party scrutinizes every human action with Big Brother watching.',
    tags: ['Dystopian', 'Political', 'Classic'],
    charactersCount: 5,
    conversationsCount: 1876,
    viewsCount: 3890,
    characters: [
      {
        id: 10,
        name: 'Winston Smith',
        description: 'Party member who secretly rebels against totalitarian regime',
        tags: ['Rebellious', 'Thoughtful', 'Tragic'],
        conversations: 945,
        isFeatured: true,
      },
      {
        id: 11,
        name: 'Julia',
        description: "Winston's lover who also rebels against the Party in her own way",
        tags: ['Rebellious', 'Practical', 'Passionate'],
        conversations: 678,
        isFeatured: true,
      },
      {
        id: 12,
        name: "O'Brien",
        description: 'Member of the Inner Party who Winston believes is a secret rebel',
        tags: ['Manipulative', 'Intelligent', 'Powerful'],
        conversations: 423,
        isFeatured: true,
      },
      {
        id: 13,
        name: 'Big Brother',
        description: 'The face of the Party, omnipresent leader who may or may not exist',
        tags: ['Omnipresent', 'Symbolic', 'Authoritarian'],
        conversations: 567,
        isFeatured: false,
      },
    ],
    relationships: [
      { from: 'Winston Smith', to: 'Julia', type: 'love', label: 'Main Story' },
      { from: 'Winston Smith', to: "O'Brien", type: 'conflict', label: 'Mean Conflict' },
      { from: 'Big Brother', to: 'Winston Smith', type: 'oppressor', label: 'Mean Conflict' },
    ],
  },
}

// 현재 책 ID로 데이터 로드
const bookId = route.params.id as string
const bookData = booksDatabase[bookId as keyof typeof booksDatabase]

// 책이 없으면 기본값 설정
const book = ref(
  bookData || {
    id: 0,
    title: 'Book Not Found',
    author: 'Unknown',
    year: '0000',
    description: 'This book does not exist in our database.',
    tags: [],
    charactersCount: 0,
    conversationsCount: 0,
    viewsCount: 0,
    characters: [],
    relationships: [],
  }
)

const characters = ref(book.value.characters || [])
const relationships = book.value.relationships || []
const selectedCharacter = ref<number | null>(null)
const showScenarioModal = ref(false)

// SVG Graph State
const svgWidth = 400
const svgHeight = 400
const nodes = ref<Array<{ id: string; x: number; y: number; type: 'main' | 'minor' }>>([])
const edges = ref<Array<{ from: string; to: string; type: string; label: string }>>([])

// Initialize graph layout
onMounted(() => {
  initializeGraph()

  // GA4: 책 조회 추적
  if (book.value) {
    trackBookViewed(String(book.value.id), book.value.title)
  }
})

const initializeGraph = () => {
  // Define node positions manually for better layout
  const characterNames = [
    ...new Set([...relationships.map((r) => r.from), ...relationships.map((r) => r.to)]),
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
  if (selectedCharacter.value === characterId) {
    selectedCharacter.value = null
  } else {
    selectedCharacter.value = characterId
  }
}

const openScenarioModal = () => {
  if (selectedCharacter.value === null) return
  showScenarioModal.value = true
}

const closeScenarioModal = () => {
  showScenarioModal.value = false
}

const createScenario = () => {
  console.log('Create scenario with character', selectedCharacter.value)
  // TODO: 시나리오 생성 로직 구현
  closeScenarioModal()
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
            ← Go to Book List
          </router-link>
        </div>
      </div>

      <!-- Book Header Section -->
      <div
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
            <div :class="css({ display: 'flex', gap: '2', mb: '3' })">
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
                {{ tag }}
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

            <!-- Author & Year -->
            <p :class="css({ fontSize: '1rem', color: 'gray.600', mb: '4' })">
              by {{ book.author }} • {{ book.year }}
            </p>

            <!-- Description -->
            <p
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
                  👥 Characters
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.charactersCount }}
                </div>
              </div>
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  💬 Conversations
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.conversationsCount.toLocaleString() }}
                </div>
              </div>
              <div>
                <div :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '1' })">
                  📖 Total read
                </div>
                <div :class="css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900' })">
                  {{ book.viewsCount.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            🔗 Search Characters
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
            <svg
              :width="svgWidth"
              :height="svgHeight"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            >
              <!-- Edges -->
              <g
                v-for="(edge, idx) in edges"
                :key="`edge-${idx}`"
              >
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
              <g
                v-for="node in nodes"
                :key="node.id"
              >
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
                <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">Main Character</span>
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
                <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">Minor Character</span>
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
                <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">Strong Bond</span>
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
                <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">Weak Connect</span>
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
                <span :class="css({ fontSize: '0.75rem', color: 'gray.700' })">Mean Conflict</span>
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
              All Characters
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
                <div :class="css({ display: 'flex', alignItems: 'flex-start', gap: '3', mb: '3' })">
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
                    Featured
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
                    {{ tag }}
                  </span>
                </div>
                <p :class="css({ fontSize: '0.75rem', color: 'gray.500', mb: '3' })">
                  💬 {{ character.conversations.toLocaleString() }} conversations started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Any Button -->
      <div :class="css({ mt: '8', textAlign: 'center' })">
        <button
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
              ? 'Select Character'
              : `Create ${characters.find((c) => c.id === selectedCharacter)?.name}`
          }}
        </button>
      </div>
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
            Create New Scenario
          </h2>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.600' })">
            Configure scenario settings for your conversation
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
            What changes do you want to make?
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
            <h4
              :class="css({ fontSize: '0.9375rem', fontWeight: '600', color: 'gray.900', mb: '2' })"
            >
              Character Property
            </h4>
            <textarea
              placeholder="e.g., Change personality from reserved to outgoing"
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
            <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
              Event Alterations
            </h4>
            <textarea
              placeholder="e.g., Character survives the confrontation"
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
            <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '3' })">
              Setting Modifications
            </h4>
            <textarea
              placeholder="e.g., Story takes place in modern times instead of 1920s"
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
                  resize: 'vertical',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                  },
                })
              "
            />
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
            Scenario Description (Optional)
          </label>
          <textarea
            id="scenario-description"
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
            placeholder="Describe your scenario or add notes..."
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
            @click="createScenario"
          >
            Create Scenario
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
            @click="closeScenarioModal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
