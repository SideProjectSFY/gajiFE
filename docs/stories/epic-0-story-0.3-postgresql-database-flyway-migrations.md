# Story 0.3: PostgreSQL Database Setup & Flyway Migrations

**Epic**: Epic 0 - Project Initialization  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 5 hours

## Description

Set up PostgreSQL 15.x database with Flyway migration management, initial schema versioning, and development data seeding.

## Dependencies

**Blocks**:

- Story 1.1: Scenario Data Model (needs database)
- Story 4.1: Conversation Data Model (needs database)
- Story 6.1: User Authentication Backend (needs users table)
- All stories requiring database persistence

**Requires**:

- Story 0.1: Spring Boot Backend (Flyway integration)
- Story 0.5: Docker Configuration (PostgreSQL container)

## Acceptance Criteria

- [ ] PostgreSQL 15.x running in Docker container (port 5432)
- [ ] Database `gaji_db` created with `gaji_user` owner
- [ ] PostgreSQL extensions enabled:
  - `uuid-ossp` for UUID generation
  - `pg_trgm` for full-text search
  - `vector` (pgvector) for embedding similarity search
- [ ] Flyway integrated in Spring Boot with `spring.flyway.enabled=true`
- [ ] Migration files in `/src/main/resources/db/migration/` following V{version}\_\_{description}.sql naming
- [ ] **32 tables total** (21 core + 11 normalized relationship tables):
  - Core tables: users, novels, novel_chapters, novel_passages, characters, locations, events, themes, narrative_arcs, base_scenarios, root_user_scenarios, leaf_user_scenarios, conversations, messages, conversation_message_links, conversation_emotions, follows, likes, memos, llm_analysis_metadata, character_appearances, location_appearances
  - **Normalized tables** (no JSONB): character_aliases, character_personality_traits, character_relationships, event_characters, theme_passages, narrative_arc_characters, narrative_arc_events, scenario_character_changes, scenario_event_alterations, scenario_setting_modifications, conversation_emotions (structured)
- [ ] **0 JSONB columns** (fully normalized relational design)
- [ ] All foreign keys use CASCADE DELETE for automatic cleanup
- [ ] B-tree indexes on all FK columns and scoring columns (intensity, strength, relevance_score, importance_to_arc)
- [ ] Timezone set to UTC: `SET TIMEZONE='UTC';`
- [ ] Connection pooling configured: HikariCP with max 10 connections
- [ ] Development seed data migration V33\_\_seed_dev_data.sql (only applied with `spring.profiles.active=dev`)
- [ ] Database connection validated on Spring Boot startup
- [ ] Migration history tracked in `flyway_schema_history` table

## Technical Notes

**Database Design Philosophy**: Fully normalized relational design with 32 tables. All JSONB columns have been eliminated in favor of structured relational tables for better queryability, type safety, and performance.

**Migration Sequence (32 migrations)**:

1. V1-6: Core tables (users, novels, novel_chapters, novel_passages, characters, locations)
2. V7-9: Character normalized tables (character_aliases, character_personality_traits, character_relationships)
3. V10-11: Appearance tracking (character_appearances, location_appearances)
4. V12-14: Event/theme/arc (events, themes, narrative_arcs)
5. V15-18: Event/theme/arc normalized tables (event_characters, theme_passages, narrative_arc_characters, narrative_arc_events)
6. V19-21: Scenario tables (base_scenarios, root_user_scenarios, leaf_user_scenarios)
7. V22-24: Scenario type-specific tables (scenario_character_changes, scenario_event_alterations, scenario_setting_modifications)
8. V25-28: Conversation tables (conversations, messages, conversation_message_links, conversation_emotions)
9. V29-31: Social features (follows, likes, memos)
10. V32: LLM metadata (llm_analysis_metadata)

**Example Normalized Tables (V1\_\_create_users_table.sql)**:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$'),
  bio TEXT CHECK (length(bio) <= 500),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example Novels Table (V2\_\_create_novels_table.sql)**:

```sql
CREATE TABLE novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(200) NOT NULL,
  original_language VARCHAR(10),
  era VARCHAR(100),
  genre VARCHAR(100),
  full_text_s3_path VARCHAR(500),
  total_word_count INTEGER,
  publication_year INTEGER,
  isbn VARCHAR(20),
  series_title VARCHAR(300),  -- For book series (e.g., 'The Barton books for girls')
  series_number INTEGER,      -- Book number in series (e.g., 8)
  copyright_status VARCHAR(100) DEFAULT 'unknown',  -- 'public_domain', 'copyrighted', 'creative_commons', 'unknown'
  copyright_note TEXT,        -- Detailed copyright info (e.g., 'Public domain in the USA')
  cover_image_url VARCHAR(500),
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_novels_series ON novels(series_title, series_number);
CREATE INDEX idx_novels_copyright ON novels(copyright_status);
```

**Example Normalized Character Tables (V7-9)**:

```sql
-- V7__create_character_aliases_table.sql
CREATE TABLE character_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  usage_context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, alias)
);

-- V8__create_character_personality_traits_table.sql
CREATE TABLE character_personality_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  trait VARCHAR(100) NOT NULL,
  intensity DECIMAL(3,2) CHECK (intensity BETWEEN 0 AND 1),
  evidence_passage_id UUID REFERENCES novel_passages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, trait)
);

-- V9__create_character_relationships_table.sql
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
```

**Example Scenario Type-Specific Tables (V22-24)**:

```sql
-- V22__create_scenario_character_changes_table.sql
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

**Seed Data (V33\_\_seed_dev_data.sql)**:

```sql
-- Only executed when spring.profiles.active=dev
INSERT INTO users (email, password_hash, username, bio) VALUES
  ('dev@example.com', '$2a$12$hashed_password', 'dev_user', 'Development test user');

-- Insert sample novel, characters, scenarios for testing
```

## QA Checklist

### Functional Testing

- [ ] PostgreSQL container starts successfully
- [ ] Database `gaji_db` accessible with credentials
- [ ] Flyway migrations execute on Spring Boot startup
- [ ] V1\_\_init_schema.sql creates all tables
- [ ] V2\_\_seed_dev_data.sql runs only with dev profile
- [ ] flyway_schema_history tracks migration versions

### Schema Validation

- [ ] All 32 tables created successfully
- [ ] All tables have primary keys (UUID type)
- [ ] Foreign key constraints enforced with CASCADE DELETE
- [ ] UNIQUE constraints on users.email and users.username
- [ ] CHECK constraints validate data ranges (intensity 0-1, strength 0-1, etc.)
- [ ] B-tree indexes created on all FK columns
- [ ] B-tree indexes on scoring columns (intensity, strength, relevance_score, importance_to_arc)
- [ ] UUID, pg_trgm, vector extensions enabled (test with `SELECT uuid_generate_v4()`)
- [ ] **0 JSONB columns exist** (verify with query: `SELECT table_name, column_name FROM information_schema.columns WHERE data_type = 'jsonb'` returns empty)
- [ ] XOR constraints on scenario type-specific tables (root_scenario_id XOR leaf_scenario_id)

### Migration Management

- [ ] Flyway baseline version set correctly
- [ ] Out-of-order migrations rejected
- [ ] Checksum validation prevents manual schema changes
- [ ] Failed migration rolls back transaction

### Performance

- [ ] Connection pool max 10 connections configured
- [ ] Connection acquisition < 50ms
- [ ] B-tree index queries on FK columns optimized (use EXPLAIN ANALYZE)
- [ ] No GIN indexes (JSONB columns eliminated)
- [ ] Query performance for normalized joins acceptable (<100ms for typical queries)

### Security

- [ ] Database user `gaji_user` has limited privileges (no DROP DATABASE)
- [ ] Password not hardcoded in application.yml
- [ ] SSL connection enabled for production profile

## Estimated Effort

5 hours
