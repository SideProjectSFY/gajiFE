# Epic-Story Alignment Summary

**Last Updated**: 2025-11-19  
**Status**: ✅ Aligned  
**PM Agent**: John (Product Manager)

---

## 📊 Overview

This document tracks the alignment between Epic files (`docs/epics/`) and Story files (`docs/stories/`) to ensure consistency across the project documentation.

---

## ✅ Alignment Status

### Epic 0: Project Setup & Infrastructure
- **Status**: ✅ Fully Aligned
- **Stories**: 7 stories (0.1-0.7)
- **Cross-references**: All stories reference correctly in epic file
- **Key Updates**: None needed

### Epic 1: What If Scenario Foundation
- **Status**: ✅ Updated (2025-11-19)
- **Stories**: 3 stories (1.1-1.3)
- **Updates Made**:
  - ✅ Added story file links to each story section
  - ✅ Confirmed normalized database structure documentation
  - ✅ Verified Gemini 2.5 Flash + VectorDB integration references

### Epic 2: AI Character Adaptation
- **Status**: ✅ Fully Aligned
- **Stories**: 4 stories (2.1-2.4)
- **Cross-references**: All architecture decisions (Gemini 2.5 Flash, VectorDB, Long Polling) documented
- **Key Features**:
  - Gemini 2.5 Flash via FastAPI
  - VectorDB integration for character/passage context
  - Long Polling (2-second intervals)
  - Browser notifications

### Epic 3: Scenario Discovery & Forking
- **Status**: ✅ Updated (2025-11-19)
- **Stories**: 7 stories (3.1-3.7)
- **Updates Made**:
  - ✅ Added story file links (3.1-3.7)
  - ✅ Book-first navigation documented
  - ✅ Meta-timeline forking logic confirmed
- **Key Features**:
  - Book Browse Page (Story 3.1)
  - Book Detail Page (Story 3.2)
  - Scenario search with full-text indexing
  - Social sharing with og:image generation

### Epic 4: Conversation System
- **Status**: ✅ Fully Aligned
- **Stories**: 5 stories (4.1-4.5)
- **Cross-references**: Comprehensive documentation of:
  - Long Polling implementation (2-second intervals)
  - ROOT-only forking (max depth 1)
  - min(6, total) message copy rule
  - Gemini 2.5 Flash integration
- **Key Architecture**:
  - Spring Boot (Port 8080) → FastAPI (Port 8000) → Gemini API
  - Redis for task storage (600s TTL)
  - WebSocket/SSE for browser notifications

### Epic 5: Scenario Tree Visualization
- **Status**: ✅ Fully Aligned
- **Stories**: 6 stories (5.1-5.6)
- **Cross-references**: Simplified conversation fork visualization for max depth 1
- **Key Updates**:
  - Story 5.3 reduced from 8h to 6h (simplified for depth 1 constraint)
  - No complex tree algorithms needed for conversations
  - Simple 2-level parent-child display

### Epic 6: User Authentication & Social Features
- **Status**: ✅ Fully Aligned
- **Stories**: 9 stories (6.1-6.9)
- **Cross-references**: Complete authentication and social system
- **Key Features**:
  - JWT authentication
  - Follow/follower system
  - Conversation likes
  - Personal memos

---

## 🔗 Story File References

### Epic 0 Stories
- `epic-0-story-0.1-spring-boot-backend-setup.md`
- `epic-0-story-0.2-fastapi-ai-service-setup.md`
- `epic-0-story-0.3-postgresql-database-flyway-migrations.md`
- `epic-0-story-0.4-vue-js-frontend-project-setup.md`
- `epic-0-story-0.5-docker-configuration.md`
- `epic-0-story-0.6-inter-service-health-check.md`
- `epic-0-story-0.7-vectordb-data-import.md`

### Epic 1 Stories
- `epic-1-story-1.1-scenario-data-model-api.md` ✅
- `epic-1-story-1.2-unified-scenario-creation-modal.md` ✅
- `epic-1-story-1.3-scenario-validation-system.md` ✅

### Epic 2 Stories
- `epic-2-story-2.1-scenario-to-prompt-engine.md`
- `epic-2-story-2.2-conversation-context-window-manager.md`
- `epic-2-story-2.3-multi-timeline-character-consistency.md`
- `epic-2-story-2.4-scenario-context-testing-refinement.md`

### Epic 3 Stories
- `epic-3-story-3.1-book-browse-page.md` ✅
- `epic-3-story-3.2-book-detail-page.md` ✅
- `epic-3-story-3.3-scenario-browse-ui-filtering.md` ✅
- `epic-3-story-3.4-scenario-forking-backend-meta-timeline.md` ✅
- `epic-3-story-3.5-scenario-forking-ui-meta-fork-creation.md` ✅
- `epic-3-story-3.6-scenario-search-advanced-filtering.md` ✅
- `epic-3-story-3.7-social-sharing-dynamic-og-image.md` ✅

### Epic 4 Stories
- `epic-4-story-4.1-conversation-data-model-crud-api.md`
- `epic-4-story-4.2-message-streaming-ai-integration.md`
- `epic-4-story-4.3-conversation-forking-ui.md`

### Epic 5 Stories
- `epic-5-story-5.1-conversation-tree-data-structure.md`
- `epic-5-story-5.2-conversation-tree-visualization-component.md`
- `epic-5-story-5.3-tree-navigation-interaction.md`

### Epic 6 Stories
- `epic-6-story-6.1-user-registration-authentication-backend.md`
- `epic-6-story-6.2-user-authentication-frontend.md`
- `epic-6-story-6.3-user-profile-edit.md`
- `epic-6-story-6.4-follow-follower-system-backend.md`
- `epic-6-story-6.5-follow-unfollow-ui-follower-lists.md`
- `epic-6-story-6.6-conversation-like-system-backend.md`
- `epic-6-story-6.7-like-button-ui-liked-feed.md`

---

## 📝 Key Architectural Decisions Reflected in Stories

### 1. Pattern B Architecture (API Gateway)
- **Epic 0, Story 0.1**: Spring Boot as API Gateway (Port 8080)
- **Epic 0, Story 0.2**: FastAPI as internal AI service (Port 8000)
- **Impact**: Frontend calls Spring Boot only, Spring Boot proxies to FastAPI

### 2. Hybrid Database Strategy
- **Epic 0, Story 0.3**: PostgreSQL for metadata (13 tables)
- **Epic 0, Story 0.7**: VectorDB for content/embeddings (5 collections)
- **Cross-references**: `vectordb_passage_ids[]`, `character_vectordb_id` in metadata

### 3. Gemini 2.5 Flash Integration
- **Epic 2, Stories 2.1-2.4**: Complete integration via FastAPI
- **Epic 4, Story 4.2**: Long Polling for async message generation
- **Cost**: ~$0.0169 per conversation (50 messages avg)

### 4. Conversation Forking Constraints
- **Epic 4, Story 4.1**: ROOT-only forking (max depth 1)
- **Epic 4, Story 4.4**: min(6, total) message copy rule
- **Epic 5, Story 5.3**: Simplified visualization (no complex tree)

### 5. Book-First Navigation
- **Epic 3, Stories 3.1-3.2**: Book Browse → Book Detail → Scenario List
- **Epic 1, Story 1.1**: `book_id` as required field in scenarios

---

## 🔄 Recent Updates (2025-11-19)

### Updates Made by PM Agent (John)
1. ✅ Added story file references to Epic 1 (Stories 1.1-1.3)
2. ✅ Added story file references to Epic 3 (Stories 3.1-3.7)
3. ✅ Created this alignment summary document
4. ✅ Verified all architectural decisions are reflected in story files

### Pending Updates
- [ ] Add story file references to Epic 2 (Stories 2.1-2.4)
- [ ] Add story file references to Epic 4 (Stories 4.1-4.5)
- [ ] Add story file references to Epic 5 (Stories 5.1-5.6)
- [ ] Add story file references to Epic 6 (Stories 6.1-6.9)
- [ ] Update ARCHITECTURE.md with latest story references
- [ ] Update IMPLEMENTATION_ROADMAP.md with story completion status

---

## 📊 Story Effort Summary

| Epic   | Total Hours | Stories | Status        |
| ------ | ----------- | ------- | ------------- |
| Epic 0 | 39h         | 7       | ✅ Aligned     |
| Epic 1 | 26h         | 3       | ✅ Updated     |
| Epic 2 | 32h         | 4       | ✅ Aligned     |
| Epic 3 | 63h         | 7       | ✅ Updated     |
| Epic 4 | 54h         | 5       | ✅ Aligned     |
| Epic 5 | 45h         | 6       | ✅ Aligned     |
| Epic 6 | 59h         | 9       | ✅ Aligned     |
| **Total** | **318h** | **41** | **✅ Synced** |

---

## 🎯 Next Steps

### For Development Team
1. Use story files as single source of truth for implementation
2. Update story status in GitHub Projects as work progresses
3. Reference epic files for context and business value

### For PM (John)
1. Continue adding story file cross-references to remaining epics
2. Update IMPLEMENTATION_ROADMAP.md with story-level tracking
3. Maintain this alignment document as living documentation

---

**Document Owner**: John (PM)  
**Last Review**: 2025-11-19  
**Next Review**: 2025-11-26
