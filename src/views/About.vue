<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const { t } = useI18n()
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'gray.50' })">
    <AppHeader />

    <main
      :class="
        css({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { base: '4', md: '8' },
          py: '12',
        })
      "
    >
      <div :class="css({ maxW: '1200px', w: 'full' })">
        <!-- Hero Section -->
        <div :class="css({ textAlign: 'center', mb: '12' })">
          <h1
            :class="
              css({
                fontSize: { base: '2.5rem', md: '3rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '4',
              })
            "
          >
            {{ t('about.title') }}
          </h1>

          <!-- What is Gaji Section -->
          <div
            :class="
              css({
                bg: 'green.50',
                borderRadius: '1rem',
                p: { base: '6', md: '8' },
                mb: '8',
                border: '2px solid #1f7d51',
              })
            "
          >
            <h2
              :class="
                css({
                  fontSize: { base: '1.25rem', md: '1.5rem' },
                  fontWeight: 'bold',
                  color: 'green.800',
                  mb: '4',
                })
              "
            >
              {{ t('about.whatIsGaji.title') }}
            </h2>
            <p
              :class="
                css({
                  fontSize: '1rem',
                  color: 'green.900',
                  lineHeight: '1.8',
                  maxW: '700px',
                  mx: 'auto',
                })
              "
              v-html="t('about.whatIsGaji.description')"
            />
          </div>

          <p
            :class="
              css({
                fontSize: { base: '1rem', md: '1.125rem' },
                color: 'gray.600',
                lineHeight: '1.8',
                maxW: '800px',
                mx: 'auto',
              })
            "
          >
            {{ t('about.subtitle') }}
          </p>
        </div>

        <!-- Mission Section -->
        <div :class="css({ textAlign: 'center', mb: '16' })">
          <h2
            :class="
              css({
                fontSize: { base: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '4',
              })
            "
          >
            {{ t('about.mission.title') }}
          </h2>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
                lineHeight: '1.8',
                maxW: '700px',
                mx: 'auto',
                mb: '12',
              })
            "
          >
            {{ t('about.mission.description') }}
          </p>

          <!-- Mission Cards -->
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
                gap: '8',
                mb: '12',
              })
            "
          >
            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">📚</div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                {{ t('about.mission.preserve.title') }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                {{ t('about.mission.preserve.description') }}
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">👥</div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                {{ t('about.mission.community.title') }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                {{ t('about.mission.community.description') }}
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">💬</div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                {{ t('about.mission.enhance.title') }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                {{ t('about.mission.enhance.description') }}
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">💡</div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                {{ t('about.mission.innovate.title') }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                {{ t('about.mission.innovate.description') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Get Started Section -->
        <div
          :class="css({ bg: 'white', borderRadius: '1rem', p: { base: '8', md: '12' }, mb: '12' })"
        >
          <h2
            :class="
              css({
                fontSize: { base: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                textAlign: 'center',
                mb: '8',
              })
            "
          >
            {{ t('about.getStarted.title') }}
          </h2>

          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '6' })">
            <!-- Step 1 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'green.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🔍
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">{{
                    t('about.getStarted.step1.label')
                  }}</span>
                  {{ t('about.getStarted.step1.title') }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  {{ t('about.getStarted.step1.description') }}
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'yellow.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                💬
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">{{
                    t('about.getStarted.step2.label')
                  }}</span>
                  {{ t('about.getStarted.step2.title') }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  {{ t('about.getStarted.step2.description') }}
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'green.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🌳
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">{{
                    t('about.getStarted.step3.label')
                  }}</span>
                  {{ t('about.getStarted.step3.title') }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  {{ t('about.getStarted.step3.description') }}
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'yellow.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🔗
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">{{
                    t('about.getStarted.step4.label')
                  }}</span>
                  {{ t('about.getStarted.step4.title') }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  {{ t('about.getStarted.step4.description') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
