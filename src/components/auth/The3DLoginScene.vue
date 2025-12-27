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
const booksRef = shallowRef()
const handshakeRef = shallowRef()
const emojisRef = shallowRef()
const keyRef = shallowRef()

const { onBeforeRender } = useLoop()

// --- Helpers ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// 현재 표시되는 stage인지 확인
const isCurrentStage = computed(() => props.activeStage === props.activeStage)

// 각 scene은 자신의 activeStage 값만 표시 (다른 stage의 오브젝트는 표시 안 함)
const shouldShowObject = computed(() => {
  // activeStage prop이 이 컴포넌트에 할당된 stage ID와 같을 때만 표시
  return true
})

// Scales - stageBlend를 이용한 부드러운 전환
const SCALE_MULTIPLIER = 1.5
const objectScale = computed(() => {
  const baseScale = 0.8 + 0.2 * props.stageBlend
  return baseScale * SCALE_MULTIPLIER
})

onBeforeRender(({ elapsed }) => {
  if (groupRef.value) {
    // Constant rotation
    groupRef.value.rotation.y = elapsed * 0.2
    groupRef.value.position.y = Math.sin(elapsed) * 0.1
  }

  // Individual Animations based on activeStage
  if (props.activeStage === 0 && booksRef.value) {
    booksRef.value.position.y = Math.sin(elapsed) * 0.05
  }
  if (props.activeStage === 1 && handshakeRef.value) {
    // Gentle shake animation
    handshakeRef.value.rotation.z = Math.sin(elapsed * 2) * 0.05
    handshakeRef.value.position.y = Math.sin(elapsed * 4) * 0.05
  }
  if (props.activeStage === 2 && emojisRef.value) {
    // Emojis floating/bouncing
    emojisRef.value.rotation.z = Math.sin(elapsed * 1.5) * 0.05
    emojisRef.value.position.y = Math.cos(elapsed) * 0.05
  }
  if (props.activeStage === 3 && keyRef.value) {
    keyRef.value.rotation.z = elapsed * 0.5
  }
})
</script>

<template>
  <TresGroup ref="groupRef">
    <!-- Stage 0: Books (Knowledge/Story) - Stack of Books -->
    <TresGroup
      v-if="activeStage === 0"
      ref="booksRef"
      :position="[0, 0, 0]"
      :scale="[objectScale, objectScale, objectScale]"
      :rotation="[0.2, -0.5, 0]"
    >
      <!-- Bottom Book (Purple) -->
      <TresGroup :position="[0, -0.4, 0]" :rotation="[0, 0.2, 0]">
        <!-- Cover Top -->
        <TresMesh :position="[0, 0.151, 0]">
          <TresBoxGeometry :args="[1.6, 0.05, 2.2]" />
          <TresMeshStandardMaterial color="#8b5cf6" :depthWrite="true" />
        </TresMesh>
        <!-- Cover Bottom -->
        <TresMesh :position="[0, -0.151, 0]">
          <TresBoxGeometry :args="[1.6, 0.05, 2.2]" />
          <TresMeshStandardMaterial color="#8b5cf6" :depthWrite="true" />
        </TresMesh>
        <!-- Spine -->
        <TresMesh :position="[-0.75, 0, 0]">
          <TresBoxGeometry :args="[0.1, 0.35, 2.2]" />
          <TresMeshStandardMaterial color="#7c3aed" :depthWrite="true" />
        </TresMesh>
        <!-- Pages -->
        <TresMesh :position="[0.05, 0, 0]">
          <TresBoxGeometry :args="[1.5, 0.25, 2.1]" />
          <TresMeshStandardMaterial color="#fefce8" :depthWrite="true" />
        </TresMesh>
      </TresGroup>

      <!-- Middle Book (Cyan) -->
      <TresGroup :position="[0, 0, 0]" :rotation="[0, -0.15, 0]">
        <!-- Cover Top -->
        <TresMesh :position="[0, 0.151, 0]">
          <TresBoxGeometry :args="[1.4, 0.05, 2.0]" />
          <TresMeshStandardMaterial color="#22d3ee" :depthWrite="true" />
        </TresMesh>
        <!-- Cover Bottom -->
        <TresMesh :position="[0, -0.151, 0]">
          <TresBoxGeometry :args="[1.4, 0.05, 2.0]" />
          <TresMeshStandardMaterial color="#22d3ee" :depthWrite="true" />
        </TresMesh>
        <!-- Spine -->
        <TresMesh :position="[-0.65, 0, 0]">
          <TresBoxGeometry :args="[0.1, 0.35, 2.0]" />
          <TresMeshStandardMaterial color="#06b6d4" :depthWrite="true" />
        </TresMesh>
        <!-- Pages -->
        <TresMesh :position="[0.05, 0, 0]">
          <TresBoxGeometry :args="[1.3, 0.25, 1.9]" />
          <TresMeshStandardMaterial color="#fefce8" :depthWrite="true" />
        </TresMesh>
      </TresGroup>

      <!-- Top Book (Orange) -->
      <TresGroup :position="[0, 0.4, 0]" :rotation="[0, 0.1, 0]">
        <!-- Cover Top -->
        <TresMesh :position="[0, 0.151, 0]">
          <TresBoxGeometry :args="[1.2, 0.05, 1.8]" />
          <TresMeshStandardMaterial color="#fbbf24" :depthWrite="true" />
        </TresMesh>
        <!-- Cover Bottom -->
        <TresMesh :position="[0, -0.151, 0]">
          <TresBoxGeometry :args="[1.2, 0.05, 1.8]" />
          <TresMeshStandardMaterial color="#fbbf24" :depthWrite="true" />
        </TresMesh>
        <!-- Spine -->
        <TresMesh :position="[-0.55, 0, 0]">
          <TresBoxGeometry :args="[0.1, 0.35, 1.8]" />
          <TresMeshStandardMaterial color="#f59e0b" :depthWrite="true" />
        </TresMesh>
        <!-- Pages -->
        <TresMesh :position="[0.05, 0, 0]">
          <TresBoxGeometry :args="[1.1, 0.25, 1.7]" />
          <TresMeshStandardMaterial color="#fefce8" :depthWrite="true" />
        </TresMesh>
        <!-- Bookmark -->
        <TresMesh :position="[0.2, 0, 0.9]" :rotation="[0.2, 0, 0]">
          <TresBoxGeometry :args="[0.15, 0.4, 0.02]" />
          <TresMeshStandardMaterial color="#ef4444" :depthWrite="true" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 1: Handshake (Connection) -->
    <TresGroup
      v-if="activeStage === 1"
      ref="handshakeRef"
      :position="[0, 0, 0]"
      :scale="[objectScale, objectScale, objectScale]"
    >
      <!-- Left Arm (Front/Bottom-Left) -->
      <TresGroup :position="[-0.55, -0.4, 0]" :rotation="[0, 0, -0.785]">
        <!-- Sleeve (Even Shorter & Wider) -->
        <TresMesh :position="[0, 0, 0]">
          <TresCylinderGeometry :args="[0.3, 0.3, 0.6, 16]" />
          <TresMeshStandardMaterial color="#fbbf24" />
        </TresMesh>
        <!-- Cuff -->
        <TresMesh :position="[0, 0.35, 0]">
          <TresCylinderGeometry :args="[0.33, 0.33, 0.15, 16]" />
          <TresMeshStandardMaterial color="#ffffff" />
        </TresMesh>
        <!-- Hand Base (Even Bigger) -->
        <TresMesh :position="[0, 0.7, 0]">
          <TresBoxGeometry :args="[0.5, 0.65, 0.25]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
        <!-- Thumb (Even Bigger) -->
        <TresMesh :position="[0.28, 0.65, 0.05]" :rotation="[0, 0, -0.6]">
          <TresCapsuleGeometry :args="[0.13, 0.45, 4, 8]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
        <!-- Fingers (Even Bigger) -->
        <TresMesh :position="[0.25, 0.9, -0.12]" :rotation="[0, 0, -0.2]">
          <TresBoxGeometry :args="[0.25, 0.5, 0.18]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
      </TresGroup>

      <!-- Right Arm (Back/Bottom-Right) -->
      <TresGroup :position="[0.55, -0.4, 0]" :rotation="[0, 0, 0.785]">
        <!-- Sleeve (Even Shorter & Wider) -->
        <TresMesh :position="[0, 0, 0]">
          <TresCylinderGeometry :args="[0.3, 0.3, 0.6, 16]" />
          <TresMeshStandardMaterial color="#fbbf24" />
        </TresMesh>
        <!-- Cuff -->
        <TresMesh :position="[0, 0.35, 0]">
          <TresCylinderGeometry :args="[0.33, 0.33, 0.15, 16]" />
          <TresMeshStandardMaterial color="#ffffff" />
        </TresMesh>
        <!-- Hand Base (Even Bigger) -->
        <TresMesh :position="[0, 0.7, 0]">
          <TresBoxGeometry :args="[0.5, 0.65, 0.25]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
        <!-- Thumb (Even Bigger) -->
        <TresMesh :position="[-0.28, 0.65, 0.05]" :rotation="[0, 0, 0.6]">
          <TresCapsuleGeometry :args="[0.13, 0.45, 4, 8]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
        <!-- Fingers (Even Bigger) -->
        <TresMesh :position="[-0.25, 0.9, 0.18]" :rotation="[0, 0, 0.2]">
          <TresBoxGeometry :args="[0.25, 0.5, 0.18]" />
          <TresMeshStandardMaterial color="#fda4af" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 2: Emojis (Laugh & Cry) -->
    <TresGroup
      v-if="activeStage === 2"
      ref="emojisRef"
      :position="[0, 0, 0]"
      :scale="[objectScale, objectScale, objectScale]"
    >
      <!-- Laughing Face (Left) -->
      <TresGroup :position="[-0.6, 0, 0]" :rotation="[0, 0.2, 0]">
        <!-- Head -->
        <TresMesh>
          <TresSphereGeometry :args="[0.5, 32, 32]" />
          <TresMeshStandardMaterial color="#facc15" :roughness="0.2" :metalness="0.1" />
        </TresMesh>
        <!-- Eyes (^ ^) -->
        <TresMesh :position="[-0.2, 0.15, 0.45]" :rotation="[0, 0, -0.785]">
          <TresCapsuleGeometry :args="[0.05, 0.2, 4, 8]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
        <TresMesh :position="[0.2, 0.15, 0.45]" :rotation="[0, 0, 0.785]">
          <TresCapsuleGeometry :args="[0.05, 0.2, 4, 8]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
        <!-- Mouth (Big Smile) -->
        <TresMesh :position="[0, -0.1, 0.4]" :rotation="[0, 0, 3.14]">
          <TresTorusGeometry :args="[0.25, 0.05, 16, 32, 3.14]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
        <!-- Teeth (Optional white strip) -->
        <TresMesh :position="[0, -0.1, 0.42]" :rotation="[0, 0, 0]">
          <TresBoxGeometry :args="[0.4, 0.05, 0.02]" />
          <TresMeshStandardMaterial color="#ffffff" />
        </TresMesh>
      </TresGroup>

      <!-- Crying Face (Right) -->
      <TresGroup :position="[0.6, 0, 0]" :rotation="[0, -0.2, 0]">
        <!-- Head -->
        <TresMesh>
          <TresSphereGeometry :args="[0.5, 32, 32]" />
          <TresMeshStandardMaterial color="#facc15" :roughness="0.2" :metalness="0.1" />
        </TresMesh>
        <!-- Eyes (T T or closed down) -->
        <TresMesh :position="[-0.2, 0.15, 0.45]" :rotation="[0, 0, 1.57]">
          <TresCapsuleGeometry :args="[0.05, 0.2, 4, 8]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
        <TresMesh :position="[0.2, 0.15, 0.45]" :rotation="[0, 0, 1.57]">
          <TresCapsuleGeometry :args="[0.05, 0.2, 4, 8]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
        <!-- Tears (Blue streams) -->
        <TresMesh :position="[-0.2, -0.1, 0.5]" :rotation="[0, 0, 0]">
          <TresConeGeometry :args="[0.08, 0.4, 16]" />
          <TresMeshStandardMaterial color="#60a5fa" />
        </TresMesh>
        <TresMesh :position="[0.2, -0.1, 0.5]" :rotation="[0, 0, 0]">
          <TresConeGeometry :args="[0.08, 0.4, 16]" />
          <TresMeshStandardMaterial color="#60a5fa" />
        </TresMesh>
        <!-- Mouth (Wailing O) -->
        <TresMesh :position="[0, -0.25, 0.45]" :rotation="[1.57, 0, 0]">
          <TresTorusGeometry :args="[0.1, 0.04, 16, 32]" />
          <TresMeshStandardMaterial color="#374151" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <!-- Stage 3: Key (Magic/Unlock) -->
    <TresGroup
      v-if="activeStage === 3"
      ref="keyRef"
      :position="[0, 0, 0]"
      :scale="[objectScale, objectScale, objectScale]"
    >
      <!-- Head (Ring) -->
      <TresMesh :position="[0, 0.8, 0]">
        <TresTorusGeometry :args="[0.3, 0.08, 16, 32]" />
        <TresMeshStandardMaterial
          color="#fde68a"
          :metalness="1"
          :roughness="0.08"
          emissive="#fbbf24"
          :emissive-intensity="0.45"
        />
      </TresMesh>
      <!-- Shaft -->
      <TresMesh :position="[0, 0, 0]">
        <TresCylinderGeometry :args="[0.08, 0.08, 1.6, 16]" />
        <TresMeshStandardMaterial
          color="#fde68a"
          :metalness="1"
          :roughness="0.08"
          emissive="#fbbf24"
          :emissive-intensity="0.45"
        />
      </TresMesh>
      <!-- Teeth -->
      <TresMesh :position="[0.2, -0.6, 0]">
        <TresBoxGeometry :args="[0.4, 0.2, 0.1]" />
        <TresMeshStandardMaterial
          color="#fde68a"
          :metalness="1"
          :roughness="0.08"
          emissive="#fbbf24"
          :emissive-intensity="0.45"
        />
      </TresMesh>
      <TresMesh :position="[0.2, -0.3, 0]">
        <TresBoxGeometry :args="[0.3, 0.15, 0.1]" />
        <TresMeshStandardMaterial
          color="#fde68a"
          :metalness="1"
          :roughness="0.08"
          emissive="#fbbf24"
          :emissive-intensity="0.45"
        />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
