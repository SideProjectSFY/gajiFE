<script setup lang="ts">
import { css } from '../../styled-system/css'
import LogoSvg from '@/assets/Logo.svg'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '2rem',
    position: 'relative',
  }),
  content: css({
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%',
  }),
  logoContainer: css({
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'center',
    animation: 'bounce 2s infinite',
  }),
  heading: css({
    fontSize: { base: '4rem', md: '6rem' },
    fontWeight: '800',
    lineHeight: '1',
    background: 'linear-gradient(135deg, #1f7d51 0%, #10b981 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    marginBottom: '1.5rem',
  }),
  subHeading: css({
    fontSize: { base: '1.5rem', md: '2rem' },
    fontWeight: 'bold',
    color: 'gray.800',
    marginBottom: '1rem',
  }),
  description: css({
    fontSize: '1.125rem',
    color: 'gray.600',
    marginBottom: '2.5rem',
    lineHeight: '1.6',
  }),
  buttonGroup: css({
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  }),
  primaryLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.875rem 2rem',
    backgroundColor: '#1f7d51',
    color: 'white',
    borderRadius: 'full',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.2s',
    boxShadow: 'lg',
    '&:hover': {
      backgroundColor: '#166534',
      transform: 'translateY(-2px)',
      boxShadow: 'xl',
    },
  }),
  secondaryLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.875rem 2rem',
    backgroundColor: 'white',
    color: '#1f7d51',
    border: '1px solid #1f7d51',
    borderRadius: 'full',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f0fdf4',
      transform: 'translateY(-2px)',
    },
  }),
  searchBox: css({
    marginTop: '2rem',
    display: 'flex',
    justifyContent: 'center',
  }),
  searchInput: css({
    width: '100%',
    maxWidth: '360px',
    padding: '0.85rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: 'white',
    _focus: {
      borderColor: '#16a34a',
      boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.15)',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div style="position: absolute; top: 1.5rem; right: 1.5rem">
      <LanguageSwitcher />
    </div>
    <div :class="styles.content">
      <div :class="styles.logoContainer">
        <LogoSvg style="width: 80px; height: 80px; fill: #1f7d51" />
      </div>

      <h1 :class="styles.heading">404</h1>

      <h2 :class="styles.subHeading">
        {{ t('notFound.title') }}
      </h2>

      <p :class="styles.description" v-html="t('notFound.description')"></p>

      <div :class="styles.buttonGroup">
        <router-link to="/" :class="styles.primaryLink">
          {{ t('notFound.goHome') }}
        </router-link>

        <router-link to="/books" :class="styles.secondaryLink">
          {{ t('notFound.findNewStory') }}
        </router-link>
      </div>
    </div>
  </div>
</template>
