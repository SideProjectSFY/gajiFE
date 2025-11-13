# Story 2.1: Dynamic Scenario-to-Prompt Engine

**Epic**: Epic 2 - AI Adaptation Layer  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 12 hours

## Description

Create the FastAPI service that converts scenario JSONB parameters into Local LLM system prompts, maintaining character consistency across multiple scenarios.

## Dependencies

**Blocks**:

- Story 2.2: Conversation Context Window Manager (needs prompts)
- Story 2.3: Multi-Timeline Character Consistency (builds on this)
- Epic 4 stories (conversation messages need scenario-adapted prompts)

**Requires**:

- Story 0.2: FastAPI AI Service Setup
- Story 1.1: Scenario Data Model (reads scenario parameters)

## Acceptance Criteria

- [ ] `/api/ai/adapt-prompt` endpoint accepts scenario_id and base_prompt
- [ ] Scenario type-specific templates: CHARACTER_CHANGE, EVENT_ALTERATION, SETTING_MODIFICATION
- [ ] JSONB parameter interpolation into prompt templates
- [ ] Character consistency layer preserves core traits across scenarios (e.g., Hermione's intelligence maintained)
- [ ] Negation instruction for altered properties (e.g., "Hermione is NOT in Gryffindor")
- [ ] Meta-scenario handling for forked scenarios (combines parent + child parameters)
- [ ] Prompt caching with Redis (TTL 1 hour) for identical scenario_id + base_prompt
- [ ] Response time < 50ms (cached), < 200ms (uncached)
- [ ] Unit tests >80% coverage

## Technical Notes

**Example Transformation**:

```python
# Input
scenario = {
  "type": "CHARACTER_CHANGE",
  "parameters": {
    "character": "Hermione",
    "original_property": "Gryffindor",
    "new_property": "Slytherin"
  }
}
base_prompt = "You are Hermione from Harry Potter..."

# Output
adapted_prompt = """
You are Hermione from Harry Potter.
KEY ALTERATION: Hermione is in Slytherin house, NOT Gryffindor.
PRESERVE: Her intelligence, love of learning, and problem-solving skills remain constant.
ADAPT: Her social circle includes Draco, Pansy instead of Harry, Ron.
"""
```

## QA Checklist

### Functional Testing

- [ ] All three scenario types generate correct prompts
- [ ] Character traits preserved across scenarios
- [ ] Meta-scenario combines parent + child parameters correctly
- [ ] Invalid scenario_id returns 404 error
- [ ] Prompt caching reduces response time >75%

### Prompt Quality

- [ ] Generated prompts produce logically consistent AI responses
- [ ] Negation instructions prevent AI hallucinations (tested manually with Local LLM)
- [ ] Character personality maintains consistency (test with 10+ conversations per scenario)

### Performance

- [ ] Cached requests < 50ms
- [ ] Uncached requests < 200ms
- [ ] Redis cache hit rate >80% in production simulation

### Security

- [ ] Scenario JSONB validated before prompt interpolation
- [ ] No prompt injection vulnerabilities
- [ ] Rate limiting on prompt generation (100 requests/min per user)

## Estimated Effort

12 hours
