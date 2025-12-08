<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref } from 'vue'
import ScenarioTreeView from '@/components/scenario/ScenarioTreeView.vue'
import Button from 'primevue/button'
import { css } from 'styled-system/css'

// Mock scenario IDs for testing different cases
const testCases = [
  { id: 'test-root-with-3-forks', label: '3 Forks (Normal Case)' },
  { id: 'test-root-with-10-forks', label: '10 Forks (Many Forks)' },
  { id: 'test-root-no-forks', label: 'No Forks (Empty State)' },
  { id: 'test-error-case', label: 'Error Case' },
]

const currentScenarioId = ref('test-root-with-3-forks')

// Mock API interceptor - this will be set up in the component
if (typeof window !== 'undefined') {
  // @ts-ignore - Adding mock API to window for testing
  window.mockScenarioTreeAPI = (scenarioId: string) => {
    if (scenarioId === 'test-error-case') {
      return Promise.reject(new Error('API Error'))
    }

    if (scenarioId === 'test-root-no-forks') {
      return Promise.resolve({
        root: {
          id: 'test-root-no-forks',
          title: 'Scenario Without Forks',
          whatIfQuestion: 'What if nothing happened yet?',
          description: 'This scenario has no forks to display',
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          conversation_count: 0,
          fork_count: 0,
          like_count: 0,
        },
        children: [],
        totalCount: 1,
        maxDepth: 0,
      })
    }

    if (scenarioId === 'test-root-with-10-forks') {
      const children = Array.from({ length: 10 }, (_, i) => ({
        id: `fork-${i + 1}`,
        title: `Fork ${i + 1}: Alternative Path`,
        whatIfQuestion: `What if option ${i + 1} was chosen?`,
        description: `This is fork number ${i + 1} exploring a different direction`,
        parent_scenario_id: scenarioId,
        user_id: `user-${i + 2}`,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        conversation_count: Math.floor(Math.random() * 10),
        fork_count: 0,
      }))

      return Promise.resolve({
        root: {
          id: scenarioId,
          title: 'Root Scenario with Many Forks',
          whatIfQuestion: 'What if the story went in many directions?',
          description: 'A popular scenario with lots of alternative paths',
          user_id: 'user-1',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          conversation_count: 25,
          fork_count: 10,
          like_count: 50,
        },
        children,
        totalCount: 11,
        maxDepth: 1,
      })
    }

    // Default: test-root-with-3-forks
    return Promise.resolve({
      root: {
        id: scenarioId,
        title: "The Hero's Dilemma",
        whatIfQuestion: 'What if the hero chose a different path?',
        description:
          'At the crossroads, our hero faces three distinct paths, each leading to a different destiny.',
        user_id: 'user-1',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        conversation_count: 15,
        fork_count: 3,
        like_count: 42,
      },
      children: [
        {
          id: 'fork-1',
          title: 'The Path of Courage',
          whatIfQuestion: 'What if they fought the dragon?',
          description: 'Our hero decides to face the dragon head-on, sword in hand.',
          parent_scenario_id: scenarioId,
          user_id: 'user-2',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          conversation_count: 8,
          fork_count: 0,
        },
        {
          id: 'fork-2',
          title: 'The Path of Wisdom',
          whatIfQuestion: 'What if they sought the ancient sage?',
          description: 'Instead of fighting, our hero seeks wisdom from the mountain sage.',
          parent_scenario_id: scenarioId,
          user_id: 'user-3',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          conversation_count: 12,
          fork_count: 0,
        },
        {
          id: 'fork-3',
          title: 'The Path of Cunning',
          whatIfQuestion: 'What if they infiltrated the castle?',
          description: 'Our hero decides to use stealth and cunning to achieve their goal.',
          parent_scenario_id: scenarioId,
          user_id: 'user-4',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          conversation_count: 6,
          fork_count: 0,
        },
      ],
      totalCount: 4,
      maxDepth: 1,
    })
  }
}
</script>

<template>
  <div :class="pageContainer">
    <div :class="header">
      <h1 :class="title">
        Scenario Tree Visualization Test
      </h1>
      <p :class="subtitle">
        Test the ScenarioTreeView component with various mock data scenarios
      </p>
    </div>

    <div :class="controls">
      <h2 :class="controlsTitle">
        Test Cases
      </h2>
      <div :class="buttonGroup">
        <Button
          v-for="testCase in testCases"
          :key="testCase.id"
          :label="testCase.label"
          :severity="currentScenarioId === testCase.id ? 'primary' : 'secondary'"
          @click="currentScenarioId = testCase.id"
        />
      </div>
    </div>

    <div :class="treeContainer">
      <ScenarioTreeView
        :key="currentScenarioId"
        :scenario-id="currentScenarioId"
        :current-scenario-id="currentScenarioId"
      />
    </div>

    <div :class="instructions">
      <h3 :class="instructionsTitle">
        Testing Instructions
      </h3>
      <ul :class="instructionsList">
        <li><strong>3 Forks:</strong> Normal case with root scenario and 3 fork scenarios</li>
        <li><strong>10 Forks:</strong> Tests responsive grid with many forks</li>
        <li><strong>No Forks:</strong> Tests empty state when scenario has no forks</li>
        <li><strong>Error Case:</strong> Tests error handling and retry button</li>
        <li>
          <strong>Keyboard Navigation:</strong> Press Tab to move between nodes, Enter/Space to
          navigate
        </li>
        <li>
          <strong>Screen Reader:</strong> Enable VoiceOver (Cmd+F5) to test ARIA labels and live
          regions
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
const pageContainer = css({
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '2rem',
})

const header = css({
  marginBottom: '2rem',
  textAlign: 'center',
})

const title = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'gray.900',
  marginBottom: '0.5rem',
})

const subtitle = css({
  fontSize: '1rem',
  color: 'gray.600',
})

const controls = css({
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: 'gray.50',
  borderRadius: '0.5rem',
  border: '1px solid',
  borderColor: 'gray.200',
})

const controlsTitle = css({
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '1rem',
  color: 'gray.800',
})

const buttonGroup = css({
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
})

const treeContainer = css({
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  border: '1px solid',
  borderColor: 'gray.200',
  minHeight: '400px',
})

const instructions = css({
  padding: '1.5rem',
  backgroundColor: 'blue.50',
  borderRadius: '0.5rem',
  border: '1px solid',
  borderColor: 'blue.200',
})

const instructionsTitle = css({
  fontSize: '1.125rem',
  fontWeight: '600',
  marginBottom: '1rem',
  color: 'blue.900',
})

const instructionsList = css({
  listStyle: 'disc',
  paddingLeft: '1.5rem',
  color: 'gray.700',
  '& li': {
    marginBottom: '0.5rem',
  },
  '& strong': {
    fontWeight: '600',
    color: 'gray.900',
  },
})

export {
  pageContainer,
  header,
  title,
  subtitle,
  controls,
  controlsTitle,
  buttonGroup,
  treeContainer,
  instructions,
  instructionsTitle,
  instructionsList,
}
</script>

<style scoped>
/* Using Panda CSS tokens for consistency */
</style>
