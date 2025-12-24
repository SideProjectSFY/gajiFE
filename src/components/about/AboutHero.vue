<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import The3DHeroStage from './3d/The3DHeroStage.vue'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()

const subtitleRef = ref(null)
const boxRef = ref(null)

onMounted(() => {
  // Apple-style scroll-away effect for subtitle
  gsap.to(subtitleRef.value, {
    scrollTrigger: {
      trigger: subtitleRef.value,
      scroller: '#about-scroller',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    opacity: 0,
    scale: 1.1,
    y: -50,
  })

  // The box fades out slightly later
  gsap.to(boxRef.value, {
    scrollTrigger: {
      trigger: boxRef.value,
      scroller: '#about-scroller',
      start: 'top center',
      end: 'bottom top',
      scrub: true,
    },
    opacity: 0,
    y: -30,
  })
})

const sectionStyle = css({
  position: 'relative',
  minH: '80vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  overflow: 'hidden',
  mb: '0', // Remove margin, let the next section flow naturally
})

// Placeholder for the 3D Scene (Absolute positioned behind text)
const scenePlaceholderStyle = css({
  position: 'absolute',
  top: 0,
  left: 0,
  w: 'full',
  h: 'full',
  bg: 'radial-gradient(circle at 50% 50%, #f0fdf4 0%, #f9fafb 100%)', // Subtle gradient
  zIndex: 0,
  opacity: 0.8,
})

const contentWrapperStyle = css({
  position: 'relative',
  zIndex: 1,
  maxW: '1000px',
  px: '6',
})

const subtitleStyle = css({
  fontSize: { base: '1.25rem', md: '1.5rem' },
  fontWeight: 'medium',
  color: 'gray.600',
  maxW: '600px',
  mx: 'auto',
  lineHeight: '1.6',
  mb: '12',
})

const descriptionBoxStyle = css({
  position: 'relative',
  zIndex: 10,
  bg: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '2xl',
  p: { base: '8', md: '10' },
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
  maxW: '800px',
  mx: 'auto',
  mb: '16',
  transition: 'transform 0.3s ease',
  _hover: {
    transform: 'translateY(-5px)',
  },
})

const descriptionTitleStyle = css({
  fontSize: '1.25rem',
  fontWeight: 'bold',
  color: 'green.700',
  mb: '4',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

const descriptionTextStyle = css({
  fontSize: '1.125rem',
  color: 'gray.700',
  lineHeight: '1.8',
})
</script>

<template>
  <section id="about-hero" :class="sectionStyle">
    <!-- 3D Background Placeholder -->
    <div :class="scenePlaceholderStyle">
      <The3DHeroStage />
    </div>
    <!-- Glassmorphism Info Box -->
    <div ref="boxRef" :class="descriptionBoxStyle">
      <h2 :class="descriptionTitleStyle">
        {{ t('about.whatIsGaji.title') }}
      </h2>
      <p :class="descriptionTextStyle" v-html="t('about.whatIsGaji.description')" />
    </div>

    <div :class="contentWrapperStyle">
      <p ref="subtitleRef" :class="subtitleStyle">
        {{ t('about.subtitle') }}
      </p>
    </div>
  </section>
</template>
