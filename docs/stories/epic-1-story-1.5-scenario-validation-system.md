# Story 1.5: Scenario Validation System

**Epic**: Epic 1 - What If Scenario Foundation  
**Priority**: P2 - Medium  
**Status**: Not Started  
**Estimated Effort**: 8 hours

## Description

Implement backend validation system to ensure scenario quality, prevent nonsensical scenarios, and validate base_story authenticity using basic heuristics.

## Dependencies

**Blocks**:

- Epic 3 stories (scenario discovery needs quality scenarios)

**Requires**:

- Story 1.1: Scenario Data Model & API
- Story 1.2-1.4: Scenario UI components (generate validation test cases)

## Acceptance Criteria

- [ ] `ScenarioValidator` service class with validation methods for each scenario type
- [ ] Base story validation: minimum 2 characters, exists in predefined list of popular stories (Harry Potter, Game of Thrones, LOTR, etc.)
- [ ] CHARACTER_CHANGE validation: character name length > 1, properties non-empty and different
- [ ] EVENT_ALTERATION validation: event_name length > 3, outcomes non-empty and different, outcome length < 500 chars
- [ ] SETTING_MODIFICATION validation: setting_aspect in allowed values, settings non-empty and different
- [ ] Profanity filter: reject scenarios containing inappropriate content
- [ ] Duplicate detection: prevent identical scenarios (same base_story + parameters)
- [ ] Quality score calculation: based on parameter completeness, base_story popularity, creativity (simple heuristic)
- [ ] Validation errors return 400 Bad Request with specific error messages
- [ ] Unit tests for all validation rules >90% coverage

## Technical Notes

**ScenarioValidator Service**:

```java
@Service
public class ScenarioValidator {

    private static final Set<String> SUPPORTED_STORIES = Set.of(
        "Harry Potter", "Game of Thrones", "Lord of the Rings",
        "Star Wars", "Marvel Universe", "Percy Jackson",
        "The Hunger Games", "Twilight", "Divergent"
    );

    private static final Set<String> PROFANITY_LIST = Set.of(
        // Loaded from config file
    );

    public ValidationResult validateScenario(CreateScenarioRequest request) {
        List<String> errors = new ArrayList<>();

        // Base story validation
        if (!SUPPORTED_STORIES.contains(request.getBaseStory())) {
            errors.add("Base story '" + request.getBaseStory() +
                      "' is not currently supported. Supported: " +
                      String.join(", ", SUPPORTED_STORIES));
        }

        // Type-specific validation
        switch (request.getScenarioType()) {
            case CHARACTER_CHANGE:
                errors.addAll(validateCharacterChange(request.getParameters()));
                break;
            case EVENT_ALTERATION:
                errors.addAll(validateEventAlteration(request.getParameters()));
                break;
            case SETTING_MODIFICATION:
                errors.addAll(validateSettingModification(request.getParameters()));
                break;
        }

        // Profanity check
        if (containsProfanity(request)) {
            errors.add("Scenario contains inappropriate content");
        }

        // Duplicate check
        if (isDuplicate(request)) {
            errors.add("A similar scenario already exists");
        }

        return errors.isEmpty()
            ? ValidationResult.valid()
            : ValidationResult.invalid(errors);
    }

    private List<String> validateCharacterChange(Map<String, Object> params) {
        List<String> errors = new ArrayList<>();

        String character = (String) params.get("character");
        String originalProp = (String) params.get("original_property");
        String newProp = (String) params.get("new_property");

        if (character == null || character.length() <= 1) {
            errors.add("Character name must be at least 2 characters");
        }

        if (originalProp == null || originalProp.isEmpty()) {
            errors.add("Original property is required");
        }

        if (newProp == null || newProp.isEmpty()) {
            errors.add("New property is required");
        }

        if (originalProp != null && originalProp.equals(newProp)) {
            errors.add("Original and new properties must be different");
        }

        return errors;
    }

    private boolean containsProfanity(CreateScenarioRequest request) {
        String allText = request.getBaseStory() + " " +
                        request.getParameters().values().toString();
        return PROFANITY_LIST.stream()
            .anyMatch(word -> allText.toLowerCase().contains(word));
    }

    private boolean isDuplicate(CreateScenarioRequest request) {
        return scenarioRepository.existsByBaseStoryAndScenarioTypeAndParameters(
            request.getBaseStory(),
            request.getScenarioType(),
            request.getParameters()
        );
    }

    public double calculateQualityScore(Scenario scenario) {
        double score = 0.5; // Base score

        // Bonus for popular base story
        if (SUPPORTED_STORIES.contains(scenario.getBaseStory())) {
            score += 0.2;
        }

        // Bonus for complete parameters
        if (scenario.getParameters().size() >= 3) {
            score += 0.1;
        }

        // Bonus for detailed descriptions (> 20 chars per field)
        long detailedFields = scenario.getParameters().values().stream()
            .filter(v -> v.toString().length() > 20)
            .count();
        score += detailedFields * 0.1;

        return Math.min(score, 1.0); // Cap at 1.0
    }
}
```

**Controller Integration**:

```java
@PostMapping("/scenarios")
public ResponseEntity<?> createScenario(@RequestBody CreateScenarioRequest request) {
    ValidationResult validation = scenarioValidator.validateScenario(request);

    if (!validation.isValid()) {
        return ResponseEntity.badRequest()
            .body(Map.of("errors", validation.getErrors()));
    }

    Scenario scenario = scenarioService.createScenario(request);
    double qualityScore = scenarioValidator.calculateQualityScore(scenario);
    scenario.setQualityScore(qualityScore);

    return ResponseEntity.ok(scenario);
}
```

## QA Checklist

### Functional Testing

- [ ] Unsupported base story returns 400 with clear error message
- [ ] Profanity in scenario rejected with generic error (no profanity echo)
- [ ] Duplicate scenario prevented
- [ ] Valid scenario passes all validations
- [ ] Each scenario type validation enforced correctly

### Validation Rule Testing

- [ ] Character name < 2 chars rejected
- [ ] Identical original and new properties rejected
- [ ] Event outcome > 500 chars rejected
- [ ] Invalid setting_aspect rejected
- [ ] Empty required fields rejected

### Quality Score Testing

- [ ] Popular base story gets higher score (0.7+)
- [ ] Unpopular base story gets lower score (0.5)
- [ ] Detailed parameters increase score
- [ ] Score never exceeds 1.0

### Edge Cases

- [ ] Null parameters handled gracefully
- [ ] Empty JSONB parameters rejected
- [ ] Case-insensitive base story matching ("harry potter" === "Harry Potter")
- [ ] Special characters in parameters validated

### Performance

- [ ] Validation executes < 50ms
- [ ] Duplicate check uses database index (< 100ms)
- [ ] Profanity filter optimized (no regex catastrophic backtracking)

## Estimated Effort

8 hours
