<script setup lang="ts">
import { shallowRef, computed } from 'vue'
import { useLoop } from '@tresjs/core'
import { DoubleSide } from 'three'

const props = defineProps<{
  progress: number
  activeStage: number
  stageBlend: number
}>()

const groupRef = shallowRef()
const penRef = shallowRef()
const scrollRef = shallowRef()
const bookRef = shallowRef()
const keyRef = shallowRef()

const { onBeforeRender } = useLoop()

// --- Helpers ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const stagePosition = computed(() => props.activeStage + props.stageBlend)

// Stage visibility
const stageAlpha = (index: number) => (index === props.activeStage ? 1 : 0)

const alphaPen = computed(() => stageAlpha(0))
const alphaScroll = computed(() => stageAlpha(1))
const alphaBook = computed(() => stageAlpha(2))
const alphaKey = computed(() => stageAlpha(3))

// Scales
const SCALE_MULTIPLIER = 1.5
const penScale = computed(() => (0.8 + 0.2 * alphaPen.value) * SCALE_MULTIPLIER)
const scrollScale = computed(() => (0.8 + 0.2 * alphaScroll.value) * SCALE_MULTIPLIER)
const bookScale = computed(() => (0.8 + 0.2 * alphaBook.value) * SCALE_MULTIPLIER)
const keyScale = computed(() => (0.8 + 0.2 * alphaKey.value) * SCALE_MULTIPLIER)

// Anchors (Y positions)
const stageAnchors = [0, 2, 4, 6]

onBeforeRender(({ elapsed }) => {
  if (groupRef.value) {
    // Constant rotation
    groupRef.value.rotation.y = elapsed * 0.2

    // Camera/Group movement
    const clampedStage = Math.min(stageAnchors.length - 1, Math.max(0, stagePosition.value))
    const currentIndex = Math.floor(clampedStage)
    const nextIndex = Math.min(stageAnchors.length - 1, currentIndex + 1)
    const localBlend = currentIndex === nextIndex ? 0 : props.stageBlend
    const anchor = lerp(stageAnchors[currentIndex], stageAnchors[nextIndex], localBlend)

    const targetY = -anchor
    groupRef.value.position.y = targetY + Math.sin(elapsed) * 0.1
  }

  // Individual Animations
  if (penRef.value) {
    penRef.value.rotation.z = Math.sin(elapsed) * 0.1
    penRef.value.rotation.x = Math.cos(elapsed * 0.5) * 0.1
  }
  if (scrollRef.value) {
    scrollRef.value.rotation.x = Math.sin(elapsed * 0.8) * 0.1
  }
  if (bookRef.value) {
    // Book opening animation?
    // For now just float
  }
  if (keyRef.value) {
    keyRef.value.rotation.z = elapsed * 0.5
  }
})
</script>

<template>
  <TresGroup ref="groupRef">
    <!-- Stage 0: Pen (Writing) -->
    <TresGroup
      ref="penRef"
      :position="[0, stageAnchors[0], 0]"
      :scale="[penScale, penScale, penScale]"
      :visible="alphaPen > 0.001"
    >
      <!-- Body -->
      <TresMesh :position="[0, 0, 0]">
        <TresCylinderGeometry :args="[0.1, 0.1, 1.5, 16]" />
        <TresMeshStandardMaterial color="#1e293b" :roughness="0.3" :metalness="0.8" />
      </TresMesh>
      <!-- Tip -->
      <TresMesh :position="[0, -0.85, 0]">
        <TresConeGeometry :args="[0.1, 0.2, 16]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.2" />
      </TresMesh>
      <!-- Feather/Top (Optional) -->
      <TresMesh :position="[0, 0.85, 0]">
        <TresSphereGeometry :args="[0.12, 16, 16]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.2" />
      </TresMesh>
    </TresGroup>

    <!-- Stage 1: Scroll (Connection) -->
    <TresGroup
      ref="scrollRef"
      :position="[0, stageAnchors[1], 0]"
      :scale="[scrollScale, scrollScale, scrollScale]"
      :visible="alphaScroll > 0.001"
    >
      <!-- Paper -->
      <TresMesh :position="[0, 0, 0]" :rotation="[0, 0, 0]">
        <TresPlaneGeometry :args="[1.2, 1.6, 4, 4]" />
        <TresMeshStandardMaterial color="#fefce8" side="DoubleSide" />
      </TresMesh>
      <!-- Top Roll -->
      <TresMesh :position="[0, 0.8, 0.05]" :rotation="[0, 0, 1.57]">
        <TresCylinderGeometry :args="[0.1, 0.1, 1.4, 16]" />
        <TresMeshStandardMaterial color="#854d0e" />
      </TresMesh>
      <!-- Bottom Roll -->
      <TresMesh :position="[0, -0.8, 0.05]" :rotation="[0, 0, 1.57]">
        <TresCylinderGeometry :args="[0.1, 0.1, 1.4, 16]" />
        <TresMeshStandardMaterial color="#854d0e" />
      </TresMesh>
    </TresGroup>

    <!-- Stage 2: Book (Emotion/Story) - Reusing existing book model -->
    <TresGroup
      ref="bookRef"
      :position="[0, stageAnchors[2], 0]"
      :scale="[bookScale, bookScale, bookScale]"
      :visible="alphaBook > 0.001"
      :rotation="[0.5, -0.5, 0]"
    >
      <!-- Left Cover -->
      <TresMesh :position="[-0.8, 0, 0]" :rotation="[0, 0.2, 0]">
        <TresBoxGeometry :args="[1.6, 2.2, 0.1]" />
        <TresMeshStandardMaterial color="#ef4444" />
      </TresMesh>
      <!-- Right Cover -->
      <TresMesh :position="[0.8, 0, 0]" :rotation="[0, -0.2, 0]">
        <TresBoxGeometry :args="[1.6, 2.2, 0.1]" />
        <TresMeshStandardMaterial color="#ef4444" />
      </TresMesh>
      <!-- Left Pages -->
      <TresMesh :position="[-0.75, 0.05, 0]" :rotation="[0, 0.2, 0]">
        <TresBoxGeometry :args="[1.4, 2.0, 0.15]" />
        <TresMeshStandardMaterial color="#fefce8" />
      </TresMesh>
      <!-- Right Pages -->
      <TresMesh :position="[0.75, 0.05, 0]" :rotation="[0, -0.2, 0]">
        <TresBoxGeometry :args="[1.4, 2.0, 0.15]" />
        <TresMeshStandardMaterial color="#fefce8" />
      </TresMesh>
      <!-- Spine -->
      <TresMesh :position="[0, 0, 0]" :rotation="[0, 0, 1.57]">
        <TresCylinderGeometry :args="[0.15, 0.15, 2.2, 16]" />
        <TresMeshStandardMaterial color="#b91c1c" />
      </TresMesh>
    </TresGroup>

    <!-- Stage 3: Key (Magic/Unlock) -->
    <TresGroup
      ref="keyRef"
      :position="[0, stageAnchors[3], 0]"
      :scale="[keyScale, keyScale, keyScale]"
      :visible="alphaKey > 0.001"
    >
      <!-- Head (Ring) -->
      <TresMesh :position="[0, 0.8, 0]">
        <TresTorusGeometry :args="[0.3, 0.08, 16, 32]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.1" />
      </TresMesh>
      <!-- Shaft -->
      <TresMesh :position="[0, 0, 0]">
        <TresCylinderGeometry :args="[0.08, 0.08, 1.6, 16]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.1" />
      </TresMesh>
      <!-- Teeth -->
      <TresMesh :position="[0.2, -0.6, 0]">
        <TresBoxGeometry :args="[0.4, 0.2, 0.1]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.1" />
      </TresMesh>
      <TresMesh :position="[0.2, -0.3, 0]">
        <TresBoxGeometry :args="[0.3, 0.15, 0.1]" />
        <TresMeshStandardMaterial color="#fbbf24" :metalness="1" :roughness="0.1" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
