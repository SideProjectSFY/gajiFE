import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScenarioBrowseCard from '../scenario/ScenarioBrowseCard.vue'
import type { BrowseScenario } from '@/types'

describe('ScenarioBrowseCard', () => {
  const mockScenario: BrowseScenario = {
    id: 'scenario-1',
    base_story: 'Harry Potter',
    scenario_type: 'CHARACTER_CHANGE',
    scenario_preview: 'Test preview',
    fork_count: 42,
    creator_username: 'testuser',
    parameters: {
      character: 'Harry',
      new_property: 'Slytherin',
      original_property: 'Gryffindor',
    },
    created_at: '2024-01-01T00:00:00Z',
  }

  it('renders scenario card with correct data', () => {
    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: mockScenario },
    })

    expect(wrapper.text()).toContain('Harry Potter')
    expect(wrapper.text()).toContain('Character')
    expect(wrapper.text()).toContain('42 forks')
    expect(wrapper.text()).toContain('@testuser')
  })

  it('displays correct scenario type badge', () => {
    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: mockScenario },
    })

    expect(wrapper.text()).toContain('Character')
  })

  it('generates correct preview for CHARACTER_CHANGE', () => {
    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: mockScenario },
    })

    expect(wrapper.text()).toContain('What if Harry was Slytherin instead of Gryffindor?')
  })

  it('generates correct preview for EVENT_ALTERATION', () => {
    const eventScenario: BrowseScenario = {
      ...mockScenario,
      scenario_type: 'EVENT_ALTERATION',
      parameters: {
        event_name: 'The Battle of Hogwarts',
      },
    }

    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: eventScenario },
    })

    expect(wrapper.text()).toContain('What if The Battle of Hogwarts had a different outcome')
  })

  it('generates correct preview for SETTING_MODIFICATION', () => {
    const settingScenario: BrowseScenario = {
      ...mockScenario,
      scenario_type: 'SETTING_MODIFICATION',
      parameters: {
        new_setting: 'modern day New York',
      },
    }

    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: settingScenario },
    })

    expect(wrapper.text()).toContain('What if Harry Potter took place in modern day New York?')
  })

  it('emits click event when card is clicked', async () => {
    const wrapper = mount(ScenarioBrowseCard, {
      props: { scenario: mockScenario },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual(['scenario-1'])
  })
})
