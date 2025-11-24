<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { css } from '../../styled-system/css'

const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Computed properties (truly reactive - depends on loading.value)
const buttonText = computed(() => (loading.value ? '로그인 중...' : '로그인'))
const isFormValid = computed(() => email.value && password.value)

// Static style definitions (no computed needed)
const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'neutral.100',
    padding: '2rem',
  }),
  card: css({
    backgroundColor: 'white',
    borderRadius: 'lg',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  }),
  heading: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    textAlign: 'center',
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  formGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  label: css({
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'neutral.700',
  }),
  input: css({
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
  }),
  errorMessage: css({
    padding: '0.75rem',
    backgroundColor: 'error',
    color: 'white',
    borderRadius: 'md',
    fontSize: '0.875rem',
    opacity: 0.9,
  }),
  submitButton: css({
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
  }),
  linkText: css({
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'neutral.600',
  }),
  link: css({
    color: 'primary.600',
    textDecoration: 'none',
    fontWeight: '600',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
}

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
  <div :class="styles.container">
    <div :class="styles.card">
      <h1 :class="styles.heading">
        로그인
      </h1>

      <form
        :class="styles.form"
        @submit.prevent="handleLogin"
      >
        <div :class="styles.formGroup">
          <label
            for="email"
            :class="styles.label"
          >이메일</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :class="styles.input"
            placeholder="your@email.com"
          >
        </div>

        <div :class="styles.formGroup">
          <label
            for="password"
            :class="styles.label"
          >비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :class="styles.input"
            placeholder="••••••••"
          >
        </div>

        <div
          v-if="error"
          :class="styles.errorMessage"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          :class="styles.submitButton"
        >
          {{ buttonText }}
        </button>
      </form>

      <p :class="styles.linkText">
        계정이 없으신가요?
        <router-link
          to="/register"
          :class="styles.link"
        >
          회원가입
        </router-link>
      </p>
    </div>
  </div>
</template>
