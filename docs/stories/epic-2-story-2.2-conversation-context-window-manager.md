# Story 2.2: Conversation Context Window Manager

**Epic**: Epic 2 - AI Adaptation Layer  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 10 hours

## Description

Implement intelligent context window management to include relevant message history, scenario parameters, and character consistency rules within Local LLM token limits.

## Dependencies

**Blocks**:

- Story 4.2: Message Streaming (needs context management for multi-turn conversations)

**Requires**:

- Story 2.1: Scenario-to-Prompt Engine (builds on prompt generation)
- Story 4.1: Conversation Data Model (reads message history)

## Acceptance Criteria

- [ ] `ContextWindowManager` service calculates token count for messages using custom tokenizer
- [ ] Context strategy: System prompt (scenario-adapted) + Last N messages where total ≤ 4096 tokens
- [ ] Sliding window: Removes oldest messages when limit exceeded, always keeps system prompt
- [ ] Character consistency injection: Adds character traits summary every 10 messages
- [ ] Message compression for old messages: Summarize messages 20+ back to save tokens
- [ ] `/api/ai/build-context` endpoint returns: system_prompt, messages[], token_count, compression_applied
- [ ] Token count validation before Local LLM API call (reject if > 4096)
- [ ] Context caching: Redis cache for repeated conversation_id queries (TTL 5 minutes)
- [ ] Metrics: Average token usage, compression rate, cache hit rate
- [ ] Unit tests >85% coverage

## Technical Notes

**Token Counting** (Python with custom tokenizer):

```python
class ContextWindowManager:
    MAX_TOKENS = 4096
    COMPRESSION_THRESHOLD = 20  # Messages older than 20th get compressed

    def __init__(self):
        self.tokenizer = load_tokenizer()  # Custom tokenizer for Local LLM

    def count_tokens(self, text: str) -> int:
        return len(self.tokenizer.encode(text))

    async def build_context(
        self,
        scenario_id: str,
        conversation_id: str
    ) -> ContextWindow:
        # Get scenario-adapted system prompt
        system_prompt = await prompt_adapter.adapt_prompt(scenario_id)
        system_tokens = self.count_tokens(system_prompt)

        # Get all messages for conversation
        messages = await get_conversation_messages(conversation_id)

        # Build context with sliding window
        context_messages = []
        total_tokens = system_tokens

        # Always include most recent messages
        for i, msg in enumerate(reversed(messages)):
            msg_text = f"{msg.role}: {msg.content}"
            msg_tokens = self.count_tokens(msg_text)

            # Check if adding message exceeds limit
            if total_tokens + msg_tokens > self.MAX_TOKENS:
                break

            # Compress old messages
            if i >= self.COMPRESSION_THRESHOLD:
                msg_text = await self.compress_message(msg)
                msg_tokens = self.count_tokens(msg_text)

            context_messages.insert(0, {
                "role": msg.role,
                "content": msg.content if i < self.COMPRESSION_THRESHOLD else msg_text
            })
            total_tokens += msg_tokens

        # Inject character consistency every 10 messages
        if len(context_messages) >= 10:
            context_messages = self.inject_character_reminders(
                context_messages,
                scenario_id
            )

        return ContextWindow(
            system_prompt=system_prompt,
            messages=context_messages,
            token_count=total_tokens,
            compression_applied=len(messages) > self.COMPRESSION_THRESHOLD
        )

    async def compress_message(self, message: Message) -> str:
        """Summarize old message to save tokens"""
        if len(message.content) < 100:
            return message.content  # Too short to compress

        # Simple compression: Extract key points
        # Future: Use Local LLM for intelligent summarization
        words = message.content.split()
        return " ".join(words[:30]) + "..."  # Keep first 30 words

    def inject_character_reminders(
        self,
        messages: list,
        scenario_id: str
    ) -> list:
        """Inject character consistency reminders every 10 messages"""
        scenario = get_scenario(scenario_id)
        reminder = f"REMINDER: {scenario.parameters.get('character')} is {scenario.parameters.get('new_property')}."

        result = []
        for i, msg in enumerate(messages):
            result.append(msg)
            if (i + 1) % 10 == 0:
                result.append({
                    "role": "system",
                    "content": reminder
                })

        return result
```

**FastAPI Endpoint**:

```python
@router.post("/ai/build-context")
async def build_context(request: BuildContextRequest):
    context_manager = ContextWindowManager()

    # Check cache first
    cache_key = f"context:{request.conversation_id}"
    cached = await redis.get(cache_key)
    if cached:
        return ContextWindow.parse_raw(cached)

    # Build context
    context = await context_manager.build_context(
        request.scenario_id,
        request.conversation_id
    )

    # Cache for 5 minutes
    await redis.setex(cache_key, 300, context.json())

    return context
```

## QA Checklist

### Functional Testing

- [ ] Context with 5 messages stays within 4096 token limit
- [ ] Context with 50 messages compresses messages 20+ correctly
- [ ] System prompt always included in context
- [ ] Character reminders injected every 10 messages
- [ ] Token count matches actual Local LLM tokenization

### Context Window Strategy

- [ ] Most recent messages prioritized
- [ ] Oldest messages removed when limit exceeded
- [ ] Compression reduces token usage by >50% for long messages
- [ ] Compressed messages still coherent

### Performance

- [ ] build_context < 200ms (uncached)
- [ ] build_context < 50ms (cached)
- [ ] Cache hit rate >70% in load testing
- [ ] Token counting < 10ms per message

### Edge Cases

- [ ] Conversation with 1 message works
- [ ] Conversation with 100+ messages handles gracefully
- [ ] Empty message history returns only system prompt
- [ ] Very long single message (5000 tokens) handled

### Metrics & Monitoring

- [ ] Average token usage logged per conversation
- [ ] Compression rate tracked (messages compressed / total messages)
- [ ] Cache hit rate exposed via /metrics endpoint

## Estimated Effort

10 hours
