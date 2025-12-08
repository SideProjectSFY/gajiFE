<script setup lang="ts">
import { computed } from 'vue'
import { css } from 'styled-system/css'
import type { Scenario } from '@/types'

const props = defineProps<{
  scenario: Scenario
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const scenarioTypeBadges = computed(() => {
  return props.scenario.scenario_types.map((type) => {
    switch (type) {
      case 'character_changes':
        return { label: 'Character Changes', color: '#e0e7ff', textColor: '#4f46e5' }
      case 'event_alterations':
        return { label: 'Event Alterations', color: '#fef3c7', textColor: '#d97706' }
      case 'setting_modifications':
        return { label: 'Setting Modifications', color: '#d1fae5', textColor: '#059669' }
      default:
        return { label: type, color: '#f3f4f6', textColor: '#6b7280' }
    }
  })
})

const handleClick = (): void => {
  emit('click')
}

const styles = {
  card: css({
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)',
    },
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  }),
  title: css({
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    lineHeight: '1.4',
  }),
  badges: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  }),
  badge: css({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  }),
  preview: css({
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '1rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }),
  stats: css({
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  }),
  stat: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '14px',
    color: '#6b7280',
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
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
  }),
  avatarImg: css({
    width: '100%',
    height: '100%',
    borderRadius: 'full',
    objectFit: 'cover',
  }),
  username: css({
    fontSize: '13px',
    color: '#6b7280',
  }),
}
</script>

<template>
  <div
    :class="styles.card"
    @click="handleClick"
  >
    <div :class="styles.header">
      <h3 :class="styles.title">
        {{ scenario.scenario_title }}
      </h3>
    </div>

    <div :class="styles.badges">
      <span
        v-for="badge in scenarioTypeBadges"
        :key="badge.label"
        :class="styles.badge"
        :style="{
          backgroundColor: badge.color,
          color: badge.textColor,
        }"
      >
        {{ badge.label }}
      </span>
    </div>

    <p :class="styles.preview">
      {{ scenario.preview_text }}
    </p>

    <div :class="styles.stats">
      <div :class="styles.stat">
        <span>💬</span>
        <span>{{ scenario.conversation_count }}</span>
      </div>
      <div :class="styles.stat">
        <span>🍴</span>
        <span>{{ scenario.fork_count }}</span>
      </div>
      <div :class="styles.stat">
        <span>❤️</span>
        <span>{{ scenario.like_count }}</span>
      </div>
    </div>

    <div :class="styles.footer">
      <div :class="styles.avatar">
        <img
          v-if="scenario.creator.avatar_url"
          :src="scenario.creator.avatar_url"
          :alt="scenario.creator.username"
          :class="styles.avatarImg"
        >
        <span v-else>
          {{ scenario.creator.username.charAt(0).toUpperCase() }}
        </span>
      </div>
      <span :class="styles.username">
        {{ scenario.creator.username }}
      </span>
    </div>
  </div>
</template>
