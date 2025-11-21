<script setup lang="ts">
import { useRoute } from 'vue-router'
import { css } from '../../styled-system/css'

const route = useRoute()
const conversationId = route.params.id
</script>

<template>
  <div :class="container">
    <h1 :class="heading">대화 {{ conversationId }}</h1>
    <p :class="description">준비 중입니다.</p>
  </div>
</template>

<script lang="ts">
const container = css({
  minHeight: '100vh',
  padding: '2rem',
  backgroundColor: 'neutral.50',
})

const heading = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
})

const description = css({
  color: 'neutral.600',
})
</script>
