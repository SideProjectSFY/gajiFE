# Story 6.9: Memo UI in Conversation View

**Epic**: Epic 6 - User Authentication & Social Features  
**Priority**: P2 - Medium  
**Status**: Not Started  
**Estimated Effort**: 6 hours

## Description

Create frontend UI for personal memo input/display in conversation page sidebar with auto-save, markdown rendering, and character limit.

## Dependencies

**Blocks**:

- None (completes memo feature)

**Requires**:

- Story 6.8: Personal Memo System Backend (memo API)
- Story 4.2: Conversation Page (conversation view)

## Acceptance Criteria

- [ ] Memo textarea in conversation page sidebar
- [ ] Auto-save with 1 second debounce
- [ ] Markdown rendering for memo display
- [ ] Character counter (X/1000)
- [ ] Empty state: "Add a private memo..."
- [ ] Toggle between edit/preview mode
- [ ] Save indicator: "Saving..." / "Saved ✓" / "Failed ✗"
- [ ] Delete memo button with confirmation
- [ ] Memo visible only to memo owner (logged-in user)
- [ ] Mobile-responsive layout
- [ ] Unit tests >80% coverage

## Technical Notes

**Memo Component**:

```vue
<template>
  <div class="conversation-memo" v-if="isAuthenticated">
    <div class="memo-header">
      <h3>Private Memo</h3>
      <div class="memo-actions">
        <button @click="toggleMode" class="btn-toggle" :disabled="!memoText">
          {{ isEditing ? "Preview" : "Edit" }}
        </button>

        <button
          v-if="memoText"
          @click="showDeleteConfirm = true"
          class="btn-delete"
        >
          Delete
        </button>
      </div>
    </div>

    <div v-if="isEditing" class="memo-edit-mode">
      <textarea
        v-model="memoText"
        @input="handleInput"
        placeholder="Add a private memo... (supports Markdown)"
        class="memo-textarea"
        :maxlength="1000"
      ></textarea>

      <div class="memo-footer">
        <span class="char-count" :class="{ warning: charCount > 900 }">
          {{ charCount }}/1000
        </span>

        <span class="save-status" :class="saveStatusClass">
          {{ saveStatusText }}
        </span>
      </div>
    </div>

    <div v-else class="memo-preview-mode">
      <div v-if="!memoText" class="empty-state">
        <p>No memo yet. Click "Edit" to add one.</p>
      </div>

      <div v-else class="memo-markdown" v-html="renderedMarkdown"></div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-if="showDeleteConfirm" @close="showDeleteConfirm = false">
      <h3>Delete Memo?</h3>
      <p>
        This will permanently delete your private memo for this conversation.
      </p>
      <div class="modal-actions">
        <button @click="handleDelete" class="btn-danger">Delete</button>
        <button @click="showDeleteConfirm = false" class="btn-secondary">
          Cancel
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { marked } from "marked";
import DOMPurify from "dompurify";
import api from "@/services/api";

const props = defineProps<{
  conversationId: string;
}>();

const authStore = useAuthStore();

const memoText = ref("");
const isEditing = ref(true);
const saveStatus = ref<"idle" | "saving" | "saved" | "error">("idle");
const showDeleteConfirm = ref(false);
const saveTimer = ref<number | null>(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const charCount = computed(() => memoText.value.length);

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved ✓";
    case "error":
      return "Failed ✗";
    default:
      return "";
  }
});

const saveStatusClass = computed(() => {
  return {
    "status-saving": saveStatus.value === "saving",
    "status-saved": saveStatus.value === "saved",
    "status-error": saveStatus.value === "error",
  };
});

const renderedMarkdown = computed(() => {
  if (!memoText.value) return "";

  const rawMarkdown = marked(memoText.value);
  return DOMPurify.sanitize(rawMarkdown);
});

onMounted(async () => {
  if (isAuthenticated.value) {
    await loadMemo();
  }
});

const loadMemo = async () => {
  try {
    const response = await api.get(
      `/conversations/${props.conversationId}/memo`
    );

    if (response.status === 200 && response.data) {
      memoText.value = response.data.memoText;
      isEditing.value = false; // Start in preview mode if memo exists
    } else {
      // No memo exists (204 No Content)
      memoText.value = "";
      isEditing.value = true; // Start in edit mode if no memo
    }
  } catch (error) {
    console.error("Failed to load memo:", error);
  }
};

const handleInput = () => {
  // Clear existing timer
  if (saveTimer.value !== null) {
    clearTimeout(saveTimer.value);
  }

  // Set new debounced save timer (1 second)
  saveTimer.value = window.setTimeout(() => {
    saveMemo();
  }, 1000);
};

const saveMemo = async () => {
  if (!memoText.value.trim()) {
    return; // Don't save empty memo
  }

  saveStatus.value = "saving";

  try {
    await api.post(`/conversations/${props.conversationId}/memo`, {
      memoText: memoText.value,
    });

    saveStatus.value = "saved";

    // Reset to idle after 2 seconds
    setTimeout(() => {
      if (saveStatus.value === "saved") {
        saveStatus.value = "idle";
      }
    }, 2000);
  } catch (error) {
    console.error("Failed to save memo:", error);
    saveStatus.value = "error";
    showError("Failed to save memo");
  }
};

const handleDelete = async () => {
  showDeleteConfirm.value = false;

  try {
    await api.delete(`/conversations/${props.conversationId}/memo`);

    memoText.value = "";
    isEditing.value = true;
    saveStatus.value = "idle";

    showToast("Memo deleted");
  } catch (error) {
    console.error("Failed to delete memo:", error);
    showError("Failed to delete memo");
  }
};

const toggleMode = () => {
  isEditing.value = !isEditing.value;
};

// Cleanup timer on component unmount
onUnmounted(() => {
  if (saveTimer.value !== null) {
    clearTimeout(saveTimer.value);
  }
});
</script>

<style scoped>
.conversation-memo {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.memo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.memo-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.memo-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-toggle,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-toggle {
  background: #f5f5f5;
  color: #333;
}

.btn-toggle:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background: #fee;
  color: #e63946;
}

.btn-delete:hover {
  background: #fdd;
}

.memo-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s;
}

.memo-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 14px;
}

.char-count {
  color: #999;
}

.char-count.warning {
  color: #e63946;
  font-weight: 600;
}

.save-status {
  font-size: 13px;
}

.status-saving {
  color: #999;
}

.status-saved {
  color: #06d6a0;
}

.status-error {
  color: #e63946;
}

.memo-preview-mode {
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  min-height: 100px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem 1rem;
}

.memo-markdown {
  line-height: 1.8;
}

.memo-markdown h1,
.memo-markdown h2,
.memo-markdown h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.memo-markdown h1 {
  font-size: 24px;
}

.memo-markdown h2 {
  font-size: 20px;
}

.memo-markdown h3 {
  font-size: 18px;
}

.memo-markdown p {
  margin-bottom: 1rem;
}

.memo-markdown ul,
.memo-markdown ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.memo-markdown code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: "Menlo", "Monaco", "Courier New", monospace;
  font-size: 13px;
}

.memo-markdown pre {
  background: #2d2d2d;
  color: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.memo-markdown pre code {
  background: transparent;
  padding: 0;
}

.memo-markdown blockquote {
  border-left: 4px solid #667eea;
  padding-left: 1rem;
  margin-left: 0;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .conversation-memo {
    padding: 1rem;
  }

  .memo-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .memo-textarea {
    min-height: 150px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>
```

**Update Conversation Page to include Memo**:

```vue
<template>
  <div class="conversation-page">
    <div class="main-content">
      <!-- Existing conversation messages -->
      <ConversationMessages :conversationId="conversationId" />
    </div>

    <aside class="conversation-sidebar">
      <!-- Add Memo Component -->
      <ConversationMemo :conversationId="conversationId" />

      <!-- Existing sidebar content -->
      <ConversationInfo :conversation="conversation" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import ConversationMemo from "@/components/ConversationMemo.vue";
import ConversationMessages from "@/components/ConversationMessages.vue";
import ConversationInfo from "@/components/ConversationInfo.vue";

const route = useRoute();
const conversationId = ref(route.params.id);
const conversation = ref(null);

onMounted(async () => {
  // Load conversation data
});
</script>

<style scoped>
.conversation-page {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.main-content {
  min-width: 0; /* Fix grid overflow */
}

.conversation-sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

@media (max-width: 1024px) {
  .conversation-page {
    grid-template-columns: 1fr;
  }

  .conversation-sidebar {
    position: static;
  }
}
</style>
```

## QA Checklist

### Functional Testing

- [ ] Memo textarea appears in conversation sidebar
- [ ] Typing triggers auto-save after 1 second
- [ ] "Saving..." indicator shows during save
- [ ] "Saved ✓" shows after successful save
- [ ] "Failed ✗" shows on save error
- [ ] Delete button deletes memo
- [ ] Delete confirmation modal appears
- [ ] Character counter updates on typing
- [ ] Markdown preview renders correctly

### Auto-Save Testing

- [ ] Debounce waits 1 second before saving
- [ ] Multiple rapid edits only trigger 1 save
- [ ] Timer resets on each keystroke
- [ ] Save triggered when user stops typing
- [ ] No save if memo is empty

### Markdown Rendering

- [ ] Headings render correctly (H1, H2, H3)
- [ ] Bold, italic, code render correctly
- [ ] Lists (ordered, unordered) render correctly
- [ ] Blockquotes render correctly
- [ ] Code blocks render correctly
- [ ] XSS prevented (DOMPurify sanitization)

### Edge Cases

- [ ] Loading existing memo populates textarea
- [ ] Empty memo shows empty state
- [ ] Character limit enforced (1000 chars)
- [ ] Counter turns red near limit (>900)
- [ ] Network error during save handled
- [ ] Delete confirmation prevents accidental deletion

### Performance

- [ ] Auto-save feels responsive
- [ ] Markdown rendering < 100ms
- [ ] No lag when typing
- [ ] Debounce prevents excessive API calls

### Accessibility

- [ ] Textarea keyboard accessible
- [ ] Character counter announced by screen reader
- [ ] Save status announced by screen reader
- [ ] Delete confirmation keyboard navigable
- [ ] Focus management in edit/preview toggle

## Estimated Effort

6 hours
