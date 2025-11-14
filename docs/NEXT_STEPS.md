# Gaji Platform: Next Steps# Gaji Project: Next Steps & Implementation Guide



**Last Updated**: 2025-01-14  **Documentation Status**: ✅ 100% Complete (35/35 stories)  

**Current Phase**: Architecture Complete, Ready for Implementation  **Last Updated**: 2025-11-13  

**Status**: 🟢 All Documentation Complete**Project Phase**: Planning → Implementation Transition



------



## 📋 Current Status## 📊 Current Project Status



### ✅ Completed Work### Documentation Completion: 35/35 Stories (100%)



#### Architecture & Design (100% Complete)| Epic                               | Stories   | Status          | Estimated Effort |

- [x] MSA Backend Architecture finalized (Spring Boot + FastAPI)| ---------------------------------- | --------- | --------------- | ---------------- |

- [x] Hybrid Database Strategy documented (PostgreSQL + VectorDB)| **Epic 0**: Project Initialization | 6/6       | ✅ Complete     | 38 hours         |

- [x] **Pattern B (API Gateway) selected and documented**| **Epic 1**: Scenario Foundation    | 5/5       | ✅ Complete     | 42 hours         |

- [x] Frontend Access Pattern decided (Single entry point)| **Epic 2**: AI Adaptation Layer    | 4/4       | ✅ Complete     | 34 hours         |

- [x] Data Streaming Strategy (SSE) designed| **Epic 3**: Scenario Discovery     | 5/5       | ✅ Complete     | 45 hours         |

- [x] Project Structure (Nx Monorepo) planned| **Epic 4**: Conversation System    | 3/3       | ✅ Complete     | 26 hours         |

| **Epic 5**: Tree Visualization     | 3/3       | ✅ Complete     | 26 hours         |

#### Documentation (100% Complete)| **Epic 6**: User Auth & Social     | 9/9       | ✅ Complete     | 59 hours         |

- [x] 6 Architecture Decision Records (ADRs) created| **TOTAL**                          | **35/35** | **✅ Complete** | **~270 hours**   |

- [x] Pattern B Migration Guide (1,200+ lines)

- [x] Complete Architecture Summary consolidated### Story Quality Metrics

- [x] MSA Optimization Strategies (7 strategies)

- [x] Frontend-Backend Access Pattern Comparison- ✅ Average Acceptance Criteria: 11 per story

- [x] Database Strategy Comparison- ✅ Average QA Test Cases: 23 per story

- [x] All Korean content translated to English- ✅ Code Examples: 100% (all stories include full implementations)

- ✅ Dependencies: 100% bi-directional mapping

#### Epic/Story Planning (100% Complete)- ✅ Average Story File Size: ~450 lines

- [x] 7 Epics fully specified (Epic 0-6)

- [x] 37 User Stories documented with acceptance criteria---

- [x] Effort estimates completed (~290 hours total)

- [x] Technical implementation details provided## 🎯 Recommended Next Steps



---### Option 1: Start Implementation (Most Common Path) ⭐



## 🎯 Immediate Next Steps (This Week)**Phase 1 - Foundation (2-3 weeks)**:



### 1. Development Environment Setup```

Epic 0.1-0.6: Project setup, Docker, DB, API foundation

**Priority**: 🔴 Critical  Epic 1.1-1.5: Scenario CRUD operations

**Estimated Time**: 4 hours  Deliverable: Working scenario creation/viewing

**Owner**: Both developers```



**Tasks**:**Phase 2 - Core Features (3-4 weeks)**:

- [ ] Clone repository and review all documentation

- [ ] Install required tools (Java 17+, Python 3.11+, Node.js 18+, Docker)```

- [ ] Set up local PostgreSQL and ChromaDB via DockerEpic 2.1-2.4: AI integration

- [ ] Configure environment variables (.env files)Epic 4.1-4.3: Conversation system with ROOT-only fork

- [ ] Run initial health checksDeliverable: AI conversations with forking

- [ ] Review [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)```



**Success Criteria**:**Phase 3 - Discovery & Visualization (2-3 weeks)**:

- ✅ All services start successfully locally

- ✅ Database connections verified```

- ✅ Health check endpoints respondingEpic 3.1-3.5: Search, social sharing

Epic 5.1-5.3: D3.js tree visualization

---Deliverable: Full discovery experience

```

### 2. Pattern B Migration - Phase 1: Spring Boot Proxy

**Phase 4 - Social Features (3-4 weeks)**:

**Priority**: 🔴 Critical  

**Estimated Time**: 16 hours  ```

**Owner**: Backend developer (민영재)Epic 6.1-6.9: Auth, follow, like, memos

Deliverable: Complete social platform

**Tasks**:```

- [ ] Create AIProxyController class

- [ ] Update WebClientConfig for FastAPI connection**Total Implementation Time**: 10-14 weeks

- [ ] Create DTO classes for AI requests/responses

- [ ] Write unit tests for proxy controller---

- [ ] Write integration tests for Spring Boot ↔ FastAPI

### Option 2: Create Supporting Documentation

**Reference**: [PATTERN_B_MIGRATION_GUIDE.md](./PATTERN_B_MIGRATION_GUIDE.md) - Phase 1

1. **DEVELOPMENT_SETUP.md**

**Success Criteria**:

- ✅ AIProxyController proxies all FastAPI endpoints   - Step-by-step local dev environment setup

- ✅ Unit tests pass (>80% coverage)   - Docker compose instructions

- ✅ Integration tests verify end-to-end flow   - Database migration guide

   - Environment variables configuration

---

2. **API_DOCUMENTATION.md**

### 3. Pattern B Migration - Phase 2: Frontend Update

   - Consolidate all 40+ endpoints

**Priority**: 🔴 Critical     - Request/response examples

**Estimated Time**: 8 hours     - Error codes and handling

**Owner**: Frontend developer (구서원)   - Authentication flows



**Tasks**:3. **DATABASE_SCHEMA.md**

- [ ] Create unified API client (`frontend/src/services/api.ts`)

- [ ] Remove dual API clients (coreApi, aiApi)   - Unified schema documentation

- [ ] Update all service layer calls to use single client   - All 15+ migrations consolidated

- [ ] Update SSE EventSource paths to use Spring Boot proxy   - Relationship diagrams

- [ ] Update environment variables (VITE_API_URL)   - Index strategy documentation

- [ ] Write E2E tests to verify no direct FastAPI calls

4. **TESTING_GUIDE.md**

**Reference**: [PATTERN_B_MIGRATION_GUIDE.md](./PATTERN_B_MIGRATION_GUIDE.md) - Phase 2

   - Unit/integration test patterns

**Success Criteria**:   - E2E test scenarios

- ✅ Only 1 API client exists   - QA checklist execution guide

- ✅ All API calls go through Spring Boot   - Performance testing guidelines

- ✅ E2E tests confirm Pattern B implementation

5. **DEPLOYMENT.md**

---   - Railway deployment guide

   - Vercel frontend deployment

## 🚀 Short-term Goals (Next 2 Weeks)   - Environment configuration

   - CI/CD pipeline setup

### Week 1: Pattern B Migration Complete

---

**Goal**: Fully implement and test Pattern B architecture

### Option 3: Generate Project Management Artifacts

**Deliverables**:

- ✅ AIProxyController implemented and tested1. **GitHub Issues**

- ✅ Frontend unified API client

- ✅ Infrastructure updated (Docker, CORS)   - Convert 35 stories → GitHub Issues

- ✅ All tests passing (unit, integration, E2E)   - Add labels: `epic-0`, `epic-1`, ..., `epic-6`

   - Add story points (Fibonacci scale)

---   - Link dependencies



### Week 2: Epic 0 Foundation2. **Project Board**



**Goal**: Complete project infrastructure setup (Epic 0)   - Create swim lanes: Backlog, In Progress, Review, Done

   - Organize by epic

**Stories to Complete**:   - Sprint planning views

- [ ] 0.1-0.6: Basic infrastructure

- [ ] 0.7: Novel ingestion pipeline (Gutenberg → VectorDB)3. **Sprint Structure**

- [ ] 0.8: LLM character extraction (Gemini)

   - Define 2-week sprints

**Success Criteria**:   - Sprint 1-2: Epic 0 + Epic 1

- ✅ All services deployed and communicating   - Sprint 3-4: Epic 2 + Epic 4

- ✅ Database schema created via Flyway   - Sprint 5-6: Epic 3 + Epic 5

- ✅ At least 1 novel ingested and processed   - Sprint 7-8: Epic 6



---4. **Story Points Assignment**

   - 2-3 points: 4-6 hours

## 📅 Mid-term Goals (Next Month)   - 5 points: 8-10 hours

   - 8 points: 12+ hours

### Month 1: Core Features (Epic 1-2)

---

**Epic 1: Scenario Foundation** (40 hours)

- Scenario data model & API### Option 4: Build MVP Prototype (Fastest Validation)

- 3 scenario types UI

- Validation system**Minimal Scope** (2-3 weeks):



**Epic 2: AI Character Adaptation** (40 hours)✅ **Include**:

- Scenario → prompt engine

- Context window manager- Epic 0: Basic setup

- Character consistency- Epic 1.1-1.3: Scenario creation

- Epic 2.1-2.2: Basic AI chat

**Milestones**:- Epic 4.1: Simple conversations (no fork)

- Week 3: Epic 1 complete

- Week 4: Epic 2 complete❌ **Defer**:



---- Epic 3, 5, 6 (add later)

- Advanced features (search, tree viz, social)

## 🎯 Long-term Goals (Next 3 Months)

**Goal**: Validate core "What If" concept with minimal investment

### Month 2: Social Features (Epic 3-4)

- Scenario discovery & forking---

- Conversation system with SSE

- 6-message fork logic### Option 5: CI/CD & DevOps Setup



### Month 3: Visualization & Polish (Epic 5-6)1. **GitHub Actions Workflows**

- D3.js tree visualization

- User authentication   ```yaml

- Social features (likes, follows, memos)   - lint: ESLint, Prettier, Checkstyle

   - test: JUnit, pytest, Vitest

**Milestone**: Beta launch with 100 users   - build: Docker images

   - deploy: Railway + Vercel

---   ```



## 📊 Implementation Priorities2. **Quality Gates**



### Priority 1: Must Have (MVP)   - Code coverage >80%

1. Pattern B Migration   - No critical security vulnerabilities

2. Novel Ingestion   - All tests passing

3. Scenario Creation   - Successful Docker build

4. AI Conversations

5. Basic User Auth3. **Staging Environment**



### Priority 2: Should Have (Beta)   - Auto-deploy to staging on `develop` branch

1. Scenario Forking   - Manual approval for production

2. Conversation Forking (6-message copy)   - Database migration automation

3. SSE Message Streaming

4. Tree Visualization4. **Monitoring**

5. Social Features   - Application logs (Railway)

   - Error tracking (Sentry)

---   - Performance monitoring (New Relic)



## 📈 Success Metrics---



### Technical KPIs### Option 6: Technical Validation

| Metric | Target |

|--------|--------|1. **PostgreSQL 15.x + Spring Boot 3.x Compatibility**

| API Response Time (P95) | < 500ms |

| AI First Token | < 1000ms |   - Test recursive CTEs performance

| Error Rate | < 0.1% |   - Validate JSONB queries

| Test Coverage | > 80% |   - Benchmark Flyway migrations



### Product KPIs2. **D3.js v7 Performance Testing**

| Metric | MVP | Beta |

|--------|-----|------|   - Test with 1000+ node trees

| Daily Active Users | 10 | 100 |   - Zoom/pan performance

| Scenarios Created | 50 | 500 |   - Mobile rendering validation

| Conversations Started | 100 | 1000 |

3. **OpenAI API Rate Limits**

---

   - Calculate expected load

## ✅ Action Items Summary   - Test rate limiting logic

   - Validate exponential backoff

### This Week

1. [ ] **민영재**: Implement AIProxyController (16h)4. **Database Query Performance**

2. [ ] **구서원**: Update Frontend API client (8h)   - Index optimization

3. [ ] **구서원**: Update Docker configuration (4h)   - Query plan analysis

4. [ ] **Both**: Environment setup and testing (4h)   - Connection pool tuning



### Next Week---

1. [ ] **민영재**: Flyway migrations + Novel ingestion (16h)

2. [ ] **구서원**: Vue.js frontend basic setup (12h)## 🚀 Implementation Kickstart Guide

3. [ ] **Both**: Health check endpoints + Integration tests (4h)

### Step 1: Development Environment Setup

---

```bash

## 📚 Key References# Clone repository (if not already done)

git clone https://github.com/yourusername/gaji.git

### Start Herecd gaji

- [COMPLETE_ARCHITECTURE_SUMMARY.md](./COMPLETE_ARCHITECTURE_SUMMARY.md) - **Complete overview**

- [PATTERN_B_MIGRATION_GUIDE.md](./PATTERN_B_MIGRATION_GUIDE.md) - **Migration steps**# Install dependencies

cd core-backend && ./gradlew build

### Architecturecd ../ai-backend && uv venv && uv pip install -r requirements.txt

- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) - All 6 ADRscd ../frontend && pnpm install

- [architecture.md](../architecture.md) - System architecture

# Start Docker services

### Implementationdocker-compose up -d postgres

- [MSA_BACKEND_OPTIMIZATION.md](./MSA_BACKEND_OPTIMIZATION.md) - 7 strategies

- [DATABASE_STRATEGY_COMPARISON.md](./DATABASE_STRATEGY_COMPARISON.md) - Hybrid DB# Run database migrations

- [DATA_STREAM_STRATEGY_UX.md](./DATA_STREAM_STRATEGY_UX.md) - SSE streamingcd core-backend && ./gradlew flywayMigrate

```

---

### Step 2: Review Story Files

**Status**: Ready to Begin Development 🚀  

**Next Review**: After Week 1 (Pattern B migration)All stories are in `docs/stories/` with complete specifications:


- `epic-0-story-0.1-repository-setup.md`
- `epic-0-story-0.2-docker-configuration.md`
- ... (35 total)

Each file contains:

- ✅ Complete acceptance criteria
- ✅ Production-ready code examples
- ✅ QA checklist (20-27 test cases)
- ✅ Dependencies and estimated effort

### Step 3: Start with Epic 0.1

```bash
# Epic 0.1: Repository Setup & Structure
# See: docs/stories/epic-0-story-0.1-repository-setup.md

# Key tasks:
# 1. Finalize monorepo structure
# 2. Configure Git workflows
# 3. Setup branch protection rules
# 4. Document contribution guidelines
```

### Step 4: Progress Tracking

Update this file or create a separate `PROGRESS.md`:

```markdown
## Sprint 1 (Week 1-2)

- [x] Epic 0.1: Repository Setup
- [x] Epic 0.2: Docker Environment
- [ ] Epic 0.3: Database Setup (In Progress)
- [ ] Epic 0.4: Backend API Foundation
- [ ] Epic 0.5: Frontend Foundation
- [ ] Epic 0.6: CI/CD Pipeline
```

---

## 📋 Pre-Implementation Checklist

Before starting implementation, ensure:

### Technical Setup

- [ ] Development machine meets requirements (Java 17+, Python 3.11+, Node.js 18+)
- [ ] Docker Desktop installed and running
- [ ] PostgreSQL 15.x accessible (local or Docker)
- [ ] IDE configured (IntelliJ/VS Code recommended)
- [ ] Git repository initialized with proper .gitignore

### Documentation Review

- [ ] Read `docs/PRD.md` for business context
- [ ] Review `docs/architecture.md` for technical architecture
- [ ] Understand fork business rules (Scenario vs. Conversation)
- [ ] Review `docs/USER_FLOW.md` for UX expectations

### API Keys & Secrets

- [ ] OpenAI API key obtained ($18 credit for testing)
- [ ] Railway account created (for deployment)
- [ ] Vercel account created (for frontend hosting)
- [ ] Environment variables documented

### Team Alignment

- [ ] Development roles assigned (if team project)
- [ ] Sprint schedule defined
- [ ] Communication channels established (Slack/Discord)
- [ ] Code review process agreed upon

---

## 🎓 Key Business Rules Reference

### Fork Types (Critical!)

1. **Scenario Fork**:

   - ✅ Unlimited depth permitted
   - Example: "Hermione in Slytherin" → "Hermione in Slytherin AND Head Girl"
   - Uses `parent_scenario_id` for tree structure

2. **Conversation Fork**:
   - ⚠️ ROOT conversations only (parent_conversation_id IS NULL)
   - ⚠️ Maximum depth: 1 level (parent → child, no grandchildren)
   - ⚠️ Auto-copy: min(6, total_message_count) most recent messages

### Database Constraints

```sql
-- Conversation fork constraint
CHECK (
  parent_conversation_id IS NULL OR
  (SELECT parent_conversation_id FROM conversations WHERE id = parent_conversation_id) IS NULL
)

-- Forked conversations cannot be re-forked
CHECK (
  parent_conversation_id IS NULL OR
  NOT EXISTS (SELECT 1 FROM conversations WHERE parent_conversation_id = NEW.id)
)
```

### Conversation Start Rule

- Users ALWAYS initiate conversations
- No AI-first messages allowed
- First message must be from user (role='user')

---

## 💡 Additional Recommendations

### 1. Seed Data Strategy (Pre-Launch)

```markdown
**AI-Generated Scenarios** (20-30 scenarios):

- Harry Potter: 5-7 scenarios
- Pride & Prejudice: 3-5 scenarios
- Great Gatsby: 3-5 scenarios
- 1984: 2-4 scenarios
- Other popular books: 1-2 scenarios each

**Creator Partnerships** ($3,000 budget):

- 10 BookTokers/BookTubers @ $300 each
- Create viral "What If" scenarios
- "Let's gaji this timeline" video content

**University Coursework**:

- Partner with 5-10 literature professors
- Assign "Create 3 What If scenarios" homework
- 200 students × 3 = 600 free quality scenarios
```

### 2. Quality Metrics to Track

During implementation, monitor:

- [ ] Test coverage per epic (target: >80%)
- [ ] Story completion rate (velocity tracking)
- [ ] Technical debt accumulation
- [ ] Bug count per sprint
- [ ] Performance benchmarks (API response times)

### 3. Risk Mitigation

**Technical Risks**:

- OpenAI rate limits → Implement exponential backoff (Story 2.4)
- Database performance → Index optimization (Stories 3.4, 5.1)
- Tree visualization performance → Limit depth/breadth (Story 5.2)

**Business Risks**:

- Cold start problem → Seed 500+ scenarios pre-launch
- Quality control → Implement scenario validation (Story 1.2)
- User adoption → Target fandoms first (BookTok, AO3)

---

## 🔗 Quick Reference Links

- **PRD**: `docs/PRD.md`
- **Architecture**: `docs/architecture.md`
- **All Stories**: `docs/stories/`
- **Epics**: `docs/epics/`
- **CLAUDE Guide**: `CLAUDE.md`

---

## ❓ Questions or Issues?

If you encounter any ambiguity or need clarification:

1. Check story file for detailed specifications
2. Review PRD for business context
3. Consult architecture.md for technical decisions
4. Review related epic file for broader context
5. Check CLAUDE.md for development commands

---

## 🎉 Ready to Start?

**Recommended First Action**:

```bash
# Option A: Start implementing Epic 0.1
open docs/stories/epic-0-story-0.1-repository-setup.md

# Option B: Create development setup guide first
# (see Option 2 above)

# Option C: Build minimal MVP prototype
# (see Option 4 above)
```

**The journey of 270 hours begins with a single story!** 🚀

---

**Last Updated**: 2025-11-13  
**Documentation Phase**: ✅ Complete  
**Next Phase**: Implementation
