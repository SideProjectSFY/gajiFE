# Story 0.8: LLM Character Extraction & Relationship Mapping

**Epic**: Epic 0 - Project Setup & Infrastructure  
**Priority**: P0 - Critical  
**Estimated Effort**: 10 hours

## Status

Draft

## Story

As a **platform administrator**,  
I want **characters to be automatically extracted from novel passages using LLM analysis**,  
So that **users can create What If scenarios with accurate character metadata and relationship graphs**.

## Context

This story implements the core LLM analysis pipeline for extracting character metadata from novel passages. It creates the `characters`, `character_appearances`, and `llm_analysis_metadata` records that power scenario creation and character-based conversations.

**Character Extraction Process**:

```
Novel Passages → LLM Character Extraction → Character Entity Creation → Relationship Mapping
      ↓                    ↓                         ↓                        ↓
passage_type      personality_traits           characters              relationships JSONB
   detection        aliases extraction        table creation          (friend, enemy, etc.)
```

**Why LLM Analysis**:

- Manual character cataloging is time-intensive and error-prone
- LLMs excel at understanding narrative context, character traits, and relationships
- Automated extraction enables rapid onboarding of new books
- Relationship graphs require semantic understanding (not regex-parseable)

## Acceptance Criteria

### AC1: Passage Type Classification

- [ ] LLM classifies each passage into types:
  - `narrative` - third-person narration
  - `dialogue` - character speech-heavy
  - `description` - scene/setting descriptions
  - `action` - action sequences
  - `internal_thought` - character introspection
  - `mixed` - multiple types combined
- [ ] `novel_passages.passage_type` field updated for all passages
- [ ] Batch processing: 50 passages per LLM request (reduce API calls)
- [ ] Temperature: 0.2 (low for consistent classification)

### AC2: Character Extraction from Passages

- [ ] LLM identifies all characters mentioned in novel
- [ ] For each character, extract:
  - `name` - primary name (e.g., "Hermione Granger")
  - `aliases` - JSONB array (e.g., ["Hermione", "Granger", "Ms. Granger"])
  - `role` - protagonist, antagonist, supporting, minor
  - `description` - physical and personality description
  - `first_appearance_chapter_id` - chapter where first mentioned
  - `personality_traits` - JSONB array (e.g., ["brave", "intelligent", "loyal"])
- [ ] Character deduplication: "Harry" and "Harry Potter" recognized as same character
- [ ] UNIQUE constraint enforced: (novel_id, name)

### AC3: Character Appearance Tracking

- [ ] For each passage, create `character_appearances` records linking characters to passages
- [ ] Track mention context:
  - `mention_type` - direct_speech, action, description, mentioned, thought, internal_monologue
  - `mention_count` - number of times mentioned in passage
  - `context_snippet` - brief excerpt showing mention (max 200 chars)
  - `sentiment` - positive, negative, neutral, mixed (LLM-detected)
  - `emotional_state` - LLM-detected emotion (e.g., "happy", "angry", "sad")
- [ ] UNIQUE constraint: (passage_id, character_id, mention_type)

### AC4: Character Relationship Mapping

- [ ] LLM extracts relationship graph from novel context
- [ ] Relationships stored in `characters.relationships` JSONB:
  ```json
  [
    {
      "character_id": "uuid-of-ron-weasley",
      "character_name": "Ron Weasley",
      "type": "friend",
      "description": "Best friend since first year at Hogwarts",
      "strength": 0.95,
      "since_chapter": 1
    },
    {
      "character_id": "uuid-of-draco-malfoy",
      "character_name": "Draco Malfoy",
      "type": "rival",
      "description": "Slytherin rival, frequent antagonist",
      "strength": 0.8,
      "since_chapter": 2
    }
  ]
  ```
- [ ] Relationship types: friend, enemy, family, romantic, mentor, rival, neutral
- [ ] Bidirectional relationships: If Harry → Ron (friend), then Ron → Harry (friend)
- [ ] Relationship strength: 0.0 (weak) to 1.0 (strong), LLM-assessed

### AC5: LLM Analysis Metadata Tracking

- [ ] Every LLM analysis job creates `llm_analysis_metadata` record:
  - `analysis_type` = 'character_extraction'
  - `llm_model` = model used (e.g., "llama-2-7b-chat")
  - `llm_temperature` = temperature setting
  - `tokens_used` = total tokens consumed
  - `cost_usd` = calculated cost (local compute)
  - `status` = pending → processing → completed | failed
  - `started_at`, `completed_at` timestamps
  - `error_message` if failed
- [ ] Cost calculation: track input/output tokens separately
- [ ] Dashboard shows total analysis costs by type and novel

### AC6: Batch Processing & Job Management

- [ ] Character extraction runs asynchronously via job queue
- [ ] Progress tracking: GET /api/v1/admin/novels/{id}/analysis/status
  ```json
  {
    "novel_id": "uuid",
    "analysis_type": "character_extraction",
    "status": "processing",
    "progress": {
      "total_passages": 450,
      "processed_passages": 120,
      "percentage": 26.7
    },
    "estimated_completion": "2025-01-13T14:30:00Z"
  }
  ```
- [ ] Retry logic: 3 attempts on LLM API failures with exponential backoff
- [ ] Rate limiting: max 50 requests/minute to Local LLM (avoid overload)
- [ ] Idempotency: Re-running extraction updates existing character records

## Technical Notes

### LLM Prompt Engineering

**Character Extraction Prompt**:

```python
CHARACTER_EXTRACTION_PROMPT = """
Analyze the following novel passages and extract ALL characters mentioned.

Novel: {novel_title} by {author}
Passages (batch {batch_num}):

{passages_text}

For each character, provide:
1. Name (primary full name)
2. Aliases (alternative names, nicknames, titles)
3. Role (protagonist, antagonist, supporting, minor)
4. Physical description (appearance details)
5. Personality traits (adjectives describing character)
6. First appearance passage number

Return as JSON array:
[
  {{
    "name": "Hermione Granger",
    "aliases": ["Hermione", "Granger", "Ms. Granger"],
    "role": "protagonist",
    "description": "Bushy brown hair, intelligent, determined",
    "personality_traits": ["intelligent", "brave", "loyal", "perfectionist"],
    "first_appearance_passage": 3
  }},
  ...
]

IMPORTANT:
- Merge variations of the same character (e.g., "Harry" and "Harry Potter")
- Only include characters with speaking roles or significant mentions
- Distinguish between similar names (e.g., "Tom" vs "Tom Riddle")
"""
```

**Relationship Extraction Prompt**:

```python
RELATIONSHIP_EXTRACTION_PROMPT = """
Analyze character relationships in: {novel_title}

Characters identified: {character_names}

For each character, identify their relationships with other characters.

Return as JSON:
{{
  "Hermione Granger": [
    {{
      "character": "Harry Potter",
      "type": "friend",
      "description": "Close friend, fought alongside in battles",
      "strength": 0.95
    }},
    {{
      "character": "Ron Weasley",
      "type": "romantic",
      "description": "Eventually becomes romantic partner",
      "strength": 0.90
    }}
  ],
  ...
}}

Relationship types: friend, enemy, family, romantic, mentor, rival, neutral
Strength: 0.0 (weak/distant) to 1.0 (very strong/intimate)
"""
```

### Implementation (FastAPI - Python)

```python
from llm_client import LocalLLMClient
from typing import List, Dict
import json

class CharacterExtractionService:

    def __init__(self, llm_client: LocalLLMClient):
        self.client = llm_client
        self.model = "llama-2-7b-chat"  # Local LLM model
        self.temperature = 0.2  # Low for consistency

    async def extract_characters_from_novel(self, novel_id: str) -> Dict:
        """Main entry point for character extraction pipeline"""

        # 1. Create analysis metadata record
        analysis = await self.analysis_repo.create({
            'novel_id': novel_id,
            'analysis_type': 'character_extraction',
            'llm_model': self.model,
            'llm_temperature': self.temperature,
            'status': 'processing',
            'started_at': datetime.utcnow()
        })

        try:
            # 2. Get all passages for novel
            passages = await self.passage_repo.find_by_novel(novel_id)

            # 3. Batch process passages (50 at a time)
            all_characters = []
            total_tokens = 0

            for batch in self._chunk_passages(passages, batch_size=50):
                characters, tokens = await self._extract_character_batch(batch)
                all_characters.extend(characters)
                total_tokens += tokens

                # Update progress
                progress = len(all_characters) / len(passages) * 100
                await self.analysis_repo.update_progress(analysis.id, progress)

            # 4. Deduplicate characters
            unique_characters = self._deduplicate_characters(all_characters)

            # 5. Save to database
            character_ids = {}
            for char_data in unique_characters:
                character = await self.character_repo.create({
                    'novel_id': novel_id,
                    'name': char_data['name'],
                    'aliases': char_data['aliases'],
                    'role': char_data['role'],
                    'description': char_data['description'],
                    'personality_traits': char_data['personality_traits'],
                    'first_appearance_chapter_id': self._get_chapter_id(
                        novel_id, char_data['first_appearance_passage']
                    )
                })
                character_ids[char_data['name']] = character.id

            # 6. Extract relationships
            relationships = await self._extract_relationships(
                novel_id, unique_characters
            )

            # 7. Update character relationships
            for char_name, char_relationships in relationships.items():
                if char_name in character_ids:
                    await self.character_repo.update_relationships(
                        character_ids[char_name],
                        self._convert_relationships_to_jsonb(
                            char_relationships, character_ids
                        )
                    )

            # 8. Calculate cost
            cost_usd = self._calculate_cost(total_tokens)

            # 9. Mark analysis complete
            await self.analysis_repo.complete(
                analysis.id,
                tokens_used=total_tokens,
                cost_usd=cost_usd
            )

            return {
                'characters_extracted': len(unique_characters),
                'tokens_used': total_tokens,
                'cost_usd': cost_usd
            }

        except Exception as e:
            # Mark analysis failed
            await self.analysis_repo.fail(analysis.id, str(e))
            raise

    async def _extract_character_batch(
        self, passages: List[Passage]
    ) -> tuple[List[Dict], int]:
        """Extract characters from a batch of passages using LLM"""

        # Prepare passages text
        passages_text = "\n\n".join([
            f"Passage {p.sequence_order}: {p.content_text}"
            for p in passages
        ])

        # Call Local LLM
        response = await self.client.generate(
            prompt=CHARACTER_EXTRACTION_PROMPT.format(
                novel_title=passages[0].chapter.novel.title,
                author=passages[0].chapter.novel.author,
                batch_num=passages[0].sequence_order,
                passages_text=passages_text
            ),
            temperature=self.temperature,
            system_prompt="You are a literary analysis expert specializing in character extraction."
        )

        # Parse response
        characters = json.loads(response)
        tokens_used = len(response.split())  # Approximate token count

        return characters.get('characters', []), tokens_used

    def _deduplicate_characters(self, characters: List[Dict]) -> List[Dict]:
        """Merge duplicate character entries"""

        unique = {}
        for char in characters:
            name = char['name']

            # Check if this character already exists (by name or alias)
            existing_key = None
            for key in unique.keys():
                if (name.lower() == key.lower() or
                    name.lower() in [a.lower() for a in unique[key]['aliases']]):
                    existing_key = key
                    break

            if existing_key:
                # Merge with existing
                unique[existing_key]['aliases'].extend(char['aliases'])
                unique[existing_key]['aliases'] = list(set(unique[existing_key]['aliases']))
                # Keep more detailed description
                if len(char['description']) > len(unique[existing_key]['description']):
                    unique[existing_key]['description'] = char['description']
            else:
                unique[name] = char

        return list(unique.values())

    async def _extract_relationships(
        self, novel_id: str, characters: List[Dict]
    ) -> Dict[str, List[Dict]]:
        """Extract character relationships using LLM"""

        character_names = [c['name'] for c in characters]

        response = await self.client.generate(
            prompt=RELATIONSHIP_EXTRACTION_PROMPT.format(
                novel_title=await self._get_novel_title(novel_id),
                character_names=", ".join(character_names)
            ),
            temperature=0.2,
            system_prompt="You are a literary analysis expert specializing in character relationships."
        )

        return json.loads(response)

    def _calculate_cost(self, total_tokens: int) -> float:
        """Calculate Local LLM compute cost"""
        # Local LLM: electricity cost estimate
        # GPT-4o mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens
        # Approximate 60/40 split input/output
        input_tokens = total_tokens * 0.6
        output_tokens = total_tokens * 0.4

        cost = (
            (input_tokens / 1_000_000 * 0.150) +
            (output_tokens / 1_000_000 * 0.600)
        )
        return round(cost, 4)
```

### Character Appearance Tracking

```python
async def track_character_appearances(
    self, novel_id: str, character_id: str
):
    """Track all appearances of a character in passages"""

    character = await self.character_repo.get(character_id)
    passages = await self.passage_repo.find_by_novel(novel_id)

    for passage in passages:
        # Check if character mentioned in passage
        mentions = self._find_character_mentions(
            passage.content_text,
            character.name,
            character.aliases
        )

        if mentions:
            for mention in mentions:
                await self.appearance_repo.create({
                    'passage_id': passage.id,
                    'character_id': character.id,
                    'mention_type': mention['type'],
                    'mention_count': mention['count'],
                    'context_snippet': mention['snippet'],
                    'sentiment': await self._analyze_sentiment(mention['snippet']),
                    'emotional_state': await self._detect_emotion(mention['snippet'])
                })

def _find_character_mentions(
    self, text: str, name: str, aliases: List[str]
) -> List[Dict]:
    """Find all mentions of character in text"""

    mentions = []
    all_names = [name] + aliases

    for name_variant in all_names:
        # Find all occurrences
        pattern = re.compile(rf'\b{re.escape(name_variant)}\b', re.IGNORECASE)
        matches = list(pattern.finditer(text))

        if matches:
            # Determine mention type based on context
            mention_type = self._classify_mention_type(text, matches[0])

            # Extract context snippet (100 chars before/after)
            snippet = self._extract_context_snippet(text, matches[0])

            mentions.append({
                'type': mention_type,
                'count': len(matches),
                'snippet': snippet
            })

    return mentions

def _classify_mention_type(self, text: str, match) -> str:
    """Classify how character is mentioned"""

    # Get surrounding context
    start = max(0, match.start() - 100)
    end = min(len(text), match.end() + 100)
    context = text[start:end]

    # Simple heuristics (can be improved with LLM)
    if '"' in context or "'" in context:
        return 'direct_speech'
    elif ' said ' in context or ' thought ' in context:
        return 'internal_monologue' if 'thought' in context else 'action'
    elif any(verb in context for verb in ['walked', 'ran', 'jumped', 'fought']):
        return 'action'
    else:
        return 'description'
```

## Testing Strategy

### Unit Tests

```python
def test_character_extraction_prompt_format():
    """Test prompt formatting"""
    prompt = format_character_extraction_prompt(
        novel_title="Harry Potter",
        author="J.K. Rowling",
        passages_text="Sample text..."
    )
    assert "Harry Potter" in prompt
    assert "J.K. Rowling" in prompt
    assert "JSON" in prompt

def test_character_deduplication():
    """Test merging duplicate characters"""
    characters = [
        {"name": "Harry Potter", "aliases": ["Harry"], "description": "Young wizard"},
        {"name": "Harry", "aliases": ["Potter"], "description": "The Boy Who Lived"}
    ]

    unique = service._deduplicate_characters(characters)

    assert len(unique) == 1
    assert unique[0]['name'] == "Harry Potter"
    assert "Harry" in unique[0]['aliases']
    assert "Potter" in unique[0]['aliases']
    assert "The Boy Who Lived" in unique[0]['description']

def test_relationship_strength_validation():
    """Test relationship strength is 0.0-1.0"""
    relationships = [
        {"character": "Ron", "strength": 0.95},
        {"character": "Draco", "strength": 1.5},  # Invalid
    ]

    validated = service._validate_relationships(relationships)

    assert validated[0]['strength'] == 0.95
    assert validated[1]['strength'] == 1.0  # Capped at 1.0
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_full_character_extraction_pipeline():
    """Test complete character extraction from novel"""

    # Setup: Create test novel with passages
    novel = await create_test_novel("Harry Potter Test")
    await create_test_passages(novel.id, [
        "Harry Potter was a wizard...",
        "Hermione Granger helped Harry...",
        "Ron Weasley, Harry's best friend..."
    ])

    # Execute: Run character extraction
    result = await service.extract_characters_from_novel(novel.id)

    # Verify: Characters created
    characters = await character_repo.find_by_novel(novel.id)
    assert len(characters) >= 3

    # Verify: Harry Potter character
    harry = next(c for c in characters if c.name == "Harry Potter")
    assert "Harry" in harry.aliases
    assert "brave" in harry.personality_traits
    assert harry.role == "protagonist"

    # Verify: Relationships exist
    assert len(harry.relationships) >= 2
    hermione_rel = next(
        r for r in harry.relationships if r['character_name'] == "Hermione Granger"
    )
    assert hermione_rel['type'] == "friend"
    assert hermione_rel['strength'] > 0.8

    # Verify: Analysis metadata created
    analysis = await analysis_repo.find_by_novel_and_type(
        novel.id, 'character_extraction'
    )
    assert analysis.status == 'completed'
    assert analysis.tokens_used > 0
    assert analysis.cost_usd > 0
```

### Performance Tests

```python
@pytest.mark.benchmark
async def test_character_extraction_performance():
    """Test extraction completes within time limit"""

    # Create novel with 100 passages (typical chapter)
    novel = await create_test_novel_with_passages(passage_count=100)

    start_time = time.time()
    await service.extract_characters_from_novel(novel.id)
    duration = time.time() - start_time

    # Should complete within 2 minutes for 100 passages
    assert duration < 120
```

## Dependencies

**Requires**:

- Story 0.7: Novel Ingestion & Chapter Segmentation (needs passages to analyze)
- Story 0.3: PostgreSQL Database Setup (characters, character_appearances tables)
- Story 0.2: FastAPI AI Service Setup (Local LLM integration)

**Blocks**:

- Story 0.9: LLM Event Detection (can reference extracted characters)
- Epic 2 Story 2.3: Multi-Timeline Character Consistency (needs character traits)
- Epic 1 Story 1.2-1.4: Scenario UI (character dropdowns populated from this data)

## Success Metrics

- Character extraction accuracy: >85% (verified on 10 sample novels)
- Character deduplication accuracy: >90% (no duplicate character entries)
- Relationship extraction completeness: >75% of major relationships identified
- Processing cost per novel: <$0.50 (for 100k-word novel with Local LLM)
- Processing time: <5 minutes for typical novel (300 passages)
- Zero critical failures (LLM errors handled gracefully)

## Open Questions

1. **Q**: Should we extract minor characters (mentioned once)?
   **A**: Yes, but mark with `role='minor'`. Can filter in UI if needed.

2. **Q**: How to handle character name changes (e.g., "Tom Riddle" → "Voldemort")?
   **A**: Store both as aliases: `["Tom Riddle", "Voldemort", "The Dark Lord"]`

3. **Q**: Should relationship extraction run separately or during character extraction?
   **A**: Separately (after all characters identified). Two-pass approach ensures all character IDs exist.

4. **Q**: How to handle unreliable narrator or character perception biases?
   **A**: Extract "objective" traits from narrator perspective. Phase 2: add character-specific perception views.

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] Character extraction runs successfully on 5 test novels
- [ ] Characters table populated with correct personality_traits and relationships
- [ ] Character appearances tracked in character_appearances table
- [ ] LLM analysis metadata records created with accurate cost tracking
- [ ] Unit tests >80% coverage
- [ ] Integration test passes for full pipeline
- [ ] Performance benchmark: 100-passage novel processes in <5 minutes
- [ ] API documented (OpenAPI/Swagger)
- [ ] Code reviewed and approved
- [ ] Cost analysis dashboard shows total spend per novel

---

**Assigned To**: AI/ML Engineer  
**Story Points**: 10  
**Sprint**: Week 1, Days 2-4
