# Story 6.8: Personal Memo System Backend

**Epic**: Epic 6 - User Authentication & Social Features  
**Priority**: P2 - Medium  
**Status**: Not Started  
**Estimated Effort**: 5 hours

## Description

Create backend API for personal conversation memos (private notes) with CRUD operations and user-scoped privacy enforcement.

## Dependencies

**Blocks**:

- Story 6.9: Memo UI in Conversation View

**Requires**:

- Story 4.1: Conversation Data Model
- Story 6.1: User Authentication Backend

## Acceptance Criteria

- [ ] `conversation_memos` table created
- [ ] Composite primary key: (user_id, conversation_id)
- [ ] GET /api/conversations/{id}/memo endpoint (user-scoped)
- [ ] POST /api/conversations/{id}/memo endpoint (create/update)
- [ ] DELETE /api/conversations/{id}/memo endpoint
- [ ] Memo text limited to 1000 characters
- [ ] Privacy: Users can only access their own memos
- [ ] Unique constraint per user-conversation pair
- [ ] Authenticated users only
- [ ] Unit tests >80% coverage

## Technical Notes

**Database Migration**:

```sql
-- V16__create_conversation_memos.sql
CREATE TABLE conversation_memos (
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    memo_text TEXT NOT NULL CHECK (LENGTH(memo_text) <= 1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, conversation_id),

    CONSTRAINT fk_conversation_memos_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_memos_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE
);

-- Index for fetching user's memos
CREATE INDEX idx_conversation_memos_user
    ON conversation_memos(user_id, updated_at DESC);

-- Trigger to update updated_at on memo update
CREATE OR REPLACE FUNCTION update_conversation_memo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_memo_timestamp
BEFORE UPDATE ON conversation_memos
FOR EACH ROW
EXECUTE FUNCTION update_conversation_memo_timestamp();
```

**Entity - ConversationMemo.java**:

```java
package com.gaji.domain.conversationmemo;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "conversation_memos")
@IdClass(ConversationMemoId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMemo {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @NotBlank(message = "Memo text cannot be blank")
    @Size(max = 1000, message = "Memo text cannot exceed 1000 characters")
    @Column(name = "memo_text", nullable = false, length = 1000)
    private String memoText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

**Composite Key - ConversationMemoId.java**:

```java
package com.gaji.domain.conversationmemo;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ConversationMemoId implements Serializable {
    private UUID userId;
    private UUID conversationId;
}
```

**Repository - ConversationMemoRepository.java**:

```java
package com.gaji.repository;

import com.gaji.domain.conversationmemo.ConversationMemo;
import com.gaji.domain.conversationmemo.ConversationMemoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemoRepository extends JpaRepository<ConversationMemo, ConversationMemoId> {

    Optional<ConversationMemo> findByUserIdAndConversationId(UUID userId, UUID conversationId);

    boolean existsByUserIdAndConversationId(UUID userId, UUID conversationId);
}
```

**Service - ConversationMemoService.java**:

```java
package com.gaji.service;

import com.gaji.domain.conversationmemo.ConversationMemo;
import com.gaji.domain.conversationmemo.ConversationMemoId;
import com.gaji.dto.MemoRequest;
import com.gaji.dto.MemoResponse;
import com.gaji.repository.ConversationMemoRepository;
import com.gaji.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationMemoService {

    private final ConversationMemoRepository conversationMemoRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Get user's memo for a conversation.
     * Returns null if no memo exists.
     */
    @Transactional(readOnly = true)
    public MemoResponse getMemo(UUID conversationId, UUID userId) {
        // Verify conversation exists
        conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        return conversationMemoRepository.findByUserIdAndConversationId(userId, conversationId)
            .map(MemoResponse::from)
            .orElse(null);
    }

    /**
     * Create or update user's memo for a conversation.
     */
    @Transactional
    public MemoResponse saveMemo(UUID conversationId, UUID userId, MemoRequest request) {
        // Verify conversation exists
        conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        // Validate memo text
        if (request.getMemoText() == null || request.getMemoText().isBlank()) {
            throw new IllegalArgumentException("Memo text cannot be blank");
        }

        if (request.getMemoText().length() > 1000) {
            throw new IllegalArgumentException("Memo text cannot exceed 1000 characters");
        }

        // Find existing memo or create new
        ConversationMemo memo = conversationMemoRepository
            .findByUserIdAndConversationId(userId, conversationId)
            .orElseGet(() -> ConversationMemo.builder()
                .userId(userId)
                .conversationId(conversationId)
                .build());

        memo.setMemoText(request.getMemoText());

        ConversationMemo savedMemo = conversationMemoRepository.save(memo);

        log.info("User {} saved memo for conversation {}", userId, conversationId);

        return MemoResponse.from(savedMemo);
    }

    /**
     * Delete user's memo for a conversation.
     */
    @Transactional
    public void deleteMemo(UUID conversationId, UUID userId) {
        // Verify conversation exists
        conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        ConversationMemoId memoId = new ConversationMemoId(userId, conversationId);

        if (!conversationMemoRepository.existsById(memoId)) {
            log.warn("Attempted to delete non-existent memo for user {} and conversation {}", userId, conversationId);
            return;
        }

        conversationMemoRepository.deleteById(memoId);

        log.info("User {} deleted memo for conversation {}", userId, conversationId);
    }
}
```

**DTO - MemoRequest.java**:

```java
package com.gaji.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoRequest {

    @NotBlank(message = "Memo text cannot be blank")
    @Size(max = 1000, message = "Memo text cannot exceed 1000 characters")
    private String memoText;
}
```

**DTO - MemoResponse.java**:

```java
package com.gaji.dto;

import com.gaji.domain.conversationmemo.ConversationMemo;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoResponse {
    private UUID userId;
    private UUID conversationId;
    private String memoText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MemoResponse from(ConversationMemo memo) {
        return MemoResponse.builder()
            .userId(memo.getUserId())
            .conversationId(memo.getConversationId())
            .memoText(memo.getMemoText())
            .createdAt(memo.getCreatedAt())
            .updatedAt(memo.getUpdatedAt())
            .build();
    }
}
```

**Controller - ConversationMemoController.java**:

```java
package com.gaji.controller;

import com.gaji.dto.MemoRequest;
import com.gaji.dto.MemoResponse;
import com.gaji.security.CurrentUser;
import com.gaji.service.ConversationMemoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationMemoController {

    private final ConversationMemoService conversationMemoService;

    /**
     * Get user's memo for a conversation.
     * GET /api/conversations/{id}/memo
     */
    @GetMapping("/{id}/memo")
    public ResponseEntity<MemoResponse> getMemo(
        @PathVariable UUID id,
        @AuthenticationPrincipal CurrentUser currentUser
    ) {
        MemoResponse memo = conversationMemoService.getMemo(id, currentUser.getUserId());

        if (memo == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(memo);
    }

    /**
     * Create or update user's memo for a conversation.
     * POST /api/conversations/{id}/memo
     */
    @PostMapping("/{id}/memo")
    public ResponseEntity<MemoResponse> saveMemo(
        @PathVariable UUID id,
        @AuthenticationPrincipal CurrentUser currentUser,
        @Valid @RequestBody MemoRequest request
    ) {
        MemoResponse memo = conversationMemoService.saveMemo(id, currentUser.getUserId(), request);
        return ResponseEntity.ok(memo);
    }

    /**
     * Delete user's memo for a conversation.
     * DELETE /api/conversations/{id}/memo
     */
    @DeleteMapping("/{id}/memo")
    public ResponseEntity<Void> deleteMemo(
        @PathVariable UUID id,
        @AuthenticationPrincipal CurrentUser currentUser
    ) {
        conversationMemoService.deleteMemo(id, currentUser.getUserId());
        return ResponseEntity.noContent().build();
    }
}
```

## QA Checklist

### Functional Testing

- [ ] POST /memo creates conversation_memos record
- [ ] POST /memo updates existing memo
- [ ] GET /memo returns user's memo
- [ ] GET /memo returns 204 if no memo exists
- [ ] DELETE /memo removes memo record
- [ ] Memo text limited to 1000 characters
- [ ] Blank memo text rejected

### Privacy & Security

- [ ] User can only access their own memos
- [ ] User A cannot read User B's memo
- [ ] User A cannot update User B's memo
- [ ] User A cannot delete User B's memo
- [ ] Unauthenticated requests return 401

### Data Integrity

- [ ] Composite primary key prevents duplicate memos
- [ ] CASCADE delete removes memos when conversation deleted
- [ ] CASCADE delete removes memos when user deleted
- [ ] updated_at updates on memo change

### Edge Cases

- [ ] Creating memo for non-existent conversation returns 404
- [ ] Deleting non-existent memo is idempotent (no error)
- [ ] Memo text > 1000 chars returns 400
- [ ] Blank memo text returns 400

### Performance

- [ ] GET /memo < 50ms
- [ ] POST /memo < 100ms
- [ ] DELETE /memo < 50ms
- [ ] Index on user_id for performance

## Estimated Effort

5 hours
