<script setup lang="ts">
import { css } from 'styled-system/css'

// Define the stages for the overlay text
const stages = [
  {
    id: 1,
    title: '모든 이야기는 작은 씨앗에서 시작됩니다.',
    description: 'Every story begins with a small seed.',
  },
  {
    id: 2,
    title: '당신의 선택으로 뻗어나가는 무한한 가능성.',
    description: 'Infinite possibilities branching from your choices.',
  },
  {
    id: 3,
    title: 'AI와 함께 상상을 현실로 만드세요.',
    description: 'Turn imagination into reality with AI.',
  },
  {
    id: 4,
    title: 'Gaji에서 당신만의 세계를 완성하세요.',
    description: 'Complete your world in Gaji.',
    hasCta: true,
  },
]

const props = defineProps<{
  activeStage: number
  stageBlend: number
}>()

const TEXT_OFFSET_VH = 20
const STAGE_SPACING_VH = 100

const getTop = (index: number) => `${TEXT_OFFSET_VH + index * STAGE_SPACING_VH}vh`

const getOpacity = (index: number) => {
  const nextIndex = props.activeStage + 1
  if (index === props.activeStage) return 1 - props.stageBlend
  if (index === nextIndex) return props.stageBlend
  return 0
}

defineEmits(['start-writing'])
</script>

<template>
  <div :class="overlayContainerStyle">
    <div
      v-for="(stage, index) in stages"
      :key="stage.id"
      :class="sectionStyle"
      :style="{
        top: getTop(index),
        opacity: getOpacity(index),
        pointerEvents: getOpacity(index) > 0 ? 'auto' : 'none',
      }"
    >
      <h2 :class="titleStyle">{{ stage.title }}</h2>
      <p :class="descStyle">{{ stage.description }}</p>

      <button v-if="stage.hasCta" @click="$emit('start-writing')" :class="ctaButtonStyle">
        Start Writing
      </button>
    </div>
  </div>
</template>

<script lang="ts">
const overlayContainerStyle = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%', // Fill the sticky wrapper
  pointerEvents: 'none', // Allow clicks to pass through to 3D scene if needed, but buttons need pointer-events: auto
  zIndex: 20,
})

const sectionStyle = css({
  position: 'absolute',
  width: '100%',
  textAlign: 'center',
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.5s ease-in-out',
})

const titleStyle = css({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: 'white',
  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  marginBottom: '1rem',
  '@media (max-width: 768px)': {
    fontSize: '1.8rem',
  },
})

const descStyle = css({
  fontSize: '1.2rem',
  color: 'green.100',
  textShadow: '0 2px 5px rgba(0,0,0,0.3)',
  marginBottom: '2rem',
})

const ctaButtonStyle = css({
  pointerEvents: 'auto',
  padding: '1rem 2rem',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: 'green.900',
  bg: 'green.300',
  borderRadius: 'full',
  cursor: 'pointer',
  transition: 'all 0.3s',
  _hover: {
    bg: 'white',
    transform: 'scale(1.05)',
  },
})
</script>
