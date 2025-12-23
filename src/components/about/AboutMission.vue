<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import The3DMissionStage from './3d/The3DMissionStage.vue'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()

const cardRefs = ref<HTMLElement[]>([])

const setCardRef = (el: any) => {
  if (el) cardRefs.value.push(el)
}

onMounted(() => {
  cardRefs.value.forEach((card, index) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 100,
        scale: 0.9,
        filter: 'blur(10px)',
      },
      {
        scrollTrigger: {
          trigger: card,
          scroller: '#about-scroller',
          start: 'top bottom-=100', // Start animation when card enters viewport
          end: 'top center',
          scrub: 1,
        },
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        ease: 'power2.out',
      }
    )
  })
})

const missions = [
  {
    icon: '📚',
    titleKey: 'about.mission.preserve.title',
    descKey: 'about.mission.preserve.description',
  },
  {
    icon: '👥',
    titleKey: 'about.mission.community.title',
    descKey: 'about.mission.community.description',
  },
  {
    icon: '💬',
    titleKey: 'about.mission.enhance.title',
    descKey: 'about.mission.enhance.description',
  },
  {
    icon: '💡',
    titleKey: 'about.mission.innovate.title',
    descKey: 'about.mission.innovate.description',
  },
]

// Outer container that defines the scroll length
const sectionStyle = css({
  position: 'relative',
  minH: '300vh', // Tall enough for a journey
  bg: 'gray.900', // Dark background for contrast
  color: 'white',
})

// Sticky container for the 3D scene
const stickySceneStyle = css({
  position: 'sticky',
  top: 0,
  left: 0,
  w: 'full',
  h: '100vh',
  overflow: 'hidden',
  zIndex: 0,
})

// Overlay to ensure text readability over the 3D scene
const sceneOverlayStyle = css({
  position: 'absolute',
  top: 0,
  left: 0,
  w: 'full',
  h: 'full',
  bg: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.4) 50%, rgba(17, 24, 39, 0.8) 100%)',
  pointerEvents: 'none',
})

// Content that scrolls over the scene
const scrollContentStyle = css({
  position: 'relative',
  zIndex: 1,
  w: 'full',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pt: '20vh', // Start content a bit down
  pb: '20vh',
})

const headerStyle = css({
  textAlign: 'center',
  mb: '40vh', // Space before cards start appearing
  px: '6',
})

const titleStyle = css({
  fontSize: { base: '2.5rem', md: '4rem' },
  fontWeight: 'bold',
  color: 'white',
  mb: '6',
  textShadow: '0 0 20px rgba(255,255,255,0.2)',
})

const descStyle = css({
  fontSize: { base: '1.125rem', md: '1.25rem' },
  color: 'gray.300',
  lineHeight: '1.8',
  maxW: '700px',
  mx: 'auto',
})

// Cards container - spaced out vertically
const cardsContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '40vh', // Large gap between cards for the "fly-through" feel
  w: 'full',
  maxW: '1000px',
  px: '6',
})

const cardStyle = css({
  bg: 'rgba(255, 255, 255, 0.05)', // Glassmorphism
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 'xl',
  p: '10',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6',
  transition: 'transform 0.3s ease, opacity 0.3s ease',
  _hover: {
    bg: 'rgba(255, 255, 255, 0.1)',
  },
  // Alternating alignment
  '&:nth-child(even)': {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    textAlign: 'right',
  },
  '&:nth-child(odd)': {
    alignSelf: 'flex-start',
  },
  maxW: '600px',
})

const iconStyle = css({
  fontSize: '3rem',
  flexShrink: 0,
  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
})

const cardContentStyle = css({
  flex: 1,
})

const cardTitleStyle = css({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: 'white',
  mb: '3',
})

const cardDescStyle = css({
  fontSize: '1rem',
  color: 'gray.300',
  lineHeight: '1.6',
})
</script>

<template>
  <section id="mission-section" :class="sectionStyle">
    <!-- Sticky 3D Background -->
    <div :class="stickySceneStyle">
      <The3DMissionStage />
      <!-- Overlay Gradient for readability -->
      <div :class="sceneOverlayStyle"></div>
    </div>

    <!-- Scrolling Content -->
    <div :class="scrollContentStyle">
      <!-- Header Section -->
      <div :class="headerStyle">
        <h2 :class="titleStyle">
          {{ t('about.mission.title') }}
        </h2>
        <p :class="descStyle">
          {{ t('about.mission.description') }}
        </p>
      </div>

      <!-- Mission Cards (Spaced out) -->
      <div :class="cardsContainerStyle">
        <div v-for="(mission, index) in missions" :key="index" :ref="setCardRef" :class="cardStyle">
          <div :class="iconStyle">{{ mission.icon }}</div>
          <div :class="cardContentStyle">
            <h3 :class="cardTitleStyle">
              {{ t(mission.titleKey) }}
            </h3>
            <p :class="cardDescStyle">
              {{ t(mission.descKey) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
