# Story 1.3: Event Alteration Scenario UI

**Epic**: Epic 1 - What If Scenario Foundation  
**Priority**: P1 - High  
**Status**: Not Started  
**Estimated Effort**: 5 hours

## Description

Create Vue.js UI for "Event Alteration" scenarios (e.g., "What if Ned Stark survived?") with event selection and outcome specification.

## Dependencies

**Blocks**:

- Story 3.1: Scenario Browse UI (needs scenarios to display)

**Requires**:

- Story 0.4: Vue.js Frontend Project Setup
- Story 1.1: Scenario Data Model & API
- Story 1.2: Character Property Change UI (shares form component structure)

## Acceptance Criteria

- [ ] EVENT_ALTERATION tab in `CreateScenarioForm.vue` component
- [ ] Form fields: base_story, event_name, original_outcome, altered_outcome
- [ ] Real-time preview: "What if [event_name] resulted in [altered_outcome] instead of [original_outcome] in [base_story]?"
- [ ] Event name autocomplete suggestions from common events (future: AI-powered)
- [ ] Form validation: all fields required, altered_outcome must differ from original_outcome
- [ ] Submit calls POST /api/scenarios with scenario_type: EVENT_ALTERATION
- [ ] Success redirects to conversation creation with new scenario
- [ ] Error handling for duplicate or invalid events
- [ ] Keyboard shortcuts: Cmd+Enter to submit
- [ ] Unit tests >80% coverage

## Technical Notes

**Form Implementation** (extends CHARACTER_CHANGE pattern):

```vue
<form @submit.prevent="handleSubmit" v-if="selectedType === 'EVENT_ALTERATION'">
  <div class="form-group">
    <label>Base Story</label>
    <input 
      v-model="form.baseStory" 
      placeholder="e.g., Game of Thrones" 
      required 
    />
  </div>

  <div class="form-group">
    <label>Event Name</label>
    <input 
      v-model="form.parameters.event_name" 
      placeholder="e.g., Ned Stark's Execution" 
      required 
      list="common-events"
    />
    <datalist id="common-events">
      <option value="Character Death"></option>
      <option value="Battle Outcome"></option>
      <option value="Marriage"></option>
    </datalist>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label>Original Outcome</label>
      <textarea 
        v-model="form.parameters.original_outcome" 
        placeholder="e.g., Ned Stark was executed in King's Landing" 
        required 
        rows="2"
      />
    </div>

    <div class="form-group">
      <label>Altered Outcome</label>
      <textarea 
        v-model="form.parameters.altered_outcome" 
        placeholder="e.g., Ned Stark escaped and returned to Winterfell" 
        required 
        rows="2"
      />
    </div>
  </div>

  <div class="preview-panel">
    <h3>Preview</h3>
    <p>{{ scenarioPreview }}</p>
  </div>

  <button type="submit" :disabled="!isFormValid || isSubmitting">
    Create Event Alteration Scenario
  </button>
</form>
```

**Validation Logic**:

```typescript
const isFormValid = computed(() => {
  const { baseStory, parameters } = form.value;
  return (
    baseStory.trim().length > 0 &&
    parameters.event_name.trim().length > 0 &&
    parameters.original_outcome.trim().length > 0 &&
    parameters.altered_outcome.trim().length > 0 &&
    parameters.original_outcome !== parameters.altered_outcome
  );
});
```

## QA Checklist

### Functional Testing

- [ ] Create event alteration scenario submits successfully
- [ ] Missing field prevents submission
- [ ] Identical original and altered outcomes show validation error
- [ ] Autocomplete datalist shows event suggestions
- [ ] Success redirects to conversation page with scenario_id

### UI/UX Testing

- [ ] Textarea auto-expands for long outcomes (max 5 rows)
- [ ] Preview updates as user types in any field
- [ ] Form resets after successful submission
- [ ] Loading spinner shows during API call
- [ ] Error toast displays for network failures

### Validation Testing

- [ ] Empty event_name shows error message
- [ ] Whitespace-only input rejected
- [ ] original_outcome === altered_outcome shows error: "Outcomes must be different"
- [ ] Submit button disabled when form invalid

### Performance

- [ ] Preview computation < 10ms
- [ ] Form submission < 500ms
- [ ] Autocomplete suggestions appear < 100ms

### Accessibility

- [ ] Datalist accessible via keyboard
- [ ] Textarea has proper label association
- [ ] Validation errors announced to screen readers

## Estimated Effort

5 hours
