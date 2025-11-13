# Story 1.4: Setting Modification Scenario UI

**Epic**: Epic 1 - What If Scenario Foundation  
**Priority**: P2 - Medium  
**Status**: Not Started  
**Estimated Effort**: 5 hours

## Description

Create Vue.js UI for "Setting Modification" scenarios (e.g., "What if Harry Potter took place in modern day?") with location/time period changes.

## Dependencies

**Blocks**:

- Story 3.1: Scenario Browse UI (needs scenarios to display)

**Requires**:

- Story 0.4: Vue.js Frontend Project Setup
- Story 1.1: Scenario Data Model & API
- Story 1.2: Character Property Change UI (shares form structure)

## Acceptance Criteria

- [ ] SETTING_MODIFICATION tab in `CreateScenarioForm.vue` component
- [ ] Form fields: base_story, setting_aspect (location/time_period/technology_level/culture), original_setting, new_setting
- [ ] Real-time preview: "What if [base_story] took place in [new_setting] instead of [original_setting]?"
- [ ] setting_aspect dropdown with predefined options: Location, Time Period, Technology Level, Cultural Context
- [ ] Form validation: all fields required, new_setting must differ from original_setting
- [ ] Submit calls POST /api/scenarios with scenario_type: SETTING_MODIFICATION
- [ ] Example suggestions for each setting_aspect (e.g., Time Period: "Modern Day", "Medieval Era")
- [ ] Success redirects to scenario detail page
- [ ] Unit tests >80% coverage

## Technical Notes

**Form Implementation**:

```vue
<form
  @submit.prevent="handleSubmit"
  v-if="selectedType === 'SETTING_MODIFICATION'"
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
    <label>Setting Aspect to Change</label>
    <select v-model="form.parameters.setting_aspect" required>
      <option value="">Choose an aspect...</option>
      <option value="location">Location</option>
      <option value="time_period">Time Period</option>
      <option value="technology_level">Technology Level</option>
      <option value="cultural_context">Cultural Context</option>
    </select>
  </div>

  <div class="example-suggestions" v-if="form.parameters.setting_aspect">
    <p class="text-sm text-gray-600">
      Examples for {{ settingAspectLabel }}: 
      {{ exampleSuggestions.join(', ') }}
    </p>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label>Original Setting</label>
      <input 
        v-model="form.parameters.original_setting" 
        :placeholder="originalSettingPlaceholder" 
        required 
      />
    </div>

    <div class="form-group">
      <label>New Setting</label>
      <input 
        v-model="form.parameters.new_setting" 
        :placeholder="newSettingPlaceholder" 
        required 
      />
    </div>
  </div>

  <div class="preview-panel">
    <h3>Preview</h3>
    <p>{{ scenarioPreview }}</p>
  </div>

  <button type="submit" :disabled="!isFormValid || isSubmitting">
    Create Setting Modification Scenario
  </button>
</form>
```

**Dynamic Placeholders and Examples**:

```typescript
const settingAspectExamples = {
  location: {
    label: "Location",
    examples: ["Tokyo", "New York City", "Ancient Rome", "Mars Colony"],
    originalPlaceholder: "e.g., Hogwarts (Scotland)",
    newPlaceholder: "e.g., Tokyo Magic Academy",
  },
  time_period: {
    label: "Time Period",
    examples: [
      "Modern Day (2024)",
      "Medieval Era",
      "Cyberpunk Future",
      "1920s",
    ],
    originalPlaceholder: "e.g., 1990s",
    newPlaceholder: "e.g., 2024",
  },
  technology_level: {
    label: "Technology Level",
    examples: [
      "Stone Age",
      "Industrial Revolution",
      "Modern Tech",
      "Post-Singularity AI",
    ],
    originalPlaceholder: "e.g., Magic-based",
    newPlaceholder: "e.g., Advanced Technology",
  },
  cultural_context: {
    label: "Cultural Context",
    examples: [
      "Korean Culture",
      "Steampunk Victorian",
      "Cyberpunk Asian Fusion",
    ],
    originalPlaceholder: "e.g., British Wizarding Culture",
    newPlaceholder: "e.g., Korean Wizarding Culture",
  },
};

const exampleSuggestions = computed(() => {
  const aspect = form.value.parameters.setting_aspect;
  return aspect ? settingAspectExamples[aspect].examples : [];
});
```

## QA Checklist

### Functional Testing

- [ ] Create setting modification scenario for each aspect type
- [ ] Setting aspect dropdown changes placeholder text dynamically
- [ ] Example suggestions update when aspect selected
- [ ] Identical original and new settings show validation error
- [ ] Success redirects to scenario detail page

### UI/UX Testing

- [ ] Placeholders provide helpful examples for each aspect
- [ ] Example suggestions clickable to auto-fill (future enhancement)
- [ ] Preview updates dynamically with all field changes
- [ ] Form resets after successful submission
- [ ] Dropdown accessible via keyboard

### Validation Testing

- [ ] Empty setting_aspect prevents submission
- [ ] Empty original_setting shows error
- [ ] original_setting === new_setting shows error: "Settings must be different"
- [ ] Submit button disabled when form invalid

### Performance

- [ ] Dynamic placeholder update < 5ms
- [ ] Preview computation < 10ms
- [ ] Form submission < 500ms

### Accessibility

- [ ] Dropdown has proper label association
- [ ] Example suggestions visible to screen readers
- [ ] Keyboard navigation through all form fields

## Estimated Effort

5 hours
