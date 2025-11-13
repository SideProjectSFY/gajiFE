# Epic 4: Conversation System

## Epic Goal

Build a real-time AI conversation system where users can chat with literary characters adapted to alternate "What If" timelines, with support for message streaming, conversation forking, and multi-timeline context management.

## User Value

Users can engage in meaningful conversations with AI characters who authentically embody their alternate timeline selves. The streaming interface provides immediate feedback, conversation forking enables exploration of different dialogue paths, and the system maintains character consistency across complex scenario contexts.

## Timeline

**Week 2, Day 3 - Week 3, Day 1 of MVP development**

## Stories

### Story 4.1: Conversation Data Model & CRUD API

**Priority: P0 - Critical**

**Description**: Implement PostgreSQL schema for conversations and messages, with REST API for creating conversations, retrieving message history, and managing conversation metadata.

**Acceptance Criteria**:

- [ ] Conversation and Message entities created (see Epic 0, Story 0.3 for schema)
- [ ] ConversationRepository with methods:
  - `findById(UUID id)`
  - `findByUserId(UUID userId, Pageable)`
  - `findByScenarioId(UUID scenarioId, Pageable)`
  - `findByUserIdAndScenarioId(UUID userId, UUID scenarioId, Pageable)`
  - `countByScenarioId(UUID scenarioId)` (for scenario.conversation_count)
  - `findPopularConversations(Pageable)` (order by like_count DESC)
- [ ] MessageRepository with methods:
  - `findByConversationId(UUID conversationId, Pageable)`
  - `countByConversationId(UUID conversationId)` (message count)
  - `sumTokenCountByConversationId(UUID conversationId)` (total tokens used)
- [ ] ConversationService with methods:
  - `createConversation(UUID userId, UUID scenarioId, String characterName) → ConversationResponse`
  - `getConversation(UUID conversationId) → ConversationResponse`
  - `getConversationMessages(UUID conversationId, int page, int size) → Page<MessageResponse>`
  - `getUserConversations(UUID userId, int page, int size) → Page<ConversationResponse>`
  - `getScenarioConversations(UUID scenarioId, int page, int size) → Page<ConversationResponse>`
  - `deleteConversation(UUID conversationId)` (soft delete)
- [ ] REST API endpoints:
  - POST /api/v1/conversations (requires authentication)
  - GET /api/v1/conversations/{id}
  - GET /api/v1/conversations/{id}/messages?page=0&size=50
  - GET /api/v1/users/{userId}/conversations?page=0&size=20
  - GET /api/v1/scenarios/{scenarioId}/conversations?page=0&size=20
  - DELETE /api/v1/conversations/{id} (requires authentication, owner only)
- [ ] Conversation metadata:
  - scenario_id (which scenario this conversation explores)
  - parent_conversation_id (if forked from another conversation)
  - character_name (which character user is talking to)
  - like_count (denormalized, updated by Epic 6)
  - has_been_forked (boolean, default false) - prevents multiple forks per conversation
  - created_at, updated_at, deleted_at (soft delete)
- [ ] Message metadata:
  - role: "user" or "assistant"
  - content: message text
  - token_count: for cost tracking and context window management
  - created_at timestamp
- [ ] Validation rules:
  - Character name: max 100 chars, required
  - User message: max 1000 chars
  - Scenario must exist and not be deleted
  - User can only delete their own conversations
- [ ] Business rules:
  - Creating conversation increments scenario.conversation_count atomically
  - Soft deleting conversation decrements scenario.conversation_count
  - Messages ordered by created_at ASC (oldest first)
  - Conversation list ordered by updated_at DESC (most recent first)
  - User must send first message (no AI-initiated conversations)
  - **Fork depth limit**: Only root conversations (parent_conversation_id = NULL) can be forked
  - **Fork constraint**: If conversation.parent_conversation_id IS NOT NULL → cannot be forked (자식 대화는 Fork 불가)
  - Root conversations can be forked only once (has_been_forked flag)
- [ ] Unit tests for ConversationService and MessageRepository
- [ ] Integration tests for all conversation endpoints

**API Examples**:

**POST /api/v1/conversations**

```json
Request:
{
  "scenario_id": "uuid",
  "character_name": "Hermione Granger"
}

Response (201 Created):
{
  "id": "uuid",
  "scenario_id": "uuid",
  "scenario_title": "What if Hermione was sorted into Slytherin?",
  "user_id": "uuid",
  "character_name": "Hermione Granger",
  "message_count": 0,
  "like_count": 0,
  "parent_conversation_id": null,
  "created_at": "2025-11-13T10:00:00Z",
  "updated_at": "2025-11-13T10:00:00Z"
}
```

**GET /api/v1/conversations/{id}/messages?page=0&size=50**

```json
Response (200 OK):
{
  "content": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "How do you feel about being in Slytherin?",
      "token_count": 12,
      "created_at": "2025-11-13T10:01:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "At first, I was shocked—Slytherin? Me? But I've come to appreciate...",
      "token_count": 85,
      "created_at": "2025-11-13T10:01:05Z"
    }
  ],
  "page": 0,
  "size": 50,
  "total_elements": 10,
  "total_pages": 1
}
```

**Technical Notes**:

- Use database transactions for conversation creation + count increment
- Index on (user_id, created_at DESC) for fast user conversation queries
- Index on (scenario_id, created_at DESC) for scenario conversation list
- Store token_count for each message (use tiktoken library for accurate counting)
- Soft delete: set deleted_at timestamp, filter out in queries

**Estimated Effort**: 8 hours

---

### Story 4.2: Local LLM Integration & Server-Sent Events (SSE) Streaming

**Priority: P0 - Critical**

**Description**: Integrate Local LLM for generating AI character responses with streaming support using Server-Sent Events (SSE) for real-time message delivery.

**Acceptance Criteria**:

- [ ] Local LLM service wrapper (LLMService)
  - Initialize with model path and type from environment variables
  - Support Llama-2-7B or Mistral-7B for MVP
  - Configurable model, temperature, max_tokens per scenario type
  - Retry logic for model loading failures
  - Error handling: model errors, timeout, inference failures
  - Performance tracking: log token generation speed per request
- [ ] Streaming service using Spring WebFlux
  - POST /api/v1/conversations/{id}/messages endpoint (requires authentication)
  - Accept user message in request body
  - Return Server-Sent Events (SSE) stream
  - Event format: `data: {"content": "...", "done": false}\n\n`
  - Final event: `data: {"done": true, "token_count": 85}\n\n`
- [ ] Message flow:
  1. Validate user message (max 1000 chars)
  2. Verify conversation doesn't start with AI message (user must go first)
  3. Save user message to database with role="user"
  4. Retrieve conversation context (scenario + last 6 messages for manageable context)
  5. Generate system prompt from scenario (integrate with Epic 2, Story 2.1)
  6. Build LLM messages array: [system, ...conversation_history, user_message]
  7. Call Local LLM streaming inference
  8. Stream each token chunk to client via SSE
  9. Accumulate full response
  10. Save assistant message to database with role="assistant", token_count
  11. Update conversation.updated_at timestamp
  12. Send final SSE event with done=true
- [ ] Token counting:
  - Count user message tokens using tokenizer
  - Count assistant response tokens from LLM generation
  - Store both in messages table
  - Track cumulative tokens per conversation
- [ ] Rate limiting (per user):
  - Max 30 messages per hour (MVP)
  - Return 429 Too Many Requests if exceeded
  - Include Retry-After header
- [ ] Error handling:
  - LLM inference errors: retry logic
  - LLM timeout: return error event via SSE
  - Invalid scenario: return 404 Not Found
  - User not owner: return 403 Forbidden
- [ ] Unit tests for LLMService (mock LLM inference)
- [ ] Integration tests for message streaming endpoint

**API Example**:

**POST /api/v1/conversations/{id}/messages**

```json
Request:
{
  "content": "How do you feel about being in Slytherin?"
}

Response (SSE stream):
event: message
data: {"content": "At", "done": false}

event: message
data: {"content": " first,", "done": false}

event: message
data: {"content": " I", "done": false}

event: message
data: {"content": " was", "done": false}

...

event: message
data: {"content": " appreciate...", "done": false}

event: done
data: {"done": true, "token_count": 85, "message_id": "uuid"}
```

**Technical Notes**:

- Use Spring WebFlux `Flux<ServerSentEvent<String>>` for SSE
- Local LLM streaming: set `stream=true` in inference request
- Use custom tokenizer for accurate token counting
- Store model path in environment variable: `LLM_MODEL_PATH`, `LLM_MODEL_TYPE`
- Log all inference requests for debugging and performance analysis
- Temperature settings from Epic 2, Story 2.3: 0.6-0.8 based on scenario type
- Enforce user-first message rule: reject POST if conversation has 0 messages and role != "user"
- Context window: keep last 6 messages only to maintain focus and reduce token costs

**Estimated Effort**: 10 hours

---

### Story 4.3: Real-Time Chat Interface UI

**Priority: P0 - Critical**

**Description**: Build responsive chat interface with real-time message streaming, typing indicators, and optimized mobile/desktop layouts.

**Acceptance Criteria**:

- [ ] ChatView component (`/conversations/{id}` route)
  - Full-height layout (fills viewport, no scrolling except message list)
  - Chat header:
    - Scenario title (clickable, links to scenario detail)
    - Character name badge
    - Like button (from Epic 6)
    - Memo button (from Epic 6)
    - Fork conversation button (Story 4.4)
    - Options menu (delete conversation)
  - Message list:
    - Auto-scroll to bottom on new messages
    - Scroll to load older messages (pagination)
    - User messages: right-aligned, blue background
    - Assistant messages: left-aligned, gray background
    - Timestamps (relative: "2 minutes ago")
    - Avatar icons (user vs. character)
  - Message input area:
    - Textarea with auto-expand (max 5 lines)
    - Character counter (1000 max)
    - Send button (Enter to send, Shift+Enter for newline)
    - Disabled during streaming
- [ ] MessageBubble component
  - Props: `message` (role, content, timestamp), `isStreaming`
  - Markdown rendering for assistant messages (bold, italic, lists)
  - Code block syntax highlighting (optional, nice-to-have)
  - Copy message button (on hover)
  - User messages: plain text only
- [ ] StreamingMessage component
  - Display partial message as it streams
  - Blinking cursor indicator during streaming
  - Smooth text appearance (no flickering)
- [ ] SSE integration using EventSource API:
  ```javascript
  const eventSource = new EventSource(`/api/v1/conversations/${id}/messages`);
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.done) {
      // Finalize message, enable input
    } else {
      // Append content to streaming message
    }
  };
  ```
- [ ] ConversationStore (Pinia) actions:
  - `loadConversation(conversationId)`
  - `loadMessages(conversationId, page)`
  - `sendMessage(conversationId, content)` (initiates SSE stream)
  - `deleteConversation(conversationId)`
- [ ] Loading states:
  - Skeleton loader for initial conversation load
  - "Loading older messages..." for pagination
  - "Thinking..." typing indicator during streaming
- [ ] Empty state (new conversation):
  - "Start your conversation with {character_name}"
  - Reminder: "You always send the first message"
  - If this is a forked conversation: "Continuing from original conversation ({fork_message_count} messages copied)"
  - Suggested opening questions (3-5 examples)
- [ ] Error handling:
  - Show error toast if message send fails
  - Retry button for failed messages
  - Reconnect SSE if connection drops
- [ ] Responsive design:
  - Mobile: full-screen chat, fixed header/input
  - Desktop: max-width 800px, centered layout
  - Tablet: similar to desktop
- [ ] Accessibility:
  - Keyboard navigation (Tab, Enter)
  - Screen reader support for new messages
  - Focus management (input auto-focus after send)

**Chat Layout**:

```
┌────────────────────────────────────────┐
│ [Back] Hermione in Slytherin  [♥ 5]  │ ← Header
│ Character: Hermione Granger   [📝]    │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────┐     │
│  │ How do you feel about being  │     │ ← User message
│  │ in Slytherin?                │     │
│  └──────────────────────────────┘     │
│                                        │
│     ┌────────────────────────────────┐│
│     │ At first, I was shocked—       ││ ← Assistant
│     │ Slytherin? Me? But I've come   ││   message
│     │ to appreciate...               ││
│     └────────────────────────────────┘│
│                                        │
│  [Loading older messages...]          │ ← Pagination
│                                        │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐│
│ │ Type your message...          900 ││ ← Input area
│ └────────────────────────────────────┘│
│                                [Send] │
└────────────────────────────────────────┘
```

**Technical Notes**:

- Use `EventSource` API for SSE (native browser support)
- Auto-reconnect on SSE disconnect (exponential backoff)
- Debounce scroll events for pagination (load when 100px from top)
- Use `IntersectionObserver` for efficient scroll detection
- Markdown rendering: use `marked.js` or `markdown-it`
- Store draft message in localStorage (prevent data loss on refresh)

**Estimated Effort**: 12 hours

---

### Story 4.4: Conversation Forking & Branching UI

**Priority: P1 - High**

**Description**: Enable users to fork conversations at any message to explore alternative dialogue paths, creating a tree of conversation branches.

**Acceptance Criteria**:

- [ ] Fork conversation backend logic
  - POST /api/v1/conversations/{id}/fork endpoint (requires authentication)
  - **Validation 1**: Check conversation.parent_conversation_id IS NULL (return 403 Forbidden if trying to fork a forked conversation)
  - **Validation 2**: Check conversation.has_been_forked = false (return 409 Conflict if root already forked)
  - Request body: Empty `{}` (no message selection - always copies most recent messages)
  - Create new conversation with:
    - parent_conversation_id = original conversation ID
    - scenario_id = same as parent
    - character_name = same as parent
    - **Message Copy Logic**: Copy min(6, total_message_count) most recent messages
      - If original has ≥6 messages → copy last 6 messages
      - If original has <6 messages → copy ALL messages
      - Example: Original has 3 messages → copy all 3
      - Example: Original has 10 messages → copy last 6 (messages #5-10)
    - fork_message_count = number of messages actually copied
  - Update parent conversation: set has_been_forked = true (atomic operation)
  - Return new conversation ID with copied message count
- [ ] ForkConversationButton in conversation header
  - **Only show if**: conversation.parent_conversation_id IS NULL (root conversations only)
  - Show "Fork Conversation" button if conversation.has_been_forked = false
  - Disabled state if conversation.has_been_forked = true (tooltip: "This conversation has already been forked")
  - If conversation is a fork (parent_conversation_id IS NOT NULL): hide button entirely (show badge: "Forked conversation - cannot fork again")
  - Click → opens ForkConversationModal
  - Button placement in header next to like/memo buttons
- [ ] ForkConversationModal component
  - Shows preview of messages that will be copied:
    - If conversation has ≥6 messages: "Last 6 messages will be preserved"
    - If conversation has <6 messages: "All {count} messages will be preserved"
  - Display the exact messages that will be copied (scrollable preview)
  - No message selection - copy logic is automatic (most recent 6 or all if fewer)
  - Input: optional "Fork description" (why you're forking)
  - Warning: "Original conversations can only be forked once. Forked conversations cannot be forked again."
  - "Create Fork" button (disabled if parent already forked)
  - On success: navigate to new conversation showing "{count} messages copied from original conversation"
- [ ] Conversation breadcrumb navigation
  - If conversation has parent_conversation_id (is a fork):
    - Show breadcrumb: "Forked from [Parent Conversation Title]"
    - Show badge: "This is a forked conversation (cannot be forked again)"
    - Click breadcrumb → navigate to parent conversation
  - If conversation is root (parent_conversation_id IS NULL):
    - If has_been_forked = true: Show "Forked" badge, click → navigate to child
    - If has_been_forked = false: Show "Fork" button (can be forked once)
- [ ] ConversationForkTree component (simple version for MVP)
  - Display parent conversation link at top
  - Display child forks below current conversation
  - Each fork shows: first user message after fork, message count, created date
  - Click fork → navigate to that conversation
- [ ] ConversationStore actions:
  - `forkConversation(conversationId, forkAtMessageId, description)`
  - `getConversationForks(conversationId)` (get child forks)
- [ ] Analytics:
  - Track fork count per conversation (denormalized column)
  - Track which messages are most forked (future feature)
- [ ] Unit tests for fork logic
- [ ] Integration test for fork endpoint

**Fork Flow**:

```
User reading ROOT conversation (parent_conversation_id IS NULL):
1. Sees "Fork Conversation" button in header (if not already forked)
2. Clicks button
3. Modal opens showing: "The most recent 6 messages will be preserved"
4. User sees preview of 6 messages that will be copied
5. User optionally adds fork description
6. User clicks "Create Fork"
7. Backend validates:
   - Check parent.parent_conversation_id IS NULL ✓ (is root)
   - Check parent.has_been_forked = false ✓ (not forked yet)
8. New conversation created with most recent 6 messages
9. Parent conversation marked as has_been_forked = true
10. User redirected to new FORKED conversation
11. Forked conversation shows "Forked from [Parent]" badge
12. Forked conversation has NO fork button (cannot fork again)
```

**Attempting to Fork a FORKED conversation**:

```
User on forked conversation (parent_conversation_id IS NOT NULL):
1. No "Fork Conversation" button visible
2. Badge shows: "This is a forked conversation"
3. Message: "Only original conversations can be forked"
```

**API Example**:

**POST /api/v1/conversations/{id}/fork**

```json
Request:
{
  "description": "Explore cunning vs. ambition distinction"
}

Response (201 Created):
{
  "id": "new-uuid",
  "parent_conversation_id": "original-uuid",
  "scenario_id": "uuid",
  "character_name": "Hermione Granger",
  "message_count": 6,
  "fork_description": "Explore cunning vs. ambition distinction",
  "created_at": "2025-11-13T11:00:00Z",
  "can_be_forked": false  // Forked conversations cannot be forked again
}

Error Response (403 Forbidden - trying to fork a forked conversation):
{
  "error": "Cannot fork a forked conversation",
  "message": "Only original conversations can be forked. This conversation was already forked from another conversation.",
  "parent_conversation_id": "parent-uuid"
}

Error Response (409 Conflict - root already forked):
{
  "error": "Conversation has already been forked",
  "message": "This original conversation has already been forked once",
  "forked_conversation_id": "existing-fork-uuid"
}
```

**Technical Notes**:

- Fork operation is transactional: copy 6 messages + create conversation + update parent flag
- Only copy most recent 6 messages (or all if conversation has <6 messages)
- Use bulk insert for message copying (efficient operation)
- Add index on parent_conversation_id for fast child fork queries
- Add index on has_been_forked for fast fork validation
- **Database constraint**: `CHECK (parent_conversation_id IS NULL OR has_been_forked = FALSE)` (forked conversations cannot be re-forked)
- **Application validation order**:
  1. Check if conversation.parent_conversation_id IS NOT NULL → 403 Forbidden
  2. Check if conversation.has_been_forked = true → 409 Conflict
  3. Proceed with fork creation

**Estimated Effort**: 8 hours

---

### Story 4.5: Conversation Discovery & Browse UI

**Priority: P1 - High**

**Description**: Build conversation discovery page where users can browse public conversations, filter by scenario/character, and discover interesting dialogue examples.

**Acceptance Criteria**:

- [ ] ConversationBrowseView component (`/conversations` route)
  - Page header: "Explore Conversations"
  - Filter sidebar:
    - Search input (search by conversation content, character name)
    - Scenario filter (dropdown, multi-select)
    - Character filter (autocomplete, popular characters)
    - Sort options: Recent, Most Liked, Most Forked, Longest
    - Date range filter
  - Conversation card grid (3 cols desktop, 2 tablet, 1 mobile)
  - Infinite scroll pagination (20 conversations per batch)
- [ ] ConversationCard component
  - Scenario title (clickable → scenario detail)
  - Character name badge
  - Conversation preview (first user message + first assistant reply)
  - Metadata:
    - Message count (e.g., "15 messages")
    - Like count with like button
    - Fork count
    - Creator username (clickable → user profile)
    - Created date (relative)
  - Hover state: show "View Conversation" button
  - Click card → navigate to conversation detail
- [ ] Backend search endpoint:
  - GET /api/v1/conversations/search?q=ambition&scenario_id=uuid&character=Hermione&sort=likes&page=0
  - Full-text search on message content using PostgreSQL `to_tsvector`
  - Filter by scenario_id, character_name
  - Sort options: recent (updated_at DESC), likes (like_count DESC), forks (fork_count DESC), longest (message_count DESC)
  - Pagination support
- [ ] ConversationStore actions:
  - `searchConversations(query, filters, sort, page)`
  - `getPopularConversations(page)`
  - `getRecentConversations(page)`
- [ ] Empty states:
  - "No conversations found" with suggestions
  - "Be the first to start a conversation with this character!"
- [ ] SEO optimization:
  - Meta tags for conversation pages (og:title, og:description)
  - Include conversation preview in description
  - Canonical URLs
- [ ] Performance optimization:
  - Server-side pagination (don't load all conversations)
  - Image lazy loading for avatars
  - Debounce search input (300ms)

**Conversation Browse Layout**:

```
┌──────────────────────────────────────────────┐
│  Explore Conversations                       │
├──────────────┬───────────────────────────────┤
│ Filters      │  [Card 1]      [Card 2]       │
│              │                                │
│ [Search]     │  [Card 3]      [Card 4]       │
│              │                                │
│ Scenario:    │  [Card 5]      [Card 6]       │
│ [All ▼]      │                                │
│              │  [Loading more...]             │
│ Character:   │                                │
│ [Hermione]   │                                │
│              │                                │
│ Sort:        │                                │
│ [Recent ▼]   │                                │
└──────────────┴───────────────────────────────┘
```

**Technical Notes**:

- Use PostgreSQL GIN index on message content for fast search
- Cache popular conversations (Redis, 5-minute TTL)
- Prefetch next page on scroll (better UX)
- URL params sync with filters (bookmarkable searches)

**Estimated Effort**: 10 hours

---

## Epic-Level Acceptance Criteria

- [ ] Users can create conversations with AI characters based on scenarios
- [ ] Real-time message streaming works smoothly (< 100ms first token)
- [ ] Messages persist correctly in database with token counts
- [ ] Conversation forking creates independent branches
- [ ] Browse page displays public conversations with search/filter
- [ ] Mobile responsive design (375px+ width)
- [ ] No message loss (all messages saved even if client disconnects)
- [ ] SSE reconnection works seamlessly
- [ ] Token usage tracked accurately for cost monitoring

## Dependencies

**Blocks**:

- Epic 5: Scenario Tree Visualization (needs conversation data to visualize)
- Post-MVP analytics (needs conversation metrics)

**Requires**:

- Epic 0: Project Setup & Infrastructure (database, backend, frontend)
- Epic 1: What If Scenario Foundation (scenarios must exist)
- Epic 2: AI Character Adaptation (prompt generation, context window management)
- Epic 6: User Authentication (for authenticated endpoints)

## Success Metrics

**Technical Metrics**:

- SSE first token latency < 100ms (p95)
- Message persistence success rate > 99.9%
- Average conversation length > 10 messages
- Token counting accuracy > 99%
- Search response time < 200ms (p95)
- SSE reconnection success rate > 95%

**User Metrics** (Phase 1 - 3 months):

- 80%+ users who create scenario start at least one conversation
- 60%+ conversations exceed 10 messages
- 30%+ conversations get forked at least once
- 40%+ users browse public conversations before creating their own
- 20%+ conversation completion rate (user says goodbye or clear ending)

## Cost Monitoring

**Local LLM Infrastructure Cost Estimation**:

- Hardware: ~$0.01 per 1K tokens (electricity + compute amortization)
- Input/Output: Similar cost structure (inference time-based)

**Example Conversation Cost**:

- Average conversation: 10 messages (5 user, 5 assistant)
- Average context per request: 800 tokens (scenario) + 300 tokens (last 6 messages) = 1,100 input tokens
- Average assistant response: 150 output tokens
- Cost per assistant message: ~$0.002 (local compute)
- Cost per 10-message conversation: $0.002 × 5 = $0.01 (~$0.01)

**Monthly Cost Projection** (MVP - 1,000 active users):

- Assume 5 conversations per user per month
- Total conversations: 5,000
- Total cost: 5,000 × $0.01 = $50/month (electricity and hardware amortization)

**Cost Optimization Strategies**:

- Use smaller models (Llama-2-7B) for non-critical conversations
- Cache common scenario prompts
- Summarize long conversation history instead of sending all messages
- Implement conversation cooldown (limit messages per hour)
- Batch inference requests when possible

## Risk Mitigation

**Risk 1: Local LLM inference latency (slower than cloud APIs)**

- Mitigation: Implement response streaming to show partial results
- Mitigation: Use faster models (Mistral-7B) for latency-sensitive conversations
- Mitigation: Show user estimated wait time during high load
- Mitigation: Consider GPU acceleration for production deployment

**Risk 2: Message loss during SSE disconnect**

- Mitigation: Save user message immediately (before calling OpenAI)
- Mitigation: Use database transaction (user message + assistant response)
- Mitigation: Client-side retry logic with exponential backoff
- Mitigation: Store partial assistant response on disconnect (resume later - Phase 2)

**Risk 3: Conversation context explosion (>4K tokens)**

- Mitigation: Hard limit to last 6 messages (prevents context explosion)
- Mitigation: Re-inject scenario context with each request (always fresh)
- Mitigation: 6-message limit provides ~300-500 token context (well under limits)
- Mitigation: No summarization needed (6 messages manageable)

**Risk 4: Spam/abuse (users sending excessive messages)**

- Mitigation: Rate limiting (30 messages/hour per user)
- Mitigation: Token cost tracking per user
- Mitigation: Conversation cooldown (30s between messages - Phase 2)
- Mitigation: Anomaly detection (flag users sending >100 messages/day)

**Risk 5: Poor character consistency across long conversations**

- Mitigation: Periodic scenario context re-injection (Story 2.2)
- Mitigation: Temperature optimization per scenario type (Story 2.3)
- Mitigation: User feedback mechanism ("Character broke timeline" report button)
- Mitigation: Test with 30+ message conversations before launch

## Technical Debt Decisions

**Accepted Debt** (to be addressed post-MVP):

- No conversation summarization (send full history until token limit)
- No resume from disconnect (restart SSE stream on reconnect)
- No conversation templates (pre-filled opening messages)
- No conversation sharing with custom URLs (use generic share)
- No conversation export (download as text/JSON)
- No voice input/output (text only)
- Simple rate limiting (no sophisticated abuse detection)

**Won't Build** (architectural decisions):

- WebSocket instead of SSE (SSE simpler, HTTP/2 compatible)
- Conversation threading (one linear conversation per fork)
- Multi-character conversations (1-on-1 only for MVP)
- Conversation merging (only forking, no merging branches)

## Testing Strategy

**Unit Tests**:

- ConversationService: create, get, delete conversations
- MessageService: save, retrieve, count tokens
- LLMService: inference call, retry logic, error handling (mock LLM)
- Fork logic: copy messages, create child conversation

**Integration Tests**:

- POST /conversations → creates conversation + increments scenario count
- POST /conversations/{id}/messages → saves user message + calls Local LLM + saves assistant message
- SSE streaming → client receives all tokens + final done event
- Fork endpoint → creates child with parent messages copied

**E2E Tests**:

- User journey: create scenario → start conversation → send 5 messages → messages persist
- Streaming: send message → receive streaming response → full message saved
- Fork: create conversation → send 3 messages → fork at message 2 → verify child has 2 messages
- Browse: create 10 conversations → visit /conversations → see all 10 → filter by character → see subset

**Load Tests**:

- Concurrent SSE streams (100 simultaneous conversations)
- Local LLM inference capacity (max concurrent requests)
- Database transaction throughput (message save performance)

**Security Tests**:

- User can only delete their own conversations (403 on other user's conversation)
- Invalid conversation ID returns 404
- Message content XSS prevention (sanitization)

## Open Questions

1. **Q**: Should conversations be public by default or private?
   **A**: Public by default (like Twitter). Privacy settings in Phase 2.

2. **Q**: Can users edit/delete their messages after sending?
   **A**: No editing (preserves conversation integrity). Deletion soft-deletes message (shows "[deleted]").

3. **Q**: Maximum conversation length (number of messages)?
   **A**: No hard limit for MVP. Context window uses last 6 messages only, so conversations can grow indefinitely without token issues. Add soft limit (50 messages) in Phase 2 for UX.

4. **Q**: Should we show "Character is typing..." indicator?
   **A**: Yes, show during SSE streaming for better UX.

5. **Q**: Can users fork other users' conversations?
   **A**: Yes, public conversations are forkable once (enables learning and exploration). Each conversation can only be forked one time.

6. **Q**: Should forked conversations inherit likes from parent?
   **A**: No, each conversation has independent like count.

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Users can create conversations and chat with AI characters
- [ ] SSE streaming works smoothly with real-time message display
- [ ] Messages persist in database with accurate token counts
- [ ] Conversation forking creates independent branches
- [ ] Browse page displays and filters conversations correctly
- [ ] Unit tests >80% coverage on services
- [ ] Integration tests passing for all conversation endpoints
- [ ] E2E test: complete conversation flow (create → chat → fork)
- [ ] Load test: 100 concurrent SSE streams without errors
- [ ] Local LLM capacity handling tested (inference queue works)
- [ ] Mobile responsive design verified on 375px+ width
- [ ] SSE reconnection tested (disconnect → reconnect → resume)
- [ ] Cost monitoring dashboard shows token usage per conversation
- [ ] Code review completed, no P0/P1 security issues
- [ ] Deployed to Railway staging, smoke tested with real conversations

---

**Epic Owner**: Backend Lead + Frontend Lead (joint ownership)

**Start Date**: Week 2, Day 3 of MVP development

**Target Completion**: Week 3, Day 1 (2-3 working days)

**Estimated Total Effort**: 48 hours (achievable in 3 days for 2 engineers working in parallel)

**Priority**: CRITICAL - Core user value, enables meaningful exploration of What If scenarios
