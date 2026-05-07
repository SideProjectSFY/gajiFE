<script setup lang="ts">
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
import AboutHero from '../components/about/AboutHero.vue'
import AboutMission from '../components/about/AboutMission.vue'
import AboutGuide from '../components/about/AboutGuide.vue'

const pageContainerStyle = css({
  height: '100vh',
  overflowY: 'auto',
  overscrollBehavior: 'none',
  display: 'flex',
  flexDirection: 'column',
  bg: 'gray.50',
  scrollbarGutter: 'stable',
})

const mainContentStyle = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  w: 'full',
})

const srOnlyStyle = css({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
})
</script>

<template>
  <div id="about-scroller" :class="pageContainerStyle">
    <AppHeader />

    <main :class="mainContentStyle">
      <h1 :class="srOnlyStyle">About Gaji</h1>
      <AboutHero />
      <AboutMission />
      <AboutGuide />
    </main>

    <AppFooter />
  </div>
</template>
