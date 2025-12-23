<script setup lang="ts">
import { shallowRef, computed } from 'vue'
import { useLoop } from '@tresjs/core'

const props = defineProps<{
  progress: number
  activeStage: number
  stageBlend: number
}>()

const GOLD_PRIMARY = '#f5c542'
const GOLD_EDGE = '#ffe8a3'
const EBONY = '#151718'
const PAGE_COLOR = '#fef6df'
const TORUS_COLOR = '#facc15'
const GALAXY_LIGHT = '#fff1c1'

const bookDustOffsets = [
  { position: [-0.55, 0.35, 0.1], scale: 0.08 },
  { position: [0.4, 0.48, -0.1], scale: 0.06 },
  { position: [-0.1, 0.6, 0.2], scale: 0.05 },
  { position: [0.15, 0.32, 0.25], scale: 0.07 },
  { position: [-0.35, 0.55, -0.2], scale: 0.05 },
  { position: [0.3, 0.7, 0.05], scale: 0.04 },
]

const sparkleConfigs = Array.from({ length: 14 }, (_, index) => ({
  angle: (index / 14) * Math.PI * 2,
  radius: 0.3 + (index % 4) * 0.08,
  height: -0.15 + (index % 3) * 0.15,
  scale: 0.12 + (index % 3) * 0.03,
}))

const groupRef = shallowRef()
const scrollDrift = shallowRef(0)
const galaxySpin = shallowRef(0)

const { onBeforeRender } = useLoop()

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const stagePosition = computed(() => props.activeStage + props.stageBlend)
const stageBlendClamped = computed(() => clamp(props.stageBlend, 0, 1))

const MIN_SCALE = 0.1
const MAX_SCALE = 4.0
const SCALE_MULTIPLIER = 2

const stageAlpha = (index: number) => {
  const distance = Math.abs(stagePosition.value - index)
  return clamp(1 - distance, 0, 1)
}

const alphaBook = computed(() => stageAlpha(0))
const alphaScroll = computed(() => stageAlpha(1))
const alphaClosed = computed(() => stageAlpha(2))
const alphaGalaxy = computed(() => stageAlpha(3))

const bookScale = computed(() => {
  const base = (0.9 + 0.2 * alphaBook.value) * SCALE_MULTIPLIER
  return clamp(base, MIN_SCALE, MAX_SCALE)
})

const scrollScale = computed(() => {
  const base = (0.85 + 0.3 * alphaScroll.value) * SCALE_MULTIPLIER
  return clamp(base, MIN_SCALE, MAX_SCALE)
})

const closedScale = computed(() => {
  const base = (0.9 + 0.3 * alphaClosed.value) * SCALE_MULTIPLIER
  return clamp(base, MIN_SCALE, MAX_SCALE)
})

const galaxyScale = computed(() => {
  const base = (0.8 + 0.5 * alphaGalaxy.value) * SCALE_MULTIPLIER
  return clamp(base, MIN_SCALE, MAX_SCALE)
})

const bookPulse = computed(() => 1 + Math.sin(props.progress * Math.PI * 2) * 0.05)
const bookOpenAngle = computed(() => lerp(0.75, 0.4, stageBlendClamped.value))
const scrollRingSeparation = computed(() => 0.35 + stageBlendClamped.value * 0.45)
const scrollRingTwist = computed(() => lerp(-0.3, 0.35, stageBlendClamped.value))
const scrollRibbonStretch = computed(() => 0.6 + stageBlendClamped.value * 0.8)
const closedBookAngle = computed(() => lerp(Math.PI / 3, 0.05, stageBlendClamped.value))
const closedBookGlow = computed(() => lerp(0.25, 0.65, stageBlendClamped.value))
const galaxySpread = computed(() => 0.3 + stageBlendClamped.value * 0.8)

const stageAnchors = [
  0.3 * SCALE_MULTIPLIER,
  0.8 * SCALE_MULTIPLIER,
  1.0 * SCALE_MULTIPLIER,
  1.3 * SCALE_MULTIPLIER,
]

onBeforeRender(({ elapsed }) => {
  if (groupRef.value) {
    groupRef.value.rotation.y = elapsed * 0.25
    const clampedStage = Math.min(stageAnchors.length - 1, Math.max(0, stagePosition.value))
    const currentIndex = Math.floor(clampedStage)
    const nextIndex = Math.min(stageAnchors.length - 1, currentIndex + 1)
    const localBlend = currentIndex === nextIndex ? 0 : stageBlendClamped.value
    const anchor = lerp(stageAnchors[currentIndex], stageAnchors[nextIndex], localBlend)
    const targetY = -anchor
    groupRef.value.position.y = targetY + Math.sin(elapsed) * 0.08
  }

  scrollDrift.value = Math.sin(elapsed * 0.8) * 0.12
  galaxySpin.value = elapsed * 0.25
})
</script>

<template>
  <TresGroup ref="groupRef">
    <!-- Stage 1: The Book (gold, breathing particles) -->
    <TresGroup
      :scale="[bookScale * bookPulse, bookScale * bookPulse, bookScale * bookPulse]"
      :visible="alphaBook > 0.001"
    >
      <TresMesh :position="[0, -0.05, 0]" :scale="[1.45, 0.12, 1]">
        <TresBoxGeometry :args="[1.2, 0.12, 0.8]" />
        <TresMeshStandardMaterial :color="EBONY" :roughness="0.85" :metalness="0.25" />
      </TresMesh>

      <TresMesh :scale="[1.1, 0.08, 0.72]">
        <TresBoxGeometry :args="[1.1, 0.08, 0.72]" />
        <TresMeshStandardMaterial :color="PAGE_COLOR" :roughness="0.25" />
      </TresMesh>

      <TresGroup :position="[-0.55, 0, 0]" :rotation="[0, bookOpenAngle, 0]">
        <TresMesh :position="[0.55, 0, 0]" :scale="[1.2, 0.08, 0.8]">
          <TresBoxGeometry :args="[1.1, 0.08, 0.78]" />
          <TresMeshStandardMaterial
            :color="GOLD_PRIMARY"
            :metalness="0.8"
            :roughness="0.2"
            :emissive="GOLD_EDGE"
            :emissive-intensity="0.35"
          />
        </TresMesh>
      </TresGroup>

      <TresMesh :position="[0.58, 0, 0]" :scale="[0.08, 0.09, 0.82]">
        <TresBoxGeometry :args="[0.08, 0.09, 0.82]" />
        <TresMeshStandardMaterial :color="GOLD_EDGE" :roughness="0.4" />
      </TresMesh>

      <TresGroup v-for="(dust, dustIndex) in bookDustOffsets" :key="`book-dust-${dustIndex}`">
        <TresMesh :position="dust.position" :scale="[dust.scale, dust.scale, dust.scale]">
          <TresSphereGeometry :args="[0.1, 12, 12]" />
          <TresMeshStandardMaterial
            :color="GOLD_EDGE"
            :emissive="GOLD_EDGE"
            :emissive-intensity="0.45"
          />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 2: HandScroll (interlocking torus rings) -->
    <TresGroup :scale="[scrollScale, scrollScale, scrollScale]" :visible="alphaScroll > 0.001">
      <TresGroup
        :position="[-scrollRingSeparation, 0, 0]"
        :rotation="[Math.PI / 2, 0, scrollRingTwist + scrollDrift]"
      >
        <TresMesh>
          <TresTorusGeometry :args="[0.45, 0.06, 40, 90]" />
          <TresMeshStandardMaterial
            :color="TORUS_COLOR"
            :metalness="0.9"
            :roughness="0.1"
            :emissive="GOLD_EDGE"
            :emissive-intensity="0.35"
          />
        </TresMesh>
      </TresGroup>

      <TresGroup
        :position="[scrollRingSeparation, 0, 0]"
        :rotation="[Math.PI / 2, 0, -scrollRingTwist + scrollDrift]"
      >
        <TresMesh>
          <TresTorusGeometry :args="[0.45, 0.06, 40, 90]" />
          <TresMeshStandardMaterial
            :color="TORUS_COLOR"
            :metalness="0.9"
            :roughness="0.1"
            :emissive="GOLD_EDGE"
            :emissive-intensity="0.35"
          />
        </TresMesh>
      </TresGroup>

      <TresMesh :scale="[scrollRibbonStretch, 0.05, 0.25]">
        <TresBoxGeometry :args="[1, 0.05, 0.25]" />
        <TresMeshStandardMaterial :color="'#0f172a'" :roughness="0.8" />
      </TresMesh>

      <TresMesh :position="[0, 0.05, 0]" :scale="[0.4, 0.02, 0.4]">
        <TresCylinderGeometry :args="[0.15, 0.15, 0.4, 32]" />
        <TresMeshStandardMaterial :color="'#cbd5f5'" :roughness="0.3" />
      </TresMesh>
    </TresGroup>

    <!-- Stage 3: Closed Book (hinged cover animation) -->
    <TresGroup :scale="[closedScale, closedScale, closedScale]" :visible="alphaClosed > 0.001">
      <TresMesh :scale="[1.3, 0.12, 0.85]">
        <TresBoxGeometry :args="[1.3, 0.12, 0.85]" />
        <TresMeshStandardMaterial :color="EBONY" :roughness="0.8" />
      </TresMesh>

      <TresMesh :scale="[1.24, 0.11, 0.78]">
        <TresBoxGeometry :args="[1.24, 0.11, 0.78]" />
        <TresMeshStandardMaterial :color="PAGE_COLOR" :roughness="0.3" />
      </TresMesh>

      <TresMesh :position="[0.62, 0, 0]" :scale="[0.08, 0.12, 0.82]">
        <TresBoxGeometry :args="[0.08, 0.12, 0.82]" />
        <TresMeshStandardMaterial :color="GOLD_EDGE" :roughness="0.25" />
      </TresMesh>

      <TresGroup :position="[-0.65, 0, 0]">
        <TresMesh :scale="[0.06, 0.12, 0.82]">
          <TresBoxGeometry :args="[0.06, 0.12, 0.82]" />
          <TresMeshStandardMaterial :color="GOLD_EDGE" :roughness="0.25" />
        </TresMesh>
      </TresGroup>

      <TresGroup :position="[-0.65, 0, 0]" :rotation="[0, -closedBookAngle, 0]">
        <TresMesh :position="[0.65, 0, 0]" :scale="[1.3, 0.12, 0.84]">
          <TresBoxGeometry :args="[1.3, 0.12, 0.84]" />
          <TresMeshStandardMaterial
            :color="GOLD_PRIMARY"
            :metalness="0.85"
            :roughness="0.2"
            :emissive="GOLD_EDGE"
            :emissive-intensity="closedBookGlow"
          />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 4: Sparkles (spiral galaxy finale) -->
    <TresGroup
      :scale="[galaxyScale, galaxyScale, galaxyScale]"
      :visible="alphaGalaxy > 0.001"
      :rotation="[0, galaxySpin, 0]"
    >
      <TresGroup
        v-for="(sparkle, sparkleIndex) in sparkleConfigs"
        :key="`sparkle-${sparkleIndex}`"
        :position="[
          Math.cos(sparkle.angle) * galaxySpread * sparkle.radius,
          sparkle.height,
          Math.sin(sparkle.angle) * galaxySpread * sparkle.radius,
        ]"
      >
        <TresMesh :scale="[sparkle.scale, sparkle.scale, sparkle.scale]">
          <TresOctahedronGeometry :args="[0.25, 0]" />
          <TresMeshStandardMaterial
            :color="GOLD_PRIMARY"
            :roughness="0.1"
            :metalness="0.95"
            :emissive="GALAXY_LIGHT"
            :emissive-intensity="0.6"
          />
        </TresMesh>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
