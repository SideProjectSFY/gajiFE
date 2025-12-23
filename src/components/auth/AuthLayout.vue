<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import The3DAuthStage from './The3DAuthStage.vue'

gsap.registerPlugin(ScrollTrigger)

const { locale } = useI18n()

const leftColumnRef = ref<HTMLElement | null>(null)
const rightColumnRef = ref<HTMLElement | null>(null)
const showBackToTop = ref(false)
const scrollProgress = ref(0)
const currentStage = ref(0)
const stageBlend = ref(0)
const scrollTriggerInstance = ref<ScrollTrigger | null>(null)

// Dynamic expansion height based on viewport (50% of viewport height)
const expansionHeight = computed(() => window.innerHeight * 0.5)

const props = defineProps<{
  stages?: Array<{
    id: number
    title: string
    description: string
  }>
}>()

const defaultStages = [
  {
    id: 0,
    title: '모든 이야기는 작은 씨앗에서 시작됩니다.',
    description: 'Every story begins with a small seed.',
  },
  {
    id: 1,
    title: '당신의 선택으로 뻗어나가는 무한한 가능성.',
    description: 'Infinite possibilities branching from your choices.',
  },
  {
    id: 2,
    title: 'AI와 함께 상상을 현실로 만드세요.',
    description: 'Turn imagination into reality with AI.',
  },
  {
    id: 3,
    title: 'Gaji에서 당신만의 세계를 완성하세요.',
    description: 'Complete your world in Gaji.',
  },
]

const stages = computed(() => props.stages || defaultStages)

const scrollToTop = () => {
  if (leftColumnRef.value) {
    leftColumnRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const scrollDown = () => {
  if (leftColumnRef.value) {
    leftColumnRef.value.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
  }
}

const handleScroll = () => {
  const scrollTop = leftColumnRef.value?.scrollTop ?? 0
  showBackToTop.value = scrollTop > 100

  // Calculate scroll progress after expansion phase (using dynamic expansion height)
  const currentExpansionHeight = expansionHeight.value
  if (scrollTop > currentExpansionHeight) {
    const scrollableHeight = leftColumnRef.value?.scrollHeight ?? 0
    const viewportHeight = leftColumnRef.value?.clientHeight ?? 0
    const maxScroll = scrollableHeight - viewportHeight - currentExpansionHeight

    if (maxScroll > 0) {
      const effectiveScroll = scrollTop - currentExpansionHeight
      scrollProgress.value = Math.min(1, Math.max(0, effectiveScroll / maxScroll))

      // Calculate stage (0-3) and blend (0-1 within stage)
      const totalProgress = scrollProgress.value * 4 // 4 stages
      currentStage.value = Math.floor(totalProgress)
      stageBlend.value = totalProgress - currentStage.value

      // Clamp to last stage
      if (currentStage.value >= 4) {
        currentStage.value = 3
        stageBlend.value = 1
      }
    }
  } else {
    scrollProgress.value = 0
    currentStage.value = 0
    stageBlend.value = 0
  }
}

onMounted(() => {
  if (!leftColumnRef.value || !rightColumnRef.value) return

  leftColumnRef.value.addEventListener('scroll', handleScroll)

  // Takeover Animation with proper lifecycle management
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: leftColumnRef.value, // The scroll container
      scroller: leftColumnRef.value, // It scrolls itself
      start: 'top top',
      end: `+=${expansionHeight.value}`, // Dynamic expansion based on viewport
      scrub: 1,
      invalidateOnRefresh: true, // Prevents accumulation on refresh
      onUpdate: (self) => {
        // Safety check to detect anomalies
        if (self.progress < 0 || self.progress > 1) {
          console.warn('ScrollTrigger progress out of bounds:', self.progress)
        }
      },
    },
  })

  // Store instance for cleanup
  if (tl.scrollTrigger) {
    scrollTriggerInstance.value = tl.scrollTrigger as ScrollTrigger
  }

  // Expand Left Column
  tl.to(
    leftColumnRef.value,
    {
      width: '100vw',
      duration: 1,
      ease: 'power2.inOut',
    },
    0
  )

  // Shrink/Fade Right Column
  tl.to(
    rightColumnRef.value,
    {
      width: '0vw',
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut',
      pointerEvents: 'none',
    },
    0
  )
})

onUnmounted(() => {
  // Clean up scroll listener
  leftColumnRef.value?.removeEventListener('scroll', handleScroll)

  // Kill ScrollTrigger instance to prevent memory leaks and state accumulation
  if (scrollTriggerInstance.value) {
    scrollTriggerInstance.value.kill()
    scrollTriggerInstance.value = null
  }

  // Kill all ScrollTriggers associated with this component as fallback
  ScrollTrigger.getAll().forEach((st) => {
    if (st.scroller === leftColumnRef.value) {
      st.kill()
    }
  })
})

// PandaCSS Styles
const containerStyle = css({
  display: 'flex',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  bg: 'gray.50',
})

const leftColumnStyle = css({
  width: '50%',
  height: '100vh',
  overflowY: 'auto',
  overscrollBehavior: 'none',
  position: 'relative',
  bg: '#052e16',
  backgroundImage:
    'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35) 50%, transparent 60%), ' +
    'radial-gradient(1px 1px at 70% 10%, rgba(255,255,255,0.3) 50%, transparent 60%), ' +
    'radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.25) 50%, transparent 60%), ' +
    'radial-gradient(1px 1px at 80% 60%, rgba(255,255,255,0.2) 50%, transparent 60%)',
  backgroundSize: '400px 400px, 500px 500px, 450px 450px, 550px 550px',
  backgroundRepeat: 'repeat',
  // Hide scrollbar for cleaner look
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
  zIndex: 10,
})

const sceneWrapperStyle = css({
  width: '100%',
  height: '60vh', // Fixed height to prevent resizing
  maxHeight: '600px', // Max constraint for large screens
  marginTop: '1.5rem',
  marginBottom: '2.5rem',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  borderRadius: 'lg',
  aspectRatio: '16/9', // Maintain consistent aspect ratio
})

const rightColumnStyle = css({
  width: '50%',
  height: '100vh',
  overflowY: 'auto',
  overscrollBehavior: 'none',
  position: 'relative',
  bg: 'white',
  zIndex: 5,
})

const formWrapperStyle = css({
  width: '100%',
  maxWidth: '420px',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  // justifyContent: 'center', // Removed to prevent clipping
  margin: '0 auto',
  p: '6',
})

const formContentStyle = css({
  width: '100%',
  margin: 'auto 0', // Safe centering
})

const sectionStyle = css({
  padding: '3rem 2rem 1.5rem',
  width: '100%',
  maxWidth: '960px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  minHeight: '100vh', // Full viewport height to prevent text overlap
  justifyContent: 'center',
  alignItems: 'center',
})

const contentWrapperStyle = css({
  //paddingTop: 'clamp(160px, 45vh - 120px, 320px)', // center the first text+object after takeover
})

const titleStyle = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'green.50',
  textShadow: '0 2px 10px rgba(0,0,0,0.35)',
  '@media (max-width: 768px)': {
    fontSize: '2rem',
  },
})

const descStyle = css({
  fontSize: '1.1rem',
  color: 'green.100',
  textShadow: '0 2px 5px rgba(0,0,0,0.3)',
})

const backToTopStyle = css({
  position: 'fixed',
  bottom: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 100,
  padding: '0.5rem 1rem',
  bg: 'green.600',
  color: 'white',
  borderRadius: 'full',
  cursor: 'pointer',
  transition: 'all 0.2s',
  _hover: {
    bg: 'green.700',
    transform: 'translateY(-2px) translateX(-50%)',
  },
})

const scrollDownButtonStyle = css({
  position: 'fixed',
  bottom: '2rem',
  left: '25%',
  transform: 'translateX(-50%)',
  zIndex: 100,
  padding: '0.75rem',
  bg: 'white/10',
  backdropFilter: 'blur(4px)',
  color: 'white',
  borderRadius: 'full',
  cursor: 'pointer',
  transition: 'all 0.3s',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  _hover: {
    bg: 'white/20',
    transform: 'translateX(-50%) translateY(4px)',
  },
})
</script>

<template>
  <div :class="containerStyle">
    <!-- LEFT COLUMN: The Experience (Scrollable) -->
    <div ref="leftColumnRef" :class="leftColumnStyle">
      <div :class="contentWrapperStyle">
        <section v-for="stage in stages" :key="stage.id" :class="sectionStyle">
          <div v-if="locale === 'ko'">
            <h2 :class="titleStyle">{{ stage.title }}</h2>
            <p :class="descStyle">{{ stage.description }}</p>
          </div>
          <div v-else>
            <h2 :class="titleStyle">{{ stage.description }}</h2>
            <p :class="descStyle">{{ stage.title }}</p>
          </div>
          <div :class="sceneWrapperStyle">
            <slot
              name="stage"
              :progress="scrollProgress"
              :active-stage="stage.id"
              :stage-blend="stage.id === currentStage ? stageBlend : 0"
            >
              <The3DAuthStage
                :progress="scrollProgress"
                :active-stage="stage.id"
                :stage-blend="stage.id === currentStage ? stageBlend : 0"
              />
            </slot>
          </div>
        </section>
      </div>
    </div>

    <!-- RIGHT COLUMN: The Function (Sticky/Fixed) -->
    <div ref="rightColumnRef" :class="rightColumnStyle">
      <div :class="formWrapperStyle">
        <div :class="formContentStyle">
          <slot name="form"></slot>
        </div>
      </div>
    </div>

    <button v-show="showBackToTop" @click="scrollToTop" :class="backToTopStyle">↑ Top</button>

    <button
      v-show="!showBackToTop"
      @click="scrollDown"
      :class="scrollDownButtonStyle"
      aria-label="Scroll Down"
    >
      <i class="pi pi-chevron-down" style="font-size: 1.5rem"></i>
    </button>
  </div>
</template>
