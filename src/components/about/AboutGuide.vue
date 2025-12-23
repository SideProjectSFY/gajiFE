<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import The3DGuideStage from './3d/The3DGuideStage.vue'

gsap.registerPlugin(ScrollTrigger)

const { t } = useI18n()

const stepRefs = ref<HTMLElement[]>([])

const steps = [
  {
    icon: '🔍',
    bg: 'green.100',
    labelKey: 'about.getStarted.step1.label',
    titleKey: 'about.getStarted.step1.title',
    descKey: 'about.getStarted.step1.description',
  },
  {
    icon: '💬',
    bg: 'yellow.100',
    labelKey: 'about.getStarted.step2.label',
    titleKey: 'about.getStarted.step2.title',
    descKey: 'about.getStarted.step2.description',
  },
  {
    icon: '🌳',
    bg: 'green.100',
    labelKey: 'about.getStarted.step3.label',
    titleKey: 'about.getStarted.step3.title',
    descKey: 'about.getStarted.step3.description',
  },
  {
    icon: '🔗',
    bg: 'yellow.100',
    labelKey: 'about.getStarted.step4.label',
    titleKey: 'about.getStarted.step4.title',
    descKey: 'about.getStarted.step4.description',
  },
]

onMounted(() => {
  stepRefs.value.forEach((step, index) => {
    const marker = step.querySelector('.leaf-marker')

    // Step Opacity & Border
    gsap.fromTo(
      step,
      { opacity: 0.3, borderColor: 'transparent' },
      {
        scrollTrigger: {
          trigger: step,
          scroller: '#about-scroller',
          start: 'top center+=100',
          end: 'bottom center-=100',
          toggleActions: 'play reverse play reverse',
          // markers: true,
        },
        opacity: 1,
        borderColor: 'rgba(22, 163, 74, 0.5)', // green-600 with opacity
        duration: 0.5,
      }
    )

    // Leaf Marker Pop-up
    if (marker) {
      gsap.to(marker, {
        scrollTrigger: {
          trigger: step,
          scroller: '#about-scroller',
          start: 'top center+=100',
          toggleActions: 'play reverse play reverse',
        },
        scale: 1,
        ease: 'back.out(1.7)',
        duration: 0.4,
      })
    }
  })
})

const sectionStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  minH: '100vh',
  bg: 'white',
  position: 'relative',
})

// Background: Sticky 3D Scene (Full Width)
const leftColumnStyle = css({
  gridRow: '1',
  gridColumn: '1',
  w: '100%',
  h: '100vh',
  position: 'sticky',
  top: 0,
  zIndex: 0,
  overflow: 'hidden',
})

const scenePlaceholderStyle = css({
  w: '100%',
  h: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

// Foreground: Scrolling Steps (Full Width)
const rightColumnStyle = css({
  gridRow: '1',
  gridColumn: '1',
  w: '100%',
  zIndex: 10,
  pointerEvents: 'none', // Let clicks pass through to 3D if needed
  px: { base: '6', lg: '12' },
  pt: '10vh',
})

const headerStyle = css({
  mb: '12',
  textAlign: 'center', // Center title
  pointerEvents: 'auto',
})

const titleStyle = css({
  fontSize: { base: '2rem', md: '3rem' },
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '4',
  textShadow: '0 2px 10px rgba(255,255,255,0.8)', // Readability
})

const stepItemStyle = css({
  minH: '80vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center', // Center content
  textAlign: 'center', // Center text
  pointerEvents: 'auto', // Re-enable clicks
  position: 'relative',
})

const leafMarkerStyle = css({
  position: 'absolute',
  left: '50%', // Center marker
  top: '-2rem', // Position above content
  transform: 'translateX(-50%) scale(0)',
  width: '3rem',
  height: '3rem',
  bg: 'green.100',
  color: 'green.600',
  borderRadius: 'full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  boxShadow: 'md',
  zIndex: 10,
})

const iconWrapperStyle = (bgColor: string) =>
  css({
    w: '20',
    h: '20',
    borderRadius: '2xl',
    bg: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    mb: '6',
    boxShadow: 'lg',
    backdropFilter: 'blur(8px)', // Glassmorphism
    bgOpacity: 0.9,
  })

const stepTitleStyle = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'gray.900',
  mb: '4',
  bg: 'rgba(255,255,255,0.9)', // Readability
  px: '4',
  py: '1',
  borderRadius: 'md',
  boxShadow: 'sm',
})

const stepLabelStyle = css({
  display: 'block',
  fontSize: '1rem',
  fontWeight: 'bold',
  color: 'green.700',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  mb: '2',
  bg: 'rgba(255,255,255,0.9)',
  px: '2',
  borderRadius: 'sm',
  boxShadow: 'sm',
})

const stepDescStyle = css({
  fontSize: '1.25rem',
  color: 'gray.900', // Darker text
  fontWeight: '500', // Slightly bolder
  lineHeight: '1.8',
  maxWidth: '800px', // Limit line length for readability
  bg: 'rgba(255,255,255,0.9)',
  p: '6',
  borderRadius: 'lg',
  backdropFilter: 'blur(8px)',
  boxShadow: 'md',
})

const gapStyle = css({
  marginTop: '20vh',
})
</script>

<template>
  <section id="guide-section" :class="sectionStyle">
    <!-- Left: Sticky 3D Stage -->
    <div :class="leftColumnStyle">
      <div :class="scenePlaceholderStyle">
        <The3DGuideStage />
      </div>
    </div>

    <!-- Right: Scrolling Steps -->
    <div :class="rightColumnStyle">
      <div :class="headerStyle">
        <h2 :class="titleStyle">
          {{ t('about.getStarted.title') }}
        </h2>
      </div>

      <div
        v-for="(step, index) in steps"
        :key="index"
        :class="[stepItemStyle, index === 2 ? gapStyle : '']"
        ref="stepRefs"
      >
        <div :class="iconWrapperStyle(step.bg)">
          {{ step.icon }}
        </div>
        <div>
          <span :class="stepLabelStyle">{{ t(step.labelKey) }}</span>
          <h3 :class="stepTitleStyle">
            {{ t(step.titleKey) }}
          </h3>
          <p :class="stepDescStyle">
            {{ t(step.descKey) }}
          </p>
        </div>
      </div>

      <!-- Extra space at bottom -->
      <div :class="css({ h: '20vh' })"></div>
    </div>
  </section>
</template>
