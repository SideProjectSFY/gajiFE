<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { css } from '../../styled-system/css'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin(): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    // This will be implemented when we integrate with the backend
    // For now, just simulate a successful login
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock tokens
    authStore.setTokens('mock-access-token', 'mock-refresh-token')

    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="container">
    <div :class="card">
      <h1 :class="heading">로그인</h1>

      <form @submit.prevent="handleLogin" :class="form">
        <div :class="formGroup">
          <label :class="label">이메일</label>
          <input
            v-model="email"
            type="email"
            required
            :class="input"
            placeholder="your@email.com"
          />
        </div>

        <div :class="formGroup">
          <label :class="label">비밀번호</label>
          <input
            v-model="password"
            type="password"
            required
            :class="input"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" :class="errorMessage">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" :class="submitButton">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <p :class="linkText">
        계정이 없으신가요?
        <router-link to="/register" :class="link">회원가입</router-link>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
const container = css({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'neutral.100',
  padding: '2rem',
})

const card = css({
  backgroundColor: 'white',
  borderRadius: 'lg',
  padding: '2rem',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
})

const heading = css({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '1.5rem',
  textAlign: 'center',
})

const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
})

const formGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
})

const label = css({
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'neutral.700',
})

const input = css({
  padding: '0.75rem',
  border: '1px solid',
  borderColor: 'neutral.300',
  borderRadius: 'md',
  fontSize: '1rem',
  '&:focus': {
    outline: 'none',
    borderColor: 'primary.500',
    boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
  },
})

const errorMessage = css({
  padding: '0.75rem',
  backgroundColor: 'error',
  color: 'white',
  borderRadius: 'md',
  fontSize: '0.875rem',
  opacity: 0.9,
})

const submitButton = css({
  padding: '0.75rem',
  backgroundColor: 'primary.600',
  color: 'white',
  border: 'none',
  borderRadius: 'md',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'primary.700',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
})

const linkText = css({
  marginTop: '1.5rem',
  textAlign: 'center',
  fontSize: '0.875rem',
  color: 'neutral.600',
})

const link = css({
  color: 'primary.600',
  textDecoration: 'none',
  fontWeight: '600',
  '&:hover': {
    textDecoration: 'underline',
  },
})
</script>
