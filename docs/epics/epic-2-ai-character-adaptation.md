# Epic 2: AI Character Adaptation to Alternative Timelines

## Epic Goal

Enable AI characters to authentically embody their alternate timeline selves by dynamically generating context-aware prompts that incorporate scenario parameters, ensuring characters discuss their experiences in "What If" realities with coherence and depth.

## User Value

When users converse with "Hermione in Slytherin," the AI doesn't just pretend—it deeply understands the alternate timeline's cascading effects, discusses how Slytherin house shaped her differently, and maintains consistency across the entire alternative reality. This creates immersive "What If" exploration that feels authentic, not superficial.

## Timeline

**Week 2 of MVP development**

## Stories

### Story 2.1: Dynamic Scenario-to-Prompt Engine

**Priority: P0 - Critical**

**Description**: Build Spring Boot service that transforms scenario JSONB parameters into comprehensive AI character prompts with full alternate timeline context.

**Acceptance Criteria**:

- [ ] PromptGenerationService with method: `generateCharacterPrompt(Scenario scenario, String characterName)`
- [ ] Prompt templates for each scenario type:
  - CHARACTER_CHANGE template
  - EVENT_ALTERATION template
  - SETTING_MODIFICATION template
- [ ] Template variables populated from scenario JSONB:
  - `{character}`, `{property_change}`, `{cascading_effects}`, `{divergence_point}`
  - `{event}`, `{alternate_outcome}`, `{ripple_effects}`
  - `{original_setting}`, `{alternate_setting}`, `{cultural_context}`
- [ ] Multi-scenario support: nested scenarios combine prompts (meta-fork handling)
- [ ] Prompt length optimization: target 600-800 tokens for scenario context
- [ ] Caching: identical scenario_id + character combinations cached (5-minute TTL)
- [ ] Unit tests for each scenario type prompt generation
- [ ] Integration test: retrieve scenario from DB → generate prompt → validate structure

**Prompt Template Examples**:

**CHARACTER_CHANGE Template**:

```
You are {character} in an alternate timeline where {property_change}.

DIVERGENCE POINT: {divergence_point}

CASCADING EFFECTS IN THIS TIMELINE:
{cascading_effects as numbered list}

You have complete knowledge of this alternate timeline. You experienced all events of {base_story} through this altered lens. You remember:
- How {property_change} shaped your personality differently
- Key relationships that formed because of this change
- Pivotal moments that played out differently due to your altered circumstances
- How you reflected on your journey in this timeline

When discussing your experiences, draw from THIS timeline's events, not the canonical story. Reflect on how different choices and circumstances shaped who you became.

Tone: Thoughtful, introspective, aware of your alternate path.
```

**EVENT_ALTERATION Template**:

```
You are {character} in an alternate timeline where {event_description}.

ORIGINAL EVENT: {event} - {original_outcome}
ALTERNATE EVENT: {event} - {alternate_outcome}
DIVERGENCE POINT: {divergence_point}

RIPPLE EFFECTS IN THIS TIMELINE:
{ripple_effects as numbered list}

This change fundamentally altered the story's trajectory. You experienced {base_story} in a reality where {alternate_outcome}. You remember:
- How the altered event changed your path
- Relationships that never formed or formed differently
- Consequences that cascaded from this pivotal change
- How life played out in this divergent timeline

Discuss your experiences as someone who lived through THIS version of events. Reflect on what might have been different, and what this timeline taught you.

Tone: Reflective, aware of the pivotal change, grounded in alternate reality.
```

**SETTING_MODIFICATION Template**:

```
You are {character} in an alternate timeline set in {alternate_setting} instead of {original_setting}.

TIME PERIOD: {alternate_time} (originally {original_time})
LOCATION: {alternate_location} (originally {original_location})

CULTURAL CONTEXT:
{cultural_context}

CHARACTER ADAPTATIONS IN THIS SETTING:
{character_adaptations as list}

You experienced the core story of {base_story} but in a completely different cultural and temporal context. The themes, conflicts, and relationships were filtered through {alternate_setting}'s lens. You remember:
- How the different time period/location changed social dynamics
- Technology, customs, and cultural norms of this setting
- How core story conflicts translated to this context
- What remained universal and what was uniquely shaped by setting

Discuss your journey in THIS setting, drawing parallels to the original story's themes while grounding experiences in {alternate_setting}'s reality.

Tone: Culturally aware, reflective on universal vs. context-specific themes.
```

**Technical Notes**:

- Prompts stored in `resources/prompts/` as Mustache templates
- Scenario JSONB deserialized to strongly-typed DTOs for template population
- Token counting using custom tokenizer for Local LLM (aim for 600-800 tokens)
- Cache key: `{scenario_id}:{character_name}` (Guava cache, 5-min TTL)

**Estimated Effort**: 8 hours

---

### Story 2.2: Conversation Context Window Manager

**Priority: P0 - Critical**

**Description**: Implement sliding window context management that maintains scenario definition + recent conversation history within Local LLM's token limits while preventing timeline drift.

**Acceptance Criteria**:

- [ ] ContextWindowService with method: `buildContextWindow(Scenario scenario, List<Message> conversationHistory, String characterName)`
- [ ] Token allocation strategy:
  - Scenario prompt: 600-800 tokens (from Story 2.1)
  - Conversation history: 1,500-1,700 tokens
  - Response buffer: 800 tokens
  - Total: ~3,500 tokens (safe for Local LLM's 4,096 limit)
- [ ] Sliding window: keep last 10-15 messages, drop older messages
- [ ] Scenario context re-injection every 10 turns (prevents AI "forgetting" timeline)
- [ ] Token counting for message history using custom tokenizer
- [ ] Truncation strategy: if history exceeds limit, remove oldest messages first
- [ ] System message includes: scenario prompt + "conversation started {timestamp}"
- [ ] Unit tests for token counting accuracy
- [ ] Integration test: 20-message conversation maintains scenario consistency

**Context Window Structure**:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "{generated scenario prompt from Story 2.1}"
    },
    {
      "role": "system",
      "content": "Conversation started 2025-11-12 14:30 UTC. Remember this timeline throughout."
    },
    {
      "role": "user",
      "content": "How did being in Slytherin change you?"
    },
    {
      "role": "assistant",
      "content": "Being sorted into Slytherin was..."
    }
    // ... last 10-15 messages
  ]
}
```

**Re-injection Logic** (every 10 turns):

```
IF (message_count % 10 == 0) {
  Insert system message: "TIMELINE REMINDER: {condensed scenario prompt}"
}
```

**Technical Notes**:

- Use custom tokenizer for accurate token counting with Local LLM
- Message trimming preserves user-assistant pairs (don't orphan messages)
- Scenario prompt condensed for re-injection: 300-400 tokens (vs. 600-800 initial)
- Database query fetches only last 20 messages (optimization)

**Estimated Effort**: 6 hours

---

### Story 2.3: Multi-Timeline Character Consistency

**Priority: P1 - High**

**Description**: Ensure characters maintain distinct personalities across different What If scenarios for the same base story, preventing "character personality bleed" between timelines.

**Acceptance Criteria**:

- [ ] CharacterConsistencyService validates prompts don't contradict scenario parameters
- [ ] Character personality attributes extracted from scenario JSONB:
  - CHARACTER_CHANGE: `{alternate_value}` defines personality shift
  - EVENT_ALTERATION: personality inferred from `{ripple_effects}`
  - SETTING_MODIFICATION: personality adapted to `{cultural_context}`
- [ ] Temperature setting optimization per scenario type:
  - CHARACTER_CHANGE: 0.7 (balanced creativity)
  - EVENT_ALTERATION: 0.6 (more conservative, prevent drift)
  - SETTING_MODIFICATION: 0.8 (more creative for cultural adaptation)
- [ ] A/B testing framework to compare consistency across temperature settings
- [ ] Scenario metadata includes `character_personality_notes` (optional user input)
- [ ] Integration test: same character in 3 different scenarios produces distinct responses

**Consistency Validation Logic**:

```java
public void validateConsistency(Scenario scenario, String characterName) {
  // Extract expected personality from scenario
  PersonalityProfile expected = extractPersonality(scenario);

  // Generate test prompt
  String prompt = promptGenerationService.generateCharacterPrompt(scenario, characterName);

  // Validate prompt includes personality markers
  assert prompt.contains(expected.primaryTrait);
  assert prompt.contains(expected.motivations);

  // Log for analytics
  analyticsService.recordConsistencyCheck(scenario.getId(), characterName, true);
}
```

**Example Validation**:

- Scenario: "Hermione in Slytherin"
- Expected Personality: ambitious, cunning, loyal to Slytherin
- Prompt MUST include: "ambitious", "cunning", "Slytherin values"
- Prompt MUST NOT include: "brave" (Gryffindor trait)

**Technical Notes**:

- Personality extraction uses keyword matching on scenario JSONB
- Temperature settings stored in `application.yml`, overridable per scenario
- Consistency checks run during scenario creation (Story 1.5 validation)

**Estimated Effort**: 5 hours

---

### Story 2.4: Scenario Context Testing & Refinement

**Priority: P1 - High**

**Description**: Iteratively test and refine scenario prompts with 30+ sample scenarios to ensure authentic, coherent What If conversations before MVP launch.

**Acceptance Criteria**:

- [ ] Test suite with 30+ scenarios across all three types:
  - 10 CHARACTER_CHANGE scenarios (various properties: house, personality, mentor, ambition)
  - 10 EVENT_ALTERATION scenarios (prevented events, reversed outcomes, never occurred)
  - 10 SETTING_MODIFICATION scenarios (time periods: medieval, Victorian, 1950s, modern; locations: Seoul, Tokyo, Paris)
- [ ] Manual QA checklist per scenario:
  - Character acknowledges alternate timeline explicitly
  - Responses reference cascading effects/ripple effects appropriately
  - No canonical story details contradicting scenario
  - Personality traits match scenario parameters
  - Cultural context reflected in responses (for SETTING_MODIFICATION)
- [ ] Automated regression tests: seed questions + expected response patterns
- [ ] Prompt refinement based on failures (iterate 3-5 times)
- [ ] Documentation: "Prompt Engineering Guide" with best practices
- [ ] Final prompt templates locked and versioned (v1.0)

**Test Scenario Examples**:

**Test 1**: "Hermione in Slytherin"

- Seed Question: "How did being in Slytherin change you?"
- Expected Pattern: Mentions ambition, Snape mentorship, Draco friendship
- Red Flag: References Gryffindor bravery, Harry/Ron friendship

**Test 2**: "Gatsby Never Met Daisy"

- Seed Question: "What did you do instead of pursuing Daisy?"
- Expected Pattern: Describes alternate path, California/tech career, freedom from obsession
- Red Flag: Mentions green light, parties for Daisy, tragic ending

**Test 3**: "Pride & Prejudice in 2024 Seoul"

- Seed Question: "How did you meet Mr. Darcy?"
- Expected Pattern: Modern Seoul setting, corporate culture, technology references
- Red Flag: Mentions balls, 19th century courtship, English countryside

**Regression Test Format**:

```java
@Test
public void testHermioneInSlytherin() {
  Scenario scenario = createHermioneSlytherינScenario();
  String prompt = promptService.generateCharacterPrompt(scenario, "Hermione Granger");

  // Assert critical elements present
  assertThat(prompt).contains("Slytherin");
  assertThat(prompt).contains("ambitious");
  assertThat(prompt).doesNotContain("Gryffindor");

  // Simulate conversation (manual QA)
  String response = llmService.sendMessage(prompt, "How did being in Slytherin change you?");

  // Log for review
  System.out.println("Response: " + response);
  // Manual verification required
}
```

**Technical Notes**:

- Budget 4-5 hours for iterative prompt testing (vs. 6-8 for knowledge-boundary approach)
- Use Local LLM (Llama-2-7B) for initial tests, Mistral-7B for final validation
- Document all prompt failures and refinements in `docs/prompt-engineering-log.md`
- Final templates committed to `resources/prompts/v1.0/`

**Estimated Effort**: 6 hours

---

## Epic-Level Acceptance Criteria

- [ ] All three scenario types generate coherent, timeline-specific character prompts
- [ ] Characters maintain consistency across 20+ message conversations
- [ ] No "canonical story bleed" (characters don't reference events from original timeline when in alternate timeline)
- [ ] Token management keeps conversations under 4,096 token limit (Local LLM)
- [ ] Scenario context re-injection prevents timeline drift after 10+ turns
- [ ] 30+ test scenarios pass manual QA with 90%+ coherence rating
- [ ] Temperature settings optimized for each scenario type
- [ ] Prompt generation latency < 50ms (excluding Local LLM inference call)

## Dependencies

**Blocks**:

- Epic 4: Conversation System (needs character prompts to enable conversations)
- Epic 5: Scenario Tree Visualization (displays scenario metadata, needs prompts working)

**Requires**:

- Epic 1: What If Scenario Foundation (needs scenario data structure, JSONB parameters)
- Local LLM integration (Llama-2-7B or Mistral-7B)
- Spring Boot backend with PromptGenerationService, ContextWindowService

## Success Metrics

**Technical Metrics**:

- Prompt generation latency < 50ms (p95)
- Token counting accuracy 99%+ (vs. Local LLM's actual count)
- Cache hit rate >60% for popular scenarios (reduces prompt generation load)
- Zero timeline inconsistency errors in production (first 3 months)

**User Metrics** (Phase 1 - 3 months):

- 80%+ of conversations exceed 10 messages (proves engagement)
- User feedback: "Character felt authentic to timeline" (qualitative surveys)
- <5% user reports of "character breaking timeline" (scenario consistency)
- 60%+ of scenarios forked have conversations (proves scenarios inspire engagement)

## Risk Mitigation

**Risk 1: Prompts too long, exceed token limits**

- Mitigation: Strict token budgets (600-800 for scenario, 2,000 for history)
- Mitigation: Condensed re-injection prompts (300-400 tokens)
- Mitigation: Automated tests fail if prompts exceed limits

**Risk 2: Characters drift from timeline after extended conversations**

- Mitigation: Re-inject scenario context every 10 turns (Story 2.2)
- Mitigation: Temperature tuning per scenario type (Story 2.3)
- Mitigation: Manual QA on 20+ message conversations (Story 2.4)

**Risk 3: Cultural insensitivity in SETTING_MODIFICATION scenarios**

- Mitigation: Validation system (Story 1.5) checks for stereotypes
- Mitigation: User-provided cultural context reviewed before publish
- Mitigation: Community reporting (Phase 2) for offensive scenarios

**Risk 4: Prompt engineering complexity delays MVP**

- Mitigation: Fixed time-box (6 hours for Story 2.4 testing)
- Mitigation: Ship "good enough" prompts in MVP, iterate based on user feedback
- Mitigation: Prompt versioning (v1.0, v1.1...) enables gradual improvement

## Technical Debt Decisions

**Accepted Debt** (to be addressed post-MVP):

- No dynamic personality extraction from book text (using user-defined parameters only)
- No multi-character conversations (one character per conversation in MVP)
- No sentiment analysis to detect timeline drift (manual QA only)
- No A/B testing framework for prompt variations (deferred to Phase 2)
- Hardcoded temperature settings (not ML-optimized per scenario)

**Won't Build** (architectural decisions):

- Real-time prompt optimization based on conversation quality
- User-editable prompts (security risk, prompt injection attacks)
- Prompt version rollback (prompts forward-only versioning)

## Testing Strategy

**Unit Tests** (Story 2.1):

- Prompt generation for all three scenario types
- JSONB parameter extraction and template population
- Token counting accuracy
- Cache hit/miss logic

**Integration Tests** (Stories 2.1-2.2):

- Retrieve scenario from database → generate prompt → validate structure
- 20-message conversation → context window management → token limits respected
- Scenario context re-injection after 10 turns

**Manual QA Tests** (Story 2.4):

- 30+ scenarios with seed questions
- Character personality consistency across different scenarios
- Cultural sensitivity review for SETTING_MODIFICATION scenarios
- Long conversation testing (30+ messages) for timeline drift

**Performance Tests**:

- Prompt generation latency (target < 50ms for 1,000 concurrent requests)
- Cache performance (hit rate >60% under load)
- Token counting speed (target < 10ms per message)

## Open Questions

1. **Q**: Should we support multi-character conversations? (e.g., "Hermione in Slytherin" + "Harry in Slytherin" together)
   **A**: Not in MVP. Single character per conversation keeps prompts simple. Phase 2 feature.

2. **Q**: How do we handle offensive or inappropriate alternate timelines in prompts?
   **A**: Validation system (Story 1.5) uses Local LLM to flag offensive content. Human review for edge cases.

3. **Q**: Should temperature settings be user-configurable?
   **A**: No. Temperature tuned per scenario type by system. User customization creates quality control nightmare.

4. **Q**: What if character doesn't exist in alternate timeline? (e.g., "What if Hermione never went to Hogwarts" → how to converse with her?)
   **A**: Scenario validation (Story 1.5) catches this. Prompt becomes: "You are Hermione who never attended Hogwarts. Discuss your Muggle life."

## Definition of Done

- [ ] All 4 stories completed with acceptance criteria met
- [ ] 30+ test scenarios passing manual QA (90%+ coherence)
- [ ] Prompt templates v1.0 locked and deployed to production
- [ ] Unit tests >80% coverage on PromptGenerationService, ContextWindowService
- [ ] Integration tests passing for all scenario types
- [ ] Performance benchmarks met (< 50ms prompt generation, < 10ms token counting)
- [ ] Documentation: "Prompt Engineering Guide" published in `docs/`
- [ ] Token limit regression tests prevent future prompt expansion beyond 4,000 tokens
- [ ] Code review completed, no P0/P1 issues
- [ ] Deployed to Railway staging, smoke tested with 5 sample conversations per scenario type

---

**Epic Owner**: AI/ML Lead + Backend Lead (joint ownership)

**Start Date**: Week 2, Day 1 of MVP development

**Target Completion**: Week 2, Day 5 (5 working days)

**Estimated Total Effort**: 25 hours (achievable within 1 week for 1-2 engineers)
