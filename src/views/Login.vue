<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { trackLogin } = useAnalytics()

const emailInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const errors = reactive({
  email: '',
  password: '',
})

const touched = reactive({
  email: false,
  password: false,
})

const isLoading = ref(false)
const isFormValid = computed(() => form.email && form.password)

const validateEmail = (): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address'
  } else {
    errors.email = ''
  }
}

const validatePassword = (): void => {
  if (!form.password) {
    errors.password = 'Password is required'
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else {
    errors.password = ''
  }
}

const handleEmailBlur = (): void => {
  touched.email = true
  validateEmail()
}

const handlePasswordBlur = (): void => {
  touched.password = true
  validatePassword()
}

const validateForm = (): boolean => {
  validateEmail()
  validatePassword()
  touched.email = true
  touched.password = true

  return !errors.email && !errors.password
}

const handleLogin = async () => {
  if (!validateForm()) return

  isLoading.value = true
  const result = await authStore.login(form.email, form.password, form.rememberMe)
  isLoading.value = false

  if (result.success) {
    trackLogin('email')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } else {
    errors.password = result.message || 'Login failed'
  }
}

onMounted(() => {
  emailInputRef.value?.focus()
})
</script>

<template>
  <div style="min-height: 100vh; display: flex; background-color: white">
    <!-- Left Section: Brand Area -->
    <div
      style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
        padding: 3rem;
      "
    >
      <div style="text-align: center; color: white">
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem">
          Every story has infinite branches to explore
        </div>
        <div style="font-size: 1rem; opacity: 0.9; font-style: italic">
          Discover endless possibilities
        </div>
      </div>
    </div>

    <!-- Right Section: Login Form -->
    <div
      style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background-color: #f9fafb;
      "
    >
      <div style="width: 100%; max-width: 420px">
        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem">
          <span style="font-size: 1.5rem">🌿</span>
          <span style="font-size: 1.25rem; font-weight: bold; color: #1f2937">Gaji</span>
        </div>

        <h1 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 0.5rem; color: #111827">
          Continue exploring story branches
        </h1>
        <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.875rem">Email or Username</p>

        <form
          style="display: flex; flex-direction: column; gap: 1.25rem"
          @submit.prevent="handleLogin"
        >
          <!-- Email Input -->
          <div>
            <label
              for="email"
              style="
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                display: block;
                margin-bottom: 0.5rem;
              "
            >
              Email or Username
            </label>
            <input
              id="email"
              ref="emailInputRef"
              v-model="form.email"
              type="text"
              placeholder="Enter your email or username"
              required
              maxlength="255"
              autocomplete="email"
              data-testid="email-input"
              aria-required="true"
              :aria-invalid="touched.email && !!errors.email"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border: errors.email && touched.email ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }"
              @blur="handleEmailBlur"
            />
            <span
              v-if="errors.email && touched.email"
              id="email-error"
              role="alert"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ errors.email }}
            </span>
          </div>

          <!-- Password Input -->
          <div>
            <label
              for="password"
              style="
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                display: block;
                margin-bottom: 0.5rem;
              "
            >
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
              data-testid="password-input"
              aria-required="true"
              :aria-invalid="touched.password && !!errors.password"
              :aria-describedby="errors.password ? 'password-error' : undefined"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border:
                  errors.password && touched.password ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }"
              @blur="handlePasswordBlur"
            />
            <span
              v-if="errors.password && touched.password"
              id="password-error"
              role="alert"
              data-testid="password-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ errors.password }}
            </span>
          </div>

          <!-- Remember Me -->
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <input id="remember" v-model="form.rememberMe" type="checkbox" />
            <label for="remember" style="font-size: 0.875rem; color: #374151">Remember me</label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            data-testid="login-button"
            :style="{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: isLoading || !isFormValid ? '#9ca3af' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading || !isFormValid ? 'not-allowed' : 'pointer',
              opacity: isLoading || !isFormValid ? 0.6 : 1,
            }"
          >
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <!-- Divider -->
        <div style="text-align: center; margin: 1.5rem 0; position: relative">
          <div
            style="
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 1px;
              background-color: #d1d5db;
            "
          />
          <span
            style="
              position: relative;
              background-color: #f9fafb;
              padding: 0 1rem;
              font-size: 0.875rem;
              color: #6b7280;
            "
          >
            or
          </span>
        </div>

        <!-- Footer -->
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: #6b7280">
          New to Gaji?
          <router-link
            to="/register"
            style="color: #16a34a; text-decoration: none; font-weight: 600"
          >
            Create account
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

input:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}
</style>
