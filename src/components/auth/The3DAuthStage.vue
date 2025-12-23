<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars } from '@tresjs/cientos'
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import The3DAuthScene from './The3DAuthScene.vue'

const props = defineProps<{
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
    <TresPerspectiveCamera :position="[0, 0, 6]" :look-at="[0, 0, 0]" />
    <OrbitControls :enable-zoom="false" :enable-pan="false" :enable-rotate="false" />

    <Stars :radius="100" :depth="50" :count="5000" :size="0.1" :size-attenuation="true" />

    <!-- Soft Ambient Fill -->
    <TresAmbientLight :intensity="0.7" color="#ffffff" />

    <!-- Key Light (Warm Sun) -->
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="1.2" cast-shadow color="#fff7ed" />

    <!-- Rim Light (Cool Backlight for definition) -->
    <TresSpotLight
      :position="[-5, 5, -5]"
      :intensity="2"
      color="#dbeafe"
      :angle="0.5"
      :penumbra="1"
    />

    <The3DAuthScene :progress="progress" :active-stage="activeStage" :stage-blend="stageBlend" />
  </TresCanvas>
</template>
