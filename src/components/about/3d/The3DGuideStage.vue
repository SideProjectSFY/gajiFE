<script setup lang="ts">
import { shallowRef, watchEffect, onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { ContactShadows, OrbitControls, Stars } from '@tresjs/cientos'
import * as THREE from 'three'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const groupRef = shallowRef(null)
const trunkRef = shallowRef(null)
const branchesRef = shallowRef(null)
const foliageRef = shallowRef(null)

// Scroll Interaction: Growth
watchEffect(() => {
  if (groupRef.value && trunkRef.value) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#guide-section',
        scroller: '#about-scroller',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    })

    // Step 1: Trunk Grows (The Foundation)
    tl.fromTo(trunkRef.value.scale, { y: 0 }, { y: 1, duration: 1, ease: 'power1.out' }).fromTo(
      trunkRef.value.position,
      { y: -2 },
      { y: 1, duration: 1, ease: 'power1.out' },
      '<'
    )

    // Step 2: Branches Sprout (The Forking)
    tl.fromTo(
      branchesRef.value.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1, ease: 'back.out(1.7)' }
    )

    // Step 3: Foliage Expands (The Community)
    tl.fromTo(
      foliageRef.value.scale,
      { x: 0, y: 0, z: 0 },
      { x: 0.5, y: 0.5, z: 0.5, duration: 1, ease: 'elastic.out(1, 0.5)' }
    )

    // Step 4: Full Bloom (The Result - "Last one looks like leaves")
    tl.to(foliageRef.value.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 1,
      ease: 'elastic.out(1, 0.3)',
    }).to(foliageRef.value.material, { color: '#22c55e', duration: 1 }, '<') // Brighten up

    // Continuous Rotation
    gsap.to(groupRef.value.rotation, {
      scrollTrigger: {
        trigger: '#guide-section',
        scroller: '#about-scroller',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      y: Math.PI,
    })
  }
})
</script>

<template>
  <TresCanvas clear-color="#f9fafb" alpha shadows>
    <TresPerspectiveCamera :position="[0, 2, 8]" :fov="45" :look-at="[0, 1, 0]" />

    <TresAmbientLight :intensity="0.8" />
    <TresDirectionalLight
      :position="[5, 10, 5]"
      :intensity="2"
      cast-shadow
      :shadow-mapSize="[1024, 1024]"
    />

    <TresGroup ref="groupRef" :position="[0, -1, 0]">
      <!-- 1. Trunk -->
      <TresMesh ref="trunkRef" :position="[0, 1, 0]" cast-shadow receive-shadow>
        <TresCylinderGeometry :args="[0.2, 0.5, 2.5, 8]" />
        <TresMeshStandardMaterial color="#5D4037" :roughness="0.9" />
      </TresMesh>

      <!-- 2. Branches -->
      <TresGroup ref="branchesRef" :position="[0, 1.8, 0]">
        <!-- Left Branch -->
        <TresMesh :position="[-0.4, 0.2, 0]" :rotation="[0, 0, Math.PI / 4]" cast-shadow>
          <TresCylinderGeometry :args="[0.1, 0.2, 1.5, 8]" />
          <TresMeshStandardMaterial color="#5D4037" :roughness="0.9" />
        </TresMesh>
        <!-- Right Branch -->
        <TresMesh :position="[0.4, 0.4, 0.2]" :rotation="[0.2, 0, -Math.PI / 4]" cast-shadow>
          <TresCylinderGeometry :args="[0.08, 0.15, 1.2, 8]" />
          <TresMeshStandardMaterial color="#5D4037" :roughness="0.9" />
        </TresMesh>
        <!-- Back Branch -->
        <TresMesh :position="[0, 0.5, -0.3]" :rotation="[-Math.PI / 4, 0, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.08, 0.15, 1.2, 8]" />
          <TresMeshStandardMaterial color="#5D4037" :roughness="0.9" />
        </TresMesh>
      </TresGroup>

      <!-- 3 & 4. Foliage (Leaves) -->
      <TresGroup ref="foliageRef" :position="[0, 2.5, 0]">
        <!-- Main Canopy -->
        <TresMesh :position="[0, 0.5, 0]" cast-shadow>
          <TresIcosahedronGeometry :args="[1.5, 1]" />
          <!-- Low poly look -->
          <TresMeshStandardMaterial color="#4ade80" :roughness="0.6" :flat-shading="true" />
        </TresMesh>
        <!-- Detail Clumps -->
        <TresMesh :position="[-1, 0, 0.5]" :scale="0.6" cast-shadow>
          <TresIcosahedronGeometry :args="[1, 0]" />
          <TresMeshStandardMaterial color="#22c55e" :roughness="0.6" :flat-shading="true" />
        </TresMesh>
        <TresMesh :position="[1, 0.2, -0.5]" :scale="0.7" cast-shadow>
          <TresIcosahedronGeometry :args="[1, 0]" />
          <TresMeshStandardMaterial color="#16a34a" :roughness="0.6" :flat-shading="true" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <ContactShadows
      :opacity="0.4"
      :scale="10"
      :blur="2.5"
      :far="10"
      :resolution="256"
      color="#000000"
    />
  </TresCanvas>
</template>
