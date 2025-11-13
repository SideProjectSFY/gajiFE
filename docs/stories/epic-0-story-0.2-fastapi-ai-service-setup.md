# Story 0.2: FastAPI AI Service Setup

**Epic**: Epic 0 - Project Initialization  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 6 hours

## Description

Initialize FastAPI Python service for AI integration with Local LLM, including async request handling and environment configuration.

## Dependencies

**Blocks**:

- Story 2.1: Scenario-to-Prompt Engine (needs FastAPI foundation)
- Story 4.2: Message Streaming (needs AI service)
- All Epic 2 stories (AI adaptation layer)

**Requires**:

- Story 0.3: PostgreSQL Database (shares database for AI logs)
- Story 0.5: Docker Configuration (containerization)

## Acceptance Criteria

- [ ] Python 3.11+ project with FastAPI 0.104+, uvicorn, pydantic
- [ ] Project structure: `/ai-service/app/main.py`, `/app/routers/`, `/app/models/`, `/app/services/`
- [ ] Health check endpoint: GET /health returns {"status": "healthy"}
- [ ] Local LLM client configured with model path from environment variables
- [ ] Async request handling with httpx AsyncClient
- [ ] CORS middleware enabled for Spring Boot backend (http://localhost:8080)
- [ ] Pydantic models for request/response validation
- [ ] Error handling middleware with structured JSON responses
- [ ] Logging configured with uvicorn logger
- [ ] pytest framework setup with >80% coverage requirement
- [ ] .env.example file with LLM_MODEL_PATH, LLM_MODEL_TYPE placeholders

## Technical Notes

**Project Structure**:

```
ai-service/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── routers/
│   │   ├── ai.py            # AI endpoints
│   │   └── health.py        # Health check
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   └── llm_client.py    # Local LLM integration
│   └── config.py            # Environment config
├── tests/
│   └── test_health.py
├── requirements.txt
└── .env.example
```

## QA Checklist

### Functional Testing

- [ ] Health check endpoint returns 200 status
- [ ] Local LLM client initializes with valid model path
- [ ] CORS allows requests from http://localhost:8080
- [ ] Invalid request returns 422 with Pydantic validation errors
- [ ] 500 errors return structured JSON response

### Configuration Testing

- [ ] Environment variables loaded correctly from .env
- [ ] Missing LLM_MODEL_PATH raises startup error
- [ ] CORS configuration allows required origins only

### Code Quality

- [ ] PEP 8 compliance (checked with black formatter)
- [ ] Type hints on all functions
- [ ] Docstrings on public functions
- [ ] pytest tests pass with >80% coverage

### Documentation

- [ ] README.md with setup instructions
- [ ] .env.example lists all required variables
- [ ] API docs auto-generated at /docs (Swagger UI)

### Security

- [ ] API keys never logged or exposed
- [ ] CORS restricted to known origins
- [ ] Request validation prevents injection attacks

## Estimated Effort

6 hours
