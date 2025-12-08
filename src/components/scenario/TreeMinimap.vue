<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<template>
  <div
    v-if="isVisible && treeData"
    :class="css(containerStyles)"
    data-testid="tree-minimap"
    role="complementary"
    aria-label="Tree minimap"
  >
    <canvas
      ref="canvasRef"
      :width="MINIMAP_SIZE"
      :height="MINIMAP_SIZE"
      :class="css(canvasStyles)"
      @mousedown="onMouseDown"
      @click="onCanvasClick"
    />
    <button
      :class="css(toggleButtonStyles)"
      aria-label="Hide minimap"
      data-testid="minimap-toggle"
      @click="toggleVisibility"
    >
      ✕
    </button>
  </div>
  <button
    v-else-if="!isVisible && treeData"
    :class="css(showButtonStyles)"
    aria-label="Show minimap"
    data-testid="minimap-show"
    @click="toggleVisibility"
  >
    🗺️
  </button>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { css } from 'styled-system/css'
import type { ScenarioTreeResponse } from '@/types'

interface Props {
  treeData: ScenarioTreeResponse | null
  viewportWidth: number
  viewportHeight: number
  panX: number
  panY: number
  zoom: number
  treeWidth: number
  treeHeight: number
}

interface Emits {
  (e: 'pan', data: { x: number; y: number }): void
  (e: 'jump', data: { x: number; y: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Constants
const MINIMAP_SIZE = 150
const NODE_RADIUS = 3
const EDGE_WIDTH = 1

// State
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isVisible = ref(true)
const isDragging = ref(false)
const updateDebounceTimer = ref<number | null>(null)

// Methods
const drawMinimap = () => {
  const canvas = canvasRef.value
  if (!canvas || !props.treeData) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

  // Calculate scale
  const scale = Math.min(MINIMAP_SIZE / props.treeWidth, MINIMAP_SIZE / props.treeHeight)

  // Center the tree in minimap
  const offsetX = (MINIMAP_SIZE - props.treeWidth * scale) / 2
  const offsetY = 10

  // Draw edges (connections)
  ctx.strokeStyle = '#93C5FD' // blue.300
  ctx.lineWidth = EDGE_WIDTH

  // Draw connections from root to children
  if (props.treeData.children.length > 0) {
    const rootX = offsetX + (props.treeWidth * scale) / 2
    const rootY = offsetY + 20 * scale

    props.treeData.children.forEach((_, index) => {
      const childX =
        offsetX + ((index + 1) * props.treeWidth * scale) / (props.treeData!.children.length + 1)
      const childY = offsetY + 80 * scale

      ctx.beginPath()
      ctx.moveTo(rootX, rootY)
      ctx.lineTo(childX, childY)
      ctx.stroke()
    })
  }

  // Draw nodes
  ctx.fillStyle = '#3B82F6' // blue.600

  // Draw root node
  const rootX = offsetX + (props.treeWidth * scale) / 2
  const rootY = offsetY + 20 * scale
  ctx.beginPath()
  ctx.arc(rootX, rootY, NODE_RADIUS, 0, 2 * Math.PI)
  ctx.fill()

  // Draw child nodes
  props.treeData.children.forEach((_, index) => {
    const childX =
      offsetX + ((index + 1) * props.treeWidth * scale) / (props.treeData!.children.length + 1)
    const childY = offsetY + 80 * scale

    ctx.fillStyle = '#10B981' // green.600
    ctx.beginPath()
    ctx.arc(childX, childY, NODE_RADIUS, 0, 2 * Math.PI)
    ctx.fill()
  })

  // Draw viewport rectangle
  drawViewport(ctx, scale, offsetX, offsetY)
}

const drawViewport = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  offsetX: number,
  offsetY: number
) => {
  const viewportX = offsetX + (-props.panX * scale) / props.zoom
  const viewportY = offsetY + (-props.panY * scale) / props.zoom
  const viewportWidth = (props.viewportWidth * scale) / props.zoom
  const viewportHeight = (props.viewportHeight * scale) / props.zoom

  ctx.strokeStyle = '#EF4444' // red.600
  ctx.lineWidth = 2
  ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'

  ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight)
  ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight)
}

const debouncedDraw = () => {
  if (updateDebounceTimer.value) {
    clearTimeout(updateDebounceTimer.value)
  }

  updateDebounceTimer.value = window.setTimeout(() => {
    drawMinimap()
  }, 300)
}

const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  handleDrag(e)
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  handleDrag(e)
}

const onMouseUp = () => {
  isDragging.value = false
}

const handleDrag = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const scale = Math.min(MINIMAP_SIZE / props.treeWidth, MINIMAP_SIZE / props.treeHeight)

  const offsetX = (MINIMAP_SIZE - props.treeWidth * scale) / 2
  const offsetY = 10

  // Calculate corresponding tree coordinates
  const treeX = ((x - offsetX) * props.zoom) / scale
  const treeY = ((y - offsetY) * props.zoom) / scale

  emit('pan', { x: -treeX + props.viewportWidth / 2, y: -treeY + props.viewportHeight / 2 })
}

const onCanvasClick = (e: MouseEvent) => {
  if (isDragging.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const scale = Math.min(MINIMAP_SIZE / props.treeWidth, MINIMAP_SIZE / props.treeHeight)

  const offsetX = (MINIMAP_SIZE - props.treeWidth * scale) / 2
  const offsetY = 10

  const treeX = ((x - offsetX) * props.zoom) / scale
  const treeY = ((y - offsetY) * props.zoom) / scale

  emit('jump', { x: -treeX + props.viewportWidth / 2, y: -treeY + props.viewportHeight / 2 })
}

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

// Watchers
watch(
  () => [props.treeData, props.panX, props.panY, props.zoom],
  () => {
    if (isVisible.value) {
      debouncedDraw()
    }
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  drawMinimap()
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (updateDebounceTimer.value) {
    clearTimeout(updateDebounceTimer.value)
  }
})

// Styles
const containerStyles = {
  position: 'fixed',
  bottom: '4',
  right: '4',
  width: `${MINIMAP_SIZE}px`,
  height: `${MINIMAP_SIZE}px`,
  bg: 'white',
  border: '2px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  boxShadow: 'lg',
  zIndex: '1000',
}

const canvasStyles = {
  display: 'block',
  cursor: 'pointer',
}

const toggleButtonStyles = {
  position: 'absolute',
  top: '1',
  right: '1',
  width: '6',
  height: '6',
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '0.75rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  '&:hover': {
    bg: 'gray.100',
  },
}

const showButtonStyles = {
  position: 'fixed',
  bottom: '4',
  right: '4',
  width: '12',
  height: '12',
  bg: 'white',
  border: '2px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: '1.5rem',
  cursor: 'pointer',
  boxShadow: 'lg',
  zIndex: '1000',
  transition: 'all 0.2s',
  '&:hover': {
    bg: 'gray.50',
    transform: 'scale(1.05)',
  },
}
</script>
