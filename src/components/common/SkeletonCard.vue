<script setup lang="ts">
import { css } from 'styled-system/css'

const styles = {
  card: css({
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }),
  skeleton: css({
    backgroundColor: '#e5e7eb',
    borderRadius: '8px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }),
  title: css({
    height: '24px',
    width: '70%',
    marginBottom: '1rem',
  }),
  badge: css({
    height: '20px',
    width: '100px',
    display: 'inline-block',
    marginRight: '0.5rem',
    marginBottom: '0.75rem',
  }),
  text: css({
    height: '16px',
    marginBottom: '0.5rem',
  }),
  stats: css({
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    marginBottom: '1rem',
  }),
  stat: css({
    height: '20px',
    width: '40px',
  }),
  footer: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f3f4f6',
  }),
  avatar: css({
    width: '24px',
    height: '24px',
    borderRadius: 'full',
  }),
  username: css({
    height: '16px',
    width: '80px',
  }),
}
</script>

<template>
  <div :class="styles.card">
    <div :class="[styles.skeleton, styles.title]" />
    <div :class="[styles.skeleton, styles.badge]" />
    <div :class="[styles.skeleton, styles.text]" />
    <div
      :class="[styles.skeleton, styles.text]"
      style="width: 90%"
    />

    <div :class="styles.stats">
      <div :class="[styles.skeleton, styles.stat]" />
      <div :class="[styles.skeleton, styles.stat]" />
      <div :class="[styles.skeleton, styles.stat]" />
    </div>

    <div :class="styles.footer">
      <div :class="[styles.skeleton, styles.avatar]" />
      <div :class="[styles.skeleton, styles.username]" />
    </div>
  </div>
</template>

<style>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
