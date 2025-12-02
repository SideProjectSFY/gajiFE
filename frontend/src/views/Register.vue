<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { css } from '../../styled-system/css'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isLoading = ref(false)

const isFormValid = computed(
  () =>
    form.username &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword
)

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
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    errors.email = 'Invalid email format'
    return false
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(form.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number'
    return false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }

  return true
}

const handleRegister = async () => {
  if (!validateForm()) return

  isLoading.value = true

  const result = await authStore.register(form.username, form.email, form.password)

  isLoading.value = false

  if (result.success) {
    router.push('/')
  } else {
    errors.email = result.message || 'Registration failed'
  }
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.card">
      <h1 :class="styles.heading">
        Create Account
      </h1>
      <p :class="styles.subtitle">
        Start exploring "What If" scenarios
      </p>

      <form
        :class="styles.form"
        @submit.prevent="handleRegister"
      >
        <div :class="styles.formGroup">
          <label
            for="username"
            :class="styles.label"
          >Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="johndoe"
            required
            :class="[styles.input, errors.username && styles.inputError]"
          >
          <span
            v-if="errors.username"
            :class="styles.errorMessage"
          >
            {{ errors.username }}
          </span>
        </div>

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

        <div :class="styles.formGroup">
          <label
            for="confirmPassword"
            :class="styles.label"
          >Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            :class="[styles.input, errors.confirmPassword && styles.inputError]"
          >
          <span
            v-if="errors.confirmPassword"
            :class="styles.errorMessage"
          >
            {{ errors.confirmPassword }}
          </span>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          :class="styles.button"
        >
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <p :class="styles.footer">
        Already have an account?
        <router-link
          to="/login"
          :class="styles.link"
        >
          Log in
        </router-link>
      </p>
    </div>
  </div>
</template>
