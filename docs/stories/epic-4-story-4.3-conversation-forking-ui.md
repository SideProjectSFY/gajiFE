# Story 4.3: Conversation Forking & Branching UI

**Epic**: Epic 4 - Conversation System  
**Priority**: P1 - High  
**Status**: Not Started  
**Estimated Effort**: 10 hours

## Description

Enable users to fork conversations to explore alternative dialogue paths, with strict ROOT-only forking constraints and automatic message copying logic.

## Dependencies

**Blocks**:

- Epic 5 stories (tree visualization requires fork data structure)

**Requires**:

- Story 4.1: Conversation Data Model & CRUD API (needs conversation schema)
- Story 4.2: Message Streaming & AI Integration (needs message data)

## Acceptance Criteria

- [ ] Fork conversation backend logic

  - POST /api/v1/conversations/{id}/fork endpoint (requires authentication)
  - **Validation 1**: Check conversation.parent_conversation_id IS NULL (return 403 Forbidden if trying to fork a forked conversation)
  - **Validation 2**: Check conversation.has_been_forked = false (return 409 Conflict if root already forked)
  - Request body: Empty `{}` (no message selection - always copies most recent messages)
  - **Message Copy Logic**: Copy min(6, total_message_count) most recent messages
    - If original has ≥6 messages → copy last 6 messages
    - If original has <6 messages → copy ALL messages
  - Update parent conversation: set has_been_forked = true (atomic operation)
  - Return new conversation ID with copied message count

- [ ] ForkConversationButton in conversation header

  - **Only show if**: conversation.parent_conversation_id IS NULL (root conversations only)
  - Show "Fork Conversation" button if conversation.has_been_forked = false
  - If conversation is a fork: hide button entirely (show badge: "Forked - cannot fork again")

- [ ] ForkConversationModal component
  - Preview: "Last {count} messages will be preserved"
  - Display exact messages that will be copied
  - Warning: "Original conversations can only be forked once"
  - On success: navigate to new conversation

## QA Checklist

### Fork Business Logic

- [ ] ROOT conversation can be forked successfully
- [ ] Forked conversation shows 403 when attempting to fork
- [ ] Message copy works for <6 messages (copies all)
- [ ] Message copy works for ≥6 messages (copies last 6)
- [ ] Parent has_been_forked flag updates correctly

### UI/UX Testing

- [ ] Fork button visible ONLY on ROOT conversations
- [ ] Fork button hidden on forked conversations
- [ ] Modal shows correct message count preview

### Edge Cases

- [ ] Fork with 0 messages fails gracefully
- [ ] Fork with 1 message copies 1
- [ ] Fork with 6 messages copies 6
- [ ] Concurrent fork attempts (only one succeeds)

### Security

- [ ] Only authenticated users can fork
- [ ] Forked conversation maintains permissions

### Performance

- [ ] Fork operation completes in <500ms

## Estimated Effort

10 hours
