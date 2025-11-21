<script setup lang="ts">
import { css } from '../../styled-system/css'
</script>

<template>
  <div :class="container">
    <div :class="card">
      <h1 :class="heading">회원가입</h1>
      <p :class="description">준비 중입니다.</p>
      <router-link to="/login" :class="link">로그인으로 돌아가기</router-link>
    </div>
  </div>
</template>

<script lang="ts">
const container = css({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'neutral.100',
  padding: '2rem',
})

const card = css({
  backgroundColor: 'white',
  borderRadius: 'lg',
  padding: '2rem',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
})

const heading = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
})

const description = css({
  color: 'neutral.600',
  marginBottom: '1.5rem',
})

const link = css({
  color: 'primary.600',
  textDecoration: 'none',
  fontWeight: '600',
  '&:hover': {
    textDecoration: 'underline',
  },
})
</script>
