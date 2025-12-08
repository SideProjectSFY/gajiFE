<template>
  <div :class="css(containerStyles)">
    <!-- Toolbar -->
    <div
      v-if="treeData"
      :class="css(toolbarStyles)"
      data-testid="tree-toolbar"
    >
      <div :class="css({ display: 'flex', gap: '2' })">
        <button
          data-testid="export-button"
          :class="css(toolbarButtonStyles)"
          aria-label="Export tree as image"
          @click="openExportModal"
        >
          📥 Export
        </button>
        <button
          data-testid="share-button"
          :class="css(toolbarButtonStyles)"
          aria-label="Copy shareable link"
          @click="copyShareLink"
        >
          🔗 {{ linkCopied ? 'Link Copied!' : 'Copy Link' }}
        </button>
      </div>
    </div>

    <!-- Layout with Overview Panel and Tree -->
    <div :class="css(layoutStyles)">
      <!-- Overview Panel -->
      <TreeOverviewPanel
        v-if="treeData"
        :tree-data="treeData"
        @center-node="centerNode"
      />

      <!-- Main Tree Container -->
      <div :class="css(mainContentStyles)">
        <!-- Loading State -->
        <div
          v-if="isLoading"
          data-testid="loading"
          :class="css({ textAlign: 'center', py: '8' })"
          role="status"
          aria-live="polite"
          aria-label="Loading fork history"
        >
          <div :class="css({ fontSize: '1rem', color: 'gray.500' })">
            Loading fork history...
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          data-testid="error"
          :class="css(errorContainerStyles)"
          role="alert"
          aria-live="polite"
        >
          <div :class="css({ fontSize: '1rem', color: 'red.600', mb: '3' })">
            {{ error }}
          </div>
          <button
            :class="css(retryButtonStyles)"
            aria-label="Retry loading fork history"
            @click="loadTreeData"
          >
            Retry
          </button>
        </div>

        <!-- Empty State (No Forks) -->
        <div
          v-else-if="treeData && treeData.children.length === 0"
          data-testid="empty"
          :class="css(emptyStateStyles)"
        >
          <div :class="css({ fontSize: '2rem', mb: '2' })">
            🌱
          </div>
          <div
            :class="css({ fontSize: '1.125rem', fontWeight: '500', color: 'gray.700', mb: '2' })"
          >
            No Forks Yet
          </div>
          <div :class="css({ fontSize: '0.875rem', color: 'gray.500' })">
            This scenario hasn't been forked yet. Be the first to create a variation!
          </div>
        </div>

        <!-- Tree Visualization -->
        <div
          v-else-if="treeData"
          data-testid="tree"
          :class="css(treeContainerStyles)"
          role="tree"
          aria-label="Scenario fork tree"
        >
          <!-- Root Node -->
          <div :class="css(rootNodeStyles)">
            <div :class="css(nodeHeaderStyles)">
              <div
                :class="
                  css({
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'blue.600',
                    textTransform: 'uppercase',
                    letterSpacing: 'wide',
                  })
                "
              >
                Original Scenario
              </div>
            </div>
            <div
              :class="getNodeCardClass(treeData.root.id, true)"
              role="treeitem"
              :aria-label="`Root scenario: ${treeData.root.title}`"
              :aria-selected="isCurrentScenario(treeData.root.id)"
              :aria-current="isCurrentScenario(treeData.root.id) ? 'page' : undefined"
              tabindex="0"
              @click="navigateToScenario(treeData.root.id)"
              @keydown.enter="navigateToScenario(treeData.root.id)"
              @keydown.space.prevent="navigateToScenario(treeData.root.id)"
            >
              <div
                :class="
                  css({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    mb: '2',
                  })
                "
              >
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', flex: '1' })
                  "
                >
                  {{ treeData.root.title }}
                </h3>
                <div
                  v-if="isCurrentScenario(treeData.root.id)"
                  :class="
                    css({
                      fontSize: '0.75rem',
                      px: '2',
                      py: '0.5',
                      bg: 'blue.100',
                      color: 'blue.700',
                      borderRadius: 'md',
                      fontWeight: '500',
                    })
                  "
                >
                  Current
                </div>
              </div>

              <p
                :class="
                  css({
                    fontSize: '0.875rem',
                    color: 'blue.600',
                    fontStyle: 'italic',
                    mb: '2',
                    lineHeight: '1.4',
                  })
                "
              >
                {{ treeData.root.whatIfQuestion }}
              </p>

              <p
                v-if="treeData.root.description"
                :class="css(descriptionStyles)"
              >
                {{ treeData.root.description }}
              </p>

              <div :class="css(statsStyles)">
                <span>💬 {{ treeData.root.conversation_count }}</span>
                <span>🍴 {{ treeData.root.fork_count }}</span>
                <span>❤️ {{ treeData.root.like_count }}</span>
              </div>

              <div :class="css(metaStyles)">
                By {{ treeData.root.user_id }} • {{ formatDate(treeData.root.created_at) }}
              </div>
            </div>
          </div>

          <!-- Connection Indicator -->
          <div
            v-if="treeData.children.length > 0"
            :class="css(connectionStyles)"
          >
            <div :class="css({ width: '2px', height: '2rem', bg: 'blue.200' })" />
            <div :class="css({ fontSize: '0.75rem', color: 'blue.600', fontWeight: '500' })">
              {{ treeData.children.length }} {{ treeData.children.length === 1 ? 'Fork' : 'Forks' }}
            </div>
            <div :class="css({ width: '2px', height: '1rem', bg: 'blue.200' })" />
          </div>

          <!-- Forked Scenarios Grid -->
          <div
            v-if="treeData.children.length > 0"
            :class="css(forksGridStyles)"
            role="group"
            aria-label="Forked scenarios"
          >
            <div
              v-for="child in treeData.children"
              :key="child.id"
              :class="getNodeCardClass(child.id, false)"
              role="treeitem"
              :aria-label="`Fork: ${child.title}`"
              :aria-selected="isCurrentScenario(child.id)"
              :aria-current="isCurrentScenario(child.id) ? 'page' : undefined"
              tabindex="0"
              @click="navigateToScenario(child.id)"
              @keydown.enter="navigateToScenario(child.id)"
              @keydown.space.prevent="navigateToScenario(child.id)"
            >
              <div :class="css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })">
                <span :class="css({ fontSize: '1rem' })">🍴</span>
                <span :class="css({ fontSize: '0.75rem', color: 'gray.500' })">Forked from Root</span>
                <div
                  v-if="isCurrentScenario(child.id)"
                  :class="
                    css({
                      ml: 'auto',
                      fontSize: '0.75rem',
                      px: '2',
                      py: '0.5',
                      bg: 'green.100',
                      color: 'green.700',
                      borderRadius: 'md',
                      fontWeight: '500',
                    })
                  "
                >
                  Current
                </div>
              </div>

              <h4 :class="css({ fontSize: '1rem', fontWeight: '600', color: 'gray.900', mb: '1' })">
                {{ child.title }}
              </h4>

              <p
                :class="
                  css({
                    fontSize: '0.875rem',
                    color: 'blue.600',
                    fontStyle: 'italic',
                    mb: '2',
                    lineHeight: '1.4',
                  })
                "
              >
                {{ child.whatIfQuestion }}
              </p>

              <p
                v-if="child.description"
                :class="css(descriptionStyles)"
              >
                {{ child.description }}
              </p>

              <div :class="css(statsStyles)">
                <span>💬 {{ child.conversation_count }}</span>
                <span>❤️ {{ child.like_count }}</span>
              </div>

              <div :class="css(metaStyles)">
                By {{ child.user_id }} • {{ formatDate(child.created_at) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tree Minimap -->
        <TreeMinimap
          v-if="treeData"
          :tree-data="treeData"
          :viewport-width="viewportWidth"
          :viewport-height="viewportHeight"
          :pan-x="panX"
          :pan-y="panY"
          :zoom="zoom"
          :tree-width="treeWidth"
          :tree-height="treeHeight"
          @pan="onMinimapPan"
          @jump="onMinimapJump"
        />
      </div>
    </div>

    <!-- Export Modal -->
    <TreeExportModal
      :is-open="isExportModalOpen"
      :tree-element-ref="treeElementRef"
      @close="closeExportModal"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { css } from 'styled-system/css'
import { scenarioApi } from '@/services/scenarioApi'
import type { ScenarioTreeResponse } from '@/types'
import { format } from 'date-fns'
import TreeMinimap from './TreeMinimap.vue'
import TreeOverviewPanel from './TreeOverviewPanel.vue'
import TreeExportModal from './TreeExportModal.vue'

// Props
interface Props {
  scenarioId: string
  currentScenarioId?: string // To highlight the current scenario
}

const props = defineProps<Props>()

// Types
interface ExportOptions {
  format: 'png' | 'svg'
  includeMetadata: boolean
  includeWatermark: boolean
}

// Router
const router = useRouter()
const route = useRoute()

// State
const treeData = ref<ScenarioTreeResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const treeElementRef = ref<HTMLElement | null>(null)
const isExportModalOpen = ref(false)
const linkCopied = ref(false)

// Viewport state for Minimap
const viewportWidth = ref(800)
const viewportHeight = ref(600)
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const treeWidth = ref(1000)
const treeHeight = ref(800)

// Computed
const currentId = computed(() => props.currentScenarioId || props.scenarioId)

// Methods
const loadTreeData = async (): Promise<void> => {
  isLoading.value = true
  error.value = null

  try {
    treeData.value = await scenarioApi.getScenarioTree(props.scenarioId)

    // Restore view state from URL query parameters
    restoreViewState()
  } catch (err) {
    console.error('Failed to load scenario tree:', err)

    const error_typed = err as { response?: { status?: number } }
    if (error_typed.response?.status === 404) {
      error.value = 'Scenario not found'
    } else if (error_typed.response?.status === 403) {
      error.value = 'You do not have permission to view this scenario'
    } else {
      error.value = 'Failed to load fork history. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const navigateToScenario = (scenarioId: string): void => {
  router.push(`/scenarios/${scenarioId}`)
}

const isCurrentScenario = (scenarioId: string): boolean => {
  return scenarioId === currentId.value
}

const getNodeCardClass = (scenarioId: string, isRoot: boolean): string => {
  const isCurrent = isCurrentScenario(scenarioId)
  const accentColor = isRoot ? 'blue' : 'green'

  return css({
    p: '4',
    border: '1px solid',
    borderRadius: 'lg',
    bg: isCurrent ? `${accentColor}.50` : 'white',
    borderColor: isCurrent ? `${accentColor}.500` : 'gray.200',
    borderWidth: isCurrent ? '2px' : '1px',
    boxShadow: 'sm',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: `${accentColor}.400`,
      transform: 'translateY(-2px)',
      boxShadow: 'md',
    },
  })
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

// Minimap interaction handlers
const onMinimapPan = (data: { x: number; y: number }): void => {
  panX.value = data.x
  panY.value = data.y
  updateUrlState()
}

const onMinimapJump = (data: { x: number; y: number }): void => {
  panX.value = data.x
  panY.value = data.y
  updateUrlState()
}

// Center node handler for Overview Panel
const centerNode = (nodeId: string): void => {
  // For now, just navigate to the scenario
  // In a full implementation, this would also pan/zoom the tree view
  navigateToScenario(nodeId)
}

// Export functionality
const openExportModal = (): void => {
  // Get the tree element reference
  const treeElement = document.querySelector('[data-testid="tree"]') as HTMLElement
  if (treeElement) {
    treeElementRef.value = treeElement
  }
  isExportModalOpen.value = true
}

const closeExportModal = (): void => {
  isExportModalOpen.value = false
}

const handleExport = (options: ExportOptions): void => {
  console.log('Export completed with options:', options)
  // Additional tracking or analytics can be added here
}

// Share functionality
const copyShareLink = async (): Promise<void> => {
  try {
    const shareUrl = generateShareUrl()
    await navigator.clipboard.writeText(shareUrl)
    linkCopied.value = true

    // Reset after 2 seconds
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
    alert('Failed to copy link. Please try again.')
  }
}

const generateShareUrl = (): string => {
  const baseUrl = window.location.origin + window.location.pathname
  const params = new URLSearchParams()

  if (zoom.value !== 1) {
    params.set('zoom', zoom.value.toFixed(2))
  }
  if (panX.value !== 0) {
    params.set('x', panX.value.toFixed(0))
  }
  if (panY.value !== 0) {
    params.set('y', panY.value.toFixed(0))
  }

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

const restoreViewState = (): void => {
  const query = route.query

  if (query.zoom) {
    const zoomValue = parseFloat(query.zoom as string)
    if (!isNaN(zoomValue) && zoomValue > 0 && zoomValue <= 3) {
      zoom.value = zoomValue
    }
  }

  if (query.x) {
    const xValue = parseFloat(query.x as string)
    if (!isNaN(xValue)) {
      panX.value = xValue
    }
  }

  if (query.y) {
    const yValue = parseFloat(query.y as string)
    if (!isNaN(yValue)) {
      panY.value = yValue
    }
  }
}

// Debounced URL update
let updateUrlTimeout: ReturnType<typeof setTimeout> | null = null
const updateUrlState = (): void => {
  if (updateUrlTimeout) {
    clearTimeout(updateUrlTimeout)
  }

  updateUrlTimeout = setTimeout(() => {
    const params = new URLSearchParams()

    if (zoom.value !== 1) {
      params.set('zoom', zoom.value.toFixed(2))
    }
    if (panX.value !== 0) {
      params.set('x', panX.value.toFixed(0))
    }
    if (panY.value !== 0) {
      params.set('y', panY.value.toFixed(0))
    }

    // Use replace to avoid history spam
    router.replace({
      query: Object.fromEntries(params.entries()),
    })
  }, 500)
}

// Watch for zoom changes
watch(zoom, (): void => {
  updateUrlState()
})

// Lifecycle
onMounted(() => {
  loadTreeData()

  // Set viewport dimensions from window
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
})

// Styles
const containerStyles = {
  width: '100%',
  minHeight: '20rem',
  position: 'relative',
}

const toolbarStyles = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  p: '4',
  borderBottom: '1px solid',
  borderColor: 'gray.200',
  bg: 'white',
}

const toolbarButtonStyles = {
  px: '4',
  py: '2',
  bg: 'white',
  color: 'gray.700',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    bg: 'gray.50',
    borderColor: 'blue.400',
  },
}

const layoutStyles = {
  display: 'flex',
  gap: '4',
  width: '100%',
}

const mainContentStyles = {
  flex: '1',
  minWidth: '0',
}

const errorContainerStyles = {
  textAlign: 'center',
  py: '8',
  px: '4',
}

const retryButtonStyles = {
  px: '4',
  py: '2',
  bg: 'blue.600',
  color: 'white',
  borderRadius: 'md',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    bg: 'blue.700',
  },
}

const emptyStateStyles = {
  textAlign: 'center',
  py: '12',
  px: '4',
}

const treeContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0',
  py: '4',
}

const nodeHeaderStyles = {
  textAlign: 'center',
  mb: '2',
}

const rootNodeStyles = {
  width: '100%',
  maxWidth: '40rem',
}

const connectionStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  my: '0',
}

const forksGridStyles = {
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
  },
  gap: '4',
  width: '100%',
  mt: '4',
}

const descriptionStyles = {
  fontSize: '0.875rem',
  color: 'gray.600',
  mb: '3',
  lineHeight: '1.5',
  display: '-webkit-box',
  WebkitLineClamp: '2',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const statsStyles = {
  display: 'flex',
  gap: '4',
  fontSize: '0.75rem',
  color: 'gray.500',
}

const metaStyles = {
  mt: '2',
  pt: '2',
  borderTop: '1px solid',
  borderColor: 'gray.100',
  fontSize: '0.75rem',
  color: 'gray.400',
}
</script>
