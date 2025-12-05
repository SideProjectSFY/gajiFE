<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { css } from '../../styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const router = useRouter()

// Mock data for scenario info
const scenarioInfo = ref({
  bookTitle: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  characterName: 'Nick Carraway',
  scenarioType: 'What If...',
  scenarioDescription:
    "His Midwestern values provide a stark contrast to the decadence of East Egg. Without his perspective, you wouldn't see the tragedy of my story.",
})

// Messages state
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content:
      "Old sport, this green light that burns across the bay symbolizes my eternal hope for Daisy. It represents everything I've worked for, everything I dream about. That distant green light is my future, always just out of reach.",
    timestamp: '15:32 PM',
  },
  {
    id: 2,
    role: 'user',
    content: "What do you think about Nick Carraway's role as the narrator?",
    timestamp: '15:33 PM',
  },
  {
    id: 3,
    role: 'assistant',
    content:
      "Ah, Nick Carraway. He serves as our moral compass in this tale of excess and dream. His Midwestern values provide a stark contrast to the decadence of East Egg. Without his perspective, you wouldn't see the tragedy of my story.",
    timestamp: '15:34 PM',
  },
])

const messageInput = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)
const isTyping = ref(false)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = () => {
  if (!messageInput.value.trim()) return

  // Add user message
  messages.value.push({
    id: messages.value.length + 1,
    role: 'user',
    content: messageInput.value,
    timestamp: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  })

  messageInput.value = ''
  scrollToBottom()

  // Simulate AI response
  isTyping.value = true
  setTimeout(() => {
    messages.value.push({
      id: messages.value.length + 1,
      role: 'assistant',
      content: 'This is a simulated response from the AI character.',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    })
    isTyping.value = false
    scrollToBottom()
  }, 1500)
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const goBackToList = () => {
  router.push('/conversations')
}
</script>

<template>
  <div :class="css({ display: 'flex', flexDirection: 'column', minH: '100vh', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '16' })" />

    <!-- Main Chat Container -->
    <div
      :class="
        css({
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          maxW: '1920px',
          w: 'full',
          mx: 'auto',
          gap: '0',
        })
      "
    >
      <!-- Left Sidebar - Scenario Info -->
      <div
        :class="
          css({
            w: '320px',
            bg: 'white',
            borderRight: '1px solid',
            borderColor: 'gray.200',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          })
        "
      >
        <!-- Back Button -->
        <div
          :class="
            css({
              p: '4',
              borderColor: 'gray.200',
            })
          "
        >
          <button
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                color: 'gray.700',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                bg: 'transparent',
                border: 'none',
                _hover: { color: 'green.600' },
              })
            "
            @click="goBackToList"
          >
            <span>←</span>
            <span>Back to List</span>
          </button>
        </div>

        <!-- Book Cover -->
        <div
          :class="
            css({
              p: '6',
              display: 'flex',
              justifyContent: 'center',
            })
          "
        >
          <div
            :class="
              css({
                w: '48',
                h: '64',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              })
            "
          >
            📚
          </div>
        </div>

        <!-- Book Info -->
        <div :class="css({ px: '6', pb: '6' })">
          <h2
            :class="
              css({
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '2',
                textAlign: 'center',
              })
            "
          >
            {{ scenarioInfo.bookTitle }}
          </h2>
          <p :class="css({ fontSize: '0.875rem', color: 'gray.600', textAlign: 'center' })">
            {{ scenarioInfo.author }}
          </p>
        </div>

        <!-- Scenario Details -->
        <div
          :class="
            css({
              flex: 1,
              px: '6',
              pb: '6',
              overflowY: 'auto',
            })
          "
        >
          <div :class="css({ mb: '4' })">
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              Title
            </h3>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.700' })">
              {{ scenarioInfo.scenarioType }}
            </p>
          </div>

          <div :class="css({ mb: '4' })">
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              What If...
            </h3>
            <p :class="css({ fontSize: '0.875rem', color: 'gray.700', lineHeight: '1.6' })">
              {{ scenarioInfo.scenarioDescription }}
            </p>
          </div>

          <div>
            <h3
              :class="
                css({
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '2',
                })
              "
            >
              Forked From
            </h3>
            <div
              :class="
                css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  p: '3',
                  bg: 'gray.50',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  borderColor: 'gray.200',
                })
              "
            >
              <span :class="css({ fontSize: '0.75rem', color: 'gray.600' })">
                {{ scenarioInfo.characterName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div
        :class="
          css({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bg: 'white',
          })
        "
      >
        <!-- Messages Container -->
        <div
          ref="messagesContainer"
          :class="
            css({
              flex: 1,
              overflowY: 'auto',
              px: '6',
              py: '6',
              bg: 'gray.50',
            })
          "
        >
          <div :class="css({ maxW: '900px', mx: 'auto' })">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="
                css({
                  mb: '6',
                  display: 'flex',
                  gap: '3',
                  alignItems: 'flex-start',
                })
              "
            >
              <!-- Avatar -->
              <div
                :class="
                  css({
                    w: '10',
                    h: '10',
                    borderRadius: 'full',
                    bg: message.role === 'user' ? 'blue.500' : 'gray.700',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem',
                  })
                "
              >
                {{ message.role === 'user' ? '👤' : '🎭' }}
              </div>

              <!-- Message Content -->
              <div :class="css({ flex: 1 })">
                <div
                  :class="
                    css({
                      bg: 'white',
                      p: '4',
                      borderRadius: '0.75rem',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    })
                  "
                >
                  <p
                    :class="
                      css({
                        fontSize: '0.9375rem',
                        color: 'gray.800',
                        lineHeight: '1.7',
                      })
                    "
                  >
                    {{ message.content }}
                  </p>
                </div>
                <div :class="css({ mt: '2', fontSize: '0.75rem', color: 'gray.500' })">
                  {{ message.timestamp }}
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div
              v-if="isTyping"
              :class="
                css({
                  mb: '6',
                  display: 'flex',
                  gap: '3',
                  alignItems: 'flex-start',
                })
              "
            >
              <div
                :class="
                  css({
                    w: '10',
                    h: '10',
                    borderRadius: 'full',
                    bg: 'gray.700',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem',
                  })
                "
              >
                🎭
              </div>
              <div
                :class="
                  css({
                    bg: 'white',
                    p: '4',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  })
                "
              >
                <div :class="css({ display: 'flex', gap: '1' })">
                  <span
                    :class="
                      css({
                        w: '2',
                        h: '2',
                        bg: 'gray.400',
                        borderRadius: 'full',
                        animation: 'bounce 1.4s infinite ease-in-out',
                      })
                    "
                  />
                  <span
                    :class="
                      css({
                        w: '2',
                        h: '2',
                        bg: 'gray.400',
                        borderRadius: 'full',
                        animation: 'bounce 1.4s infinite ease-in-out 0.2s',
                      })
                    "
                  />
                  <span
                    :class="
                      css({
                        w: '2',
                        h: '2',
                        bg: 'gray.400',
                        borderRadius: 'full',
                        animation: 'bounce 1.4s infinite ease-in-out 0.4s',
                      })
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div
          :class="
            css({
              px: '6',
              py: '4',
              bg: 'white',
              borderTop: '1px solid',
              borderColor: 'gray.200',
            })
          "
        >
          <div :class="css({ maxW: '900px', mx: 'auto' })">
            <div :class="css({ position: 'relative' })">
              <textarea
                v-model="messageInput"
                :class="
                  css({
                    w: 'full',
                    px: '4',
                    py: '3',
                    pr: '14',
                    border: '1px solid',
                    borderColor: 'gray.300',
                    borderRadius: '0.75rem',
                    fontSize: '0.9375rem',
                    resize: 'none',
                    minH: '12',
                    maxH: '40',
                    outline: 'none',
                    _focus: {
                      borderColor: 'green.500',
                      boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
                    },
                  })
                "
                placeholder="Type your message..."
                @keypress="handleKeyPress"
              />
              <button
                :class="
                  css({
                    position: 'absolute',
                    right: '3',
                    bottom: '3',
                    w: '10',
                    h: '10',
                    bg: 'green.500',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'full',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    _hover: { bg: 'green.600' },
                    _disabled: {
                      bg: 'gray.300',
                      cursor: 'not-allowed',
                    },
                  })
                "
                :disabled="!messageInput.trim()"
                @click="sendMessage"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--<AppFooter />-->
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
