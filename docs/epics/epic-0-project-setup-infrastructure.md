# Epic 0: Project Setup & Infrastructure

## Epic Goal

Establish the foundational technical infrastructure for Gaji platform including backend services (Spring Boot + FastAPI), frontend application (Vue.js), database setup (PostgreSQL), containerization (Docker), and inter-service communication, enabling all subsequent feature development.

## User Value

While users don't directly interact with infrastructure, this epic ensures the platform is scalable, maintainable, and production-ready from day one, preventing technical debt and enabling rapid feature iteration.

## Timeline

**Week 1-2 of MVP development**

- **Infrastructure Setup**: Days 1-3 (Stories 0.1-0.6)
- **LLM Pipeline Implementation**: Days 4-10 (Stories 0.7-0.12)

## Stories Overview

### Phase 1: Infrastructure Setup (25 hours)

**Stories 0.1-0.6**: Core infrastructure, databases, services, Docker

### Phase 2: LLM Analysis Pipeline (52 hours)

**Stories 0.7-0.12**: Novel ingestion, character/location/event extraction, embeddings, base scenarios, monitoring

**Total Epic Effort**: 77 hours (~10 working days for 1-2 engineers)

## Stories

### Story 0.1: Spring Boot Backend Core Setup

**Priority: P0 - Critical**

**Description**: Initialize Spring Boot application with essential dependencies, project structure, and base configuration for REST API development.

**Acceptance Criteria**:

- [ ] Spring Boot 3.2+ project initialized with Gradle
- [ ] Dependencies configured:
  - Spring Web (REST API)
  - Spring Data JPA (database ORM)
  - Spring Security (authentication/authorization)
  - PostgreSQL Driver
  - Lombok (reduce boilerplate)
  - Spring Validation
  - Spring Boot Actuator (health checks)
- [ ] Package structure created:
  ```
  com.gaji.backend/
  ├── config/          # Configuration classes
  ├── controller/      # REST controllers
  ├── service/         # Business logic
  ├── repository/      # Data access
  ├── entity/          # JPA entities
  ├── dto/             # Data transfer objects
  ├── exception/       # Custom exceptions
  └── util/            # Utility classes
  ```
- [ ] application.yml configured with profiles (dev, staging, prod)
- [ ] CORS configuration for frontend (localhost:5173 for dev)
- [ ] Global exception handler for consistent error responses
- [ ] Health check endpoint: GET /actuator/health
- [ ] Base API versioning: `/api/v1/*`
- [ ] Swagger/OpenAPI documentation auto-generated
- [ ] Logging configured (SLF4J + Logback)
- [ ] Application runs on port 8080

**Technical Notes**:

- Use Spring Boot 3.2+ for latest features and security patches
- Enable JPA `hibernate.ddl-auto=validate` for prod (use Flyway for migrations)
- Configure Jackson for consistent JSON serialization (camelCase, ISO-8601 dates)

**Estimated Effort**: 4 hours

---

### Story 0.2: FastAPI AI Service Setup

**Priority: P0 - Critical**

**Description**: Initialize FastAPI service for AI/ML operations including RAG pipeline, character extraction, and scenario template generation.

**Acceptance Criteria**:

- [ ] FastAPI project initialized with Poetry/pip
- [ ] Dependencies configured:
  - FastAPI
  - Uvicorn (ASGI server)
  - SQLAlchemy (database ORM)
  - Pydantic (data validation)
  - Local LLM Python SDK (llama-cpp-python)
  - LangChain (RAG framework)
  - FAISS or ChromaDB (vector store)
  - asyncpg (async PostgreSQL driver)
- [ ] Project structure created:
  ```
  gaji-ai/
  ├── app/
  │   ├── api/           # API routes
  │   ├── services/      # Business logic
  │   ├── models/        # Pydantic models
  │   ├── db/            # Database models
  │   ├── config/        # Configuration
  │   └── utils/         # Utilities
  ├── tests/
  └── requirements.txt
  ```
- [ ] Environment configuration (.env support)
- [ ] CORS middleware for backend communication
- [ ] Health check endpoint: GET /health
- [ ] OpenAPI documentation auto-generated at /docs
- [ ] Logging configured (structlog for JSON logs)
- [ ] Application runs on port 8001
- [ ] Async database connection pool configured
- [ ] Base API versioning: `/api/v1/*`

**Technical Notes**:

- Use async/await throughout for better performance
- Configure connection pooling (min 5, max 20 connections)
- Set Local LLM inference timeout: 30 seconds
- Enable request/response logging for debugging

**Estimated Effort**: 3 hours

---

### Story 0.3: PostgreSQL Database Setup & Flyway Migrations

**Priority: P0 - Critical**

**Description**: Set up PostgreSQL database with proper configuration, create initial schema using Flyway migrations, and establish connection from both backend services.

**Acceptance Criteria**:

- [ ] PostgreSQL 15+ installed/configured (or Railway cloud database)
- [ ] Database created: `gaji_db`
- [ ] PostgreSQL extensions enabled:
  - `uuid-ossp` for UUID generation
  - `pg_trgm` for full-text search
  - `pgvector` for embedding similarity search
- [ ] Flyway configured in Spring Boot for schema migrations
- [ ] Initial migration scripts created (32 tables total):
  - **Core Tables** (6 tables):
    - `V1__create_users_table.sql`
    - `V2__create_novels_table.sql` (includes series_title, series_number, copyright_status, copyright_note)
    - `V3__create_novel_chapters_table.sql`
    - `V4__create_novel_passages_table.sql`
    - `V5__create_characters_table.sql`
    - `V6__create_locations_table.sql`
  - **Character Normalized Tables** (3 tables):
    - `V7__create_character_aliases_table.sql`
    - `V8__create_character_personality_traits_table.sql`
    - `V9__create_character_relationships_table.sql`
  - **Appearance Tracking** (2 tables):
    - `V10__create_character_appearances_table.sql`
    - `V11__create_location_appearances_table.sql`
  - **Event/Theme/Arc Tables** (3 tables):
    - `V12__create_events_table.sql`
    - `V13__create_themes_table.sql`
    - `V14__create_narrative_arcs_table.sql`
  - **Event/Theme/Arc Normalized Tables** (4 tables):
    - `V15__create_event_characters_table.sql`
    - `V16__create_theme_passages_table.sql`
    - `V17__create_narrative_arc_characters_table.sql`
    - `V18__create_narrative_arc_events_table.sql`
  - **Scenario Tables** (2 tables):
    - `V19__create_base_scenarios_table.sql`
    - `V20__create_root_user_scenarios_table.sql`
    - `V21__create_leaf_user_scenarios_table.sql`
  - **Scenario Normalized Tables** (3 tables):
    - `V22__create_scenario_character_changes_table.sql`
    - `V23__create_scenario_event_alterations_table.sql`
    - `V24__create_scenario_setting_modifications_table.sql`
  - **Conversation Tables** (3 tables):
    - `V25__create_conversations_table.sql`
    - `V26__create_messages_table.sql`
    - `V27__create_conversation_message_links_table.sql`
    - `V28__create_conversation_emotions_table.sql`
  - **Social Features** (3 tables):
    - `V29__create_follows_table.sql`
    - `V30__create_likes_table.sql`
    - `V31__create_memos_table.sql`
  - **LLM Metadata**:
    - `V32__create_llm_analysis_metadata_table.sql`
  - **Indexes & Constraints**:
    - `V33__create_indexes.sql`
    - `V34__create_foreign_key_constraints.sql`
- [ ] Fully normalized relational design:
  - 0 JSONB columns (all data in structured relational tables)
  - CASCADE DELETE on all foreign keys for automatic cleanup
  - B-tree indexes on all FK columns and scoring columns
- [ ] Connection pooling configured (HikariCP):
  - Spring Boot: min 5, max 20 connections
  - FastAPI: min 5, max 15 connections
- [ ] Database connection verified from both services
- [ ] Rollback testing: migrations can be reverted cleanly
- [ ] Seed data script for development (10 sample users, 3 sample novels, 20 scenarios)

**Schema Highlights**:

```sql
-- V1__create_users_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT CHECK (length(bio) <= 500),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V29__create_follows_table.sql
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- V30__create_likes_table.sql
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, conversation_id)
);

-- V31__create_memos_table.sql
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, conversation_id)
);

-- V7__create_character_aliases_table.sql (Normalized from characters.aliases JSONB)
CREATE TABLE character_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  usage_context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, alias)
);

-- V8__create_character_personality_traits_table.sql (Normalized from characters.personality_traits JSONB)
CREATE TABLE character_personality_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  trait VARCHAR(100) NOT NULL,
  intensity DECIMAL(3,2) CHECK (intensity BETWEEN 0 AND 1),
  evidence_passage_id UUID REFERENCES novel_passages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, trait)
);

-- V9__create_character_relationships_table.sql (Normalized from characters.relationships JSONB)
CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  related_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  relationship_description TEXT,
  strength DECIMAL(3,2) CHECK (strength BETWEEN 0 AND 1),
  is_mutual BOOLEAN DEFAULT FALSE,
  first_interaction_chapter_id UUID REFERENCES novel_chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(character_id != related_character_id)
);

-- V22__create_scenario_character_changes_table.sql (Normalized from root/leaf_user_scenarios.custom_parameters JSONB)
CREATE TABLE scenario_character_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  root_scenario_id UUID REFERENCES root_user_scenarios(id) ON DELETE CASCADE,
  leaf_scenario_id UUID REFERENCES leaf_user_scenarios(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  attribute VARCHAR(100) NOT NULL,
  original_value TEXT,
  new_value TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK((root_scenario_id IS NOT NULL AND leaf_scenario_id IS NULL) OR
        (root_scenario_id IS NULL AND leaf_scenario_id IS NOT NULL))
);
```

**Technical Notes**:

- All 11 JSONB columns have been eliminated in favor of structured relational tables
- Use CASCADE DELETE on all foreign keys for automatic cleanup of dependent records
- Add B-tree indexes on all FK columns, scoring columns (intensity, strength, relevance_score, importance_to_arc)
- Create triggers for `updated_at` auto-update on relevant tables
- Create indexes in separate migration (V33) for clarity
- Normalized design provides better queryability, type safety, and performance vs JSONB

**Estimated Effort**: 5 hours

---

### Story 0.4: Vue.js Frontend Project Setup

**Priority: P0 - Critical**

**Description**: Initialize Vue 3 application with TypeScript, Vite, essential libraries (Router, Pinia, Panda CSS), and project structure.

**Acceptance Criteria**:

- [ ] Vue 3 project initialized with Vite + TypeScript
- [ ] Dependencies configured:
  - Vue Router 4 (routing)
  - Pinia (state management)
  - Panda CSS (utility-first styling)
  - Axios (HTTP client)
  - VueUse (composition utilities)
  - date-fns (date formatting)
- [ ] Project structure created:
  ```
  src/
  ├── assets/          # Static assets
  ├── components/      # Reusable components
  │   ├── common/      # Generic components
  │   ├── scenario/    # Scenario-related
  │   ├── conversation/# Conversation-related
  │   └── user/        # User-related
  ├── views/           # Page components
  ├── router/          # Route definitions
  ├── stores/          # Pinia stores
  ├── services/        # API services
  ├── types/           # TypeScript types
  ├── utils/           # Utility functions
  └── styles/          # Global styles
  ```
- [ ] Panda CSS configured with theme (colors, typography, spacing)
- [ ] Vue Router configured with:
  - Protected routes (require authentication)
  - Public routes (login, register, browse)
  - 404 page
  - Navigation guards
- [ ] Pinia stores initialized:
  - `useAuthStore` (user authentication state)
  - `useUserStore` (current user profile)
  - `useScenarioStore` (scenario browsing/creation)
  - `useConversationStore` (conversation management)
- [ ] Axios instance configured with:
  - Base URL: `http://localhost:8080/api/v1`
  - Request interceptor (add auth token)
  - Response interceptor (handle 401 errors)
- [ ] Environment variables (.env.development, .env.production)
- [ ] TypeScript strict mode enabled
- [ ] ESLint + Prettier configured
- [ ] Application runs on port 5173

**Technical Notes**:

- Use `<script setup>` syntax for composition API
- Configure path aliases: `@/` → `src/`
- Enable Vite HMR for fast development
- Add meta tags for SEO and social sharing

**Estimated Effort**: 4 hours

---

### Story 0.5: Docker Configuration & Inter-Service Communication

**Priority: P1 - High**

**Description**: Create Docker containers for all services and configure docker-compose for local development with proper networking and health checks.

**Acceptance Criteria**:

- [ ] Dockerfile created for each service:
  - `backend/Dockerfile` (Spring Boot)
  - `ai-service/Dockerfile` (FastAPI)
  - `frontend/Dockerfile` (Vue.js with Nginx)
- [ ] docker-compose.yml with services:
  - `postgres` (PostgreSQL 15)
  - `backend` (Spring Boot on port 8080)
  - `ai-service` (FastAPI on port 8001)
  - `frontend` (Nginx on port 80)
- [ ] Docker network configured for inter-service communication
- [ ] Health checks configured for all services:
  - postgres: `pg_isready`
  - backend: `GET /actuator/health`
  - ai-service: `GET /health`
  - frontend: `curl localhost:80`
- [ ] Environment variables managed via .env file
- [ ] Volumes configured:
  - PostgreSQL data persistence
  - Backend logs
  - AI service models cache
- [ ] Service dependencies: backend/ai-service wait for postgres
- [ ] Hot reload enabled for development:
  - Backend: volume mount for target/classes
  - AI service: volume mount for app/
  - Frontend: Vite dev server
- [ ] Single command startup: `docker-compose up`
- [ ] Documentation: README with setup instructions

**docker-compose.yml Structure**:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gaji_db
      POSTGRES_USER: gaji
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gaji"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/gaji_db
      SPRING_DATASOURCE_USERNAME: gaji
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      AI_SERVICE_URL: http://ai-service:8001
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-service:
    build: ./ai-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql://gaji:${DB_PASSWORD}@postgres:5432/gaji_db
      LLM_MODEL_PATH: ${LLM_MODEL_PATH}
      LLM_MODEL_TYPE: ${LLM_MODEL_TYPE}
    volumes:
      - ./models:/models
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://localhost:8080/api/v1
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Technical Notes**:

- Use multi-stage builds for smaller images
- Configure `.dockerignore` to exclude node_modules, target/
- Set resource limits (memory, CPU) for production
- Enable BuildKit for faster builds

**Estimated Effort**: 5 hours

---

### Story 0.6: Inter-Service Health Check & API Contract

**Priority: P1 - High**

**Description**: Implement health check endpoints and define API contracts between Spring Boot backend and FastAPI AI service for reliable inter-service communication.

**Acceptance Criteria**:

- [ ] Backend health check: GET /actuator/health returns:
  ```json
  {
    "status": "UP",
    "components": {
      "db": { "status": "UP" },
      "ai-service": { "status": "UP" }
    }
  }
  ```
- [ ] AI service health check: GET /health returns:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "llm_model": "loaded"
  }
  ```
- [ ] Backend → AI service API contract defined:
  - POST /api/v1/prompts/generate (generate character prompt from scenario)
  - POST /api/v1/rag/extract-characters (extract characters from book text)
  - POST /api/v1/scenarios/validate (validate scenario coherence)
- [ ] Circuit breaker configured for AI service calls:
  - Timeout: 30 seconds
  - Fallback: return cached prompt or error response
  - Retry: 3 attempts with exponential backoff
- [ ] API versioning strategy documented
- [ ] Integration test: backend calls AI service successfully
- [ ] Error handling: graceful degradation if AI service down
- [ ] Monitoring: log all inter-service calls with duration

**API Contract Example**:

```typescript
// POST /api/v1/prompts/generate
Request:
{
  "scenario_id": "uuid",
  "character_name": "Hermione Granger"
}

Response:
{
  "prompt": "You are Hermione Granger in an alternate timeline...",
  "token_count": 650,
  "temperature": 0.7
}
```

**Technical Notes**:

- Use Resilience4j for circuit breaker (Spring Boot)
- Configure timeouts: connect 5s, read 30s
- Log request/response for debugging (sanitize sensitive data)
- Cache AI service responses (5-minute TTL)

**Estimated Effort**: 4 hours

---

### Story 0.7: Novel Ingestion & Chapter Segmentation Pipeline

**Priority: P0 - Critical**

**Description**: Implement novel upload, automatic chapter detection, and passage segmentation pipeline for LLM analysis preparation.

**Acceptance Criteria**:

- [ ] Novel upload endpoint: POST /api/v1/admin/novels/upload
  - Accept file formats: .txt, .epub (Phase 1: .txt only)
  - UTF-8 encoding detection with BOM handling
  - Language detection using `langdetect` library
- [ ] Automatic chapter detection via regex patterns:
  - English: "Chapter \d+", "Part \d+", "CHAPTER [IVX]+"
  - Korean: "제(\d+)장", "(\d+)화"
  - Chinese: "第(\d+)章"
  - Fallback: Split by blank lines if no pattern matches
- [ ] Passage segmentation algorithm:
  - Target size: 200-500 words per passage
  - Overlap: 50 words between consecutive passages
  - Sentence boundary preservation (don't split mid-sentence)
  - Store `start_char_offset` and `end_char_offset` for each passage
- [ ] Batch database inserts:
  - Insert novel record
  - Insert chapter records (batch of 10)
  - Insert passage records (batch of 100)
- [ ] Status tracking:
  - Novel upload progress API: GET /api/v1/admin/novels/{id}/status
  - Returns: total_chapters, processed_chapters, total_passages, status
- [ ] Error handling:
  - Invalid file format → 400 Bad Request
  - File too large (>10MB) → 413 Payload Too Large
  - Chapter detection failure → fallback to blank-line splitting
- [ ] Unit tests for chapter detection regex patterns
- [ ] Integration test: upload sample novel, verify passages created

**Technical Notes**:

- Use Python FastAPI for implementation
- Store original file in S3 or local storage, reference via `full_text_s3_path`
- Async processing with Celery/background tasks for large files
- Target processing time: <30 seconds for typical 100k-word novel

**Estimated Effort**: 8 hours

---

### Story 0.8: LLM Character Extraction & Relationship Mapping

**Priority: P0 - Critical**

**Description**: Extract characters, their traits, and relationships from novel passages using LLM analysis.

**Acceptance Criteria**:

- [ ] Passage type classification (narrative, dialogue, description, action, internal_thought, mixed)
- [ ] Character extraction from passages:
  - Name, role (protagonist/antagonist/supporting/minor)
  - Description (physical and personality)
  - first_appearance_chapter_id
- [ ] **Normalized character data** (no JSONB):
  - Character aliases stored in `character_aliases` table (1:N)
  - Personality traits stored in `character_personality_traits` table (1:N with intensity scoring)
  - Relationships stored in `character_relationships` table (N:M self-referencing)
- [ ] Character appearance tracking:
  - Create character_appearances records for each mention
  - Track mention_type, mention_count, context_snippet, sentiment, emotional_state
- [ ] Character relationship mapping:
  - Extract relationship graph from context
  - Store in `character_relationships` table with structured columns:
    - relationship_type (friend/enemy/family/romantic/mentor/rival)
    - strength (0.0-1.0), is_mutual, first_interaction_chapter_id
  - Enable social network analysis and relationship graphs
- [ ] LLM analysis metadata tracking:
  - Create llm_analysis_metadata record for 'character_extraction'
  - Track tokens_used, cost_usd, status, started_at, completed_at
  - Progress tracking with processed_passages count
- [ ] Batch processing (50 passages per LLM request)
- [ ] Character deduplication logic (merge "Harry" and "Harry Potter" in aliases table)
- [ ] Cost optimization: Use Local LLM (Llama-2-7B, temperature 0.2)
- [ ] Target cost: <$0.50 per 100k-word novel (local compute)

**Technical Notes**:

- Two-pass approach: character extraction → relationship mapping
- Async job with progress API endpoint
- Retry logic with exponential backoff (3 attempts)
- Integration test with sample novel (verify accuracy >85%)

**Estimated Effort**: 10 hours

---

### Story 0.9: LLM Location, Event, and Theme Extraction

**Priority: P1 - High**

**Description**: Extract locations, major events, and themes from novel passages to complete metadata enrichment.

**Acceptance Criteria**:

- [ ] Location extraction:
  - Name, type (city/building/room/landmark/region), description
  - Hierarchical parent_location_id (room → building → city)
  - first_appearance_chapter_id, significance
  - Create location_appearances records linking to passages
- [ ] Event detection:
  - event_type (action/dialogue/revelation/conflict/resolution)
  - Title, description, location_id, significance_score (0.0-1.0)
  - chronological_order tracking
  - **Normalized event-character links**: Store character involvement in `event_characters` table (not JSONB)
    - event_id, character_id, role_in_event (protagonist/witness/victim)
- [ ] Theme analysis:
  - Theme name (e.g., "love vs duty", "coming of age")
  - Description, prominence_score (0.0-1.0)
  - **Normalized theme-passage links**: Store theme occurrences in `theme_passages` table (not JSONB)
    - theme_id, passage_id, relevance_score (0.0-1.0)
- [ ] Narrative arc detection:
  - Arc name, description, arc_type
  - **Normalized arc-character links**: Store character roles in `narrative_arc_characters` table
    - narrative_arc_id, character_id, role (hero/antagonist/mentor)
  - **Normalized arc-event links**: Store key events in `narrative_arc_events` table
    - narrative_arc_id, event_id, sequence_order, importance_to_arc (0.0-1.0)
- [ ] LLM analysis metadata for each type:
  - 'location_extraction', 'event_detection', 'theme_analysis', 'narrative_arc_detection'
  - Separate jobs with individual cost tracking
- [ ] Batch processing optimization (combine related analyses)
- [ ] API endpoints:
  - GET /api/v1/admin/novels/{id}/locations
  - GET /api/v1/admin/novels/{id}/events
  - GET /api/v1/admin/novels/{id}/themes
  - GET /api/v1/admin/novels/{id}/narrative-arcs
- [ ] Admin verification workflow for extracted data
- [ ] Quality metrics: extraction completeness report

**Technical Notes**:

- Run after character extraction (Story 0.8) completes
- Can run location/event/theme extractions in parallel
- Use same prompt template versioning system
- Target cost: <$3.00 per novel for all three analyses combined

**Estimated Effort**: 12 hours

---

### Story 0.10: Passage Embedding Generation for RAG

**Priority: P0 - Critical**

**Description**: Generate vector embeddings for all novel passages to enable semantic search and RAG retrieval.

**Acceptance Criteria**:

- [ ] Local LLM embedding generation:
  - Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
  - Batch processing: 100 passages per request
  - Store in novel_passages.embedding_vector (pgvector type)
  - Store embedding_model name for versioning
- [ ] ivfflat index creation:
  - Create index on novel_passages.embedding_vector
  - Configure lists parameter (100 for passages table)
  - Vector similarity operator: <=> (cosine distance)
- [ ] Character embedding generation:
  - Generate embeddings for character descriptions
  - Store in characters.embedding_vector
  - Enable character similarity search
- [ ] Semantic search API:
  - POST /api/v1/novels/{id}/passages/search
  - Input: query text, top_k (default 10)
  - Returns: most similar passages with similarity scores
- [ ] LLM analysis metadata tracking:
  - analysis_type = 'embedding_generation'
  - Track total tokens and costs
- [ ] Batch job management:
  - Process 1000 passages at a time
  - Progress tracking API
  - Retry logic for API failures
- [ ] Performance benchmarks:
  - Embedding generation: <1 minute per 100 passages
  - Similarity search: <100ms for top-10 results
- [ ] Cost calculation and budgeting

**Technical Notes**:

- Embeddings enable RAG context retrieval for conversations
- Required for AI character responses (Story 2.1, 2.2)
- Use async batch processing for efficiency
- Cache embedding API responses (24-hour TTL)
- Target cost: <$0.50 per novel for embeddings

**Estimated Effort**: 6 hours

---

### Story 0.11: Base Scenario Auto-Generation from Metadata

**Priority: P1 - High**

**Description**: Auto-generate base_scenarios from extracted novel metadata to seed user scenario creation.

**Acceptance Criteria**:

- [ ] Base scenario generation algorithm:
  - Identify 5-10 key divergence points per novel
  - Use extracted characters, locations, events, themes
  - Populate base_scenarios with **structured columns** (no JSONB):
    - character_summary TEXT
    - location_summary TEXT
    - theme_summary TEXT
    - page_range VARCHAR
    - content_summary TEXT
    - tags TEXT[] (array of searchable tags)
- [ ] Scenario type classification:
  - CHARACTER_CHANGE scenarios (personality trait modifications)
  - EVENT_ALTERATION scenarios (plot event changes)
  - SETTING_MODIFICATION scenarios (location/time period changes)
- [ ] Admin verification UI:
  - List all generated base scenarios
  - Edit/approve/reject workflow
  - Bulk approval for verified novels
- [ ] API endpoints:
  - GET /api/v1/admin/novels/{id}/base-scenarios
  - POST /api/v1/admin/base-scenarios/{id}/verify
  - POST /api/v1/admin/base-scenarios (manual creation)
- [ ] Seeding script for MVP:
  - Generate base scenarios for 3-5 popular novels
  - Verify quality before enabling user access
- [ ] Quality metrics:
  - Scenario coherence score
  - Metadata completeness check
- [ ] Documentation: base scenario creation guide for admins

**Technical Notes**:

- Runs after all LLM analyses complete (Stories 0.8, 0.9, 0.10)
- Semi-automated: LLM proposes, admin verifies
- Enables Epic 1 user scenario creation features
- Target: 10-15 high-quality base scenarios per novel

**Estimated Effort**: 8 hours

---

### Story 0.12: LLM Analysis Dashboard & Cost Monitoring

**Priority: P2 - Medium**

**Description**: Admin dashboard for monitoring LLM analysis jobs, costs, and quality metrics.

**Acceptance Criteria**:

- [ ] Dashboard UI components:
  - Analysis job list (all novels, filterable by status)
  - Job detail view (progress, costs, errors)
  - Cost breakdown by analysis type
  - Daily/weekly/monthly cost trends
- [ ] Real-time job monitoring:
  - WebSocket or polling for progress updates
  - Status indicators (pending/processing/completed/failed)
  - ETA calculation based on current progress
- [ ] Cost analytics:
  - Total spend by novel
  - Average cost per analysis type
  - Cost per 1k words (efficiency metric)
  - Budget alerts (configurable thresholds)
- [ ] Quality metrics dashboard:
  - Character extraction accuracy (sample validation)
  - Passage segmentation quality
  - Base scenario coherence scores
- [ ] Error tracking and retry UI:
  - View failed jobs with error messages
  - Retry button for failed analyses
  - Bulk retry for specific error types
- [ ] Export functionality:
  - CSV export for cost reports
  - JSON export for analysis results
- [ ] Admin controls:
  - Pause/resume background jobs
  - Configure batch sizes
  - Adjust cost limits

**Technical Notes**:

- Vue.js frontend with real-time updates
- Chart.js for cost trend visualization
- Caching for performance (5-minute TTL)
- Role-based access: admin-only dashboard

**Estimated Effort**: 8 hours

---

## Epic-Level Acceptance Criteria

- [ ] All services run with single `docker-compose up` command
- [ ] PostgreSQL database initialized with all tables and indexes
- [ ] Backend API accessible at http://localhost:8080
- [ ] AI service accessible at http://localhost:8001
- [ ] Frontend accessible at http://localhost:80
- [ ] All health checks passing
- [ ] Inter-service communication verified (backend ↔ AI service)
- [ ] **LLM pipeline functional**: Novel upload → passage segmentation → character/location/event extraction → embeddings → base scenarios
- [ ] **Cost tracking operational**: All LLM analyses tracked in llm_analysis_metadata
- [ ] Development environment documented in README
- [ ] CI/CD pipeline configured (GitHub Actions or similar)
- [ ] Code quality tools configured (linting, formatting, testing)

## Dependencies

**Blocks**:

- **Epic 1: What If Scenario Foundation**
  - Requires: Stories 0.1-0.6 (infrastructure), 0.7-0.11 (LLM pipeline)
  - Reason: Needs base_scenarios populated and database ready
- **Epic 2: AI Character Adaptation**
  - Requires: Stories 0.1-0.6 (infrastructure), 0.8 (characters), 0.10 (embeddings)
  - Reason: Needs character metadata and RAG embeddings for prompt generation
- **Epic 3: Scenario Discovery & Forking**
  - Requires: Stories 0.1-0.6 (infrastructure), 0.11 (base scenarios)
  - Reason: Needs base scenarios to enable forking
- **Epic 4: Conversation System**
  - Requires: Stories 0.1-0.6 (infrastructure), 0.10 (embeddings)
  - Reason: Needs RAG pipeline for context retrieval
- **Epic 5: Scenario Tree Visualization**
  - Requires: Stories 0.1-0.6 (infrastructure)
  - Reason: Needs database and backend API
- **Epic 6: User Authentication & Social Features**
  - Requires: Stories 0.1-0.6 (infrastructure)
  - Reason: Needs user table and backend authentication

**Internal Dependencies**:

- Story 0.8 → Requires 0.7 (needs passages to extract characters from)
- Story 0.9 → Requires 0.7 (needs passages to extract locations/events/themes)
- Story 0.10 → Requires 0.7 (needs passages to generate embeddings)
- Story 0.11 → Requires 0.8, 0.9, 0.10 (needs metadata to generate base scenarios)
- Story 0.12 → Requires 0.8-0.11 (needs analysis data to display)

**Requires**:

- Development environment (macOS, Linux, or Windows with WSL)
- Docker Desktop installed
- Local LLM models (Llama-2-7B or Mistral-7B) downloaded
- 8GB+ RAM (for running all services, 16GB+ recommended for GPU)
- GPU recommended for faster inference (CUDA/Metal support)

## Success Metrics

**Technical Metrics**:

- All services start within 60 seconds
- Zero service startup failures
- Health checks passing 99%+ of the time
- Inter-service API latency < 100ms (backend → AI service)
- Database connection pool utilization < 80%
- **LLM Pipeline Performance**:
  - Novel processing: <5 minutes for 100k-word novel (all analyses)
  - Character extraction accuracy: >85% (verified on sample novels)
  - Embedding generation: <1 minute per 100 passages
  - Semantic search: <100ms response time

**Cost Metrics**:

- **LLM Analysis Costs** (per 100k-word novel, local compute):
  - Character extraction: <$0.50 (compute cost)
  - Location/event/theme extraction: <$1.00 (combined)
  - Embedding generation: <$0.20 (local model)
  - Total per novel: <$2.00 (electricity and compute)
- Cost tracking accuracy: 100% of analyses logged
- Resource monitoring: GPU/CPU utilization tracked

**Developer Experience Metrics**:

- New developer onboarding: < 30 minutes from clone to running
- Hot reload works for all services (< 3 second refresh)
- Zero "works on my machine" incidents
- Documentation clarity: 90%+ developers succeed on first try

**Data Quality Metrics**:

- Passage segmentation: 95%+ within 200-500 word range
- Character deduplication: <5% duplicate character records
- Base scenario quality: >80% approved by admin verification

## Risk Mitigation

**Risk 1: Docker performance issues on macOS/Windows**

- Mitigation: Document Docker Desktop settings (RAM, CPU allocation)
- Mitigation: Provide native setup instructions as alternative
- Mitigation: Use volume mounts wisely (avoid mounting node_modules)

**Risk 2: Service startup order issues (race conditions)**

- Mitigation: Use `depends_on` with health checks
- Mitigation: Implement retry logic in service initialization
- Mitigation: Document startup order in README

**Risk 3: Database migration conflicts during team development**

- Mitigation: Flyway versioning convention (V{sprint}\_{story}\_\_{description}.sql)
- Mitigation: Always pull latest before creating new migration
- Mitigation: Document migration creation process

**Risk 4: Environment configuration complexity**

- Mitigation: Provide .env.example with all required variables
- Mitigation: Fail fast with clear error if required env var missing
- Mitigation: Document environment setup for each deployment target

## Technical Debt Decisions

**Accepted Debt** (to be addressed post-MVP):

- No Kubernetes/orchestration (Docker Compose sufficient for MVP)
- No Redis caching layer (use in-memory cache)
- No message queue (RabbitMQ/Kafka deferred to scale phase)
- No service mesh (Istio/Linkerd unnecessary for MVP)
- No distributed tracing (add when debugging becomes difficult)

**Won't Build** (architectural decisions):

- Microservices split (two services sufficient: backend + AI)
- GraphQL (REST API simpler for MVP)
- Server-side rendering (SPA sufficient)
- Real-time WebSocket updates (polling acceptable for MVP)

## Testing Strategy

**Unit Tests**:

- Backend: Spring Boot test framework (JUnit 5, Mockito)
- AI service: pytest with fixtures
- Frontend: Vitest + Vue Test Utils

**Integration Tests**:

- Database migrations (verify schema correctness)
- Inter-service API calls (backend → AI service)
- Health check endpoints

**E2E Tests**:

- Full stack smoke test: frontend → backend → database
- Docker Compose startup test (all services healthy)

**Performance Tests**:

- Database connection pool under load
- Concurrent service startup

## Open Questions

1. **Q**: Should we use separate databases for backend and AI service?
   **A**: No. Single PostgreSQL instance, shared schema. Simpler for MVP, can split later.

2. **Q**: How to handle database schema changes in production?
   **A**: Blue-green deployment with Flyway migrations. Zero-downtime migrations required.

3. **Q**: Should we containerize for production or use platform services (Railway)?
   **A**: Railway for MVP (managed PostgreSQL, auto-deploy). Containers for development.

4. **Q**: How to manage secrets (API keys, database passwords)?
   **A**: Development: .env file. Production: Railway environment variables (encrypted at rest).

## Definition of Done

- [ ] All 12 stories completed with acceptance criteria met
- [ ] docker-compose up successfully starts all services
- [ ] All health checks passing
- [ ] Database migrations run cleanly (including all LLM-related tables)
- [ ] **LLM Pipeline Verified**:
  - [ ] Sample novel uploaded and processed successfully
  - [ ] Characters extracted with >85% accuracy
  - [ ] Locations, events, themes extracted
  - [ ] Passage embeddings generated
  - [ ] Base scenarios created and verified
- [ ] **Cost Tracking Operational**:
  - [ ] All LLM analyses tracked in llm_analysis_metadata
  - [ ] Cost dashboard showing accurate spend data
  - [ ] Budget alerts configured
- [ ] README documentation complete with setup instructions
- [ ] .env.example provided with all required variables (LLM_MODEL_PATH, LLM_MODEL_TYPE)
- [ ] Local LLM model download instructions documented
- [ ] CI/CD pipeline configured (optional for MVP, recommended)
- [ ] All services accessible at documented URLs
- [ ] Integration tests passing (inter-service communication + LLM pipeline)
- [ ] Code review completed, no P0/P1 issues
- [ ] At least one developer successfully onboarded using documentation
- [ ] Admin dashboard accessible and functional

---

**Epic Owner**: Tech Lead / Full Stack Lead / AI/ML Engineer

**Start Date**: Week 1, Day 1 of MVP development

**Target Completion**: Week 2, Day 10 (10 working days)

**Estimated Total Effort**: 77 hours

- **Infrastructure**: 25 hours (Stories 0.1-0.6)
- **LLM Pipeline**: 52 hours (Stories 0.7-0.12)

**Priority**: HIGHEST - All other epics blocked until infrastructure (0.1-0.6) completes. Epic 1 requires LLM pipeline (0.7-0.11) to be complete.
