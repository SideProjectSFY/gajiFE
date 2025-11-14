# Epic 0: Project Setup & Infrastructure

## Epic Goal

Establish the foundational technical infrastructure for Gaji platform with **Pattern B (API Gateway)** architecture: Spring Boot API Gateway (port 8080) + FastAPI AI Backend (port 8000, internal-only), Vue.js frontend with PandaCSS, **hybrid database** (PostgreSQL for metadata + VectorDB for content/embeddings), and **Gemini API integration** for AI-powered character conversations.

## User Value

While users don't directly interact with infrastructure, this epic ensures:
- **Enhanced Security**: FastAPI and Gemini API keys protected from external access
- **Cost Efficiency**: $700/year saved on SSL certificates and domains
- **Performance**: SSE streaming for real-time AI responses
- **Scalability**: Hybrid database architecture optimized for metadata (PostgreSQL) and semantic search (VectorDB)

## Timeline

**Week 1-2 of MVP development**

- **Infrastructure Setup**: Days 1-3 (Stories 0.1-0.6)
- **Data Import**: Day 4 (Story 0.7)

## Stories Overview

### Phase 1: Infrastructure Setup (~36 hours)

**Stories 0.1-0.6**: Spring Boot API Gateway, FastAPI AI service (internal-only), PostgreSQL (13 metadata tables), Vue.js + PandaCSS + PrimeVue, Docker, health checks

### Phase 2: Data Import (~3 hours)

**Story 0.7**: Import pre-processed Project Gutenberg dataset (passages, characters, locations, events, themes) into VectorDB, create PostgreSQL metadata via Spring Boot API

**Total Epic Effort**: ~39 hours (~5 working days for 2 engineers)

## Stories

### Story 0.1: Spring Boot Backend - API Gateway Setup

**Priority: P0 - Critical**

**Description**: Initialize Spring Boot application as **API Gateway** with WebClient for proxying FastAPI requests, REST API endpoints, and JWT authentication. Implements **Pattern B** architecture where frontend communicates only with Spring Boot.

**Acceptance Criteria**:

- [ ] Spring Boot 3.2+ project initialized with Gradle
- [ ] Dependencies configured:
  - Spring Web (REST API)
  - Spring WebFlux WebClient (FastAPI proxy client)
  - Spring Data JPA (PostgreSQL ORM)
  - Spring Security (JWT authentication)
  - PostgreSQL Driver
  - Lombok (reduce boilerplate)
  - Spring Validation
  - Spring Boot Actuator (health checks)
- [ ] Package structure created:
  ```
  com.gaji.corebackend/
  ├── config/          # WebClient, Security, CORS
  ├── controller/      # REST controllers + AI proxy
  ├── service/         # Business logic
  ├── repository/      # JPA repositories (PostgreSQL only)
  ├── entity/          # JPA entities (13 tables)
  ├── dto/             # Request/response DTOs
  ├── client/          # FastAPIClient (WebClient)
  ├── exception/       # Custom exceptions
  └── util/            # Utility classes
  ```
- [ ] application.yml configured:
  - Profiles: dev, staging, prod
  - `fastapi.base-url: http://localhost:8000` (internal proxy)
  - PostgreSQL connection (metadata only)
- [ ] WebClient configured for FastAPI proxy:
  - Base URL: `http://localhost:8000`
  - Timeout: 60 seconds (AI operations)
  - Error handling with circuit breaker pattern
- [ ] CORS configuration for frontend:
  - Dev: `http://localhost:3000` (Vite default)
  - Prod: `https://gaji.app`
- [ ] API Gateway routes:
  - `/api/v1/*` - Spring Boot direct endpoints
  - `/api/v1/ai/*` - Proxy to FastAPI (e.g., `/api/v1/ai/chat` → `http://localhost:8000/api/chat`)
- [ ] Global exception handler for consistent error responses
- [ ] Health check endpoint: `GET /actuator/health` (includes FastAPI health check)
- [ ] Swagger/OpenAPI documentation auto-generated
- [ ] Logging configured (SLF4J + Logback) with request/response logging
- [ ] Application runs on port 8080

**Technical Notes**:

- **Pattern B Implementation**: Frontend → Spring Boot ONLY. Spring Boot proxies AI requests to FastAPI internally.
- **Security Benefit**: FastAPI URL and Gemini API keys never exposed to frontend
- **Database Access**: Spring Boot accesses PostgreSQL ONLY (no VectorDB libraries)
- Use Spring Boot 3.2+ for Virtual Threads support (improves proxy throughput)
- Configure connection pooling: HikariCP with max 20 connections

**Estimated Effort**: 6 hours

---

### Story 0.2: FastAPI AI Service Setup (Internal-Only)

**Priority: P0 - Critical**

**Description**: Initialize FastAPI service for **internal AI/ML operations** including RAG pipeline, Gemini API integration, and VectorDB management. Service is **NOT externally exposed** - accessed only via Spring Boot proxy.

**Acceptance Criteria**:

- [ ] Python 3.11+ project initialized with **uv** package manager
- [ ] Dependencies configured (requirements.txt):
  - FastAPI
  - Uvicorn (ASGI server)
  - Pydantic (data validation)
  - **google-generativeai** (Gemini API SDK)
  - **chromadb** (VectorDB for dev)
  - **pinecone-client** (VectorDB for prod)
  - httpx (async HTTP client for Spring Boot callbacks)
  - celery (async task queue)
  - redis (Celery broker)
- [ ] Project structure created:
  ```
  ai-backend/
  ├── app/
  │   ├── main.py              # FastAPI app
  │   ├── api/
  │   │   ├── chat.py          # Conversation endpoints
  │   │   ├── ingestion.py     # Novel processing
  │   │   └── health.py        # Health check
  │   ├── services/
  │   │   ├── gemini_client.py # Gemini API integration
  │   │   ├── rag_service.py   # RAG pipeline
  │   │   ├── vectordb_client.py # ChromaDB/Pinecone
  │   │   └── novel_ingestion.py # Gutenberg parsing
  │   ├── models/
  │   │   └── schemas.py       # Pydantic models
  │   ├── config.py            # Environment config
  │   ├── celery_app.py        # Celery configuration
  │   └── utils/
  ├── tests/
  └── requirements.txt
  ```
- [ ] Environment configuration (.env):
  - `GEMINI_API_KEY` (Gemini 2.5 Flash API key)
  - `VECTORDB_TYPE=chromadb` (dev) / `pinecone` (prod)
  - `SPRING_BOOT_URL=http://localhost:8080` (for callbacks)
  - `REDIS_URL=redis://localhost:6379` (Celery broker)
- [ ] Gemini API client configured:
  - Model: `gemini-2.5-flash` for text generation
  - Model: `text-embedding-004` for 768-dim embeddings
  - Temperature: 0.7-0.8 for character conversations
  - Timeout: 30 seconds
- [ ] VectorDB client configured:
  - ChromaDB (dev): Persistent client with local storage
  - Pinecone (prod): Cloud-hosted with API key
  - 5 collections: `novel_passages`, `characters`, `locations`, `events`, `themes`
- [ ] CORS middleware:
  - **Internal access only**: Allow `http://localhost:8080` (Spring Boot)
  - **NO external origins** (not exposed to frontend)
- [ ] Health check endpoint: `GET /health`
  - Returns Gemini API status, VectorDB connection status
- [ ] OpenAPI documentation at `/docs` (internal use only)
- [ ] Logging configured (structlog for JSON logs)
- [ ] Application runs on port 8000 (internal-only, not publicly exposed)
- [ ] Celery worker configured for async tasks (novel ingestion)
- [ ] Base API versioning: `/api/*`

**Technical Notes**:

- **Pattern B Implementation**: FastAPI is NOT externally exposed. Only Spring Boot can call it.
- **Security Benefit**: Gemini API key never exposed to frontend
- **Database Access**: FastAPI accesses VectorDB ONLY (no PostgreSQL drivers)
- **No PostgreSQL Access**: Use Spring Boot REST API for metadata queries
- Use async/await throughout for better performance
- Configure Gemini API retry logic (3 attempts with exponential backoff)
- VectorDB connection pooling: min 5, max 15 connections

**Estimated Effort**: 6 hours

---

### Story 0.3: PostgreSQL Database Setup & Flyway Migrations (Metadata Only)

**Priority: P0 - Critical**

**Description**: Set up PostgreSQL database for **metadata storage only** (13 tables) using Flyway migrations. Novel content and embeddings are stored in VectorDB (ChromaDB/Pinecone). This implements the **hybrid database architecture**.

**Acceptance Criteria**:

- [ ] PostgreSQL 15+ installed/configured (Docker or Railway cloud)
- [ ] Database created: `gaji_db`
- [ ] PostgreSQL extensions enabled:
  - `uuid-ossp` for UUID generation
  - `pg_trgm` for full-text search
- [ ] Flyway configured in Spring Boot for schema migrations
- [ ] **13 metadata tables total** (NO content storage):
  - **Core Tables** (3):
    - `V1__create_users_table.sql`
    - `V2__create_novels_table.sql` (metadata only, stores `vectordb_collection_id`, NO `full_text` column)
    - `V3__create_base_scenarios_table.sql` (stores VectorDB passage IDs as ARRAY)
  - **Scenario Tables** (5):
    - `V4__create_root_user_scenarios_table.sql`
    - `V5__create_leaf_user_scenarios_table.sql`
    - `V6__create_scenario_character_changes_table.sql` (stores `character_vectordb_id`)
    - `V7__create_scenario_event_alterations_table.sql` (stores `event_vectordb_id`)
    - `V8__create_scenario_setting_modifications_table.sql` (stores `location_vectordb_id`)
  - **Conversation Tables** (3):
    - `V9__create_conversations_table.sql` (stores `character_vectordb_id`)
    - `V10__create_messages_table.sql`
    - `V11__create_conversation_message_links_table.sql`
  - **Social Features** (3):
    - `V12__create_user_follows_table.sql`
    - `V13__create_conversation_likes_table.sql`
    - `V14__create_conversation_memos_table.sql`
- [ ] **Hybrid Database Cross-References**:
  - `novels.vectordb_collection_id` (UUID) → VectorDB collection name
  - `base_scenarios.vectordb_passage_ids` (UUID[]) → VectorDB passage documents
  - `scenario_character_changes.character_vectordb_id` (UUID) → VectorDB characters collection
  - `conversations.character_vectordb_id` (UUID) → VectorDB characters collection
- [ ] **NO content columns**:
  - ❌ NO `novels.full_text` (stored in VectorDB `novel_passages` collection)
  - ❌ NO `characters` table (stored in VectorDB `characters` collection)
  - ❌ NO `locations` table (stored in VectorDB `locations` collection)
  - ❌ NO JSONB columns (all data normalized)
- [ ] CASCADE DELETE on all foreign keys for automatic cleanup
- [ ] B-tree indexes on:
  - All FK columns
  - `novels.title`, `novels.author` (search optimization)
  - `base_scenarios.novel_id`, `root_user_scenarios.base_scenario_id`
  - `conversations.user_id`, `conversations.scenario_id`
- [ ] Connection pooling configured (HikariCP):
  - Spring Boot: min 5, max 20 connections
- [ ] Database connection verified from Spring Boot
- [ ] Rollback testing: migrations can be reverted cleanly
- [ ] Seed data script for development:
  - 10 sample users
  - 3 sample novels (metadata only, with `vectordb_collection_id`)

**Schema Highlights** (Metadata Only):

```sql
-- V1__create_users_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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

-- V2__create_novels_table.sql (Metadata Only - NO full_text)
CREATE TABLE novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(200) NOT NULL,
  publication_year INTEGER,
  genre VARCHAR(100),
  vectordb_collection_id VARCHAR(255) NOT NULL UNIQUE,  -- Reference to VectorDB
  ingestion_status VARCHAR(50) DEFAULT 'pending',       -- pending, processing, completed, failed
  total_passages_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- NOTE: Novel content is in VectorDB 'novel_passages' collection
-- NOTE: Characters are in VectorDB 'characters' collection

-- V3__create_base_scenarios_table.sql
CREATE TABLE base_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  vectordb_passage_ids UUID[] NOT NULL,  -- Array of VectorDB passage IDs
  character_vectordb_ids UUID[],         -- Array of VectorDB character IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V6__create_scenario_character_changes_table.sql
CREATE TABLE scenario_character_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES root_user_scenarios(id) ON DELETE CASCADE,
  character_vectordb_id UUID NOT NULL,   -- Reference to VectorDB characters collection
  attribute VARCHAR(100) NOT NULL,
  original_value TEXT,
  new_value TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- NOTE: Character data (name, description, personality) is in VectorDB

-- V9__create_conversations_table.sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES root_user_scenarios(id) ON DELETE SET NULL,
  character_vectordb_id UUID NOT NULL,   -- Reference to VectorDB characters collection
  parent_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (parent_conversation_id IS NULL OR 
         (SELECT parent_conversation_id FROM conversations WHERE id = parent_conversation_id) IS NULL)
);
-- NOTE: ROOT-only forking (max depth 1)

-- V12__create_user_follows_table.sql
CREATE TABLE user_follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id != followee_id)
);

-- V13__create_conversation_likes_table.sql
CREATE TABLE conversation_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, conversation_id)
);

-- V14__create_conversation_memos_table.sql
CREATE TABLE conversation_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 2000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, conversation_id)
);
```

**Technical Notes**:

- **Hybrid Database Philosophy**: PostgreSQL stores ONLY relational metadata (13 tables). VectorDB stores content + embeddings (5 collections).
- **Cross-Database References**: UUIDs link PostgreSQL metadata to VectorDB documents
- **Why Metadata-Only?**:
  - Novel passages: ~100GB for 1000 books → Better in VectorDB
  - Character descriptions: Require semantic search → Better in VectorDB
  - Metadata queries: ACID transactions, complex JOINs → Better in PostgreSQL
- **VectorDB Collections** (managed by FastAPI):
  - `novel_passages` (content chunks, 768-dim embeddings)
  - `characters` (descriptions, personality traits)
  - `locations` (settings)
  - `events` (plot points)
  - `themes` (thematic analysis)
- **Data Flow Example**:
  1. FastAPI ingests novel, stores passages in VectorDB
  2. FastAPI → Spring Boot: `POST /api/internal/novels` (metadata only)
  3. Spring Boot saves to PostgreSQL with `vectordb_collection_id`
  4. Frontend queries Spring Boot for novel metadata
  5. Spring Boot → FastAPI: Get character data from VectorDB
- Use HikariCP connection pooling for optimal performance
- Enable query logging in dev mode for debugging

**Estimated Effort**: 5 hours

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

**Description**: Initialize Vue 3 application with TypeScript, Vite, **PandaCSS**, **PrimeVue**, Pinia, and **single API client** (Spring Boot only). Implements **Pattern B** where frontend communicates ONLY with Spring Boot API Gateway.

**Acceptance Criteria**:

- [ ] Vue 3 project initialized with Vite + TypeScript
- [ ] Package manager: **pnpm** (faster than npm/yarn)
- [ ] Dependencies configured:
  - Vue Router 4 (routing)
  - Pinia (state management)
  - **PandaCSS** (CSS-in-JS with static extraction)
  - **PrimeVue** (UI component library)
  - Axios (HTTP client - Spring Boot ONLY)
  - VueUse (composition utilities)
  - date-fns (date formatting)
- [ ] Project structure created:
  ```
  frontend/
  ├── src/
  │   ├── assets/          # Static assets
  │   ├── components/      # Reusable components
  │   │   ├── common/      # Generic components
  │   │   ├── scenario/    # Scenario-related
  │   │   ├── conversation/# Conversation-related
  │   │   └── user/        # User-related
  │   ├── views/           # Page components
  │   ├── router/          # Route definitions
  │   ├── stores/          # Pinia stores
  │   ├── services/
  │   │   └── api.ts       # Axios instance (Spring Boot only)
  │   ├── types/           # TypeScript types
  │   ├── utils/           # Utility functions
  │   └── styles/          # Global styles
  ├── styled-system/       # Panda CSS generated files
  ├── panda.config.ts      # Panda CSS config
  └── package.json
  ```
- [ ] **PandaCSS configured** with:
  - Custom theme (colors, typography, spacing)
  - Static extraction for zero-runtime CSS
  - TypeScript support for styled props
- [ ] **PrimeVue integrated**:
  - Component library for UI elements (buttons, dialogs, etc.)
  - Compatible with PandaCSS styling
- [ ] Vue Router configured with:
  - Protected routes (require authentication)
  - Public routes (login, register, browse)
  - 404 page
  - Navigation guards
- [ ] Pinia stores initialized:
  - `useAuthStore` (user authentication state)
  - `useUserStore` (current user profile)
  - `useScenarioStore` (scenario browsing/creation)
  - `useConversationStore` (conversation management with SSE)
- [ ] **Single Axios instance** configured:
  - Base URL: `http://localhost:8080/api/v1` (Spring Boot ONLY)
  - ❌ NO FastAPI URL (Pattern B: all AI requests go through Spring Boot proxy)
  - Request interceptor (add JWT token)
  - Response interceptor (handle 401 errors, refresh token)
  - SSE support for streaming AI responses
- [ ] Environment variables:
  - `.env.development`: `VITE_API_BASE_URL=http://localhost:8080/api/v1`
  - `.env.production`: `VITE_API_BASE_URL=https://api.gaji.app/api/v1`
- [ ] TypeScript strict mode enabled
- [ ] ESLint + Prettier configured
- [ ] Application runs on port 3000 (Vite default)
- [ ] pnpm commands:
  - `pnpm dev` - Run dev server
  - `pnpm build` - Build for production
  - `pnpm prepare` - Generate Panda CSS (codegen)

**Technical Notes**:

- **Pattern B Implementation**: Frontend → Spring Boot ONLY. All AI requests proxied internally.
- **Security Benefit**: No FastAPI URL or Gemini API keys exposed to browser
- **PandaCSS Benefits**: 
  - Zero-runtime CSS (all styling extracted at build time)
  - Type-safe styling with TypeScript autocomplete
  - Smaller bundle size vs Tailwind
- Use `<script setup>` syntax for composition API
- Configure path aliases: `@/` → `src/`
- Enable Vite HMR for fast development
- Add meta tags for SEO and social sharing

**Estimated Effort**: 6 hours

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

### Story 0.7: VectorDB Data Import from Pre-processed Dataset

**Priority: P0 - Critical**

**Description**: Import **pre-processed Project Gutenberg dataset** into ChromaDB (dev) / Pinecone (prod) using one-time Python script. Dataset includes pre-chunked passages with 768-dim embeddings, extracted characters, locations, events, and themes. Creates PostgreSQL metadata via Spring Boot API. **No LLM processing needed** (dataset already processed).

**Acceptance Criteria**:

- [ ] **Dataset Structure**:
  - `novels.json` - Novel metadata (title, author, year, genre)
  - `passages.parquet` - Text chunks + 768-dim embeddings (200-500 words each)
  - `characters.json` - Character metadata (name, role, description, personality_traits)
  - `locations.json` - Setting descriptions
  - `events.json` - Plot events
  - `themes.json` - Thematic analysis (optional)
- [ ] **Import Script**: `ai-backend/scripts/import_dataset.py`
  - CLI tool with args: `--dataset-path`, `--vectordb-host`, `--spring-boot-api`
  - Workflow:
    1. Validate dataset structure
    2. Create 5 ChromaDB collections (passages, characters, locations, events, themes)
    3. Batch import passages (1000 per batch)
    4. Batch import characters
    5. Create PostgreSQL metadata via Spring Boot API
    6. Verify import (count validation, semantic search test)
  - Progress tracking: Console output "Importing passages: 1000/5234 (19%)"
  - Error handling: Rollback on failure, retry API calls 3 times
- [ ] **ChromaDB Collections** (5 total):
  - `novel_passages`: Text chunks with embeddings (cosine similarity, HNSW index)
  - `characters`: Character metadata with description embeddings
  - `locations`: Setting descriptions
  - `events`: Plot events
  - `themes`: Thematic elements
- [ ] **PostgreSQL Metadata** (via Spring Boot):
  - Endpoint: `POST /api/internal/novels`
  - Payload:
    ```json
    {
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "publication_year": 1813,
      "genre": "Romance",
      "language": "en",
      "vectordb_collection_id": "novel_UUID",
      "total_passages_count": 523,
      "total_characters_count": 47,
      "ingestion_status": "completed"
    }
    ```
- [ ] **Verification Script**: `scripts/verify_import.py`
  - Check all 5 collections exist
  - Count validation: PostgreSQL count == VectorDB count
  - Semantic search test: "brave protagonist" → returns relevant characters
  - Cross-reference: PostgreSQL novel_id exists in VectorDB
- [ ] **Performance Requirements**:
  - Import speed: > 1000 passages/minute
  - Total time: < 10 minutes for 10 novels
  - Memory usage: < 2GB during import

**Data Flow**:

```
1. Admin runs: python scripts/import_dataset.py --dataset-path /data/gutenberg
2. Script validates dataset structure (novels.json, passages.parquet, etc.)
3. Script creates 5 ChromaDB collections
4. Script imports passages batch (1000 per batch) → ChromaDB novel_passages
5. Script imports characters → ChromaDB characters collection
6. Script → Spring Boot API: POST /api/internal/novels (metadata only)
7. Spring Boot → PostgreSQL: Save novel metadata
8. Script runs verify_import.py to confirm success
```

**Technical Notes**:

- **Why Pre-processed Dataset**: Eliminates 10+ hours of LLM extraction work
- **Embeddings**: 768-dim vectors compatible with Gemini Embedding API (for future updates)
- **Import Script**: Python with ChromaDB client, pandas (parquet), httpx (API calls)
- **Dependencies**: `chromadb==0.4.18`, `pandas==2.1.4`, `pyarrow==14.0.1`, `httpx==0.25.2`
- Store original dataset path for debugging: `novels.dataset_source_path`

**Estimated Effort**: 3 hours

---
  - Collection: `novel_passages`
  - Document schema:
    ```python
    {
      "id": "UUID",
      "novel_id": "UUID (PostgreSQL reference)",
      "chapter_number": 1,
      "passage_number": 5,
      "passage_type": "narrative",
      "text": "It is a truth universally acknowledged...",
      "word_count": 387,
      "embedding": [768-dimensional float vector]
    }
    ```
- [ ] **PostgreSQL Metadata Storage** (via Spring Boot):
  - FastAPI → Spring Boot: `POST /api/internal/novels`
  - Request:
    ```json
    {
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "publication_year": 1813,
      "genre": "Romance",
      "vectordb_collection_id": "novel_UUID",
      "total_passages_count": 523
    }
    ```
  - Spring Boot saves to PostgreSQL `novels` table
- [ ] **Gemini API Integration**:
  - Model: `text-embedding-004` (768 dimensions)
  - Batch embeddings: 100 passages per API call
  - Error handling: retry 3 times with exponential backoff
  - Rate limiting: respect Gemini API quotas
- [ ] **Async Processing** (Celery):
  - Task: `ingest_novel_task(file_path)`
  - Status tracking: `GET /api/ingestion/tasks/{task_id}`
  - Returns: `{status: "processing", progress: "45%", total_passages: 523, processed: 235}`
- [ ] **Error Handling**:
  - Invalid file format → 400 Bad Request
  - File not found → 404 Not Found
  - Gemini API error → retry then fail gracefully
  - VectorDB connection error → log and retry
- [ ] Integration test: Ingest sample Gutenberg book, verify VectorDB + PostgreSQL storage

**Data Flow**:

```
1. Admin uploads Gutenberg .txt file
2. FastAPI parses metadata + body text
3. FastAPI chunks text (200-500 words)
4. FastAPI → Gemini API: Generate embeddings (768-dim)
5. FastAPI → VectorDB: Store passages with embeddings
6. FastAPI → Spring Boot: POST /api/internal/novels (metadata only)
7. Spring Boot → PostgreSQL: Save novel metadata
8. FastAPI → Spring Boot: PATCH /api/internal/novels/{id} (update ingestion_status)
```

**Technical Notes**:

- **Hybrid Database**: Content in VectorDB, metadata in PostgreSQL
- **Why VectorDB?**: ~100GB for 1000 novels, semantic search 10x faster than PostgreSQL
- **Why Not Real-Time API?**: Project Gutenberg dataset is static, batch import is sufficient
- Use Celery + Redis for async processing (novels can take 2-5 minutes)
- Target processing time: ~3 minutes for 100k-word novel
- Store original file path for debugging: `novels.gutenberg_file_path`

**Estimated Effort**: 3 hours

---

## Epic Summary

**Total Stories**: 7 (Stories 0.1-0.7)

**Total Effort**: ~39 hours (~5 working days for 2 engineers)

**Success Criteria**:
- ✅ All 6 services running via Docker Compose
- ✅ Pattern B architecture validated (FastAPI not externally accessible)
- ✅ PostgreSQL 13 metadata tables migrated
- ✅ 5 ChromaDB collections created and populated
- ✅ Health checks passing for all services
- ✅ Sample dataset imported (10+ novels, 5000+ passages, 100+ characters)

**Epic Dependencies**:
- Epic 0 → Epic 1 (Scenario system requires novel data)
- Epic 0 → Epic 2 (AI conversations require character data)

---
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
