<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import The3DHeroStage from './3d/The3DHeroStage.vue'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()

const titleRef = ref(null)
const subtitleRef = ref(null)
const boxRef = ref(null)

onMounted(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: titleRef.value,
      scroller: '#about-scroller',
      start: 'top top', // Adjusted for mobile: start when element hits top
      end: 'bottom top',
      scrub: true,
    },
  })

  // Apple-style scroll-away effect: Blur + Fade + Scale Up
  tl.to([titleRef.value, subtitleRef.value], {
    opacity: 0,
    filter: 'blur(10px)',
    scale: 1.1,
    y: -50,
    stagger: 0.1,
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
    filter: 'blur(5px)',
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

const titleStyle = css({
  fontSize: { base: '4rem', md: '6rem', lg: '8rem' }, // Massive modern typography
  fontWeight: '900',
  letterSpacing: '-0.04em',
  lineHeight: '0.9',
  mb: '8',
  textTransform: 'uppercase',
  background: 'linear-gradient(to right, #166534, #15803d)', // Gradient text
  backgroundClip: 'text',
  color: 'transparent',
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
  backdropFilter: 'blur(12px)',
  bg: 'rgba(255, 255, 255, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '2xl',
  p: { base: '8', md: '10' },
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
  maxW: '800px',
  mx: 'auto',
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

    <div :class="contentWrapperStyle">
      <h1 ref="titleRef" :class="titleStyle">
        {{ t('about.title') }}
      </h1>

      <p ref="subtitleRef" :class="subtitleStyle">
        {{ t('about.subtitle') }}
      </p>

      <!-- Glassmorphism Info Box -->
      <div ref="boxRef" :class="descriptionBoxStyle">
        <h2 :class="descriptionTitleStyle">
          {{ t('about.whatIsGaji.title') }}
        </h2>
        <p :class="descriptionTextStyle" v-html="t('about.whatIsGaji.description')" />
      </div>
    </div>
  </section>
</template>
