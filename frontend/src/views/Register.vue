<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  agreeToTerms: false,
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
})

const isLoading = ref(false)

const isFormValid = computed(
  () => form.username && form.email && form.password && form.agreeToTerms
)

const validateForm = (): boolean => {
  errors.username = ''
  errors.email = ''
  errors.password = ''

  if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    return false
  }

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

    <!-- Right Section: Register Form -->
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
          Start exploring infinite story branches
        </h1>
        <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.875rem">Email</p>

        <form
          @submit.prevent="handleRegister"
          style="display: flex; flex-direction: column; gap: 1.25rem"
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
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="your.email@example.com"
              required
              data-testid="email-input"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border: errors.email ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
              }"
            />
            <span
              v-if="errors.email"
              data-testid="email-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ errors.email }}
            </span>
          </div>

          <!-- Username Input -->
          <div>
            <label
              for="username"
              style="
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                display: block;
                margin-bottom: 0.5rem;
              "
            >
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Choose a unique username"
              required
              data-testid="username-input"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border: errors.username ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
              }"
            />
            <span
              v-if="errors.username"
              data-testid="username-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ errors.username }}
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
              placeholder="Create a strong password"
              required
              data-testid="password-input"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border: errors.password ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
              }"
            />
            <span
              v-if="errors.password"
              data-testid="password-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ errors.password }}
            </span>
          </div>

          <!-- Terms Checkbox -->
          <div style="display: flex; align-items: flex-start; gap: 0.5rem">
            <input
              id="agreeToTerms"
              v-model="form.agreeToTerms"
              type="checkbox"
              required
              data-testid="agree-to-terms-checkbox"
            />
            <label for="agreeToTerms" style="font-size: 0.75rem; color: #6b7280; line-height: 1.4">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            data-testid="register-button"
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
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
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
          ></div>
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
          Already have an account?
          <router-link to="/login" style="color: #16a34a; text-decoration: none; font-weight: 600">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
