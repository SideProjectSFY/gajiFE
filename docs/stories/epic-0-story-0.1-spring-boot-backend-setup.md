# Story 0.1: Spring Boot Backend Core Setup

**Epic**: Epic 0 - Project Setup & Infrastructure  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 4 hours

## Description

Initialize Spring Boot application with essential dependencies, project structure, and base configuration for REST API development.

## Dependencies

**Blocks**:

- Story 0.3: PostgreSQL Database Setup (needs backend to connect to DB)
- Story 0.6: Inter-Service Health Check (needs base backend setup)
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

## Technical Notes

- Use Spring Boot 3.2+ for latest features and security patches
- Enable JPA `hibernate.ddl-auto=validate` for prod (use Flyway for migrations)
- Configure Jackson for consistent JSON serialization (camelCase, ISO-8601 dates)

## QA Checklist

### Functional Testing

- [ ] Application starts successfully without errors
- [ ] Health check endpoint returns HTTP 200
- [ ] CORS allows requests from localhost:5173
- [ ] Swagger UI accessible at /swagger-ui.html
- [ ] API versioning correctly routes to /api/v1/\*

### Code Quality

- [ ] All package structures created and organized
- [ ] Lombok annotations working correctly
- [ ] No unused dependencies in build.gradle
- [ ] Code follows Java naming conventions

### Configuration

- [ ] Dev profile loads with correct settings
- [ ] application.yml has placeholders for secrets
- [ ] Logging outputs to console in dev mode

### Documentation

- [ ] README includes setup instructions
- [ ] API documentation auto-generated
- [ ] Environment variables documented

### Security

- [ ] No hardcoded credentials in code
- [ ] Security dependencies properly configured
- [ ] CORS limited to development domains

## Estimated Effort

4 hours
