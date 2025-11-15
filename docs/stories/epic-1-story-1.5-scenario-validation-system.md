# Story 1.5: Scenario Validation System

**Epic**: Epic 1 - What If Scenario Foundation  
**Priority**: P2 - Medium  
**Status**: Not Started  
**Estimated Effort**: 8 hours

## Description

Implement backend validation system to ensure scenario quality, prevent nonsensical scenarios, and validate base_story authenticity using **Gemini 2.5 Flash via FastAPI** for AI-powered validation.

## Dependencies

**Blocks**:

- Epic 3 stories (scenario discovery needs quality scenarios)

**Requires**:

- Story 1.1: Scenario Data Model & API
- Story 1.2-1.4: Scenario UI components (generate validation test cases)

## Acceptance Criteria

- [ ] `ScenarioValidator` service class with validation methods for each scenario type
- [ ] **Gemini 2.5 Flash AI validation** via FastAPI:
  - Story authenticity check (character/event/setting exists in base story)
  - Logical consistency validation (scenario makes sense in story context)
  - Creativity score (0.0-1.0 based on novelty and interest)
  - Token budget: 2,000 tokens per validation (1,500 input + 500 output)
  - Cost: ~$0.00015 per validation (Gemini API)
- [ ] **Redis cache** for validation results (5-minute TTL):
  - Cache key: `validation:{base_story}:{scenario_type}:{hash(parameters)}`
  - Reduces API costs for duplicate validation attempts
- [ ] Base story validation: minimum 2 characters, exists in predefined list of popular stories (Harry Potter, Game of Thrones, LOTR, etc.)
- [ ] CHARACTER_CHANGE validation: character name length > 1, properties non-empty and different
- [ ] EVENT_ALTERATION validation: event_name length > 3, outcomes non-empty and different, outcome length < 500 chars
- [ ] SETTING_MODIFICATION validation: setting_aspect in allowed values, settings non-empty and different
- [ ] Profanity filter: reject scenarios containing inappropriate content
- [ ] Duplicate detection: prevent identical scenarios (same base_story + parameters)
- [ ] Quality score calculation: **AI-powered** (Gemini) + heuristic combination
- [ ] **API Gateway Pattern**: Spring Boot → FastAPI → Gemini 2.5 Flash
- [ ] **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s) for Gemini API failures
- [ ] Validation errors return 400 Bad Request with specific error messages
- [ ] Unit tests for all validation rules >90% coverage

## Technical Notes

**Architecture: API Gateway Pattern (Pattern B)**

```
Frontend → Spring Boot (8080) → FastAPI (8000) → Gemini 2.5 Flash API
                                        ↓
                                   Redis Cache (5-min TTL)
```

**Spring Boot ScenarioValidator Service**:

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

    @Autowired
    private WebClient fastApiClient;  // Pattern B: Spring Boot → FastAPI

    @Value("${fastapi.base-url}")
    private String fastApiUrl;  // http://ai-service:8000

    public ValidationResult validateScenario(CreateScenarioRequest request) {
        List<String> errors = new ArrayList<>();

        // 1. Basic validation (fast, no AI needed)
        if (!SUPPORTED_STORIES.contains(request.getBaseStory())) {
            errors.add("Base story '" + request.getBaseStory() +
                      "' is not currently supported. Supported: " +
                      String.join(", ", SUPPORTED_STORIES));
        }

        // 2. Type-specific validation (fast)
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

        // 3. Profanity check (fast)
        if (containsProfanity(request)) {
            errors.add("Scenario contains inappropriate content");
        }

        // 4. Duplicate check (fast)
        if (isDuplicate(request)) {
            errors.add("A similar scenario already exists");
        }

        // If basic validation fails, skip AI validation (save API costs)
        if (!errors.isEmpty()) {
            return ValidationResult.invalid(errors);
        }

        // 5. AI validation via FastAPI (Gemini 2.5 Flash)
        try {
            AIValidationResponse aiValidation = callFastApiValidation(request);

            if (!aiValidation.isValid()) {
                errors.addAll(aiValidation.getErrors());
            }

            return errors.isEmpty()
                ? ValidationResult.valid(aiValidation)
                : ValidationResult.invalid(errors);
        } catch (Exception e) {
            // AI validation failure - log but don't block (fallback to basic validation)
            log.error("AI validation failed: {}", e.getMessage());
            return ValidationResult.valid(); // Graceful degradation
        }
    }

    private AIValidationResponse callFastApiValidation(CreateScenarioRequest request) {
        // Pattern B: Spring Boot proxies to FastAPI (internal network)
        return fastApiClient.post()
            .uri("/api/validate-scenario")
            .bodyValue(Map.of(
                "base_story", request.getBaseStory(),
                "scenario_type", request.getScenarioType().toString(),
                "parameters", request.getParameters()
            ))
            .retrieve()
            .bodyToMono(AIValidationResponse.class)
            .timeout(Duration.ofSeconds(10))  // Gemini API can be slow
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))  // 3 retries: 1s, 2s, 4s
            .block();
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

    public double calculateQualityScore(Scenario scenario, AIValidationResponse aiValidation) {
        // Combine heuristic score (0.5 weight) + AI creativity score (0.5 weight)
        double heuristicScore = calculateHeuristicScore(scenario);
        double aiScore = aiValidation != null ? aiValidation.getCreativityScore() : 0.5;

        return (heuristicScore * 0.5) + (aiScore * 0.5);
    }

    private double calculateHeuristicScore(Scenario scenario) {
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

**FastAPI AI Validation Endpoint** (ai-backend/app/api/validation.py):

````python
from fastapi import APIRouter, HTTPException
import google.generativeai as genai
import redis.asyncio as redis
import hashlib
import json
from tenacity import retry, stop_after_attempt, wait_exponential

router = APIRouter()

# Redis cache client (5-minute TTL)
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))

# Gemini 2.5 Flash configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/api/validate-scenario")
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4)  # 1s, 2s, 4s
)
async def validate_scenario(request: dict):
    """
    AI-powered scenario validation using Gemini 2.5 Flash

    Token budget: 2,000 tokens (1,500 input + 500 output)
    Cost: ~$0.00015 per validation
    Cache: 5-minute TTL in Redis
    """
    base_story = request['base_story']
    scenario_type = request['scenario_type']
    parameters = request['parameters']

    # Generate cache key
    cache_key = f"validation:{base_story}:{scenario_type}:{_hash_params(parameters)}"

    # Check Redis cache (5-minute TTL)
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Build validation prompt for Gemini
    prompt = _build_validation_prompt(base_story, scenario_type, parameters)

    try:
        # Call Gemini 2.5 Flash API
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = await model.generate_content_async(
            prompt,
            generation_config={
                'temperature': 0.2,  # Low temperature for consistent validation
                'max_output_tokens': 500,
                'top_p': 0.95
            }
        )

        # Parse Gemini response
        result = _parse_validation_response(response.text)

        # Cache result in Redis (5-minute TTL = 300 seconds)
        await redis_client.setex(cache_key, 300, json.dumps(result))

        return result

    except Exception as e:
        logger.error(f"Gemini API validation error: {e}")
        raise HTTPException(status_code=500, detail="AI validation failed")

def _build_validation_prompt(base_story: str, scenario_type: str, parameters: dict) -> str:
    """Build Gemini validation prompt (optimized for 1,500 input tokens)"""

    if scenario_type == "CHARACTER_CHANGE":
        character = parameters.get('character')
        original_prop = parameters.get('original_property')
        new_prop = parameters.get('new_property')

        return f"""
Validate this "What If" scenario for {base_story}:

Scenario Type: Character Property Change
Character: {character}
Original Property: {original_prop}
New Property: {new_prop}

Validation Tasks:
1. Does this character exist in {base_story}? (Yes/No)
2. Is the original property accurate for this character? (Yes/No)
3. Is the scenario change logically consistent with the story world? (Yes/No)
4. Creativity score (0.0-1.0): How interesting/novel is this change?

Respond in JSON:
{{
  "is_valid": true/false,
  "errors": ["error message if invalid"],
  "character_exists": true/false,
  "property_accurate": true/false,
  "logically_consistent": true/false,
  "creativity_score": 0.0-1.0,
  "reasoning": "Brief explanation"
}}
"""

    elif scenario_type == "EVENT_ALTERATION":
        event_name = parameters.get('event_name')
        original_outcome = parameters.get('original_outcome')
        new_outcome = parameters.get('new_outcome')

        return f"""
Validate this "What If" scenario for {base_story}:

Scenario Type: Event Alteration
Event: {event_name}
Original Outcome: {original_outcome}
New Outcome: {new_outcome}

Validation Tasks:
1. Does this event exist in {base_story}? (Yes/No)
2. Is the original outcome accurate? (Yes/No)
3. Is the new outcome plausible in the story world? (Yes/No)
4. Creativity score (0.0-1.0): How interesting is this alternate outcome?

Respond in JSON format (same as above).
"""

    # Similar prompts for SETTING_MODIFICATION...

def _parse_validation_response(response_text: str) -> dict:
    """Parse Gemini JSON response"""
    try:
        # Extract JSON from markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        data = json.loads(response_text.strip())

        return {
            "is_valid": data.get("is_valid", True),
            "errors": data.get("errors", []),
            "creativity_score": data.get("creativity_score", 0.5),
            "reasoning": data.get("reasoning", "")
        }
    except Exception as e:
        logger.error(f"Failed to parse Gemini response: {e}")
        # Fallback to valid (graceful degradation)
        return {
            "is_valid": True,
            "errors": [],
            "creativity_score": 0.5,
            "reasoning": "AI parsing failed, using fallback"
        }

def _hash_params(parameters: dict) -> str:
    """Generate hash for cache key"""
    param_str = json.dumps(parameters, sort_keys=True)
    return hashlib.md5(param_str.encode()).hexdigest()
````

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

    // Calculate quality score (heuristic + AI creativity)
    double qualityScore = scenarioValidator.calculateQualityScore(
        scenario,
        validation.getAiValidation()  // Contains creativity_score from Gemini
    );
    scenario.setQualityScore(qualityScore);

    return ResponseEntity.ok(scenario);
}
```

**Cost Analysis**:

- **Token budget per validation**: ~2,000 tokens (1,500 input + 500 output)
- **Cost per validation**: ~$0.00015 (Gemini 2.5 Flash pricing)
- **Monthly cost estimate** (1,000 users, 10 scenarios each):
  - Total validations: 10,000
  - Without cache: $1.50/month
  - With 80% cache hit rate: $0.30/month
- **Cache effectiveness**: 5-minute TTL catches duplicate attempts, A/B testing variations

## QA Checklist

### Functional Testing

- [ ] Unsupported base story returns 400 with clear error message
- [ ] Profanity in scenario rejected with generic error (no profanity echo)
- [ ] Duplicate scenario prevented
- [ ] Valid scenario passes all validations
- [ ] Each scenario type validation enforced correctly
- [ ] **Gemini AI validation** returns accurate character/event existence checks
- [ ] **Creativity score** from Gemini is 0.0-1.0 range
- [ ] **Redis cache** prevents duplicate Gemini API calls (5-minute window)
- [ ] **Retry logic** recovers from transient Gemini API failures (3 attempts)
- [ ] **Graceful degradation**: If Gemini API fails after retries, basic validation still works

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
- [ ] **AI creativity score** properly combined with heuristic score (50/50 weight)
- [ ] **Gemini creativity score** reflects scenario novelty (tested on 10+ sample scenarios)

### Edge Cases

- [ ] Null parameters handled gracefully
- [ ] Empty JSONB parameters rejected
- [ ] Case-insensitive base story matching ("harry potter" === "Harry Potter")
- [ ] Special characters in parameters validated

### Performance

- [ ] **Basic validation** (no AI) executes < 50ms
- [ ] **AI validation** (Gemini API call) executes < 3 seconds
- [ ] **Cached AI validation** (Redis hit) executes < 100ms
- [ ] Duplicate check uses database index (< 100ms)
- [ ] Profanity filter optimized (no regex catastrophic backtracking)
- [ ] **Pattern B latency**: Frontend → Spring Boot → FastAPI → Gemini < 5 seconds total
- [ ] **Cache hit rate** > 70% during peak usage (5-minute window effective)

## Estimated Effort

8 hours
