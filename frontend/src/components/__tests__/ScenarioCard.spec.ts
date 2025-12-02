import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScenarioCard from '../book/ScenarioCard.vue'
import type { Scenario } from '@/types'

describe('ScenarioCard', () => {
  const mockScenario: Scenario = {
    id: '123',
    scenario_title: 'Test Scenario',
    scenario_types: ['character_changes'],
    preview_text: 'This is a test scenario preview',
    conversation_count: 5,
    fork_count: 2,
    like_count: 10,
    creator: {
      id: 'user1',
      username: 'testuser',
      avatar_url: null,
    },
    created_at: '2025-01-01T00:00:00Z',
  }

  it('renders scenario information correctly', () => {
    const wrapper = mount(ScenarioCard, {
      props: {
        scenario: mockScenario,
      },
    })

    expect(wrapper.text()).toContain('Test Scenario')
    expect(wrapper.text()).toContain('This is a test scenario preview')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('testuser')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(ScenarioCard, {
      props: {
        scenario: mockScenario,
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('displays avatar initial when no avatar_url provided', () => {
    const wrapper = mount(ScenarioCard, {
      props: {
        scenario: mockScenario,
      },
    })

    expect(wrapper.text()).toContain('T') // First letter of username
  })

  it('displays scenario type badge', () => {
    const wrapper = mount(ScenarioCard, {
      props: {
        scenario: mockScenario,
      },
    })

    expect(wrapper.text()).toContain('Character Changes')
  })
})
