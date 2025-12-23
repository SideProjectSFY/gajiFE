<script setup lang="ts">
import { shallowRef, watchEffect, onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars, MouseParallax } from '@tresjs/cientos'
import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sphereRef = shallowRef(null)

// Scroll Interaction
watchEffect(() => {
  if (sphereRef.value) {
    // Scroll-based scaling (Explode/Grow)
    gsap.to(sphereRef.value.scale, {
      scrollTrigger: {
        trigger: '#about-hero',
        scroller: '#about-scroller',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      x: 3,
      y: 3,
      z: 3,
      ease: 'power1.inOut',
    })

    // Scroll-based rotation
    gsap.to(sphereRef.value.rotation, {
      scrollTrigger: {
        trigger: '#about-hero',
        scroller: '#about-scroller',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      x: Math.PI * 2,
      y: Math.PI * 2,
    })
  }
})

// "Liquid" pulse effect using GSAP instead of useRenderLoop
onMounted(() => {
  if (sphereRef.value) {
    gsap.to(sphereRef.value.scale, {
      x: 1.05,
      y: 1.05,
      z: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })

    // Floating effect (Levitation replacement)
    gsap.to(sphereRef.value.position, {
      y: 0.2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }
})
</script>

<template>
  <TresCanvas clear-color="#f9fafb" alpha>
    <TresPerspectiveCamera :position="[0, 0, 5]" :fov="45" />

    <!-- Lighting: Studio Setup -->
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
    <TresSpotLight :position="[0, 10, 0]" :intensity="2" :angle="0.5" :penumbra="1" cast-shadow />
    <TresPointLight :position="[-5, -5, 5]" :intensity="1" color="#4ade80" />

    <!-- Environment -->
    <Stars :radius="50" :depth="50" :count="1000" :size="0.5" :size-attenuation="true" />

    <!-- Interaction -->
    <MouseParallax :factor="1.5" :ease="3" />
  </TresCanvas>
</template>
