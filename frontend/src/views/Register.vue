<script setup lang="ts">
import { css } from '../../styled-system/css'

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'neutral.100',
    padding: '2rem',
  }),
  card: css({
    backgroundColor: 'white',
    borderRadius: 'lg',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  }),
  heading: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  }),
  description: css({
    color: 'neutral.600',
    marginBottom: '1.5rem',
  }),
  link: css({
    color: 'primary.600',
    textDecoration: 'none',
    fontWeight: '600',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.card">
      <h1 :class="styles.heading">회원가입</h1>
      <p :class="styles.description">준비 중입니다.</p>
      <router-link to="/login" :class="styles.link">로그인으로 돌아가기</router-link>
    </div>
  </div>
</template>
