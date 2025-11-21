<script setup lang="ts">
import { css } from '../../styled-system/css'

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'neutral.50',
  }),
  content: css({
    textAlign: 'center',
  }),
  heading: css({
    fontSize: '6rem',
    fontWeight: 'bold',
    color: 'primary.600',
    marginBottom: '1rem',
  }),
  description: css({
    fontSize: '1.5rem',
    color: 'neutral.600',
    marginBottom: '2rem',
  }),
  link: css({
    display: 'inline-block',
    padding: '0.75rem 2rem',
    backgroundColor: 'primary.600',
    color: 'white',
    borderRadius: 'md',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'primary.700',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.content">
      <h1 :class="styles.heading">404</h1>
      <p :class="styles.description">페이지를 찾을 수 없습니다.</p>
      <router-link to="/" :class="styles.link">홈으로 돌아가기</router-link>
    </div>
  </div>
</template>
