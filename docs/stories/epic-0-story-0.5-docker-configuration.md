# Story 0.5: Docker Configuration & Inter-Service Communication

**Epic**: Epic 0 - Project Initialization  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 8 hours

## Description

Create Docker Compose configuration for all services (Spring Boot, FastAPI, PostgreSQL, Vue.js/Nginx) with networking, volume persistence, and environment management.

## Dependencies

**Blocks**:

- Story 0.6: Inter-Service Health Check (needs Docker network)
- All development and deployment workflows

**Requires**:

- Story 0.1: Spring Boot Backend Setup
- Story 0.2: FastAPI AI Service Setup
- Story 0.3: PostgreSQL Database Setup
- Story 0.4: Vue.js Frontend Project Setup

## Acceptance Criteria

- [ ] `docker-compose.yml` defines 4 services: postgres, backend, ai-service, frontend
- [ ] Custom Docker network `gaji-network` for inter-service communication
- [ ] PostgreSQL volume persistence: `postgres-data:/var/lib/postgresql/data`
- [ ] Environment variables managed via `.env` file (not hardcoded in compose)
- [ ] Spring Boot accessible at `http://localhost:8080`
- [ ] FastAPI accessible at `http://localhost:8000`
- [ ] Vue.js/Nginx accessible at `http://localhost:3000`
- [ ] PostgreSQL accessible at `localhost:5432`
- [ ] Health check probes configured for all services
- [ ] Services start in correct order with `depends_on` conditions
- [ ] Hot reload enabled for development: backend (Spring DevTools), frontend (Vite HMR)
- [ ] `docker-compose up` brings up entire stack in < 2 minutes

## Technical Notes

**docker-compose.yml Structure**:

```yaml
version: "3.8"

networks:
  gaji-network:
    driver: bridge

volumes:
  postgres-data:

services:
  postgres:
    image: postgres:15-alpine
    container_name: gaji-postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - gaji-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: gaji-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      AI_SERVICE_URL: http://ai-service:8000
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gaji-network
    volumes:
      - ./backend:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile.dev
    container_name: gaji-ai-service
    environment:
      LLM_MODEL_PATH: ${LLM_MODEL_PATH}
      LLM_MODEL_TYPE: ${LLM_MODEL_TYPE}
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gaji-network
    volumes:
      - ./ai-service:/app
      - ./models:/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: gaji-frontend
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - gaji-network
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

**Service-to-Service Communication**:

- Backend → AI Service: `http://ai-service:8000/api/ai/stream`
- Backend → PostgreSQL: `jdbc:postgresql://postgres:5432/gaji_db`
- Frontend → Backend: `http://localhost:8080/api` (via host)

## QA Checklist

### Functional Testing

- [ ] `docker-compose up` starts all 4 services successfully
- [ ] PostgreSQL data persists after `docker-compose down`
- [ ] Services communicate via Docker network (test backend→ai-service call)
- [ ] Environment variables loaded from .env file
- [ ] Services restart automatically on failure

### Health Checks

- [ ] All health check endpoints return 200 status
- [ ] `depends_on` waits for PostgreSQL healthy before starting backend
- [ ] Unhealthy service triggers automatic restart
- [ ] `docker-compose ps` shows all services as "healthy"

### Development Experience

- [ ] Code changes in backend trigger Spring DevTools reload
- [ ] Code changes in frontend trigger Vite HMR (< 2s)
- [ ] `docker-compose logs -f backend` shows real-time logs
- [ ] Volume mounts work for all services

### Performance

- [ ] Full stack startup < 2 minutes on first run
- [ ] Subsequent starts < 30 seconds (cached images)
- [ ] No resource leaks (memory stable after 1 hour)

### Configuration

- [ ] .env.example includes all required variables
- [ ] No secrets hardcoded in docker-compose.yml
- [ ] Port conflicts detected and reported clearly

## Estimated Effort

8 hours
