# Story 0.7: Novel Ingestion & Chapter Segmentation Pipeline

**Epic**: Epic 0 - Project Setup & Infrastructure  
**Priority**: P0 - Critical  
**Estimated Effort**: 8 hours

## Status

Draft

## Story

As a **platform administrator**,  
I want **novels to be automatically processed into chapters and passages**,  
So that **the LLM analysis pipeline can extract metadata from structured book content**.

## Context

This story establishes the foundational data ingestion pipeline that transforms uploaded novels (plain text or EPUB) into the structured format required for LLM analysis. The pipeline creates the novel → chapters → passages hierarchy that enables semantic search, RAG, and character/location/event extraction.

**Data Flow**:

```
Novel Upload → Chapter Detection → Passage Segmentation → Embedding Generation
     ↓              ↓                     ↓                        ↓
  novels      novel_chapters       novel_passages        vector embeddings
```

**Key Design Decisions**:

- Passage size: 200-500 words (optimal for Local LLM context windows and RAG retrieval)
- Overlap strategy: 50-word overlap between passages (preserves context across boundaries)
- Chapter detection: Pattern matching for "Chapter N", "Part N", "Book N" etc.
- Encoding: UTF-8 with BOM handling for international texts

## Acceptance Criteria

### AC1: Novel Upload & Metadata Extraction

- [ ] POST /api/v1/admin/novels endpoint accepts multipart file upload (TXT, EPUB, PDF)
- [ ] Novel entity created with metadata:
  - title (extracted from filename or first line)
  - author (optional, admin can specify)
  - original_language (auto-detected using langdetect library)
  - total_word_count (calculated from full text)
  - full_text_s3_path (stored in cloud storage or local file system)
- [ ] File validation: max 10MB size, supported formats only
- [ ] Response includes novel_id for tracking processing status

### AC2: Chapter Detection & Segmentation

- [ ] Automatic chapter detection using regex patterns:
  - "Chapter \d+", "CHAPTER \d+", "Ch. \d+"
  - "Part \d+", "Book \d+"
  - Custom patterns for different literary styles
- [ ] Each chapter stored in `novel_chapters` table with:
  - chapter_number (sequential 1, 2, 3...)
  - title (extracted from heading or null)
  - content_text (full chapter text)
  - word_count (calculated)
  - character_count (for Asian languages)
- [ ] Fallback: If no chapters detected, split novel into equal-sized chunks (5000 words each)
- [ ] Edge case: Handle books without chapter markers (e.g., poetry, short stories)

### AC3: Passage Segmentation for RAG

- [ ] Each chapter split into passages with:
  - sequence_order (1-indexed within chapter)
  - content_text (200-500 words)
  - start_char_offset, end_char_offset (position in chapter)
  - word_count (calculated)
  - passage_type (initially null, set by LLM in Story 0.8)
- [ ] Segmentation algorithm:
  - Prefer sentence boundaries (don't cut mid-sentence)
  - Target 300-350 words per passage
  - 50-word overlap between consecutive passages
  - Preserve paragraph breaks where possible
- [ ] UNIQUE constraint enforced: (chapter_id, sequence_order)

### AC4: Processing Status Tracking

- [ ] Novel processing status tracked:
  - "pending" → "processing" → "completed" | "failed"
  - Processing time logged
  - Error messages captured for failed uploads
- [ ] Admin dashboard shows:
  - Total novels processed
  - Average processing time
  - Success/failure rate
  - Novels pending processing (queue)

### AC5: Async Processing with Job Queue

- [ ] Novel processing runs asynchronously (doesn't block HTTP response)
- [ ] Job queue implemented (Spring @Async or Celery for FastAPI)
- [ ] Progress updates via polling endpoint: GET /api/v1/admin/novels/{id}/status
- [ ] Retry logic: 3 attempts on failure with exponential backoff
- [ ] Idempotency: Reprocessing same novel updates existing records

## Technical Notes

### Implementation Approach

**Option 1: Spring Boot Backend (Java)**

```java
@Service
public class NovelIngestionService {

    @Async
    public CompletableFuture<UUID> processNovel(MultipartFile file, NovelMetadata metadata) {
        // 1. Extract full text from file
        String fullText = extractText(file);

        // 2. Detect chapters
        List<ChapterContent> chapters = detectChapters(fullText);

        // 3. Create novel entity
        Novel novel = novelRepository.save(new Novel(metadata, fullText));

        // 4. Create chapter entities
        chapters.forEach(ch -> {
            NovelChapter chapter = chapterRepository.save(
                new NovelChapter(novel.getId(), ch.getNumber(), ch.getContent())
            );

            // 5. Segment into passages
            List<PassageContent> passages = segmentIntoPassages(ch.getContent());
            passages.forEach(p ->
                passageRepository.save(new NovelPassage(chapter.getId(), p))
            );
        });

        return CompletableFuture.completedFuture(novel.getId());
    }

    private List<ChapterContent> detectChapters(String fullText) {
        Pattern chapterPattern = Pattern.compile(
            "^(Chapter|CHAPTER|Ch\\.?)\\s+(\\d+|[IVXLCDM]+)",
            Pattern.MULTILINE
        );
        // Split by chapter markers...
    }

    private List<PassageContent> segmentIntoPassages(String chapterText) {
        List<PassageContent> passages = new ArrayList<>();
        int targetWords = 325; // Mid-point of 200-500 range
        int overlapWords = 50;

        String[] sentences = chapterText.split("(?<=[.!?])\\s+");
        // Accumulate sentences until ~325 words, preserve overlap...
    }
}
```

**Option 2: FastAPI AI Service (Python) - RECOMMENDED**

```python
from fastapi import UploadFile
import re
from typing import List

class NovelIngestionService:

    async def process_novel(self, file: UploadFile, metadata: dict) -> str:
        # 1. Read file content
        content = await file.read()
        full_text = content.decode('utf-8-sig')  # Handle BOM

        # 2. Detect language
        from langdetect import detect
        language = detect(full_text)

        # 3. Detect chapters
        chapters = self._detect_chapters(full_text)

        # 4. Create novel record
        novel = await self.novel_repo.create({
            'title': metadata['title'],
            'author': metadata.get('author'),
            'original_language': language,
            'total_word_count': len(full_text.split()),
            'full_text': full_text
        })

        # 5. Process each chapter
        for idx, chapter_text in enumerate(chapters, 1):
            chapter = await self.chapter_repo.create({
                'novel_id': novel.id,
                'chapter_number': idx,
                'content_text': chapter_text,
                'word_count': len(chapter_text.split())
            })

            # 6. Segment into passages
            passages = self._segment_passages(chapter_text)
            for seq, passage in enumerate(passages, 1):
                await self.passage_repo.create({
                    'chapter_id': chapter.id,
                    'sequence_order': seq,
                    'content_text': passage['text'],
                    'word_count': passage['word_count'],
                    'start_char_offset': passage['start_offset'],
                    'end_char_offset': passage['end_offset']
                })

        return novel.id

    def _detect_chapters(self, text: str) -> List[str]:
        # Regex for chapter markers
        chapter_pattern = r'^(Chapter|CHAPTER|Ch\.?)\s+(\d+|[IVXLCDM]+)'
        matches = list(re.finditer(chapter_pattern, text, re.MULTILINE))

        if not matches:
            # Fallback: split into 5000-word chunks
            return self._chunk_by_word_count(text, 5000)

        chapters = []
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i+1].start() if i+1 < len(matches) else len(text)
            chapters.append(text[start:end])

        return chapters

    def _segment_passages(self, chapter_text: str) -> List[dict]:
        sentences = re.split(r'(?<=[.!?])\s+', chapter_text)
        passages = []
        current_passage = []
        current_words = 0
        char_offset = 0

        for sentence in sentences:
            sentence_words = len(sentence.split())

            if current_words + sentence_words > 500:
                # Save current passage
                passage_text = ' '.join(current_passage)
                passages.append({
                    'text': passage_text,
                    'word_count': current_words,
                    'start_offset': char_offset,
                    'end_offset': char_offset + len(passage_text)
                })

                # Start new passage with overlap
                overlap_sentences = current_passage[-3:]  # Keep last 3 sentences
                current_passage = overlap_sentences + [sentence]
                current_words = sum(len(s.split()) for s in current_passage)
                char_offset += len(passage_text) - len(' '.join(overlap_sentences))
            else:
                current_passage.append(sentence)
                current_words += sentence_words

        # Add final passage
        if current_passage:
            passage_text = ' '.join(current_passage)
            passages.append({
                'text': passage_text,
                'word_count': current_words,
                'start_offset': char_offset,
                'end_offset': char_offset + len(passage_text)
            })

        return passages
```

### Chapter Detection Patterns

```python
CHAPTER_PATTERNS = [
    r'^Chapter\s+(\d+)',                    # Chapter 1
    r'^CHAPTER\s+([IVXLCDM]+)',             # CHAPTER IV
    r'^Ch\.\s*(\d+)',                       # Ch. 12
    r'^Part\s+(\d+)',                       # Part 3
    r'^Book\s+(\d+)',                       # Book 2
    r'^\d+\.\s+',                           # 1. (numbered sections)
    r'^第(\d+)章',                          # Chinese: 第1章
    r'^제(\d+)장',                          # Korean: 제1장
]
```

### Passage Segmentation Example

**Input Chapter** (1200 words):

```
"It was a bright cold day in April, and the clocks were striking thirteen.
Winston Smith, his chin nuzzled into his breast in an effort to escape
the vile wind, slipped quickly through the glass doors of Victory Mansions..."
[... 1200 words total ...]
```

**Output Passages**:

1. **Passage 1** (320 words): "It was a bright cold day..." to "...into the hallway."
2. **Passage 2** (315 words): "...into the hallway. The hallway smelt..." to "...at the end." (50-word overlap from Passage 1)
3. **Passage 3** (310 words): "...at the end. Winston's flat..." to "...of the chapter." (50-word overlap from Passage 2)
4. **Passage 4** (255 words): "...of the chapter. He turned..." to end (50-word overlap from Passage 3)

### Performance Considerations

- **Processing Time**: Target < 30 seconds for 100k-word novel
- **Memory**: Stream file processing (don't load entire novel into memory)
- **Database Inserts**: Batch insert passages (100 at a time) to reduce I/O
- **Concurrency**: Process multiple novels in parallel (max 3 concurrent jobs)

### Error Handling

```python
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def process_novel_with_retry(file: UploadFile, metadata: dict):
    try:
        return await novel_ingestion_service.process_novel(file, metadata)
    except UnicodeDecodeError:
        raise ValidationError("File encoding not supported. Please use UTF-8.")
    except DatabaseError as e:
        logger.error(f"Database error during novel processing: {e}")
        raise ProcessingError("Failed to save novel data. Please try again.")
    except Exception as e:
        logger.exception("Unexpected error during novel processing")
        raise ProcessingError("Novel processing failed. Please contact support.")
```

## Testing Strategy

### Unit Tests

```python
def test_chapter_detection():
    text = "Chapter 1\nContent here\n\nChapter 2\nMore content"
    chapters = service._detect_chapters(text)
    assert len(chapters) == 2
    assert "Chapter 1" in chapters[0]
    assert "Chapter 2" in chapters[1]

def test_passage_segmentation():
    chapter = "Word " * 1000  # 1000-word chapter
    passages = service._segment_passages(chapter)

    # Should create ~3 passages (1000 words / 325 target)
    assert 3 <= len(passages) <= 4

    # Each passage should be 200-500 words
    for passage in passages:
        assert 200 <= passage['word_count'] <= 500

def test_overlap_between_passages():
    chapter = "Sentence one. " * 100
    passages = service._segment_passages(chapter)

    # Check overlap exists between consecutive passages
    for i in range(len(passages) - 1):
        passage1_end = passages[i]['text'][-100:]
        passage2_start = passages[i+1]['text'][:100]
        assert any(word in passage2_start for word in passage1_end.split())
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_full_novel_ingestion():
    # Upload test novel (Harry Potter Chapter 1)
    file = create_test_file("harry_potter_ch1.txt")
    metadata = {
        'title': 'Harry Potter Test',
        'author': 'J.K. Rowling'
    }

    novel_id = await service.process_novel(file, metadata)

    # Verify novel created
    novel = await novel_repo.get(novel_id)
    assert novel.title == 'Harry Potter Test'
    assert novel.total_word_count > 0

    # Verify chapters created
    chapters = await chapter_repo.find_by_novel(novel_id)
    assert len(chapters) >= 1

    # Verify passages created
    first_chapter = chapters[0]
    passages = await passage_repo.find_by_chapter(first_chapter.id)
    assert len(passages) >= 1

    # Verify passage constraints
    for passage in passages:
        assert 200 <= passage.word_count <= 500
        assert passage.start_char_offset < passage.end_char_offset
```

### Performance Tests

```python
@pytest.mark.benchmark
def test_large_novel_processing_time():
    # 200k-word novel (e.g., Harry Potter book)
    large_novel = create_test_file_with_size(200_000)

    start_time = time.time()
    novel_id = service.process_novel(large_novel, {})
    duration = time.time() - start_time

    # Should complete within 60 seconds
    assert duration < 60
```

## Dependencies

**Requires**:

- Story 0.3: PostgreSQL Database Setup (novels, novel_chapters, novel_passages tables)
- Story 0.2: FastAPI AI Service Setup (async framework, database ORM)

**Blocks**:

- Story 0.8: LLM Character Extraction (needs passages for analysis)
- Story 0.9: LLM Event Detection (needs passages for analysis)
- Story 0.10: Passage Embedding Generation (needs passages to embed)

## Success Metrics

- Novel processing success rate: >95%
- Average processing time for 100k-word novel: <30 seconds
- Passage segmentation accuracy: 90%+ passages within 200-500 word range
- Chapter detection accuracy: >80% for standard novels (manual verification on 50 sample books)
- Zero data loss during processing (all novel content preserved)

## Open Questions

1. **Q**: Should we support PDF and EPUB directly or require TXT conversion?
   **A**: Start with TXT only for MVP. Add PDF/EPUB parsing in Phase 2 using PyPDF2/ebooklib.

2. **Q**: How to handle novels without clear chapter markers (e.g., stream-of-consciousness)?
   **A**: Fallback to equal-sized chunks (5000 words). Add manual chapter marking tool for admins.

3. **Q**: Should passage segmentation preserve exact paragraph breaks?
   **A**: Best effort: prefer sentence boundaries, but allow mid-paragraph breaks if needed to hit 200-500 word target.

4. **Q**: How to handle very short books (<10k words)?
   **A**: Create single chapter, segment into minimum 5 passages (even if <200 words each).

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] Unit tests >80% coverage on ingestion service
- [ ] Integration test passes for complete novel processing
- [ ] Performance benchmark: 100k-word novel processes in <30s
- [ ] Error handling covers common failure cases (encoding errors, malformed files)
- [ ] API endpoint documented in OpenAPI/Swagger
- [ ] Admin can upload novel via Postman/curl and see chapters/passages created
- [ ] Code reviewed and approved
- [ ] Deployed to staging environment

---

**Assigned To**: Backend Engineer + AI/ML Engineer  
**Story Points**: 8  
**Sprint**: Week 1, Days 1-2
