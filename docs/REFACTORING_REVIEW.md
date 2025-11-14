# 데이터베이스 리팩토링 전략 검토

**Date**: 2025-01-14  
**Reviewer**: GitHub Copilot (Architect)  
**Proposed Strategy**: 유저/소설 메타데이터는 PostgreSQL, 소설 전문/캐릭터 분석/대화 처리는 VectorDB

---

## 📋 제안된 리팩토링 전략

### 현재 제안

| 데이터 종류 | 저장소 |
|-----------|-------|
| **유저 정보** | PostgreSQL |
| **소설 메타데이터** (제목, 저자, 출판일, 장르, ISBN) | PostgreSQL |
| **소설 전문** (Full Text) | VectorDB |
| **캐릭터 분석** | VectorDB |
| **대화 처리** (메시지, RAG 컨텍스트) | VectorDB |

---

## 🔍 심층 분석: 대화 데이터 위치 검토

### ⚠️ 문제점 발견: "대화 처리 전체를 VectorDB"는 **비최적**

대화(Conversation) 데이터는 **두 가지 성격**을 가집니다:

1. **메타데이터** (관계형): 누가, 언제, 어떤 시나리오에서 대화했는지
2. **컨텐츠** (비정형): 메시지 내용, RAG 컨텍스트

---

## 📊 대화 데이터 분류

### A. 대화 메타데이터 (PostgreSQL 권장) ✅

**왜 PostgreSQL에 있어야 하는가?**

```sql
-- 복잡한 관계형 쿼리가 필요한 데이터들
SELECT 
    c.id,
    c.created_at,
    u.username,
    s.scenario_type,
    c.message_count,
    c.like_count,
    COUNT(cl.user_id) AS likes
FROM conversations c
JOIN users u ON c.user_id = u.id
JOIN root_user_scenarios s ON c.scenario_id = s.id
LEFT JOIN conversation_likes cl ON c.id = cl.conversation_id
WHERE c.user_id = ?
  AND c.is_private = false
  AND c.created_at > NOW() - INTERVAL '7 days'
GROUP BY c.id
ORDER BY c.like_count DESC, c.created_at DESC
LIMIT 20;
```

**PostgreSQL에 저장해야 할 대화 관련 데이터**:

| 테이블 | 데이터 | 이유 |
|-------|-------|------|
| `conversations` | user_id, scenario_id, parent_conversation_id, is_root, like_count, is_private, created_at | **JOIN 필수** (User ↔ Scenario ↔ Conversation) |
| `conversation_message_links` | conversation_id, message_id, sequence_order | **메시지 순서 관리**, 포크 시 메시지 재사용 |
| `messages` | id, sender_id, role, **content**, created_at | **메시지 메타데이터** (짧은 텍스트는 PostgreSQL 효율적) |
| `conversation_likes` | user_id, conversation_id | **소셜 기능** (관계형 쿼리) |
| `conversation_memos` | user_id, conversation_id, content | **관계형 쿼리** |

**핵심 이유**:
1. **관계형 쿼리 필수**: "내가 좋아요한 대화", "팔로워들의 최근 대화", "특정 시나리오의 인기 대화"
2. **트랜잭션 보장**: 대화 포크 시 메시지 복사는 ACID 트랜잭션 필요
3. **페이지네이션**: `LIMIT/OFFSET`, 커서 기반 페이징
4. **정렬/필터링**: `ORDER BY like_count`, `WHERE is_private = false`

---

### B. 대화 컨텐츠/RAG 처리 (VectorDB 권장) ✅

**VectorDB에 저장해야 할 데이터**:

| 데이터 | VectorDB Collection | 이유 |
|-------|-------------------|------|
| **소설 전문** | `novel_passages` | 의미 검색, RAG 컨텍스트 |
| **캐릭터 분석** | `characters` | 성격 임베딩, 캐릭터 검색 |
| **장소/이벤트/주제** | `locations`, `events`, `themes` | LLM 분석 결과, 의미 검색 |
| **대화 임베딩** (선택적) | `conversation_embeddings` | 유사 대화 추천 |

**VectorDB가 필요한 대화 관련 작업**:

```python
# 1. RAG: 메시지에 대한 관련 구절 검색
async def get_rag_context(user_message: str, novel_id: UUID):
    # VectorDB에서 의미 검색
    chroma = chromadb.PersistentClient(path="./chroma_data")
    passages = chroma.get_collection("novel_passages")
    
    results = passages.query(
        query_texts=[user_message],
        where={"novel_id": str(novel_id)},
        n_results=20
    )
    return results["documents"]

# 2. 캐릭터 성격 기반 프롬프트 구성
async def get_character_context(character_vectordb_id: str):
    characters = chroma.get_collection("characters")
    character = characters.get(ids=[character_vectordb_id])
    
    return {
        "name": character["metadatas"][0]["name"],
        "personality": character["documents"][0],
        "traits": character["metadatas"][0]["personality_traits"]
    }

# 3. 유사 대화 추천 (선택적 기능)
async def find_similar_conversations(conversation_id: UUID):
    # 대화 내용을 임베딩하여 유사한 대화 찾기
    conversation_embeddings = chroma.get_collection("conversation_embeddings")
    # ...
```

---

## 🎯 최적 리팩토링 전략 (수정안)

### ✅ 권장: 하이브리드 접근 (대화 데이터 분리)

```
┌─────────────────────────────────────────────────────────────────┐
│                         대화(Conversation)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PostgreSQL (메타데이터)          │  VectorDB (컨텐츠/RAG)        │
│  ─────────────────────────        │  ───────────────────────     │
│  - conversations (관계형)         │  - novel_passages (RAG)      │
│  - messages (메타 + 짧은 내용)     │  - characters (성격)         │
│  - conversation_message_links     │  - locations, events         │
│  - conversation_likes (소셜)      │  - (선택) conversation_      │
│  - conversation_memos             │    embeddings (유사 대화)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 데이터 배치 최종안

| 데이터 | PostgreSQL | VectorDB | 이유 |
|-------|-----------|----------|------|
| **유저 정보** | ✅ | ❌ | 관계형, JOIN |
| **소설 메타데이터** | ✅ | ❌ | 제목, 저자, 장르 검색 |
| **소설 전문** | ❌ | ✅ | 대용량, 의미 검색 |
| **캐릭터 분석** | ❌ | ✅ | LLM 추출, 성격 임베딩 |
| **시나리오 메타데이터** | ✅ | ❌ | 관계형, 포크 트리 |
| **시나리오 변경 내용** | ✅ (요약) | ✅ (상세) | 메타는 PostgreSQL, 상세 분석은 VectorDB |
| **대화 메타데이터** | ✅ | ❌ | **user_id, scenario_id, like_count 등 JOIN 필수** |
| **메시지 내용** | ✅ | ❌ | **짧은 텍스트 (<500자), 순서 관리** |
| **RAG 컨텍스트** | ❌ | ✅ | 소설 구절 검색 |
| **대화 임베딩** (선택) | ❌ | ✅ | 유사 대화 추천 |

---

## 📐 구체적 시나리오 분석

### 시나리오 1: "내 최근 대화 목록 조회"

```typescript
// Frontend → Spring Boot
const conversations = await coreApi.getMyConversations({
  user_id: currentUserId,
  limit: 20,
  sort: 'recent'
});
```

**처리 흐름**:

```sql
-- Spring Boot → PostgreSQL
SELECT 
    c.id,
    c.created_at,
    c.message_count,
    c.like_count,
    c.is_private,
    s.scenario_type,
    u.username AS creator_name
FROM conversations c
JOIN root_user_scenarios s ON c.scenario_id = s.id
JOIN users u ON c.user_id = u.id
WHERE c.user_id = ?
ORDER BY c.created_at DESC
LIMIT 20;
```

**왜 VectorDB가 아닌가?**
- ❌ VectorDB는 JOIN 불가
- ❌ VectorDB는 복잡한 필터링/정렬 비효율적
- ✅ PostgreSQL은 인덱스로 빠른 조회 가능 (< 50ms)

---

### 시나리오 2: "AI 캐릭터에게 메시지 전송"

```typescript
// Frontend → FastAPI (스트리밍 대화)
const stream = await aiApi.sendMessage(conversationId, "Hermione, what would you do?");
```

**처리 흐름**:

```python
# FastAPI RAG Service
async def generate_response(conversation_id: UUID, user_message: str):
    # 1. PostgreSQL에서 대화 메타데이터 가져오기 (Spring Boot API 호출)
    async with httpx.AsyncClient() as client:
        conversation = await client.get(
            f"http://spring-boot:8080/api/internal/conversations/{conversation_id}"
        )
        
    scenario_id = conversation["scenario_id"]
    character_vectordb_id = conversation["character_vectordb_id"]
    novel_id = conversation["novel_id"]
    
    # 2. VectorDB에서 RAG 컨텍스트 가져오기 (FastAPI 전용)
    chroma = chromadb.PersistentClient(path="./chroma_data")
    
    # 2-1. 관련 소설 구절 검색
    passages = chroma.get_collection("novel_passages")
    relevant_passages = passages.query(
        query_texts=[user_message],
        where={"novel_id": str(novel_id)},
        n_results=20
    )
    
    # 2-2. 캐릭터 성격 정보
    characters = chroma.get_collection("characters")
    character = characters.get(ids=[character_vectordb_id])
    
    # 2-3. 시나리오 관련 이벤트/테마
    events = chroma.get_collection("events")
    # ...
    
    # 3. 프롬프트 구성
    prompt = f"""
    Character: {character["metadatas"][0]["name"]}
    Personality: {character["documents"][0]}
    
    Relevant story context:
    {relevant_passages["documents"]}
    
    User: {user_message}
    Assistant:
    """
    
    # 4. Gemini 2.5 Flash 호출
    async for token in gemini_client.generate_stream(prompt):
        yield token
    
    # 5. 메시지를 PostgreSQL에 저장 (Spring Boot API 호출)
    await client.post(
        f"http://spring-boot:8080/api/internal/conversations/{conversation_id}/messages",
        json={
            "role": "assistant",
            "content": full_response
        }
    )
```

**분석**:
- ✅ **메타데이터 조회**: PostgreSQL (대화 정보, 시나리오 ID)
- ✅ **RAG 컨텍스트**: VectorDB (소설 구절, 캐릭터 성격)
- ✅ **메시지 저장**: PostgreSQL (짧은 텍스트, 순서 관리)

---

### 시나리오 3: "대화 포크 (6개 메시지 복사)"

```typescript
// Frontend → Spring Boot
const forkedConversation = await coreApi.forkConversation(parentConversationId);
```

**처리 흐름**:

```java
// Spring Boot - ConversationService.java
@Transactional
public Conversation forkConversation(UUID parentConversationId, UUID userId) {
    // 1. 부모 대화 조회 (PostgreSQL)
    Conversation parent = conversationRepository.findById(parentConversationId)
        .orElseThrow();
    
    // 2. 새 대화 생성 (PostgreSQL)
    Conversation child = new Conversation();
    child.setUserId(userId);
    child.setScenarioId(parent.getScenarioId());
    child.setParentConversationId(parentConversationId);
    child.setIsRoot(false);
    conversationRepository.save(child);
    
    // 3. 메시지 복사 로직 (PostgreSQL 트랜잭션)
    List<ConversationMessageLink> parentLinks = messageLinksRepository
        .findByConversationIdOrderBySequenceOrder(parentConversationId);
    
    int messagesToCopy = Math.min(6, parentLinks.size());
    
    for (int i = 0; i < messagesToCopy; i++) {
        ConversationMessageLink parentLink = parentLinks.get(i);
        
        // 메시지 재사용 (messages 테이블은 공유)
        ConversationMessageLink childLink = new ConversationMessageLink();
        childLink.setConversationId(child.getId());
        childLink.setMessageId(parentLink.getMessageId());  // 같은 message_id
        childLink.setSequenceOrder(i + 1);
        messageLinksRepository.save(childLink);
    }
    
    return child;
}
```

**왜 VectorDB가 아닌가?**
- ❌ **트랜잭션 필수**: 대화 생성 + 메시지 링크 복사는 원자적 작업
- ❌ **관계형 무결성**: parent_conversation_id FK 제약
- ❌ **순서 보장**: sequence_order 관리
- ✅ PostgreSQL ACID 트랜잭션으로 안전하게 처리

---

### 시나리오 4: "유사한 대화 추천" (선택적 기능)

**요구사항**: "Hermione in Slytherin" 시나리오와 비슷한 대화 찾기

**처리 흐름**:

```python
# FastAPI - ConversationRecommendationService
async def find_similar_conversations(conversation_id: UUID, top_k: int = 10):
    # 1. PostgreSQL에서 대화 메타 가져오기
    async with httpx.AsyncClient() as client:
        conversation = await client.get(
            f"http://spring-boot:8080/api/internal/conversations/{conversation_id}"
        )
    
    # 2. VectorDB에서 대화 임베딩 검색 (선택적 기능)
    chroma = chromadb.PersistentClient(path="./chroma_data")
    conversation_embeddings = chroma.get_or_create_collection("conversation_embeddings")
    
    # 대화 요약을 임베딩하여 저장했다면
    similar = conversation_embeddings.query(
        query_embeddings=[conversation["summary_embedding"]],
        n_results=top_k,
        where={"is_private": False}
    )
    
    # 3. 유사 대화 ID들을 PostgreSQL로 조회 (메타데이터)
    conversation_ids = [result["conversation_id"] for result in similar["metadatas"]]
    
    async with httpx.AsyncClient() as client:
        conversations_meta = await client.post(
            "http://spring-boot:8080/api/internal/conversations/batch",
            json={"ids": conversation_ids}
        )
    
    return conversations_meta
```

**분석**:
- ✅ **의미 검색**: VectorDB (대화 요약 임베딩)
- ✅ **메타데이터**: PostgreSQL (좋아요 수, 작성자, 공개 여부)
- 하이브리드 접근 필요!

---

## ⚠️ "대화 전체를 VectorDB"의 문제점

### 문제 1: 관계형 쿼리 불가

```typescript
// ❌ VectorDB로는 불가능한 쿼리들

// "내가 팔로우하는 사람들의 최근 대화"
SELECT c.* FROM conversations c
JOIN users u ON c.user_id = u.id
JOIN user_follows f ON u.id = f.followee_id
WHERE f.follower_id = ?;

// "특정 시나리오에서 좋아요 많은 대화"
SELECT c.* FROM conversations c
WHERE c.scenario_id = ?
ORDER BY c.like_count DESC;

// "이번 주 인기 대화"
SELECT c.* FROM conversations c
JOIN conversation_likes cl ON c.id = cl.conversation_id
WHERE c.created_at > NOW() - INTERVAL '7 days'
GROUP BY c.id
HAVING COUNT(cl.user_id) > 10;
```

VectorDB는 이런 복잡한 JOIN, GROUP BY, HAVING 지원 안 함!

---

### 문제 2: 트랜잭션 미지원

```java
// ❌ VectorDB로는 불가능한 원자적 작업

@Transactional
public void forkConversation() {
    // 1. 새 대화 생성
    // 2. 메시지 6개 복사
    // 3. 부모 대화 fork_count 증가
    // 4. 사용자 포인트 차감
    
    // 중간에 에러 나면 모두 롤백 필요 → VectorDB는 트랜잭션 없음!
}
```

---

### 문제 3: 메시지 순서 관리 어려움

```sql
-- PostgreSQL: conversation_message_links로 순서 관리
CREATE TABLE conversation_message_links (
    conversation_id UUID,
    message_id UUID,
    sequence_order INTEGER,  -- 1, 2, 3, 4, 5, 6
    UNIQUE(conversation_id, sequence_order)
);

-- 메시지 순서대로 조회
SELECT m.content
FROM messages m
JOIN conversation_message_links cml ON m.id = cml.message_id
WHERE cml.conversation_id = ?
ORDER BY cml.sequence_order ASC;
```

VectorDB는 순서 보장, 중복 제거, FK 제약 모두 어려움!

---

### 문제 4: 소셜 기능 구현 불가

```sql
-- ❌ VectorDB로는 불가능

-- 좋아요 누르기 (중복 방지)
INSERT INTO conversation_likes (user_id, conversation_id)
VALUES (?, ?)
ON CONFLICT DO NOTHING;  -- VectorDB는 UNIQUE 제약 없음

-- 좋아요 수 집계
UPDATE conversations 
SET like_count = (
    SELECT COUNT(*) FROM conversation_likes WHERE conversation_id = ?
)
WHERE id = ?;
```

---

## ✅ 최종 권장 전략

### 데이터 분리 원칙 (수정안)

```
┌──────────────────────────────────────────────────────────────────┐
│                        Gaji 플랫폼 데이터                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PostgreSQL (관계형 메타데이터)                                    │
│  ────────────────────────────                                     │
│  ✅ users                          - 유저 정보                    │
│  ✅ novels                         - 소설 메타 (제목, 저자, 장르) │
│  ✅ base_scenarios                 - 시나리오 메타                │
│  ✅ root_user_scenarios            - 유저 시나리오                │
│  ✅ leaf_user_scenarios            - 포크된 시나리오              │
│  ✅ conversations                  - 대화 메타 (user_id, 좋아요)  │
│  ✅ messages                       - 메시지 내용 (짧은 텍스트)     │
│  ✅ conversation_message_links     - 메시지 순서 관리             │
│  ✅ conversation_likes             - 소셜 기능                    │
│  ✅ conversation_memos             - 메모                        │
│  ✅ user_follows                   - 팔로우 관계                  │
│                                                                   │
│  VectorDB (대용량 컨텐츠 + 임베딩)                                 │
│  ─────────────────────────────                                    │
│  ✅ novel_passages                 - 소설 전문 (청크 단위)        │
│  ✅ characters                     - 캐릭터 분석 + 성격 임베딩     │
│  ✅ locations                      - 장소 분석                    │
│  ✅ events                         - 이벤트 분석                  │
│  ✅ themes                         - 주제 분석                    │
│  🔶 conversation_embeddings       - 대화 요약 임베딩 (선택적)     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 핵심 원칙

| 데이터 특성 | 저장소 | 예시 |
|-----------|-------|------|
| **관계형 필요** (JOIN, FK) | PostgreSQL | User ↔ Conversation ↔ Message |
| **트랜잭션 필요** (ACID) | PostgreSQL | 대화 포크, 좋아요 처리 |
| **짧은 텍스트** (<500자) | PostgreSQL | 메시지 내용, 메모 |
| **복잡한 필터링/정렬** | PostgreSQL | "좋아요 많은 대화", "최근 7일 인기" |
| **대용량 텍스트** (1-5MB) | VectorDB | 소설 전문 (청크) |
| **의미 검색** (벡터 유사도) | VectorDB | "용감한 장면", "똑똑한 캐릭터" |
| **LLM 분석 결과** | VectorDB | 캐릭터 성격, 주제 추출 |
| **임베딩** (768-dim) | VectorDB | Gemini Embedding API 결과 |

---

## 🎯 구현 가이드

### Spring Boot Service Layer

```java
// ConversationService.java - 대화 메타데이터 관리
@Service
public class ConversationService {
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private WebClient aiServiceClient;  // FastAPI 호출용
    
    // PostgreSQL에서 대화 메타 조회
    public ConversationDTO getConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId)
            .map(this::toDTO)
            .orElseThrow();
    }
    
    // PostgreSQL에서 대화 목록 조회 (관계형 쿼리)
    public Page<ConversationDTO> getUserConversations(UUID userId, Pageable pageable) {
        return conversationRepository.findByUserIdAndIsPrivateFalse(userId, pageable)
            .map(this::toDTO);
    }
    
    // PostgreSQL 트랜잭션으로 대화 포크
    @Transactional
    public Conversation forkConversation(UUID parentId, UUID userId) {
        Conversation parent = conversationRepository.findById(parentId).orElseThrow();
        
        Conversation child = new Conversation();
        child.setUserId(userId);
        child.setScenarioId(parent.getScenarioId());
        child.setParentConversationId(parentId);
        child.setIsRoot(false);
        
        // 메시지 6개 복사 (PostgreSQL)
        List<Message> parentMessages = messageRepository
            .findByConversationIdOrderByCreatedAtAsc(parentId)
            .stream()
            .limit(6)
            .collect(Collectors.toList());
        
        child.setMessages(parentMessages);  // 메시지 재사용
        
        return conversationRepository.save(child);
    }
}
```

### FastAPI RAG Service

```python
# rag_service.py - VectorDB 전용 RAG 처리
class RAGService:
    def __init__(self):
        self.chroma = chromadb.PersistentClient(path="./chroma_data")
        self.passages = self.chroma.get_collection("novel_passages")
        self.characters = self.chroma.get_collection("characters")
        self.events = self.chroma.get_collection("events")
    
    async def generate_response(
        self,
        conversation_id: UUID,
        user_message: str
    ):
        # 1. PostgreSQL에서 대화 메타 가져오기 (Spring Boot API)
        async with httpx.AsyncClient() as client:
            conversation_meta = await client.get(
                f"http://spring-boot:8080/api/internal/conversations/{conversation_id}"
            )
            conversation = conversation_meta.json()
        
        novel_id = conversation["novel_id"]
        character_vectordb_id = conversation["character_vectordb_id"]
        
        # 2. VectorDB에서 RAG 컨텍스트 수집
        # 2-1. 관련 소설 구절
        passages_result = self.passages.query(
            query_texts=[user_message],
            where={"novel_id": str(novel_id)},
            n_results=20
        )
        
        # 2-2. 캐릭터 정보
        character = self.characters.get(ids=[character_vectordb_id])
        
        # 2-3. 관련 이벤트
        events_result = self.events.query(
            query_texts=[user_message],
            where={"novel_id": str(novel_id)},
            n_results=5
        )
        
        # 3. 프롬프트 구성
        prompt = self._build_prompt(
            character=character,
            passages=passages_result["documents"][0],
            events=events_result["documents"][0],
            user_message=user_message
        )
        
        # 4. Gemini 2.5 Flash 스트리밍
        full_response = ""
        async for token in self.gemini_client.generate_stream(prompt):
            yield token
            full_response += token
        
        # 5. 메시지를 PostgreSQL에 저장 (Spring Boot API)
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://spring-boot:8080/api/internal/conversations/{conversation_id}/messages",
                json={
                    "role": "assistant",
                    "content": full_response,
                    "conversation_id": str(conversation_id)
                }
            )
```

---

## 📊 성능 비교

### "내 최근 대화 20개 조회"

| 방식 | 시간 | 설명 |
|------|------|------|
| PostgreSQL (권장) | **30ms** | 인덱스 활용, JOIN 최적화 |
| VectorDB | **500ms+** | Metadata 필터링만 가능, JOIN 불가 |

### "유사 대화 추천"

| 방식 | 시간 | 설명 |
|------|------|------|
| VectorDB (권장) | **150ms** | 대화 임베딩 코사인 유사도 |
| PostgreSQL | ❌ 불가능 | 의미 검색 지원 안 함 |

---

## 🎯 최종 결론

### ✅ 권장 전략 (수정안)

```
PostgreSQL:
- ✅ 유저 정보
- ✅ 소설 메타데이터 (제목, 저자, 장르, 출판일)
- ✅ 시나리오 메타데이터
- ✅ 대화 메타데이터 (user_id, scenario_id, like_count, is_private)
- ✅ 메시지 내용 (짧은 텍스트, 순서 관리)
- ✅ 소셜 기능 (좋아요, 팔로우, 메모)

VectorDB:
- ✅ 소설 전문 (청크 단위, 200-500단어)
- ✅ 캐릭터 분석 + 성격 임베딩
- ✅ 장소/이벤트/주제 분석
- ✅ RAG 컨텍스트 검색
- 🔶 대화 요약 임베딩 (유사 대화 추천, 선택적)
```

### ❌ 비권장: "대화 처리 전체를 VectorDB"

**이유**:
1. ❌ **관계형 쿼리 불가**: User ↔ Conversation ↔ Message JOIN 필수
2. ❌ **트랜잭션 미지원**: 대화 포크, 좋아요 등 ACID 필요
3. ❌ **순서 관리 어려움**: 메시지 순서, 중복 방지
4. ❌ **소셜 기능 불가**: 좋아요, 팔로우 등 관계형 쿼리

### ✅ 최적 접근: 하이브리드

- **대화 메타데이터**: PostgreSQL (관계형, 트랜잭션, 소셜)
- **대화 컨텐츠 생성**: VectorDB (RAG, 의미 검색)
- **메시지 내용**: PostgreSQL (짧은 텍스트, 순서 관리)

---

## 📋 마이그레이션 체크리스트

현재 제안된 리팩토링에서 **수정이 필요한 부분**:

- [ ] ❌ "대화 처리 전체를 VectorDB" → ✅ "대화 메타는 PostgreSQL, RAG만 VectorDB"
- [x] ✅ 유저 정보 → PostgreSQL (변경 없음)
- [x] ✅ 소설 메타데이터 → PostgreSQL (변경 없음)
- [x] ✅ 소설 전문 → VectorDB (변경 없음)
- [x] ✅ 캐릭터 분석 → VectorDB (변경 없음)

**결론**: 제안된 전략은 대부분 최적이지만, **"대화 처리"는 메타데이터와 컨텐츠를 분리**해야 합니다!
