# Story 4.2: Message Streaming & AI Integration

**Epic**: Epic 4 - Conversation System  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 14 hours

## Description

Implement real-time message streaming from FastAPI AI service to Vue.js frontend with Server-Sent Events (SSE) for Local LLM responses.

## Dependencies

**Blocks**:

- Story 4.3: Conversation Forking UI (needs working chat before fork UI)
- Epic 5 stories (tree visualization needs completed conversations)

**Requires**:

- Story 0.2: FastAPI AI Service Setup
- Story 0.5: Docker Configuration (inter-service communication)
- Story 4.1: Conversation Data Model (stores messages)
- Story 2.1: Scenario-to-Prompt Engine (generates adapted prompts)

## Acceptance Criteria

- [ ] POST /api/conversations/{id}/messages endpoint in Spring Boot accepts user message, returns 202 Accepted
- [ ] Spring Boot asynchronously calls FastAPI `/api/ai/stream` endpoint with scenario-adapted prompt
- [ ] FastAPI streams Local LLM response chunks via SSE to Spring Boot
- [ ] Spring Boot broadcasts chunks to frontend via WebSocket or SSE
- [ ] Vue.js ChatInterface component displays typing animation as chunks arrive
- [ ] Final complete message saved to `messages` table after streaming completes
- [ ] Error handling for AI service timeout (30s limit)
- [ ] Rate limiting: 10 messages/min per user
- [ ] Message history included in context window (last 20 messages)
- [ ] Response time: First chunk < 2s, complete response < 15s (average)
- [ ] Integration tests for full message flow

## Technical Notes

**Message Flow**:

```
1. User sends message via Vue.js → Spring Boot
2. Spring Boot saves user message to DB
3. Spring Boot calls FastAPI /api/ai/stream with:
   - scenario_id (for prompt adaptation)
   - conversation history (last 20 messages)
4. FastAPI calls Local LLM Streaming API
5. FastAPI → Spring Boot SSE stream
6. Spring Boot → Vue.js WebSocket stream
7. Vue.js renders chunks in real-time
8. Spring Boot saves final assistant message to DB
```

**Context Window Management**:

- Include last 20 messages (user + assistant pairs)
- Total token limit: 4096 tokens (Local LLM context window)
- Truncate older messages if exceeding limit

## QA Checklist

### Functional Testing

- [ ] Send user message → receives streamed AI response
- [ ] Message history included in context (test with 25+ message conversation)
- [ ] Streaming displays typing animation in UI
- [ ] Final message saved to database correctly
- [ ] Error message shown if AI service timeout

### Streaming Quality

- [ ] First chunk arrives < 2s
- [ ] Complete response < 15s average
- [ ] No duplicate chunks
- [ ] Chunks render smoothly without visual glitches
- [ ] Connection resilient to network hiccups (auto-reconnect)

### Context Window Validation

- [ ] Last 20 messages included in AI request
- [ ] Older messages truncated correctly
- [ ] Token count stays within 8000 limit
- [ ] Conversation coherence maintained across long chats (test with 50+ messages)

### Performance

- [ ] Concurrent streaming for 10 users simultaneously
- [ ] Rate limiting enforced (11th message/min rejected)
- [ ] No memory leaks in long-running streams
- [ ] Database write after streaming < 50ms

### Security

- [ ] Only conversation owner can send messages
- [ ] Message content sanitized before DB storage
- [ ] AI response sanitized before frontend display
- [ ] Rate limiting per user enforced

## Estimated Effort

14 hours
