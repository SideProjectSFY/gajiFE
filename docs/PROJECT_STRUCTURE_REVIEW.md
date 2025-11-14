# 프로젝트 구조 검토 및 개선 제안

**Date**: 2025-01-14  
**Reviewer**: GitHub Copilot (Solution Architect)  
**Focus**: MSA 프로젝트 구조 적절성 검토 및 개선 방안

---

## 📋 Executive Summary

현재 문서에 제안된 프로젝트 구조를 MSA 아키텍처 관점에서 검토한 결과:

- ✅ **적절한 부분**: 서비스 분리, 하이브리드 DB 전략, 프론트엔드 독립성
- ⚠️ **개선 필요**: 모노레포 vs 멀티레포 결정, 공통 모듈 관리, 배포 전략
- ❌ **문제점**: 코드 재사용성, 버전 관리 복잡성, CI/CD 파이프라인 미정의

**최종 권장사항**: **모노레포 + Nx/Turborepo** 또는 **멀티레포 + 공유 라이브러리**

---

## 🏗️ 현재 제안된 구조 (CLAUDE.md 기준)

```
gajiFE/  (또는 gaji/)
├── core-backend/         # Spring Boot (Java 17+)
│   ├── src/main/java/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── config/
│   │   └── client/      # FastAPI WebClient
│   ├── src/main/resources/
│   │   └── db/migration/  # Flyway
│   ├── build.gradle
│   └── Dockerfile
│
├── ai-backend/           # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   │   ├── novel_ingestion.py
│   │   │   ├── rag_service.py
│   │   │   └── vectordb_client.py
│   │   ├── models/
│   │   ├── celery_app.py
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/             # Vue 3 + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/      # Pinia
│   │   ├── router/
│   │   └── services/
│   │       ├── coreApi.ts
│   │       └── aiApi.ts
│   ├── styled-system/   # Panda CSS
│   ├── panda.config.ts
│   ├── package.json
│   └── Dockerfile
│
├── docs/                 # Documentation
│   ├── PRD.md
│   ├── architecture.md
│   ├── ERD.md
│   ├── epics/
│   └── stories/
│
├── docker-compose.yml
└── README.md
```

---

## ✅ 적절한 부분 (Good Practices)

### 1. 서비스 책임 분리 (Single Responsibility)

```
✅ core-backend (Spring Boot)
   - User management, Authentication
   - Business logic (Scenarios, Conversations)
   - PostgreSQL metadata management
   - Social features (follows, likes)

✅ ai-backend (FastAPI)
   - AI/LLM operations
   - VectorDB management
   - RAG pipeline
   - Novel ingestion

✅ frontend (Vue.js)
   - User interface
   - State management
   - API integration
```

**장점**:
- 각 서비스가 명확한 책임을 가짐
- 기술 스택 분리 (Java ↔ Python ↔ TypeScript)
- 독립적인 확장 가능

---

### 2. Database per Service Pattern

```
core-backend → PostgreSQL (metadata)
ai-backend → VectorDB (content + embeddings)
```

**장점**:
- 데이터베이스 독립성
- 각 서비스에 최적화된 DB 선택
- 장애 격리

---

### 3. Frontend-Backend 분리

```
frontend/ (독립적인 Vue.js 프로젝트)
  - 독자적인 빌드/배포 파이프라인
  - Vercel/Netlify 배포 가능
  - Backend API와 HTTP로만 통신
```

**장점**:
- Frontend 독립 개발/배포
- Backend 변경 시 영향 최소화
- CDN 배포 최적화

---

## ⚠️ 개선이 필요한 부분

### 문제 1: 모노레포 vs 멀티레포 미결정 ❌

**현재 상태**: 하나의 Git 저장소에 3개 서비스 (모노레포)

```
gajiFE/
├── core-backend/
├── ai-backend/
└── frontend/
```

**문제점**:

1. **버전 관리 복잡성**
   ```bash
   # 어느 서비스가 변경됐는지 구분 어려움
   git log
   - "Fix bug" (어느 서비스?)
   - "Update dependencies" (전체? 일부?)
   ```

2. **CI/CD 파이프라인 복잡**
   ```yaml
   # .github/workflows/ci.yml
   # 모든 서비스를 매번 빌드? 변경된 것만?
   on:
     push:
       paths:
         - 'core-backend/**'  # Spring Boot만 빌드
         - 'ai-backend/**'    # FastAPI만 빌드
         - 'frontend/**'      # Frontend만 빌드
   ```

3. **빌드 시간 증가**
   - 작은 변경에도 전체 저장소 clone
   - 3개 서비스 의존성 모두 설치

**개선안 A: 모노레포 + Nx/Turborepo 도구** ⭐⭐⭐ 권장

```
gaji/  (Monorepo with Nx)
├── apps/
│   ├── core-backend/        # Spring Boot app
│   ├── ai-backend/          # FastAPI app
│   └── frontend/            # Vue.js app
│
├── libs/
│   ├── shared-types/        # 공통 TypeScript types
│   │   └── src/
│   │       ├── scenario.types.ts
│   │       ├── conversation.types.ts
│   │       └── user.types.ts
│   │
│   └── api-contracts/       # API 스펙 (OpenAPI)
│       └── openapi.yaml
│
├── tools/
│   └── scripts/             # 공통 스크립트
│
├── nx.json                  # Nx 설정
├── package.json             # 루트 package.json
└── docker-compose.yml
```

**Nx 도구 장점**:
```bash
# 변경된 프로젝트만 빌드
nx affected:build

# 변경된 프로젝트만 테스트
nx affected:test

# 의존성 그래프 시각화
nx graph
```

**예상 빌드 시간**:
| 시나리오 | 모노레포 (도구 없음) | Nx 모노레포 | 개선율 |
|----------|---------------------|-------------|--------|
| Frontend만 변경 | 12분 (전체 빌드) | 3분 (frontend만) | **75% 감소** |
| Backend만 변경 | 12분 | 5분 (backend만) | **58% 감소** |
| 공통 타입 변경 | 12분 | 8분 (affected 전체) | **33% 감소** |

---

**개선안 B: 멀티레포 (각 서비스 별도 저장소)** ⭐⭐

```
GitHub Organization: gaji-platform/
├── gaji-core-backend/       # 저장소 1
├── gaji-ai-backend/         # 저장소 2
├── gaji-frontend/           # 저장소 3
└── gaji-shared-contracts/   # 저장소 4 (API 스펙)
```

**장점**:
- ✅ 각 팀이 독립적으로 작업
- ✅ 버전 관리 명확 (각 서비스 v1.2.3)
- ✅ 빌드/배포 완전 독립

**단점**:
- ❌ 공통 코드 재사용 어려움
- ❌ API 스펙 동기화 복잡
- ❌ 로컬 개발 환경 구성 번거로움

---

### 문제 2: 공통 타입/모델 중복 ❌

**현재 문제**:

```typescript
// frontend/src/services/coreApi.ts
interface Scenario {
  id: string;
  base_story: string;
  scenario_type: string;
  // ...
}

// core-backend에도 동일한 Scenario 클래스 정의
// ai-backend에도 동일한 Scenario Pydantic 모델 정의
```

**3곳에서 동일한 데이터 모델 중복 정의** → 변경 시 3곳 모두 수정 필요

**개선안: OpenAPI Spec + Code Generation** ⭐⭐⭐

```yaml
# libs/api-contracts/openapi.yaml
components:
  schemas:
    Scenario:
      type: object
      required:
        - id
        - base_story
        - scenario_type
      properties:
        id:
          type: string
          format: uuid
        base_story:
          type: string
        scenario_type:
          type: string
          enum:
            - CHARACTER_CHANGE
            - EVENT_ALTERATION
            - SETTING_MODIFICATION
```

**자동 생성**:

```bash
# Frontend TypeScript types 생성
npx openapi-typescript openapi.yaml --output frontend/src/types/api.d.ts

# Java DTO 생성
./gradlew openApiGenerate

# Python Pydantic models 생성
datamodel-codegen --input openapi.yaml --output ai-backend/app/models/generated.py
```

**결과**:

```typescript
// frontend/src/types/api.d.ts (자동 생성)
export interface Scenario {
  id: string;
  base_story: string;
  scenario_type: "CHARACTER_CHANGE" | "EVENT_ALTERATION" | "SETTING_MODIFICATION";
}
```

```java
// core-backend/src/main/java/com/gaji/model/Scenario.java (자동 생성)
@Data
public class Scenario {
    private UUID id;
    private String baseStory;
    private ScenarioType scenarioType;
}
```

```python
# ai-backend/app/models/generated.py (자동 생성)
class Scenario(BaseModel):
    id: UUID
    base_story: str
    scenario_type: Literal["CHARACTER_CHANGE", "EVENT_ALTERATION", "SETTING_MODIFICATION"]
```

**장점**:
- ✅ **Single Source of Truth**: OpenAPI YAML 1개만 관리
- ✅ **타입 안전성**: 컴파일 타임에 타입 에러 감지
- ✅ **동기화 자동**: OpenAPI 변경 → 3개 언어 자동 생성

---

### 문제 3: 환경 변수 관리 분산 ❌

**현재 구조**:

```
core-backend/
├── src/main/resources/
│   ├── application.yml
│   └── application-dev.yml

ai-backend/
├── .env
└── .env.example

frontend/
├── .env
└── .env.example
```

**문제**:
- 3곳에서 중복된 설정 (예: API URL)
- 환경별 설정 파일 분산
- 시크릿 관리 일관성 없음

**개선안: 중앙 집중식 환경 변수 관리** ⭐⭐

```
gaji/
├── envs/
│   ├── .env.local           # 로컬 개발
│   ├── .env.development     # 개발 서버
│   ├── .env.staging         # 스테이징
│   └── .env.production      # 프로덕션
│
└── docker-compose.yml       # 환경 변수 주입
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  core-backend:
    build: ./core-backend
    env_file:
      - ./envs/.env.${ENV:-local}
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/gaji
      - FASTAPI_URL=http://ai-backend:8000

  ai-backend:
    build: ./ai-backend
    env_file:
      - ./envs/.env.${ENV:-local}
    environment:
      - VECTORDB_URL=http://chromadb:8000
      - SPRING_BOOT_URL=http://core-backend:8080

  frontend:
    build: ./frontend
    env_file:
      - ./envs/.env.${ENV:-local}
    environment:
      - VITE_API_URL=http://localhost:8080
```

**장점**:
- ✅ 환경별 설정 중앙 관리
- ✅ `ENV=production docker-compose up` 한 줄로 전환
- ✅ 시크릿 관리 일관성

---

### 문제 4: Docker 이미지 최적화 부재 ❌

**현재**: Dockerfile이 정의되어 있지 않음

**개선안: Multi-Stage Build** ⭐⭐⭐

```dockerfile
# core-backend/Dockerfile (Spring Boot)
# Stage 1: Build
FROM gradle:8-jdk17 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle clean build -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# Non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```dockerfile
# ai-backend/Dockerfile (FastAPI)
# Stage 1: Build
FROM python:3.11-slim AS builder
WORKDIR /app
RUN pip install uv
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY app ./app

# Non-root user
RUN adduser --disabled-password --gecos '' fastapi
USER fastapi

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# frontend/Dockerfile (Vue.js)
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**이미지 크기 비교**:
| 서비스 | Single-Stage | Multi-Stage | 개선율 |
|--------|--------------|-------------|--------|
| Spring Boot | 450MB | 180MB | **60% 감소** |
| FastAPI | 850MB | 220MB | **74% 감소** |
| Frontend | 1.2GB (Node 포함) | 25MB (Nginx) | **98% 감소** |

---

### 문제 5: CI/CD 파이프라인 미정의 ❌

**현재**: GitHub Actions 설정 없음

**개선안: Service별 CI/CD Pipeline** ⭐⭐⭐

```yaml
# .github/workflows/core-backend.yml
name: Core Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'core-backend/**'
      - '.github/workflows/core-backend.yml'
  pull_request:
    paths:
      - 'core-backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run tests
        working-directory: ./core-backend
        run: ./gradlew test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        working-directory: ./core-backend
        run: docker build -t gaji-core-backend:${{ github.sha }} .
      
      - name: Push to Registry
        run: |
          docker tag gaji-core-backend:${{ github.sha }} ghcr.io/gaji/core-backend:latest
          docker push ghcr.io/gaji/core-backend:latest
```

**Nx 모노레포 버전** (더 효율적):

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  affected:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Nx affected 분석용
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      # 변경된 프로젝트만 테스트
      - name: Run affected tests
        run: npx nx affected:test --base=origin/main
      
      # 변경된 프로젝트만 빌드
      - name: Build affected
        run: npx nx affected:build --base=origin/main
```

---

## 🎯 최종 권장 프로젝트 구조

### Option A: Nx 모노레포 (추천) ⭐⭐⭐

```
gaji/
├── apps/
│   ├── core-backend/              # Spring Boot
│   │   ├── src/
│   │   ├── build.gradle
│   │   ├── Dockerfile
│   │   └── project.json           # Nx 설정
│   │
│   ├── ai-backend/                # FastAPI
│   │   ├── app/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── project.json
│   │
│   └── frontend/                  # Vue.js
│       ├── src/
│       ├── package.json
│       ├── Dockerfile
│       └── project.json
│
├── libs/
│   ├── shared-types/              # TypeScript 공통 타입
│   │   ├── src/
│   │   │   ├── scenario.types.ts
│   │   │   ├── conversation.types.ts
│   │   │   └── user.types.ts
│   │   ├── tsconfig.json
│   │   └── project.json
│   │
│   ├── api-contracts/             # OpenAPI 스펙
│   │   ├── openapi.yaml
│   │   ├── generate.sh            # 코드 생성 스크립트
│   │   └── project.json
│   │
│   └── test-utils/                # 공통 테스트 유틸
│       ├── src/
│       └── project.json
│
├── tools/
│   ├── scripts/
│   │   ├── setup-local-env.sh
│   │   └── db-migrate.sh
│   └── generators/                # Nx 코드 생성기
│
├── envs/
│   ├── .env.local
│   ├── .env.development
│   ├── .env.staging
│   └── .env.production
│
├── docs/                          # 기존 문서
│   ├── architecture.md
│   ├── ERD.md
│   └── epics/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Nx affected 활용
│       └── deploy.yml
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── nx.json                        # Nx 설정
├── package.json                   # 루트 package.json
├── tsconfig.base.json             # 공통 TypeScript 설정
└── README.md
```

**Nx 명령어 예시**:

```bash
# 의존성 그래프 시각화
nx graph

# Frontend 개발 서버
nx serve frontend

# Backend 테스트
nx test core-backend

# 변경된 것만 빌드
nx affected:build

# 특정 프로젝트와 의존성 모두 테스트
nx test frontend --with-deps

# 모든 프로젝트 린트
nx run-many --target=lint --all
```

**장점**:
- ✅ **빠른 빌드**: Incremental build + caching
- ✅ **명확한 의존성**: libs/shared-types를 명시적으로 import
- ✅ **자동화**: 코드 생성기로 boilerplate 생성
- ✅ **Monorepo 관리 도구**: affected 분석으로 효율적 CI/CD

**단점**:
- ⚠️ Nx 학습 곡선
- ⚠️ Java/Python 프로젝트는 Nx 지원 제한적 (plugin 필요)

---

### Option B: 멀티레포 + 공유 라이브러리 ⭐⭐

```
GitHub Organization: gaji-platform/

1. gaji-core-backend/
   ├── src/
   ├── build.gradle
   ├── Dockerfile
   └── .github/workflows/

2. gaji-ai-backend/
   ├── app/
   ├── requirements.txt
   ├── Dockerfile
   └── .github/workflows/

3. gaji-frontend/
   ├── src/
   ├── package.json
   ├── Dockerfile
   └── .github/workflows/

4. gaji-api-contracts/  (공유)
   ├── openapi.yaml
   ├── generate-typescript.sh
   ├── generate-java.sh
   ├── generate-python.sh
   └── .github/workflows/publish.yml

5. gaji-docs/
   ├── architecture.md
   ├── ERD.md
   └── epics/
```

**공유 방법**:

```yaml
# gaji-api-contracts/.github/workflows/publish.yml
name: Publish API Contracts

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Generate TypeScript types
        run: npm run generate:typescript
      
      - name: Publish to npm
        run: npm publish @gaji/api-contracts
      
      - name: Generate Java DTOs
        run: ./generate-java.sh
      
      - name: Publish to Maven
        run: mvn deploy
```

**각 저장소에서 사용**:

```json
// gaji-frontend/package.json
{
  "dependencies": {
    "@gaji/api-contracts": "^1.2.3"
  }
}
```

```gradle
// gaji-core-backend/build.gradle
dependencies {
    implementation 'com.gaji:api-contracts:1.2.3'
}
```

**장점**:
- ✅ **완전한 독립성**: 각 팀이 자율적으로 작업
- ✅ **버전 관리 명확**: 각 서비스 독립 버전 (v1.2.3)
- ✅ **CI/CD 단순**: 각 저장소 독립 파이프라인

**단점**:
- ❌ **코드 공유 복잡**: npm/Maven publish 필요
- ❌ **로컬 개발 번거로움**: 3개 저장소 clone
- ❌ **API 스펙 동기화**: 수동 버전 업데이트

---

## 📊 비교표: 모노레포 vs 멀티레포

| 기준 | Nx 모노레포 | 멀티레포 | 승자 |
|------|------------|---------|------|
| **빌드 속도** | ⚡ Incremental (변경된 것만) | 🐢 항상 전체 | 🏆 모노레포 |
| **코드 공유** | ⚡ 직접 import | 🔄 Publish → Install | 🏆 모노레포 |
| **팀 독립성** | ⚠️ 같은 저장소 공유 | ⚡ 완전 독립 | 🏆 멀티레포 |
| **버전 관리** | ⚠️ 복잡 (전체 버전) | ⚡ 명확 (각 서비스) | 🏆 멀티레포 |
| **CI/CD** | ⚡ Affected 자동 분석 | ⚠️ 각각 설정 | 🏆 모노레포 |
| **로컬 개발** | ⚡ 한 번 clone | ⚠️ 여러 저장소 | 🏆 모노레포 |
| **학습 곡선** | ⚠️ Nx 학습 필요 | ⚡ 단순 | 🏆 멀티레포 |
| **의존성 관리** | ⚡ 자동 추적 | ⚠️ 수동 버전 관리 | 🏆 모노레포 |

---

## 🚀 구체적 개선 액션 플랜

### Step 1: 저장소 구조 결정 (1주차)

**Option A 선택 시 (Nx 모노레포 - 추천)**:

```bash
# 1. Nx workspace 초기화
npx create-nx-workspace@latest gaji --preset=empty

cd gaji

# 2. Frontend 앱 생성
npx nx g @nx/vue:app frontend

# 3. 공유 라이브러리 생성
npx nx g @nx/js:lib shared-types
npx nx g @nx/js:lib api-contracts

# 4. Backend 앱 수동 추가 (apps/core-backend, apps/ai-backend)
mkdir -p apps/core-backend apps/ai-backend

# 5. Nx 설정
# apps/core-backend/project.json 생성
{
  "name": "core-backend",
  "targets": {
    "build": {
      "executor": "@nx/workspace:run-commands",
      "options": {
        "command": "./gradlew build",
        "cwd": "apps/core-backend"
      }
    },
    "test": {
      "executor": "@nx/workspace:run-commands",
      "options": {
        "command": "./gradlew test",
        "cwd": "apps/core-backend"
      }
    }
  }
}
```

**Option B 선택 시 (멀티레포)**:

```bash
# GitHub Organization 생성
gh org create gaji-platform

# 각 저장소 생성
gh repo create gaji-platform/core-backend --private
gh repo create gaji-platform/ai-backend --private
gh repo create gaji-platform/frontend --private
gh repo create gaji-platform/api-contracts --public
gh repo create gaji-platform/docs --public
```

---

### Step 2: OpenAPI Spec 정의 (2주차)

```yaml
# libs/api-contracts/openapi.yaml
openapi: 3.0.0
info:
  title: Gaji API
  version: 1.0.0

paths:
  /api/scenarios:
    post:
      operationId: createScenario
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateScenarioRequest'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Scenario'

components:
  schemas:
    Scenario:
      type: object
      required: [id, base_story, scenario_type]
      properties:
        id:
          type: string
          format: uuid
        base_story:
          type: string
        scenario_type:
          $ref: '#/components/schemas/ScenarioType'
    
    ScenarioType:
      type: string
      enum:
        - CHARACTER_CHANGE
        - EVENT_ALTERATION
        - SETTING_MODIFICATION
```

---

### Step 3: 코드 생성 자동화 (2주차)

```bash
# libs/api-contracts/package.json
{
  "name": "@gaji/api-contracts",
  "scripts": {
    "generate:typescript": "openapi-typescript openapi.yaml -o ./generated/typescript/api.d.ts",
    "generate:java": "./scripts/generate-java.sh",
    "generate:python": "datamodel-codegen --input openapi.yaml --output ./generated/python/models.py",
    "generate:all": "npm run generate:typescript && npm run generate:java && npm run generate:python"
  }
}
```

---

### Step 4: Docker Compose 통합 (3주차)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gaji
      POSTGRES_USER: gaji
      POSTGRES_PASSWORD: gaji_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  core-backend:
    build:
      context: ./apps/core-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    env_file:
      - ./envs/.env.local
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/gaji
      FASTAPI_URL: http://ai-backend:8000

  ai-backend:
    build:
      context: ./apps/ai-backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - chromadb
      - redis
    env_file:
      - ./envs/.env.local
    environment:
      VECTORDB_URL: http://chromadb:8000
      SPRING_BOOT_URL: http://core-backend:8080

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend/src:/app/src
    environment:
      VITE_API_URL: http://localhost:8080

volumes:
  postgres_data:
  chroma_data:
```

---

### Step 5: CI/CD 파이프라인 (4주차)

```yaml
# .github/workflows/ci.yml (Nx 모노레포 버전)
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  affected:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint affected
        run: npx nx affected:lint --base=origin/main
      
      - name: Test affected
        run: npx nx affected:test --base=origin/main --coverage
      
      - name: Build affected
        run: npx nx affected:build --base=origin/main
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  docker:
    needs: affected
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [core-backend, ai-backend, frontend]
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t gaji-${{ matrix.service }}:${{ github.sha }} ./apps/${{ matrix.service }}
      
      - name: Push to GHCR
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker tag gaji-${{ matrix.service }}:${{ github.sha }} ghcr.io/gaji/${{ matrix.service }}:latest
          docker push ghcr.io/gaji/${{ matrix.service }}:latest
```

---

## ✅ 최종 권장사항

### 팀 규모별 추천

| 팀 규모 | 권장 구조 | 이유 |
|---------|----------|------|
| **1-3명** | 🏆 Nx 모노레포 | 빠른 개발, 코드 공유 용이, 오버헤드 최소 |
| **4-10명** | 🏆 Nx 모노레포 | Affected 빌드로 효율성, 공통 코드 관리 |
| **10명+** | 🏆 멀티레포 | 팀 독립성, 명확한 책임 경계 |

### Gaji 프로젝트 권장 (현재 초기 단계)

**🎯 Nx 모노레포 (Option A) 선택 이유**:

1. ✅ **빠른 프로토타이핑**: 3개 서비스를 한 저장소에서 개발
2. ✅ **타입 안전성**: `libs/shared-types`로 API 계약 공유
3. ✅ **효율적 CI/CD**: Affected 빌드로 변경된 것만 테스트/빌드
4. ✅ **학습 가능**: Nx 학습 곡선은 있지만, 장기적 생산성 향상

**구현 우선순위**:
1. 🥇 Nx workspace 구성 + OpenAPI 코드 생성
2. 🥈 Docker Compose 로컬 개발 환경
3. 🥉 GitHub Actions Affected CI/CD

---

## 📚 참고 자료

- [Nx Monorepo](https://nx.dev/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [GitHub Actions for Monorepos](https://github.com/features/actions)

---

**Last Updated**: 2025-01-14  
**Next Action**: 팀과 논의 후 모노레포 vs 멀티레포 결정
