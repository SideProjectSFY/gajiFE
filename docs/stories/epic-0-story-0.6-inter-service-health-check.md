# Story 0.6: Inter-Service Health Check & API Contract

**Epic**: Epic 0 - Project Initialization  
**Priority**: P1 - High  
**Status**: Not Started  
**Estimated Effort**: 4 hours

## Description

Implement comprehensive health check system with service dependency validation and API contract verification to ensure system integrity on startup.

## Dependencies

**Blocks**:

- All Epic 1-6 stories (ensures stable foundation)

**Requires**:

- Story 0.5: Docker Configuration (uses Docker network for health checks)

## Acceptance Criteria

- [ ] Spring Boot `/actuator/health` endpoint includes custom health indicators
- [ ] Custom health indicators: PostgreSQL connection, AI service availability
- [ ] FastAPI `/health` endpoint validates Local LLM model loading and database connection
- [ ] Frontend health check: GET `/health` returns build version and backend connectivity
- [ ] Startup validation script `scripts/verify-stack.sh` checks all services
- [ ] API contract tests verify Spring Boot ↔ FastAPI integration
- [ ] Health check dashboard accessible at `http://localhost:8080/actuator/health`
- [ ] Failing health check returns 503 Service Unavailable with detailed error
- [ ] Prometheus metrics exposed for future monitoring
- [ ] Integration tests validate full request flow: Frontend → Backend → AI Service

## Technical Notes

**Spring Boot Custom Health Indicator**:

```java
@Component
public class AiServiceHealthIndicator implements HealthIndicator {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public Health health() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                aiServiceUrl + "/health",
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return Health.up()
                    .withDetail("ai-service", "Available")
                    .withDetail("url", aiServiceUrl)
                    .build();
            }
        } catch (Exception e) {
            return Health.down()
                .withDetail("ai-service", "Unavailable")
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.down().build();
    }
}
```

**Verification Script** (`scripts/verify-stack.sh`):

```bash
#!/bin/bash

echo "🔍 Verifying Gaji Stack Health..."

# Check PostgreSQL
if curl -f http://localhost:5432 > /dev/null 2>&1; then
  echo "✅ PostgreSQL: Healthy"
else
  echo "❌ PostgreSQL: Not responding"
  exit 1
fi

# Check Backend
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
  echo "✅ Backend: Healthy"
else
  echo "❌ Backend: Not responding"
  exit 1
fi

# Check AI Service
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ AI Service: Healthy"
else
  echo "❌ AI Service: Not responding"
  exit 1
fi

# Check Frontend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
  echo "✅ Frontend: Healthy"
else
  echo "❌ Frontend: Not responding"
  exit 1
fi

echo "🎉 All services healthy!"
```

## QA Checklist

### Functional Testing

- [ ] All health endpoints return correct status
- [ ] PostgreSQL connection failure triggers DOWN status
- [ ] AI service unavailable triggers DOWN status
- [ ] Local LLM model loading failure detected in FastAPI health check
- [ ] `verify-stack.sh` script detects all service states correctly

### Health Indicator Validation

- [ ] Spring Boot health includes: db, ai-service, diskSpace
- [ ] FastAPI health includes: llm_model, database
- [ ] Frontend health includes: build_version, backend_connectivity
- [ ] Health details include actionable error messages

### API Contract Testing

- [ ] Backend → AI Service: POST /api/ai/stream contract verified
- [ ] Frontend → Backend: Authentication flow contract verified
- [ ] Contract tests fail on schema mismatch

### Performance

- [ ] Health check responses < 100ms (all services)
- [ ] Concurrent health checks supported (10 requests/sec)
- [ ] No health check causes service slowdown

### Monitoring

- [ ] Prometheus metrics exposed at `/actuator/prometheus`
- [ ] Metrics include: request_count, response_time, error_rate
- [ ] Health status changes logged with timestamps

## Estimated Effort

4 hours
