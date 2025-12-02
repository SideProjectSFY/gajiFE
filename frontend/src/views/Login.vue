<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { css } from '../../styled-system/css'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const errors = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)

const isFormValid = computed(() => form.email && form.password)

const styles = {
  container: css({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
  }),
  card: css({
    backgroundColor: 'white',
    borderRadius: 'xl',
    padding: '3rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  }),
  heading: css({
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  }),
  subtitle: css({
    color: 'neutral.600',
    marginBottom: '2rem',
    fontSize: '0.875rem',
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  }),
  formGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  label: css({
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'neutral.700',
  }),
  input: css({
    padding: '0.75rem',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: 'md',
    fontSize: '0.875rem',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.500',
    },
  }),
  inputError: css({
    borderColor: 'red.500 !important',
  }),
  errorMessage: css({
    color: 'red.500',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  }),
  checkbox: css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  button: css({
    padding: '0.75rem',
    backgroundColor: 'primary.600',
    color: 'white',
    border: 'none',
    borderRadius: 'md',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover:not(:disabled)': {
      backgroundColor: 'primary.700',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  }),
  footer: css({
    textAlign: 'center',
    marginTop: '1.5rem',
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

const validateForm = (): boolean => {
  errors.email = ''
  errors.password = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    errors.email = 'Invalid email format'
    return false
  }

  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  isLoading.value = true

  const result = await authStore.login(form.email, form.password, form.rememberMe)

  isLoading.value = false

  if (result.success) {
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } else {
    errors.password = result.message || 'Login failed'
  }
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.card">
      <h1 :class="styles.heading">
        Welcome Back
      </h1>
      <p :class="styles.subtitle">
        Log in to continue your "What If" adventures
      </p>

      <form
        :class="styles.form"
        @submit.prevent="handleLogin"
      >
        <div :class="styles.formGroup">
          <label
            for="email"
            :class="styles.label"
          >Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            :class="[styles.input, errors.email && styles.inputError]"
          >
          <span
            v-if="errors.email"
            :class="styles.errorMessage"
          >
            {{ errors.email }}
          </span>
        </div>

        <div :class="styles.formGroup">
          <label
            for="password"
            :class="styles.label"
          >Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            :class="[styles.input, errors.password && styles.inputError]"
          >
          <span
            v-if="errors.password"
            :class="styles.errorMessage"
          >
            {{ errors.password }}
          </span>
        </div>

        <div :class="styles.checkbox">
          <input
            id="remember"
            v-model="form.rememberMe"
            type="checkbox"
          >
          <label
            for="remember"
            :class="styles.label"
          > Remember me </label>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          :class="styles.button"
        >
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <p :class="styles.footer">
        Don't have an account?
        <router-link
          to="/register"
          :class="styles.link"
        >
          Sign up
        </router-link>
      </p>
    </div>
  </div>
</template>
