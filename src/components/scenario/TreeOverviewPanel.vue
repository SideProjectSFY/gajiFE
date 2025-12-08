<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<template>
  <div
    :class="css(containerStyles)"
    data-testid="tree-overview-panel"
    role="complementary"
    aria-label="Tree overview panel"
  >
    <!-- Toggle Button (Mobile) -->
    <button
      :class="css(mobileToggleStyles)"
      :aria-label="isOpen ? 'Close overview panel' : 'Open overview panel'"
      aria-expanded="isOpen"
      data-testid="panel-toggle"
      @click="togglePanel"
    >
      {{ isOpen ? '✕' : '📊' }}
    </button>

    <!-- Panel Content -->
    <div
      v-show="isOpen"
      :class="css(panelContentStyles)"
      data-testid="panel-content"
    >
      <!-- Header -->
      <div :class="css(headerStyles)">
        <h3 :class="css(titleStyles)">
          Tree Overview
        </h3>
      </div>

      <!-- Statistics Section -->
      <div :class="css(sectionStyles)">
        <h4 :class="css(sectionTitleStyles)">
          Statistics
        </h4>
        <div :class="css(statsGridStyles)">
          <div :class="css(statItemStyles)">
            <div :class="css(statLabelStyles)">
              Total Scenarios
            </div>
            <div :class="css(statValueStyles)">
              {{ totalScenarios }}
            </div>
          </div>
          <div :class="css(statItemStyles)">
            <div :class="css(statLabelStyles)">
              Max Depth
            </div>
            <div :class="css(statValueStyles)">
              {{ maxDepth }}
            </div>
          </div>
          <div :class="css(statItemStyles)">
            <div :class="css(statLabelStyles)">
              Total Forks
            </div>
            <div :class="css(statValueStyles)">
              {{ totalForks }}
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Scenarios Section -->
      <div :class="css(sectionStyles)">
        <h4 :class="css(sectionTitleStyles)">
          Featured Scenarios
        </h4>
        <div :class="css(listStyles)">
          <div
            v-for="scenario in featuredScenarios"
            :key="scenario.id"
            :class="css(listItemStyles)"
            role="button"
            tabindex="0"
            :aria-label="`Jump to ${scenario.title}`"
            @click="onScenarioClick(scenario.id)"
            @keydown.enter="onScenarioClick(scenario.id)"
            @keydown.space.prevent="onScenarioClick(scenario.id)"
          >
            <div :class="css(scenarioTitleStyles)">
              {{ scenario.title }}
            </div>
            <div :class="css(scenarioMetaStyles)">
              <span>💬 {{ scenario.conversation_count }}</span>
              <span>❤️ {{ scenario.like_count }}</span>
            </div>
          </div>
          <div
            v-if="featuredScenarios.length === 0"
            :class="css(emptyStateStyles)"
          >
            No featured scenarios yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ref, computed } from 'vue'
import { css } from 'styled-system/css'
import type { ScenarioTreeResponse, ScenarioTreeNode } from '@/types'

interface Props {
  treeData: ScenarioTreeResponse | null
}

interface Emits {
  (e: 'centerNode', nodeId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const isOpen = ref(true)

// Computed
const totalScenarios = computed(() => {
  return props.treeData?.totalCount ?? 0
})

const maxDepth = computed(() => {
  return props.treeData?.maxDepth ?? 0
})

const totalForks = computed(() => {
  if (!props.treeData) return 0
  return props.treeData.children.length
})

const featuredScenarios = computed(() => {
  if (!props.treeData) return []

  // Combine root and children
  const allScenarios: ScenarioTreeNode[] = [props.treeData.root, ...props.treeData.children]

  // Sort by conversation count and like count (combined score)
  const sorted = allScenarios
    .map((scenario) => ({
      ...scenario,
      score: scenario.conversation_count * 2 + scenario.like_count,
    }))
    .sort((a, b) => b.score - a.score)

  // Return top 5
  return sorted.slice(0, 5)
})

// Methods
const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const onScenarioClick = (scenarioId: string) => {
  emit('centerNode', scenarioId)
}

// Styles
const containerStyles = {
  position: {
    base: 'fixed',
    md: 'relative',
  },
  top: {
    base: '0',
    md: 'auto',
  },
  right: {
    base: '0',
    md: 'auto',
  },
  width: {
    base: isOpen.value ? '80vw' : 'auto',
    md: '16rem',
  },
  maxWidth: {
    base: '20rem',
    md: '16rem',
  },
  height: {
    base: isOpen.value ? '100vh' : 'auto',
    md: 'auto',
  },
  bg: 'white',
  border: {
    base: 'none',
    md: '1px solid',
  },
  borderColor: 'gray.200',
  borderRadius: {
    base: 'none',
    md: 'lg',
  },
  boxShadow: {
    base: isOpen.value ? '2xl' : 'none',
    md: 'md',
  },
  zIndex: {
    base: '999',
    md: 'auto',
  },
  transition: 'all 0.3s',
}

const mobileToggleStyles = {
  display: {
    base: 'flex',
    md: 'none',
  },
  position: 'absolute',
  top: '4',
  right: '4',
  width: '10',
  height: '10',
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '1.25rem',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'md',
  zIndex: '1000',
  transition: 'all 0.2s',
  '&:hover': {
    bg: 'gray.50',
  },
}

const panelContentStyles = {
  p: '4',
  overflowY: 'auto',
  maxHeight: {
    base: '100vh',
    md: '70vh',
  },
}

const headerStyles = {
  mb: '4',
  pb: '3',
  borderBottom: '2px solid',
  borderColor: 'gray.200',
}

const titleStyles = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'gray.900',
}

const sectionStyles = {
  mb: '6',
}

const sectionTitleStyles = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.700',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
  mb: '3',
}

const statsGridStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
}

const statItemStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: '2',
  bg: 'gray.50',
  borderRadius: 'md',
}

const statLabelStyles = {
  fontSize: '0.875rem',
  color: 'gray.600',
}

const statValueStyles = {
  fontSize: '1.125rem',
  fontWeight: '700',
  color: 'blue.600',
}

const listStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
}

const listItemStyles = {
  p: '3',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: 'md',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    borderColor: 'blue.400',
    bg: 'blue.50',
    transform: 'translateX(4px)',
  },
  '&:focus': {
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px',
  },
}

const scenarioTitleStyles = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'gray.900',
  mb: '1',
  display: '-webkit-box',
  WebkitLineClamp: '2',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const scenarioMetaStyles = {
  display: 'flex',
  gap: '3',
  fontSize: '0.75rem',
  color: 'gray.500',
}

const emptyStateStyles = {
  textAlign: 'center',
  py: '4',
  fontSize: '0.875rem',
  color: 'gray.400',
  fontStyle: 'italic',
}
</script>
