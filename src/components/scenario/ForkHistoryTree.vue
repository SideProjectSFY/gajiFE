<template>
  <div class="fork-history-tree" role="tree" aria-label="Fork history tree">
    <div v-if="isLoading" class="loading-state">
      <p>Loading fork history...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchForkTree" class="retry-button">🔄 Retry</button>
    </div>

    <div v-else-if="!treeData || treeData.totalCount === 0" class="empty-state">
      <p>No forks yet. Be the first to create an alternate timeline!</p>
    </div>

    <div v-else class="tree-container">
      <!-- Root Node -->
      <div class="tree-node root-node" role="treeitem" :tabindex="0" aria-expanded="true">
        <div class="node-content">
          <div class="node-icon">🌱</div>
          <div class="node-info">
            <h3 class="node-title">{{ treeData.root.title }}</h3>
            <p class="node-question">{{ treeData.root.whatIfQuestion }}</p>
            <div class="node-stats">
              <span>💬 {{ treeData.root.conversation_count || 0 }}</span>
              <span>🍴 {{ treeData.root.fork_count || 0 }}</span>
              <span>❤️ {{ treeData.root.like_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fork Nodes -->
      <div v-if="treeData.children && treeData.children.length > 0" class="forks-container">
        <div class="tree-line"></div>
        <div class="fork-nodes">
          <div
            v-for="(fork, index) in treeData.children"
            :key="fork.id"
            class="tree-node fork-node"
            role="treeitem"
            :tabindex="0"
            @click="navigateToFork(fork.id)"
            @keydown.enter="navigateToFork(fork.id)"
            @keydown.space.prevent="navigateToFork(fork.id)"
          >
            <div class="fork-connector">
              <div class="connector-line"></div>
            </div>
            <div class="node-content">
              <div class="node-icon">🔀</div>
              <div class="node-info">
                <h4 class="node-title">{{ fork.title }}</h4>
                <p class="node-question">{{ fork.whatIfQuestion }}</p>
                <div class="node-meta">
                  <span class="creator">by {{ fork.creator_username || 'User' }}</span>
                  <span class="date">{{ formatDate(fork.created_at) }}</span>
                </div>
                <div class="node-stats">
                  <span>💬 {{ fork.conversation_count || 0 }}</span>
                  <span>❤️ {{ fork.like_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="tree-stats">
        <p><strong>Total Forks:</strong> {{ treeData.totalCount - 1 }}</p>
        <p><strong>Maximum Depth:</strong> {{ treeData.maxDepth }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

interface Props {
  scenarioId: string | number
}

const props = defineProps<Props>()
const router = useRouter()

const isLoading = ref(true)
const error = ref('')
const treeData = ref<any>(null)

const fetchForkTree = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await api.get(`/scenarios/${props.scenarioId}/tree`)
    treeData.value = response.data
  } catch (err: any) {
    console.error('Failed to fetch fork tree:', err)
    error.value = err.response?.data?.message || 'Failed to load fork history'
  } finally {
    isLoading.value = false
  }
}

const navigateToFork = (forkId: string) => {
  router.push(`/scenarios/${forkId}`)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

onMounted(() => {
  fetchForkTree()
})
</script>

<style scoped>
.fork-history-tree {
  padding: 2rem;
  min-height: 400px;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #2563eb;
}

.tree-container {
  max-width: 900px;
  margin: 0 auto;
}

.tree-node {
  margin-bottom: 1rem;
  position: relative;
}

.root-node {
  margin-bottom: 2rem;
}

.node-content {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.root-node .node-content {
  border-color: #3b82f6;
  background: linear-gradient(to right, #eff6ff, #ffffff);
}

.fork-node .node-content {
  cursor: pointer;
}

.fork-node .node-content:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.fork-node .node-content:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.node-icon {
  font-size: 2rem;
  line-height: 1;
}

.node-info {
  flex: 1;
}

.node-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.node-question {
  font-size: 0.875rem;
  color: #2563eb;
  font-style: italic;
  margin: 0 0 0.75rem 0;
}

.node-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.node-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.forks-container {
  position: relative;
  margin-left: 3rem;
}

.tree-line {
  position: absolute;
  left: -1.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #d1d5db;
}

.fork-nodes {
  position: relative;
}

.fork-connector {
  position: absolute;
  left: -3rem;
  top: 50%;
  width: 1.5rem;
  height: 2px;
  background: #d1d5db;
}

.fork-connector::before {
  content: '';
  position: absolute;
  left: -2px;
  top: -4px;
  width: 10px;
  height: 10px;
  background: #d1d5db;
  border-radius: 50%;
}

.tree-stats {
  margin-top: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.tree-stats p {
  margin: 0.25rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .fork-history-tree {
    padding: 1rem;
  }

  .forks-container {
    margin-left: 1.5rem;
  }

  .fork-connector {
    left: -1.5rem;
    width: 1rem;
  }

  .node-content {
    padding: 1rem;
  }

  .node-icon {
    font-size: 1.5rem;
  }

  .node-title {
    font-size: 1rem;
  }

  .node-stats {
    flex-wrap: wrap;
  }
}
</style>
