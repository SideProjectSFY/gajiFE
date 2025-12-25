<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { Stars, MouseParallax } from '@tresjs/cientos'
import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const cameraRef = shallowRef(null)
const mainTubeRef = shallowRef(null)
const branchTubeRef = shallowRef(null)

// 1. The Canon Path (Straight & Stable)
const mainCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 20),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -50),
  new THREE.Vector3(0, 0, -100),
])

// 2. The "What If" Path (Divergent & Wild)
const branchCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0), // Split point
  new THREE.Vector3(5, 2, -20), // Curve out
  new THREE.Vector3(15, 8, -40), // Rise up
  new THREE.Vector3(30, 15, -80), // Fly away
])

// Scroll Interaction: The Journey
watchEffect(() => {
  if (cameraRef.value) {
    // Camera moves along the Z-axis (Forward)
    gsap.to(cameraRef.value.position, {
      scrollTrigger: {
        trigger: '#mission-section',
        scroller: '#about-scroller',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      z: -40,
      y: 5, // Slight rise to see the split better
      ease: 'none',
    })

    // Camera rotates to look at the branch
    gsap.to(cameraRef.value.rotation, {
      scrollTrigger: {
        trigger: '#mission-section',
        scroller: '#about-scroller',
        start: 'center center', // Start rotating when we hit the split
        end: 'bottom top',
        scrub: 1,
      },
      y: -0.5, // Look right towards the branch
      ease: 'power1.inOut',
    })
  }
})
</script>

<template>
  <TresCanvas clear-color="#0f172a" alpha>
    <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 20]" :fov="60" />

    <TresAmbientLight :intensity="0.5" />
    <TresPointLight :position="[0, 10, 0]" :intensity="2" color="#ffffff" />
    <TresPointLight :position="[20, 10, -40]" :intensity="4" color="#4ade80" />
    <!-- Green light for the branch -->

    <!-- The Canon Timeline (Blue/White) -->
    <TresMesh ref="mainTubeRef">
      <TresTubeGeometry :args="[mainCurve, 64, 0.5, 8, false]" />
      <TresMeshPhysicalMaterial
        color="#e2e8f0"
        :transmission="0.6"
        :roughness="0.2"
        :metalness="0.1"
        :clearcoat="1"
        emissive="#3b82f6"
        :emissive-intensity="0.2"
      />
    </TresMesh>

    <!-- The "What If" Branch (Gaji Green) -->
    <TresMesh ref="branchTubeRef">
      <TresTubeGeometry :args="[branchCurve, 64, 0.4, 8, false]" />
      <TresMeshPhysicalMaterial
        color="#86efac"
        :transmission="0.4"
        :roughness="0.1"
        :metalness="0.2"
        :clearcoat="1"
        emissive="#22c55e"
        :emissive-intensity="2"
      />
    </TresMesh>

    <!-- Floating Particles/Stars representing possibilities -->
    <Stars :radius="80" :depth="50" :count="3000" :size="0.3" :size-attenuation="true" />

    <MouseParallax :factor="1" />
  </TresCanvas>
</template>
