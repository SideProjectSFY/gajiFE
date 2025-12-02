<template>
  <div
    :class="cardClass"
    @click="handleClick"
  >
    <div :class="cardHeaderClass">
      <span :class="baseStoryClass">{{ scenario.base_story }}</span>
      <span :class="badgeClass">{{ scenarioTypeLabel }}</span>
    </div>

    <div :class="cardBodyClass">
      <p :class="previewClass">
        {{ scenarioPreview }}
      </p>
    </div>

    <div :class="cardFooterClass">
      <div :class="statsClass">
        <span :class="forkCountClass">🍴 {{ scenario.fork_count }} forks</span>
        <span :class="creatorClass">by @{{ scenario.creator_username }}</span>
      </div>
      <div
        :class="actionsClass"
        @click.stop
      >
        <ShareButton
          :scenario-id="scenario.id"
          :scenario-title="scenario.base_story"
          :base-story="scenario.base_story"
          @link-copied="handleLinkCopied"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { css } from '@/../styled-system/css'
import type { BrowseScenario } from '@/types'
import ShareButton from '@/components/common/ShareButton.vue'

interface Props {
  scenario: BrowseScenario
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: [scenarioId: string]
}>()

const scenarioTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    CHARACTER_CHANGE: 'Character',
    EVENT_ALTERATION: 'Event',
    SETTING_MODIFICATION: 'Setting',
  }
  return labels[props.scenario.scenario_type] || props.scenario.scenario_type
})

const scenarioPreview = computed(() => {
  const { scenario_type, parameters, base_story } = props.scenario

  if (scenario_type === 'CHARACTER_CHANGE' && parameters.character) {
    return `What if ${parameters.character} was ${parameters.new_property} instead of ${parameters.original_property}?`
  } else if (scenario_type === 'EVENT_ALTERATION' && parameters.event_name) {
    return `What if ${parameters.event_name} had a different outcome in ${base_story}?`
  } else if (scenario_type === 'SETTING_MODIFICATION' && parameters.new_setting) {
    return `What if ${base_story} took place in ${parameters.new_setting}?`
  }
  return props.scenario.scenario_preview || 'No preview available'
})

const handleClick = (): void => {
  emit('click', props.scenario.id)
}

const handleLinkCopied = (): void => {
  // Optional: Analytics tracking or additional logic
  console.log('Link copied for scenario:', props.scenario.id)
}

// PandaCSS classes
const cardClass = css({
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '1px solid #e5e7eb',
  _hover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
})

const cardHeaderClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  gap: '8px',
})

const baseStoryClass = css({
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
})

const badgeClass = computed(() => {
  const baseStyles = {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '16px',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }

  const typeColors: Record<string, { bg: string; color: string }> = {
    CHARACTER_CHANGE: { bg: '#dbeafe', color: '#1e40af' },
    EVENT_ALTERATION: { bg: '#dcfce7', color: '#15803d' },
    SETTING_MODIFICATION: { bg: '#e9d5ff', color: '#7e22ce' },
  }

  const colors = typeColors[props.scenario.scenario_type] || { bg: '#f3f4f6', color: '#6b7280' }

  return css({
    ...baseStyles,
    backgroundColor: colors.bg,
    color: colors.color,
  })
})

const cardBodyClass = css({
  marginBottom: '16px',
})

const previewClass = css({
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#6b7280',
  margin: 0,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const cardFooterClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #f3f4f6',
})

const actionsClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
})

const statsClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13px',
  color: '#6b7280',
})

const forkCountClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
})

const creatorClass = css({
  fontStyle: 'italic',
})
</script>
