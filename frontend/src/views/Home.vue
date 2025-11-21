<script setup lang="ts">
import { css } from '../../styled-system/css'
</script>

<template>
  <div :class="homeContainer">
    <header :class="header">
      <h1 :class="title">Gaji</h1>
      <p :class="subtitle">AI 시나리오 대화 플랫폼</p>
    </header>

    <main :class="main">
      <div :class="hero">
        <h2>당신만의 이야기를 만들어보세요</h2>
        <p>AI와 함께 다양한 시나리오를 탐험하고, 새로운 대화를 경험하세요.</p>
        <div :class="buttonGroup">
          <router-link to="/scenarios" :class="primaryButton"> 시나리오 둘러보기 </router-link>
          <router-link to="/login" :class="secondaryButton"> 시작하기 </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
const homeContainer = css({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
})

const header = css({
  padding: '2rem',
  backgroundColor: 'primary.600',
  color: 'white',
  textAlign: 'center',
})

const title = css({
  fontSize: '3rem',
  fontWeight: 'bold',
  margin: '0',
})

const subtitle = css({
  fontSize: '1.25rem',
  margin: '0.5rem 0 0 0',
  opacity: 0.9,
})

const main = css({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
})

const hero = css({
  textAlign: 'center',
  maxWidth: '800px',
})

const buttonGroup = css({
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  marginTop: '2rem',
})

const primaryButton = css({
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
})

const secondaryButton = css({
  padding: '0.75rem 2rem',
  backgroundColor: 'transparent',
  color: 'primary.600',
  border: '2px solid',
  borderColor: 'primary.600',
  borderRadius: 'md',
  textDecoration: 'none',
  fontWeight: '600',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'primary.50',
  },
})
</script>
