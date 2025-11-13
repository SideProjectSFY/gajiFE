# Development Setup Guide

**Project**: Gaji - Interactive Fiction Platform  
**Last Updated**: 2025-11-13  
**Target**: Local Development Environment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Backend Setup](#backend-setup)
4. [AI Backend Setup](#ai-backend-setup)
5. [Database Setup](#database-setup)
6. [Frontend Setup](#frontend-setup)
7. [Docker Setup](#docker-setup)
8. [Environment Variables](#environment-variables)
9. [Running the Full Stack](#running-the-full-stack)
10. [Verification](#verification)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software           | Version | Purpose                    |
| ------------------ | ------- | -------------------------- |
| **Java JDK**       | 17+     | Core Backend (Spring Boot) |
| **Gradle**         | 8.x     | Java build tool            |
| **Python**         | 3.11+   | AI Backend (FastAPI)       |
| **uv**             | Latest  | Python package manager     |
| **Node.js**        | 18+     | Frontend build             |
| **pnpm**           | 8+      | Node package manager       |
| **PostgreSQL**     | 15.x    | Database                   |
| **Docker**         | 24+     | Container orchestration    |
| **Docker Compose** | 2.x     | Multi-container setup      |

### Installation Commands

**macOS (Homebrew)**:

```bash
# Java 17
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc

# Python 3.11
brew install python@3.11
pip install uv

# Node.js & pnpm
brew install node
npm install -g pnpm

# PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Docker
brew install --cask docker
```

**Verification**:

```bash
java -version        # Should show 17.x
python3 --version    # Should show 3.11.x
node -v              # Should show v18.x
pnpm -v              # Should show 8.x
psql --version       # Should show 15.x
docker --version     # Should show 24.x
```

---

## Repository Setup

```bash
# Clone repository
git clone https://github.com/your-org/gaji.git
cd gaji

# Repository structure
gaji/
├── backend/           # Spring Boot (Core Backend)
├── ai-backend/        # FastAPI (AI Backend)
├── frontend/          # Vue 3 (Frontend)
├── docker-compose.yml # Full stack orchestration
└── docs/              # Documentation
```

---

## Backend Setup

**Story Reference**: Epic 0, Story 0.1 - Spring Boot Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Configure Environment

Create `backend/.env`:

```properties
# Server Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=local

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gaji
SPRING_DATASOURCE_USERNAME=gaji_user
SPRING_DATASOURCE_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-characters
JWT_ACCESS_TOKEN_EXPIRATION=3600000   # 1 hour in ms
JWT_REFRESH_TOKEN_EXPIRATION=604800000 # 7 days in ms

# AI Backend URL
AI_BACKEND_URL=http://localhost:8000

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Build & Run

```bash
# Build project
./gradlew clean build

# Run with Spring Boot
./gradlew bootRun

# Or run JAR directly
java -jar build/libs/gaji-backend-0.0.1-SNAPSHOT.jar
```

### 4. Verify Backend

```bash
# Health check
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP"}
```

**Default Port**: 8080

---

## AI Backend Setup

**Story Reference**: Epic 0, Story 0.2 - FastAPI AI Backend Setup

### 1. Navigate to AI Backend Directory

```bash
cd ai-backend
```

### 2. Create Virtual Environment

```bash
# Using uv (recommended)
uv venv
source .venv/bin/activate  # macOS/Linux

# Or using standard venv
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
# Using uv (faster)
uv pip install -r requirements.txt

# Or using pip
pip install -r requirements.txt
```

**Key Dependencies**:

- `fastapi[all]==0.104.1`
- `langchain==0.0.335`
- `chromadb==0.4.18`
- `uvicorn[standard]==0.24.0`
- `llama-cpp-python` or `transformers` (for local LLM inference)

### 4. Configure Environment

Create `ai-backend/.env`:

```properties
# Server Configuration
PORT=8000
ENV=development

# Local LLM Configuration
LLM_MODEL_PATH=/path/to/your/llm/model  # e.g., Llama-2-7b, Mistral-7B
LLM_MODEL_TYPE=llama  # llama, mistral, or other supported types
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7
LLM_CONTEXT_LENGTH=4096

# Vector Store Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=8001
CHROMADB_COLLECTION_NAME=gaji_books

# Core Backend URL
CORE_BACKEND_URL=http://localhost:8080
```

### 5. Run FastAPI Server

```bash
# Development mode with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Verify AI Backend

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-13T..."}

# API docs (Swagger UI)
open http://localhost:8000/docs
```

**Default Port**: 8000

---

## Database Setup

**Story Reference**: Epic 0, Story 0.3 - PostgreSQL Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE gaji;
CREATE USER gaji_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE gaji TO gaji_user;

# Enable required extensions
\c gaji
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  # For full-text search

\q
```

### 2. Run Flyway Migrations

Migrations are located in `backend/src/main/resources/db/migration/`

**Initial Schema** (V1\_\_initial_schema.sql):

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table (JSONB parameters)
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_story VARCHAR(100) NOT NULL,
    parent_scenario_id UUID REFERENCES scenarios(id),
    scenario_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    creator_id UUID REFERENCES users(id),
    fork_count INTEGER DEFAULT 0,
    conversation_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_conversation_id UUID REFERENCES conversations(id),
    scenario_id UUID NOT NULL REFERENCES scenarios(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200),
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversation_fork_root_only CHECK (
        parent_conversation_id IS NULL OR
        (SELECT parent_conversation_id FROM conversations WHERE id = parent_conversation_id) IS NULL
    )
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation-Message join table
CREATE TABLE conversation_message_links (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, message_id)
);

-- Social tables
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE TABLE conversation_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, conversation_id)
);

CREATE TABLE conversation_memos (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    memo_text VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, conversation_id)
);

-- Indexes
CREATE INDEX idx_scenarios_base_story ON scenarios(base_story);
CREATE INDEX idx_scenarios_creator ON scenarios(creator_id);
CREATE INDEX idx_scenarios_quality ON scenarios(quality_score);
CREATE INDEX idx_scenarios_parameters ON scenarios USING GIN (parameters);
CREATE INDEX idx_scenarios_parent ON scenarios(parent_scenario_id);

CREATE INDEX idx_conversations_scenario ON conversations(scenario_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_parent ON conversations(parent_conversation_id);

CREATE INDEX idx_messages_role ON messages(role);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

CREATE INDEX idx_likes_user ON conversation_likes(user_id);
CREATE INDEX idx_likes_conversation ON conversation_likes(conversation_id);
```

**Run Migrations**:

```bash
# Migrations run automatically on Spring Boot startup
# Or run manually with Gradle
./gradlew flywayMigrate

# Check migration status
./gradlew flywayInfo
```

### 3. Seed Test Data (Optional)

```bash
# Run seed script
psql -U gaji_user -d gaji -f backend/src/main/resources/db/seed/test_data.sql
```

---

## Frontend Setup

**Story Reference**: Epic 0, Story 0.4 - Vue.js Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

**Key Dependencies**:

- `vue@3.3.8`
- `typescript@5.2.2`
- `vite@5.0.0`
- `@pandacss/dev@0.18.0`
- `primevue@3.46.0`
- `pinia@2.1.7`
- `vue-router@4.2.5`

### 3. Configure Environment

Create `frontend/.env.local`:

```properties
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AI_API_BASE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# OAuth (if using)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Run Development Server

```bash
# Start Vite dev server
pnpm dev

# Or with npm
npm run dev
```

### 5. Build for Production

```bash
# Build optimized bundle
pnpm build

# Preview production build
pnpm preview
```

### 6. Verify Frontend

```bash
# Health check endpoint
curl http://localhost:5173/health

# Open in browser
open http://localhost:5173
```

**Default Port**: 5173

---

## Docker Setup

**Story Reference**: Epic 0, Story 0.5 - Docker Compose Configuration

### 1. Docker Compose File

`docker-compose.yml` (project root):

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: gaji-postgres
    environment:
      POSTGRES_DB: gaji
      POSTGRES_USER: gaji_user
      POSTGRES_PASSWORD: your_password_here
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gaji_user -d gaji"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gaji-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/gaji
      SPRING_DATASOURCE_USERNAME: gaji_user
      SPRING_DATASOURCE_PASSWORD: your_password_here
      AI_BACKEND_URL: http://ai-backend:8000
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-backend:
    build:
      context: ./ai-backend
      dockerfile: Dockerfile
    container_name: gaji-ai-backend
    environment:
      LLM_MODEL_PATH: /models/llm-model
      LLM_MODEL_TYPE: llama
      CORE_BACKEND_URL: http://backend:8080
    volumes:
      - ./models:/models # Mount local LLM models directory
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gaji-frontend
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api
      VITE_AI_API_BASE_URL: http://localhost:8000
    ports:
      - "5173:5173"
    depends_on:
      - backend
      - ai-backend

volumes:
  postgres_data:
```

### 2. Run Full Stack

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Environment Variables

### Required Variables

Create `.env` in project root:

```properties
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Local LLM
LLM_MODEL_PATH=/path/to/your/llm/model
LLM_MODEL_TYPE=llama

# JWT
JWT_SECRET=your-256-bit-secret-minimum-32-characters-here

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Security Best Practices

- **Never commit `.env` files** to version control
- Use different secrets for dev/staging/production
- Rotate JWT secrets periodically
- Use environment-specific `.env.local`, `.env.production` files

---

## Running the Full Stack

### Option 1: Individual Services (Development)

**Terminal 1 - Database**:

```bash
docker-compose up postgres
```

**Terminal 2 - Core Backend**:

```bash
cd backend
./gradlew bootRun
```

**Terminal 3 - AI Backend**:

```bash
cd ai-backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 4 - Frontend**:

```bash
cd frontend
pnpm dev
```

### Option 2: Docker Compose (Full Stack)

```bash
# From project root
docker-compose up
```

### Option 3: Hybrid (Database + Local Services)

```bash
# Start only database
docker-compose up postgres -d

# Run backends and frontend locally (Terminals 2-4 above)
```

---

## Verification

**Story Reference**: Epic 0, Story 0.6 - Inter-Service Health Check

### Health Check Endpoints

```bash
# Core Backend
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# AI Backend
curl http://localhost:8000/health
# Expected: {"status":"healthy","timestamp":"..."}

# Frontend
curl http://localhost:5173/health
# Expected: 200 OK

# PostgreSQL
psql -U gaji_user -d gaji -c "SELECT 1;"
# Expected: 1 row returned
```

### Integration Test

```bash
# Create a test scenario (requires backend + database)
curl -X POST http://localhost:8080/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "base_story": "harry_potter",
    "scenario_type": "CHARACTER_CHANGE",
    "parameters": {
      "character": "Hermione Granger",
      "property": "house",
      "original_value": "Gryffindor",
      "new_value": "Slytherin"
    }
  }'

# Expected: 201 Created with scenario UUID
```

### Performance Validation

```bash
# Single scenario retrieval should be < 100ms
time curl http://localhost:8080/api/scenarios/{id}

# List scenarios should be < 200ms
time curl "http://localhost:8080/api/scenarios?page=0&size=20"
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 8080 is already in use`

**Solution**:

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in application.properties
SERVER_PORT=8081
```

#### 2. Database Connection Failed

**Error**: `Connection refused: localhost:5432`

**Solutions**:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL
brew services start postgresql@15

# Verify credentials
psql -U gaji_user -d gaji

# Check firewall rules
sudo lsof -i :5432
```

#### 3. Flyway Migration Failed

**Error**: `Flyway migration checksum mismatch`

**Solution**:

```bash
# Repair Flyway metadata
./gradlew flywayRepair

# Or reset database (CAUTION: deletes all data)
./gradlew flywayClean flywayMigrate
```

#### 4. Frontend Build Errors

**Error**: `Module not found` or `Type error`

**Solutions**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf .vite

# Check Node version
node -v  # Should be 18+
```

#### 5. AI Backend Local LLM Configuration

**Error**: `Model not found` or `Failed to load LLM`

**Solutions**:

```bash
# Verify model path
ls -lh $LLM_MODEL_PATH

# Check model compatibility
python -c "from llama_cpp import Llama; print('llama-cpp-python installed correctly')"

# Ensure sufficient GPU/CPU memory for model
# Llama-7B requires ~8GB RAM, Mistral-7B requires ~8GB RAM
# For GPU: Ensure CUDA is properly configured

# Download model if missing (example for Llama-2-7B)
# Visit https://huggingface.co/meta-llama/Llama-2-7b-chat-hf
```

#### 6. Docker Volume Issues

**Error**: `Volume not found` or stale data

**Solutions**:

```bash
# List volumes
docker volume ls

# Remove specific volume
docker volume rm gaji_postgres_data

# Prune all unused volumes
docker volume prune

# Full reset (CAUTION)
docker-compose down -v
docker system prune -a
```

#### 7. CORS Errors

**Error**: `Access-Control-Allow-Origin` error in browser

**Solution** (backend `application.properties`):

```properties
cors.allowed.origins=http://localhost:5173,http://localhost:3000
```

#### 8. JWT Token Errors

**Error**: `Invalid JWT signature`

**Solutions**:

```bash
# Verify JWT_SECRET is set and consistent
echo $JWT_SECRET

# Check token expiration settings
JWT_ACCESS_TOKEN_EXPIRATION=3600000  # 1 hour

# Clear browser localStorage/cookies
# In browser DevTools: localStorage.clear()
```

---

## Development Workflow

### Recommended Workflow

1. **Start Database**: `docker-compose up postgres -d`
2. **Start Core Backend**: `cd backend && ./gradlew bootRun`
3. **Start AI Backend**: `cd ai-backend && uvicorn main:app --reload`
4. **Start Frontend**: `cd frontend && pnpm dev`
5. **Open Browser**: http://localhost:5173
6. **Check Health**: Visit health endpoints
7. **Run Tests**: `./gradlew test` (backend), `pnpm test` (frontend)

### Hot Reload

All services support hot reload in development:

- **Spring Boot**: Automatic with Spring DevTools
- **FastAPI**: `--reload` flag with uvicorn
- **Vue/Vite**: Built-in HMR (Hot Module Replacement)

---

## Next Steps

Once setup is complete:

1. **Read API Documentation**: `/docs/API_DOCUMENTATION.md`
2. **Review ERD**: `/docs/ERD.md`
3. **Check UI Specs**: `/docs/V0_SCREEN_SPECIFICATIONS.md`
4. **Review Story Files**: `/docs/stories/` for implementation details
5. **Run Integration Tests**: Epic 0, Story 0.6 test suite

---

## Support

- **Architecture**: See `/docs/architecture.md`
- **PRD**: See `/docs/PRD.md`
- **Story Files**: See `/docs/stories/epic-{N}-story-{M}.md`
- **Issues**: GitHub Issues
- **Questions**: Team Slack #gaji-dev
