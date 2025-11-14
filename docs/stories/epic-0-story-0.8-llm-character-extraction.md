# Story 0.7: VectorDB Data Import from Pre-processed Dataset

**Epic**: Epic 0 - Project Setup & Infrastructure  
**Priority**: P0 - Critical  
**Estimated Effort**: 3 hours

## Status

Ready to Implement

## Story

As a **platform administrator**,  
I want **pre-processed Project Gutenberg dataset to be imported into VectorDB**,  
So that **the application has novel passages, characters, and metadata ready for scenario creation**.

## Context

This story implements a **one-time data import script** that loads pre-processed Project Gutenberg dataset into ChromaDB (dev) or Pinecone (prod). The dataset already contains chunked passages, embeddings, and extracted character metadata, eliminating the need for real-time ingestion pipelines.

**Import Process**:

```
Pre-processed Dataset (JSON/Parquet)
      ↓
Python Import Script (FastAPI utils)
      ↓
ChromaDB/Pinecone (5 collections: passages, characters, locations, events, themes)
      ↓
PostgreSQL (novel metadata via Spring Boot API)
```

**Why Pre-processed Dataset?**:

- ✅ **No LLM extraction needed**: Characters, locations, events already extracted
- ✅ **Embeddings included**: 768-dim vectors pre-computed (Gemini Embedding API format)
- ✅ **Quality-controlled**: Dataset curated and validated
- ✅ **Fast setup**: Import takes ~5 minutes vs hours of processing
- ✅ **Cost-effective**: No API costs for initial setup

**Dataset Assumptions** (adjust based on actual dataset):
- Format: JSON or Parquet files
- Embeddings: 768-dimensional vectors (compatible with Gemini Embedding API)
- Structure: Separate files for passages, characters, locations, events, themes
- Novels: 10-50 classic books from Project Gutenberg

## Acceptance Criteria

### AC1: Dataset Structure Validation

- [ ] Dataset contains required files/tables:
  - `novels.json` - Novel metadata (title, author, year, genre)
  - `passages.parquet` - Text chunks with embeddings (200-500 words each)
  - `characters.json` - Character metadata (name, role, description, personality_traits)
  - `locations.json` - Setting descriptions
  - `events.json` - Plot events
  - `themes.json` - Thematic analysis (optional)
- [ ] Embedding validation:
  - Dimension: 768 (Gemini Embedding API compatible)
  - Data type: float32 or float64
  - No null embeddings
- [ ] Data integrity checks:
  - All passages reference valid novel_id
  - All characters reference valid novel_id
  - No duplicate IDs within collections

### AC2: ChromaDB Collection Setup

- [ ] Create 5 ChromaDB collections:
  - `novel_passages` - Text chunks with embeddings
  - `characters` - Character metadata
  - `locations` - Settings and places
  - `events` - Plot events
  - `themes` - Thematic elements
- [ ] Collection schema for `novel_passages`:
  ```python
  {
    "id": "UUID",
    "novel_id": "UUID (PostgreSQL reference)",
    "chapter_number": int,
    "passage_number": int,
    "text": str,
    "word_count": int,
    "passage_type": str,  # narrative, dialogue, description
    "embedding": [768 floats]
  }
  ```
- [ ] Collection schema for `characters`:
  ```python
  {
    "id": "UUID",
    "novel_id": "UUID",
    "name": str,
    "role": str,  # protagonist, antagonist, supporting
    "description": str,
    "personality_traits": [str],  # ["brave", "intelligent"]
    "first_appearance_chapter": int,
    "embedding": [768 floats]  # character description embedding
  }
  ```
- [ ] Distance metric: Cosine similarity (ChromaDB default)
- [ ] Index type: HNSW (Hierarchical Navigable Small World) for fast ANN search

### AC3: Python Import Script

- [ ] Script location: `ai-backend/scripts/import_dataset.py`
- [ ] Command-line interface:
  ```bash
  python scripts/import_dataset.py \
    --dataset-path /path/to/gutenberg_dataset \
    --vectordb chromadb \
    --vectordb-host localhost:8001 \
    --spring-boot-api http://localhost:8080
  ```
- [ ] Import workflow:
  1. **Validate dataset**: Check file structure and data integrity
  2. **Create ChromaDB collections**: Initialize 5 collections
  3. **Import passages**: Batch insert with embeddings (1000 per batch)
  4. **Import characters**: Batch insert character metadata
  5. **Import locations/events/themes**: Optional collections
  6. **Create PostgreSQL metadata**: Call Spring Boot API for novel records
  7. **Verify import**: Query sample data, check counts
- [ ] Progress tracking:
  - Console output: "Importing passages: 1000/5234 (19%)"
  - ETA calculation
  - Success/failure summary at end
- [ ] Error handling:
  - Rollback on failure (delete partial collections)
  - Retry logic for API calls (3 attempts)
  - Detailed error logging

### AC4: PostgreSQL Metadata Creation

- [ ] For each novel in dataset, create PostgreSQL record via Spring Boot API:
  - Endpoint: `POST /api/internal/novels`
  - Request payload:
    ```json
    {
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "publication_year": 1813,
      "genre": "Romance",
      "language": "en",
      "vectordb_collection_id": "novel_UUID_in_chromadb",
      "total_passages_count": 523,
      "total_characters_count": 47,
      "ingestion_status": "completed"
    }
    ```
  - Response: `{novel_id: UUID}`
- [ ] Store novel_id → vectordb_collection_id mapping
- [ ] Update novel record after import completes:
  - `PATCH /api/internal/novels/{id}`
  - Set `ingestion_status: "completed"`
  - Set `processed_at: TIMESTAMP`

### AC5: Import Verification & Testing

- [ ] Verification script: `scripts/verify_import.py`
- [ ] Checks performed:
  - Count validation: PostgreSQL novel count == VectorDB novel count
  - Sample queries: Retrieve 5 random passages from VectorDB
  - Semantic search test: Query "brave protagonist" → should return relevant characters
  - Cross-reference test: PostgreSQL novel_id exists in VectorDB metadata
- [ ] Integration test:
  - Import sample dataset (1 novel, ~500 passages, 20 characters)
  - Verify all data accessible via FastAPI endpoints
  - Verify PostgreSQL metadata correct
  - Cleanup test data
- [ ] Performance benchmarks:
  - Import speed: > 1000 passages/minute
  - Total import time: < 10 minutes for 10 novels
  - Memory usage: < 2GB during import


## Technical Notes

### Dataset Format Examples

**novels.json**:
```json
[
  {
    "id": "novel_pride_and_prejudice",
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "publication_year": 1813,
    "genre": "Romance",
    "language": "en",
    "total_chapters": 61,
    "total_word_count": 122189
  }
]
```

**passages.parquet** (columns):
```
id: string (UUID)
novel_id: string
chapter_number: int
passage_number: int
text: string
word_count: int
passage_type: string (narrative, dialogue, description)
embedding: list<float> (768 dimensions)
```

**characters.json**:
```json
[
  {
    "id": "char_elizabeth_bennet",
    "novel_id": "novel_pride_and_prejudice",
    "name": "Elizabeth Bennet",
    "role": "protagonist",
    "description": "Second eldest Bennet daughter, intelligent and witty",
    "personality_traits": ["intelligent", "witty", "independent", "prejudiced"],
    "first_appearance_chapter": 1,
    "embedding": [0.123, -0.456, ...]  // 768-dim vector
  }
]
```

### Import Script Implementation

**ai-backend/scripts/import_dataset.py**:

```python
import argparse
import json
import pandas as pd
from chromadb import Client
from chromadb.config import Settings
import httpx
from tqdm import tqdm

class GutenbergDatasetImporter:
    def __init__(self, dataset_path, vectordb_host, spring_boot_api):
        self.dataset_path = dataset_path
        self.chroma_client = Client(Settings(
            chroma_api_impl="rest",
            chroma_server_host=vectordb_host.split(":")[0],
            chroma_server_http_port=int(vectordb_host.split(":")[1])
        ))
        self.spring_boot_api = spring_boot_api
    
    def import_all(self):
        """Main import workflow"""
        print("🚀 Starting dataset import...")
        
        # 1. Validate dataset
        self.validate_dataset()
        
        # 2. Create collections
        self.create_collections()
        
        # 3. Import data
        novels = self.load_novels()
        for novel in tqdm(novels, desc="Importing novels"):
            self.import_novel(novel)
        
        # 4. Verify import
        self.verify_import()
        
        print("✅ Import complete!")
    
    def create_collections(self):
        """Create 5 ChromaDB collections"""
        collections = [
            "novel_passages",
            "characters", 
            "locations",
            "events",
            "themes"
        ]
        for name in collections:
            self.chroma_client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
    
    def import_novel(self, novel):
        """Import single novel's data"""
        # Import passages
        passages_df = pd.read_parquet(
            f"{self.dataset_path}/passages/{novel['id']}.parquet"
        )
        self.import_passages(novel['id'], passages_df)
        
        # Import characters
        with open(f"{self.dataset_path}/characters/{novel['id']}.json") as f:
            characters = json.load(f)
        self.import_characters(novel['id'], characters)
        
        # Create PostgreSQL metadata
        self.create_novel_metadata(novel)
    
    def import_passages(self, novel_id, df):
        """Batch insert passages to ChromaDB"""
        collection = self.chroma_client.get_collection("novel_passages")
        
        batch_size = 1000
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i+batch_size]
            collection.add(
                ids=batch['id'].tolist(),
                embeddings=batch['embedding'].tolist(),
                documents=batch['text'].tolist(),
                metadatas=batch[[
                    'novel_id', 'chapter_number', 
                    'passage_number', 'word_count', 'passage_type'
                ]].to_dict('records')
            )
    
    def create_novel_metadata(self, novel):
        """Create PostgreSQL record via Spring Boot API"""
        response = httpx.post(
            f"{self.spring_boot_api}/api/internal/novels",
            json={
                "title": novel['title'],
                "author": novel['author'],
                "publication_year": novel['publication_year'],
                "genre": novel['genre'],
                "language": novel['language'],
                "vectordb_collection_id": novel['id'],
                "total_passages_count": novel.get('total_passages_count', 0),
                "total_characters_count": novel.get('total_characters_count', 0),
                "ingestion_status": "completed"
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-path", required=True)
    parser.add_argument("--vectordb-host", default="localhost:8001")
    parser.add_argument("--spring-boot-api", default="http://localhost:8080")
    args = parser.parse_args()
    
    importer = GutenbergDatasetImporter(
        args.dataset_path,
        args.vectordb_host,
        args.spring_boot_api
    )
    importer.import_all()
```

### Spring Boot Internal API Endpoints

Required endpoints in Spring Boot for metadata creation:

**POST /api/internal/novels** (create novel metadata):
```java
@RestController
@RequestMapping("/api/internal")
public class InternalNovelController {
    
    @PostMapping("/novels")
    public NovelResponse createNovel(@RequestBody CreateNovelRequest request) {
        Novel novel = novelService.createNovel(request);
        return new NovelResponse(novel);
    }
    
    @PatchMapping("/novels/{id}")
    public void updateNovelStatus(
        @PathVariable UUID id,
        @RequestBody UpdateNovelStatusRequest request
    ) {
        novelService.updateStatus(id, request.getIngestionStatus());
    }
}
```
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
