<template>
  <div class="p-4 max-w-4xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">AI Tier Testing Playground</h1>
    
    <!-- Upload Section -->
    <div class="border p-4 rounded-lg bg-gray-50">
      <h2 class="text-lg font-semibold mb-2">1. Upload Novel (Optional)</h2>
      <input type="file" @change="handleFileUpload" class="mb-2" />
      <div v-if="uploadedFileUri" class="text-green-600 text-sm">
        Uploaded URI: {{ uploadedFileUri }}<br/>
        Store Name (Standard): {{ uploadedStoreName || 'N/A' }}
      </div>
    </div>

    <!-- Initialization Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Standard Config -->
      <div class="border p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Standard Tier (File Search)</h2>
        <input 
          v-model="standardStoreName" 
          placeholder="Enter Store Name" 
          class="w-full p-2 border rounded mb-2"
        />
        <p class="text-xs text-gray-500">Use uploaded store name or existing one.</p>
      </div>

      <!-- Premium Config -->
      <div class="border p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Premium Tier (Context Cache)</h2>
        <div class="space-y-2">
          <input 
            v-model="premiumNovelId" 
            placeholder="Novel ID (e.g. 'gatsby')" 
            class="w-full p-2 border rounded"
          />
          <input 
            v-model="premiumFileUri" 
            placeholder="File URI (gs://...)" 
            class="w-full p-2 border rounded"
          />
          <textarea 
            v-model="premiumPersona" 
            placeholder="System Persona (You are Jay Gatsby...)" 
            class="w-full p-2 border rounded h-20"
          ></textarea>
          <button 
            @click="createCache" 
            :disabled="loadingCache"
            class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {{ loadingCache ? 'Creating Cache...' : 'Create/Get Cache' }}
          </button>
          <div v-if="premiumCacheName" class="text-green-600 text-sm">
            Active Cache: {{ premiumCacheName }}
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Interface -->
    <div class="border p-4 rounded-lg bg-white shadow min-h-[400px] flex flex-col">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-lg font-semibold">Test Chat</h2>
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium">Mode:</span>
          <button 
            @click="isPremiumMode = false"
            :class="`px-3 py-1 rounded text-sm ${!isPremiumMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`"
          >
            Standard
          </button>
          <button 
            @click="isPremiumMode = true"
            :class="`px-3 py-1 rounded text-sm ${isPremiumMode ? 'bg-purple-600 text-white' : 'bg-gray-200'}`"
          >
            Premium
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-2 bg-gray-50 rounded h-64 border">
        <div 
          v-for="(msg, idx) in chatHistory" 
          :key="idx" 
          :class="`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'ml-auto bg-blue-100' : 'mr-auto bg-white border'}`"
        >
          <div class="text-xs font-bold mb-1">{{ msg.role.toUpperCase() }}</div>
          <div class="whitespace-pre-wrap">{{ msg.content }}</div>
        </div>
        <div v-if="loadingChat" class="text-center text-gray-500 text-sm italic">AI is thinking...</div>
      </div>

      <!-- Input Area -->
      <div class="flex gap-2">
        <input 
          v-model="userMessage" 
          @keyup.enter="sendMessage"
          placeholder="Type a message..." 
          class="flex-1 p-2 border rounded"
        />
        <button 
          @click="sendMessage" 
          :disabled="loadingChat || !canChat"
          class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <div v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import aiApi, { type ChatHistoryItem } from '@/services/aiApi'

// State
const uploadedFileUri = ref('')
const uploadedStoreName = ref('')
const standardStoreName = ref('')

const premiumNovelId = ref('test-novel-1')
const premiumFileUri = ref('')
const premiumPersona = ref('You are a helpful assistant analyzing this novel.')
const premiumCacheName = ref('')

const isPremiumMode = ref(false)
const chatHistory = ref<ChatHistoryItem[]>([])
const userMessage = ref('')

// Loading states
const loadingCache = ref(false)
const loadingChat = ref(false)
const errorMessage = ref('')

// Computed
const canChat = computed(() => {
  if (isPremiumMode.value) return !!premiumCacheName.value
  return !!standardStoreName.value
})

// Actions
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    try {
      errorMessage.value = ''
      const file = target.files[0]
      const res = await aiApi.uploadFile(file)
      uploadedFileUri.value = res.file_uri
      if (res.store_name) {
        uploadedStoreName.value = res.store_name
        standardStoreName.value = res.store_name // Auto-fill standard
      }
      // Auto-fill premium file URI
      premiumFileUri.value = res.file_uri
    } catch (e: any) {
      errorMessage.value = `Upload failed: ${e.message}`
    }
  }
}

async function createCache() {
  if (!premiumNovelId.value || !premiumFileUri.value || !premiumPersona.value) {
    errorMessage.value = 'Missing premium fields'
    return
  }
  
  loadingCache.value = true
  errorMessage.value = ''
  try {
    const res = await aiApi.createCache({
      novel_id: premiumNovelId.value,
      file_uri: premiumFileUri.value,
      character_persona: premiumPersona.value
    })
    premiumCacheName.value = res.cache_name
  } catch (e: any) {
    errorMessage.value = `Cache creation failed: ${e.message}`
  } finally {
    loadingCache.value = false
  }
}

async function sendMessage() {
  if (!userMessage.value.trim() || !canChat.value) return
  
  const query = userMessage.value
  userMessage.value = ''
  errorMessage.value = ''
  
  // Add user message to UI immediately
  chatHistory.value.push({ role: 'user', content: query })
  
  loadingChat.value = true
  try {
    let responseText = ''
    
    // Prepare history for API (excluding the just added user message if API wants separate query)
    // The API takes `history` + `query`. 
    // `chatHistory` now includes the latest user message. 
    // We should send `chatHistory` WITHOUT the last item as `history`.
    const historyPayload = chatHistory.value.slice(0, -1)

    if (isPremiumMode.value) {
      const res = await aiApi.chatPremium({
        cache_name: premiumCacheName.value,
        query: query,
        history: historyPayload
      })
      responseText = res.response
    } else {
      const res = await aiApi.chatStandard({
        store_name: standardStoreName.value,
        query: query,
        history: historyPayload
      })
      responseText = res.response
    }
    
    chatHistory.value.push({ role: 'model', content: responseText })
  } catch (e: any) {
    errorMessage.value = `Chat failed: ${e.message}`
    // Remove user message on failure or keep it? Keeping it but showing error.
  } finally {
    loadingChat.value = false
  }
}
</script>
