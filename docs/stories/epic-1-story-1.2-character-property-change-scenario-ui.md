# Story 1.2: Character Property Change Scenario UI

**Epic**: Epic 1 - What If Scenario Foundation  
**Priority**: P1 - High  
**Status**: Not Started  
**Estimated Effort**: 6 hours

## Description

Create Vue.js UI for users to create "Character Property Change" scenarios (e.g., "Hermione in Slytherin") with form validation and real-time preview.

## Dependencies

**Blocks**:

- Story 3.1: Scenario Browse UI (needs scenarios to display)

**Requires**:

- Story 0.4: Vue.js Frontend Project Setup
- Story 1.1: Scenario Data Model & API

## Acceptance Criteria

- [ ] `CreateScenarioForm.vue` component with scenario type tabs: CHARACTER_CHANGE, EVENT_ALTERATION, SETTING_MODIFICATION
- [ ] CHARACTER_CHANGE tab includes: base_story input, character dropdown/autocomplete, original_property input, new_property input
- [ ] Real-time preview panel shows: "What if [character] was [new_property] instead of [original_property] in [base_story]?"
- [ ] Form validation: all fields required, character must exist in base_story knowledge base (future: validated via AI)
- [ ] Submit button calls POST /api/scenarios with JSONB parameters
- [ ] Success toast notification: "Scenario created! Start a conversation to explore it."
- [ ] Error handling: displays API errors clearly (e.g., duplicate scenario, invalid base_story)
- [ ] Responsive design: mobile-friendly form layout
- [ ] Keyboard shortcuts: Cmd+Enter to submit
- [ ] Unit tests for form validation logic >80% coverage

## Technical Notes

**Component Structure**:

```vue
<template>
  <div class="create-scenario-form">
    <h2>Create Your What If Scenario</h2>

    <div class="scenario-type-tabs">
      <button
        @click="selectedType = 'CHARACTER_CHANGE'"
        :class="{ active: selectedType === 'CHARACTER_CHANGE' }"
      >
        Character Change
      </button>
      <button
        @click="selectedType = 'EVENT_ALTERATION'"
        :class="{ active: selectedType === 'EVENT_ALTERATION' }"
      >
        Event Alteration
      </button>
      <button
        @click="selectedType = 'SETTING_MODIFICATION'"
        :class="{ active: selectedType === 'SETTING_MODIFICATION' }"
      >
        Setting Change
      </button>
    </div>

    <form
      @submit.prevent="handleSubmit"
      v-if="selectedType === 'CHARACTER_CHANGE'"
    >
      <div class="form-group">
        <label>Base Story</label>
        <input
          v-model="form.baseStory"
          placeholder="e.g., Harry Potter"
          required
        />
      </div>

      <div class="form-group">
        <label>Character</label>
        <input
          v-model="form.parameters.character"
          placeholder="e.g., Hermione"
          required
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Original Property</label>
          <input
            v-model="form.parameters.original_property"
            placeholder="e.g., Gryffindor"
            required
          />
        </div>

        <div class="form-group">
          <label>New Property</label>
          <input
            v-model="form.parameters.new_property"
            placeholder="e.g., Slytherin"
            required
          />
        </div>
      </div>

      <div class="preview-panel">
        <h3>Preview</h3>
        <p>{{ scenarioPreview }}</p>
      </div>

      <button type="submit" :disabled="isSubmitting">Create Scenario</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import api from "@/services/api";

const selectedType = ref("CHARACTER_CHANGE");
const isSubmitting = ref(false);

const form = ref({
  baseStory: "",
  parameters: {
    character: "",
    original_property: "",
    new_property: "",
  },
});

const scenarioPreview = computed(() => {
  const { baseStory, parameters } = form.value;
  if (
    !parameters.character ||
    !parameters.new_property ||
    !parameters.original_property
  ) {
    return "Fill in all fields to see preview...";
  }
  return `What if ${parameters.character} was ${parameters.new_property} instead of ${parameters.original_property} in ${baseStory}?`;
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const response = await api.post("/scenarios", {
      base_story: form.value.baseStory,
      scenario_type: "CHARACTER_CHANGE",
      parameters: form.value.parameters,
    });

    // Success handling
    showToast("Scenario created! Start a conversation to explore it.");
    router.push(`/scenarios/${response.data.id}`);
  } catch (error) {
    showError(error.response?.data?.message || "Failed to create scenario");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
```

## QA Checklist

### Functional Testing

- [ ] Create scenario with all fields filled submits successfully
- [ ] Missing required field shows validation error
- [ ] Preview updates in real-time as user types
- [ ] Success creates scenario and redirects to scenario detail page
- [ ] API error displays user-friendly message

### UI/UX Testing

- [ ] Form layout responsive on mobile (< 768px width)
- [ ] Tab switching between scenario types works smoothly
- [ ] Submit button shows loading state during API call
- [ ] Keyboard shortcut Cmd+Enter submits form
- [ ] Toast notifications appear and auto-dismiss after 3s

### Validation Testing

- [ ] Empty base_story shows error "Base story is required"
- [ ] Empty character shows error "Character is required"
- [ ] Form prevents submission if any field is empty
- [ ] Duplicate scenario creation shows meaningful error

### Performance

- [ ] Preview computation < 10ms (reactive)
- [ ] Form submission < 500ms (API call)
- [ ] No UI lag when typing in inputs

### Accessibility

- [ ] Form inputs have proper labels for screen readers
- [ ] Error messages announced to screen readers
- [ ] Keyboard navigation works through all form fields

## Estimated Effort

6 hours
