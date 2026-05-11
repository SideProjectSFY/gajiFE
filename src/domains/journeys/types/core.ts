export interface UserSummary {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page?: number;
  size?: number;
}

export interface Scenario {
  id: string;
  bookId?: string;
  title: string;
  description?: string;
  userId?: string;
  username?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioTreeNode {
  id: string;
  title: string;
  children?: ScenarioTreeNode[];
}

export interface ScenarioTreeResponse {
  root: ScenarioTreeNode;
}

export interface RagCitation {
  citationId?: string;
  citation_id?: string;
  passageId?: string;
  passage_id?: string;
  finalRank?: number | null;
  final_rank?: number | null;
  vectorRank?: number | null;
  vector_rank?: number | null;
  bm25Rank?: number | null;
  bm25_rank?: number | null;
  manifestId?: string | null;
  manifest_id?: string | null;
  chapter?: string | null;
  sourceAvailable?: boolean;
  source_available?: boolean;
  text?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface RagChatMetadata {
  enabled?: boolean;
  novelId?: string;
  novel_id?: string;
  mode?: string;
  rankingPolicy?: string;
  ranking_policy?: string;
  groundingStatus?: string;
  grounding_status?: string;
  fallbackUsed?: boolean;
  fallback_used?: boolean;
  fallbackReason?: string | null;
  fallback_reason?: string | null;
  passageCount?: number;
  passage_count?: number;
  citations?: RagCitation[];
  timingMs?: Record<string, number>;
  timing_ms?: Record<string, number>;
  querySource?: string;
  query_source?: string;
}

export interface RagChatSourceResponse {
  conversationId: string;
  assistantMessageId: string;
  ragMetadataId: string;
  novelId?: string | null;
  groundingStatus?: string | null;
  fallbackUsed?: boolean | null;
  fallbackReason?: string | null;
  citations: RagCitation[];
  missingPassageIds: string[];
}

export interface ConversationMessage {
  id?: string;
  conversationId?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  createdAt?: string;
  rag?: RagChatMetadata | null;
  ragMetadataId?: string | null;
  providerElapsedMs?: number | null;
}

export type Message = ConversationMessage;

export interface Conversation {
  id: string;
  scenarioId?: string;
  title: string;
  userId?: string;
  isPrivate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  messages?: ConversationMessage[];
  likeCount?: number;
}

export interface ConversationForkRelationship {
  current: Conversation;
  parent: Conversation | null;
  child: Conversation | null;
  forkStatus?: string;
}

export interface ConversationMemo {
  id?: string;
  conversationId?: string;
  content: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  userId?: string;
  username?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResult {
  books: Array<Record<string, unknown>>;
  conversations: Conversation[];
  users: UserSummary[];
  scenarios: Scenario[];
}
