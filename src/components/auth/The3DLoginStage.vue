<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { Stars } from '@tresjs/cientos'
import { SRGBColorSpace, NoToneMapping } from 'three'
import The3DLoginScene from './The3DLoginScene.vue'

defineProps<{
  progress: number
  activeStage: number
  stageBlend: number
}>()
</script>

<template>
  <TresCanvas
    clear-color="#052e16"
    shadows
    :gl="{
      outputColorSpace: SRGBColorSpace,
      toneMapping: NoToneMapping,
    }"
  >
    <TresPerspectiveCamera :position="[0, 2, 6]" :look-at="[0, 0, 0]" />

    <Stars :radius="100" :depth="50" :count="5000" :size="0.1" :size-attenuation="true" />

    <!-- Lighting -->
    <TresAmbientLight :intensity="0.5" color="#ffffff" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" cast-shadow color="#fff7ed" />
    <TresSpotLight
      :position="[-5, 5, -5]"
      :intensity="2"
      color="#dbeafe"
      :angle="0.5"
      :penumbra="1"
      cast-shadow
    />

    <The3DLoginScene :progress="progress" :active-stage="activeStage" :stage-blend="stageBlend" />
  </TresCanvas>
</template>
