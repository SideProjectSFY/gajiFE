# Story 0.1: Spring Boot Backend - API Gateway Setup

**Epic**: Epic 0 - Project Setup & Infrastructure  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 6 hours

## Description

Initialize Spring Boot application as **API Gateway** with WebClient for proxying FastAPI requests, REST API endpoints, and JWT authentication. Implements **Pattern B architecture** where frontend communicates ONLY with Spring Boot (port 8080).

## Dependencies

**Blocks**:

- Story 0.3: PostgreSQL Database Setup (needs backend to connect to DB)
- Story 0.6: Inter-Service Health Check (needs base backend + WebClient setup)
- All Epic 1 stories (scenario API requires backend infrastructure)
- All Epic 4 stories (conversation API requires backend infrastructure)
- All Epic 6 stories (authentication requires backend infrastructure)

**Requires**:

- Development environment (Java 17+, Gradle)
- IDE (IntelliJ IDEA / VSCode with Java extensions)

## Acceptance Criteria

- [ ] Spring Boot 3.2+ project initialized with Gradle
- [ ] Dependencies configured:
  - Spring Web (REST API)
  - **Spring WebFlux WebClient** (FastAPI proxy client)
  - MyBatis (PostgreSQL SQL Mapper)
  - Spring Security (JWT authentication)
  - PostgreSQL Driver
  - Lombok (reduce boilerplate)
  - Spring Validation
  - Spring Boot Actuator (health checks)
- [ ] Package structure created:
  ```
  com.gaji.corebackend/
  ├── config/          # WebClient, Security, CORS, MyBatis
  ├── controller/      # REST controllers + AI proxy
  ├── service/         # Business logic
  ├── mapper/          # MyBatis Mapper interfaces (PostgreSQL only)
  ├── domain/          # Domain models (13 metadata tables)
  ├── dto/             # Request/response DTOs
  ├── client/          # FastAPIClient (WebClient)
  ├── exception/       # Custom exceptions
  └── util/            # Utility classes
  ```
- [ ] application.yml configured:
  - Profiles: dev, staging, prod
  - `fastapi.base-url: http://localhost:8000` (internal proxy)
  - PostgreSQL connection (metadata only, 13 tables)
- [ ] **WebClient configured for FastAPI proxy**:
  - Base URL: `http://localhost:8000`
  - Timeout: 60 seconds (AI operations can be slow)
  - Error handling with circuit breaker pattern
  - Retry logic: 3 attempts with exponential backoff
- [ ] **CORS configuration**:
  - Dev: `http://localhost:3000` (Vite default port)
  - Prod: `https://gaji.app`
  - ❌ NO external FastAPI or Gemini API access
- [ ] **API Gateway routes**:
  - `/api/v1/*` - Spring Boot direct endpoints (scenarios, conversations, users)
  - `/api/v1/ai/*` - Proxy to FastAPI internal service
    - Example: `GET /api/v1/ai/chat/{id}/stream` → `http://localhost:8000/api/chat/{id}/stream`
- [ ] Global exception handler for consistent error responses
- [ ] **Health check endpoint**: `GET /actuator/health`
  - Returns Spring Boot status + FastAPI health check
  - Example:
    ```json
    {
      "status": "UP",
      "components": {
        "db": { "status": "UP" },
        "fastapi": { "status": "UP" }
      }
    }
    ```
- [ ] Base API versioning: `/api/v1/*`
- [ ] Swagger/OpenAPI documentation auto-generated
- [ ] Logging configured (SLF4J + Logback) with request/response logging
- [ ] Application runs on port 8080

## Technical Notes

**Pattern B Implementation**:
- Frontend → Spring Boot ONLY (single entry point)
- Spring Boot → FastAPI (internal proxy, not externally exposed)
- **Security Benefit**: FastAPI URL and Gemini API keys never exposed to frontend
- **Cost Savings**: $700/year saved on SSL certificates and domain costs
- **Performance**: +50ms proxy overhead is negligible (1%) on 5000ms AI operations

**Database Access**:
- Spring Boot accesses PostgreSQL ONLY (13 metadata tables via MyBatis)
- ❌ NO VectorDB libraries (ChromaDB/Pinecone access through FastAPI)

**WebClient Configuration Example**:
```java
@Configuration
public class WebClientConfig {
    @Bean
    public WebClient fastApiClient(@Value("${fastapi.base-url}") String baseUrl) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .clientConnector(new ReactorClientHttpConnector(
                HttpClient.create().responseTimeout(Duration.ofSeconds(60))
            ))
            .build();
    }
}
```

**Proxy Controller Example**:
```java
@RestController
@RequestMapping("/api/v1/ai")
public class AIProxyController {
    @Autowired
    private WebClient fastApiClient;
    
    @GetMapping("/chat/{id}/stream")
    public Flux<String> streamChat(@PathVariable String id) {
        return fastApiClient.get()
            .uri("/api/chat/{id}/stream", id)
            .retrieve()
            .bodyToFlux(String.class);
    }
}
```

Use Spring Boot 3.2+ for Virtual Threads support (improves proxy throughput)

## QA Checklist

### Functional Testing

- [ ] Application starts successfully without errors
- [ ] Health check endpoint returns HTTP 200
- [ ] FastAPI health check included in `/actuator/health`
- [ ] CORS allows requests from frontend origin
- [ ] Swagger UI accessible at `/swagger-ui.html`
- [ ] API versioning correctly routes to `/api/v1/*`
- [ ] WebClient successfully proxies to FastAPI (mock endpoint test)

### Code Quality

- [ ] All package structures created and organized
- [ ] Lombok annotations working correctly
- [ ] No unused dependencies in build.gradle
- [ ] Code follows Java naming conventions

### Configuration

- [ ] Dev profile loads with correct settings
- [ ] FastAPI base URL configured correctly
- [ ] application.yml has placeholders for secrets (NO hardcoded values)
- [ ] Logging outputs to console in dev mode

### Documentation

- [ ] README includes setup instructions
- [ ] WebClient proxy pattern documented
- [ ] API documentation auto-generated
- [ ] Environment variables documented

### Security

- [ ] No hardcoded credentials in code
- [ ] Security dependencies properly configured
- [ ] CORS limited to known frontend domains
- [ ] FastAPI URL not exposed externally

## Estimated Effort

6 hours

4 hours
