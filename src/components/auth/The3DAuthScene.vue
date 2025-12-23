<script setup lang="ts">
import { shallowRef, computed } from 'vue'
import { useLoop } from '@tresjs/core'
import { Color, DoubleSide } from 'three'

const props = defineProps<{
  progress: number
  activeStage: number
  stageBlend: number
}>()

const groupRef = shallowRef()
const bulbRef = shallowRef()

const { onBeforeRender } = useLoop()

// --- Helpers ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const stagePosition = computed(() => props.activeStage + props.stageBlend)

// Stage visibility: render only the active stage to keep objects separate
const stageAlpha = (index: number) => (index === props.activeStage ? 1 : 0)

// Per-stage alpha helpers
const alphaSeed = computed(() => stageAlpha(0))
const alphaBranch = computed(() => stageAlpha(1))
const alphaBulb = computed(() => stageAlpha(2))
const alphaLeaves = computed(() => stageAlpha(3))

// Stage-specific scales/intensity (모든 크기 2배 증가)
const SCALE_MULTIPLIER = 2
const seedScale = computed(() => (0.8 + 0.4 * alphaSeed.value) * SCALE_MULTIPLIER)
const branchScale = computed(() => alphaBranch.value * SCALE_MULTIPLIER)
// Branch growth: Starts after a short delay (10% scroll) to ensure visibility, then grows quickly
const branchGrowth = computed(() => Math.min(1, Math.max(0, (props.stageBlend - 0.1) * 10)))

const bulbIntensity = computed(() => props.stageBlend * 2) // Grows with scroll
const bulbColor = computed(() => {
  const c = new Color('#4b5563')
  return c.lerp(new Color('#fbbf24'), props.stageBlend)
})
const bulbScale = computed(() => (0.3 + 0.7 * props.stageBlend) * SCALE_MULTIPLIER) // Starts small, grows with scroll

const leafScale = computed(() => alphaLeaves.value * SCALE_MULTIPLIER)

// --- Anchor positions for each stage (seed, branches, bulb, leaves) ---
// Values are Y offsets of the feature we want centered in view (2배 스케일 적용)
const stageAnchors = [
  0.2 * SCALE_MULTIPLIER,
  0.8 * SCALE_MULTIPLIER,
  1.0 * SCALE_MULTIPLIER,
  1.2 * SCALE_MULTIPLIER,
]

// --- Animation Loop ---
onBeforeRender(({ elapsed }) => {
  if (groupRef.value) {
    // Constant gentle rotation
    groupRef.value.rotation.y = elapsed * 0.3

    // Blend anchor positions so the focal point follows the active text stage
    const clampedStage = Math.min(stageAnchors.length - 1, Math.max(0, stagePosition.value))
    const currentIndex = Math.floor(clampedStage)
    const nextIndex = Math.min(stageAnchors.length - 1, currentIndex + 1)
    const localBlend = currentIndex === nextIndex ? 0 : props.stageBlend
    const anchor = lerp(stageAnchors[currentIndex], stageAnchors[nextIndex], localBlend)

    // Move the whole scene so the active feature sits behind the overlay text
    const targetY = -anchor

    // Floating effect added to the anchored position
    groupRef.value.position.y = targetY + Math.sin(elapsed) * 0.1
  }

  if (bulbRef.value) {
    bulbRef.value.rotation.z = Math.sin(elapsed * 2) * 0.1
  }
})
</script>

<template>
  <TresGroup ref="groupRef">
    <!-- Stage 1: Seed (New Concept: Cute Sprout 🌱) -->
    <TresGroup :scale="[seedScale, seedScale, seedScale]" :visible="alphaSeed > 0.001">
      <!-- Soil Mound (둥근 흙더미) -->
      <TresMesh :position="[0, -0.25, 0]" :scale="[1.5, 0.5, 1.5]">
        <TresSphereGeometry :args="[0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]" />
        <TresMeshStandardMaterial color="#5D4037" :roughness="1" />
      </TresMesh>

      <!-- Seed Shell (바닥에 떨어진 씨앗 껍질) -->
      <TresGroup :position="[0.15, -0.22, 0.1]" :rotation="[0, 0.5, 0.2]">
        <TresMesh :rotation="[0, 0, -0.5]">
          <TresSphereGeometry :args="[0.05, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]" />
          <TresMeshStandardMaterial color="#8D6E63" :roughness="0.8" side="DoubleSide" />
        </TresMesh>
      </TresGroup>

      <!-- Main Stem (줄기) -->
      <TresMesh :position="[0, 0, 0]" :rotation="[0.05, 0, 0]">
        <!-- 약간 위로 갈수록 얇아지는 원통 -->
        <TresCylinderGeometry :args="[0.02, 0.035, 0.5, 16]" />
        <TresMeshPhysicalMaterial color="#AED581" :roughness="0.5" :metalness="0.1" />
      </TresMesh>

      <!-- Left Leaf (왼쪽 떡잎) -->
      <TresGroup :position="[0, 0.22, 0]" :rotation="[0, 0, 0.6]">
        <!-- Petiole (잎자루) -->
        <TresMesh :position="[0, 0.05, 0]">
          <TresCylinderGeometry :args="[0.008, 0.015, 0.1, 8]" />
          <TresMeshPhysicalMaterial color="#AED581" :roughness="0.5" />
        </TresMesh>
        <!-- Blade (잎) -->
        <TresMesh :position="[0, 0.18, 0]" :scale="[1, 1.4, 0.1]">
          <TresSphereGeometry :args="[0.12, 32, 32]" />
          <TresMeshPhysicalMaterial
            color="#7CB342"
            :roughness="0.3"
            :clearcoat="0.2"
            :emissive="'#8BC34A'"
            :emissive-intensity="0.1"
          />
        </TresMesh>
      </TresGroup>

      <!-- Right Leaf (오른쪽 떡잎) -->
      <TresGroup :position="[0, 0.22, 0]" :rotation="[0, 0, -0.6]">
        <!-- Petiole (잎자루) -->
        <TresMesh :position="[0, 0.05, 0]">
          <TresCylinderGeometry :args="[0.008, 0.015, 0.1, 8]" />
          <TresMeshPhysicalMaterial color="#AED581" :roughness="0.5" />
        </TresMesh>
        <!-- Blade (잎) -->
        <TresMesh :position="[0, 0.18, 0]" :scale="[1, 1.4, 0.1]">
          <TresSphereGeometry :args="[0.12, 32, 32]" />
          <TresMeshPhysicalMaterial
            color="#7CB342"
            :roughness="0.3"
            :clearcoat="0.2"
            :emissive="'#8BC34A'"
            :emissive-intensity="0.1"
          />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 2: Growing Sapling (Branches extending with scroll) -->
    <TresGroup :scale="[branchScale, branchScale, branchScale]" :visible="alphaBranch > 0.001">
      <!-- Main Trunk (메인 줄기) -->
      <TresMesh :position="[0, 0.3, 0]">
        <TresCylinderGeometry :args="[0.03, 0.05, 0.8, 16]" />
        <TresMeshPhysicalMaterial color="#8D6E63" :roughness="0.6" :metalness="0.1" />
      </TresMesh>

      <!-- Growing Branches Group -->
      <TresGroup :position="[0, 0.1, 0]">
        <!-- Branch 1: Right (오른쪽 가지) -->
        <TresGroup
          :position="[0.02, 0.1, 0]"
          :rotation="[0, 0, -0.8]"
          :scale="[branchGrowth, branchGrowth, branchGrowth]"
        >
          <TresMesh :position="[0, 0.25, 0]">
            <TresCylinderGeometry :args="[0.015, 0.025, 0.5, 8]" />
            <TresMeshPhysicalMaterial color="#8D6E63" :roughness="0.6" />
          </TresMesh>
          <!-- Leaf Cluster -->
          <TresMesh :position="[0, 0.5, 0]" :scale="[1, 0.3, 1]">
            <TresSphereGeometry :args="[0.12, 16, 16]" />
            <TresMeshPhysicalMaterial color="#66BB6A" :roughness="0.4" />
          </TresMesh>
        </TresGroup>

        <!-- Branch 2: Left (왼쪽 가지) -->
        <TresGroup
          :position="[-0.02, 0.2, 0]"
          :rotation="[0, 0, 0.9]"
          :scale="[branchGrowth * 0.9, branchGrowth * 0.9, branchGrowth * 0.9]"
        >
          <TresMesh :position="[0, 0.2, 0]">
            <TresCylinderGeometry :args="[0.015, 0.025, 0.4, 8]" />
            <TresMeshPhysicalMaterial color="#8D6E63" :roughness="0.6" />
          </TresMesh>
          <!-- Leaf Cluster -->
          <TresMesh :position="[0, 0.4, 0]" :scale="[1, 0.3, 1]">
            <TresSphereGeometry :args="[0.1, 16, 16]" />
            <TresMeshPhysicalMaterial color="#66BB6A" :roughness="0.4" />
          </TresMesh>
        </TresGroup>

        <!-- Branch 3: Front-Right (앞쪽 가지) -->
        <TresGroup
          :position="[0, 0.3, 0.02]"
          :rotation="[0.7, 0.5, -0.3]"
          :scale="[branchGrowth * 0.8, branchGrowth * 0.8, branchGrowth * 0.8]"
        >
          <TresMesh :position="[0, 0.15, 0]">
            <TresCylinderGeometry :args="[0.012, 0.02, 0.3, 8]" />
            <TresMeshPhysicalMaterial color="#8D6E63" :roughness="0.6" />
          </TresMesh>
          <!-- Leaf Cluster -->
          <TresMesh :position="[0, 0.3, 0]" :scale="[1, 0.3, 1]">
            <TresSphereGeometry :args="[0.08, 16, 16]" />
            <TresMeshPhysicalMaterial color="#66BB6A" :roughness="0.4" />
          </TresMesh>
        </TresGroup>

        <!-- Branch 4: Back-Left (뒤쪽 가지) -->
        <TresGroup
          :position="[0, 0.4, -0.02]"
          :rotation="[-0.6, 0, 0.4]"
          :scale="[branchGrowth * 0.85, branchGrowth * 0.85, branchGrowth * 0.85]"
        >
          <TresMesh :position="[0, 0.18, 0]">
            <TresCylinderGeometry :args="[0.012, 0.02, 0.35, 8]" />
            <TresMeshPhysicalMaterial color="#8D6E63" :roughness="0.6" />
          </TresMesh>
          <!-- Leaf Cluster -->
          <TresMesh :position="[0, 0.35, 0]" :scale="[1, 0.3, 1]">
            <TresSphereGeometry :args="[0.09, 16, 16]" />
            <TresMeshPhysicalMaterial color="#66BB6A" :roughness="0.4" />
          </TresMesh>
        </TresGroup>
      </TresGroup>
    </TresGroup>

    <!-- Stage 3: Idea Bulb (New Concept: Cute Bulb 💡) -->
    <TresGroup
      ref="bulbRef"
      :position="[0, 3.0, 0]"
      :scale="[bulbScale, bulbScale, bulbScale]"
      :visible="alphaBulb > 0.001"
    >
      <!-- Bulb Base (Grey Screw) -->
      <TresGroup :position="[0, -0.55, 0]">
        <!-- Main Base Cylinder -->
        <TresMesh>
          <TresCylinderGeometry :args="[0.18, 0.15, 0.35, 32]" />
          <TresMeshStandardMaterial color="#78909C" :metalness="0.6" :roughness="0.4" />
        </TresMesh>
        <!-- Screw Threads (Rings) -->
        <TresMesh :position="[0, 0.08, 0]" :rotation="[Math.PI / 2, 0, 0]">
          <TresTorusGeometry :args="[0.19, 0.02, 16, 32]" />
          <TresMeshStandardMaterial color="#90A4AE" :metalness="0.6" :roughness="0.4" />
        </TresMesh>
        <TresMesh :position="[0, -0.08, 0]" :rotation="[Math.PI / 2, 0, 0]">
          <TresTorusGeometry :args="[0.17, 0.02, 16, 32]" />
          <TresMeshStandardMaterial color="#90A4AE" :metalness="0.6" :roughness="0.4" />
        </TresMesh>
        <!-- Bottom Contact -->
        <TresMesh :position="[0, -0.2, 0]">
          <TresSphereGeometry :args="[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]" />
          <TresMeshStandardMaterial color="#37474F" />
        </TresMesh>
      </TresGroup>

      <!-- Bulb Glass (Yellow Sphere) -->
      <TresMesh :position="[0, 0.1, 0]">
        <TresSphereGeometry :args="[0.5, 64, 64]" />
        <TresMeshPhysicalMaterial
          :color="bulbColor"
          :emissive="bulbColor"
          :emissive-intensity="bulbIntensity"
          :roughness="0.2"
          :metalness="0.1"
          :transmission="0.1"
          :thickness="0.1"
          :clearcoat="0.5"
        />
      </TresMesh>

      <!-- Filament (Simple Glow Shape) -->
      <TresMesh :position="[0, 0.1, 0]" :rotation="[0, 0, Math.PI]">
        <TresTorusGeometry :args="[0.15, 0.03, 16, 32, Math.PI]" />
        <TresMeshBasicMaterial color="#FFF59D" />
      </TresMesh>

      <!-- Light Source -->
      <TresPointLight
        :intensity="bulbIntensity * 3"
        :distance="8"
        color="#FFD54F"
        :position="[0, 0.1, 0]"
      />
    </TresGroup>

    <!-- Stage 4: Fresh Leaf (New Concept: Detailed Leaf 🍃) -->
    <TresGroup
      :position="[0, 2.5, 0]"
      :scale="[leafScale, leafScale, leafScale]"
      :visible="alphaLeaves > 0.001"
    >
      <!-- Leaf Group (Rotated for better view) -->
      <TresGroup :rotation="[0.4, 0.2, 0]">
        <!-- Petiole (잎자루) -->
        <TresMesh :position="[0, -0.7, 0]">
          <TresCylinderGeometry :args="[0.03, 0.04, 0.4, 16]" />
          <TresMeshPhysicalMaterial color="#66BB6A" :roughness="0.6" />
        </TresMesh>

        <!-- Main Leaf Blade (잎몸) -->
        <TresMesh :position="[0, 0, 0]" :scale="[1, 1.4, 0.15]">
          <TresSphereGeometry :args="[0.6, 32, 32]" />
          <TresMeshPhysicalMaterial
            color="#4CAF50"
            :roughness="0.3"
            :metalness="0.1"
            :clearcoat="0.3"
            :emissive="'#81C784'"
            :emissive-intensity="0.1"
          />
        </TresMesh>

        <!-- Midrib (중심 잎맥) - Front -->
        <TresMesh :position="[0, 0, 0.08]" :rotation="[0, 0, 0]" :scale="[0.05, 1.3, 0.05]">
          <TresCylinderGeometry :args="[1, 1, 1, 16]" />
          <TresMeshStandardMaterial color="#A5D6A7" :roughness="0.5" />
        </TresMesh>

        <!-- Midrib (중심 잎맥) - Back -->
        <TresMesh :position="[0, 0, -0.08]" :rotation="[0, 0, 0]" :scale="[0.05, 1.3, 0.05]">
          <TresCylinderGeometry :args="[1, 1, 1, 16]" />
          <TresMeshStandardMaterial color="#A5D6A7" :roughness="0.5" />
        </TresMesh>

        <!-- Veins (잎맥 패턴) - Front -->
        <TresGroup :position="[0, 0, 0.07]">
          <TresMesh :position="[0.25, 0.2, 0]" :rotation="[0, 0, -0.9]" :scale="[0.03, 0.5, 0.03]">
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh :position="[-0.25, 0.1, 0]" :rotation="[0, 0, 0.9]" :scale="[0.03, 0.5, 0.03]">
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh
            :position="[0.22, -0.3, 0]"
            :rotation="[0, 0, -0.8]"
            :scale="[0.03, 0.45, 0.03]"
          >
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh
            :position="[-0.22, -0.4, 0]"
            :rotation="[0, 0, 0.8]"
            :scale="[0.03, 0.45, 0.03]"
          >
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
        </TresGroup>

        <!-- Veins (잎맥 패턴) - Back -->
        <TresGroup :position="[0, 0, -0.07]">
          <TresMesh :position="[0.25, 0.2, 0]" :rotation="[0, 0, -0.9]" :scale="[0.03, 0.5, 0.03]">
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh :position="[-0.25, 0.1, 0]" :rotation="[0, 0, 0.9]" :scale="[0.03, 0.5, 0.03]">
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh
            :position="[0.22, -0.3, 0]"
            :rotation="[0, 0, -0.8]"
            :scale="[0.03, 0.45, 0.03]"
          >
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
          <TresMesh
            :position="[-0.22, -0.4, 0]"
            :rotation="[0, 0, 0.8]"
            :scale="[0.03, 0.45, 0.03]"
          >
            <TresCylinderGeometry :args="[1, 1, 1, 8]" />
            <TresMeshStandardMaterial color="#A5D6A7" />
          </TresMesh>
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
