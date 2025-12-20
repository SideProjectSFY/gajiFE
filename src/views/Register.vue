<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import LogoSvg from '@/assets/Logo.svg'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const { trackSignUp } = useAnalytics()

const emailInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const touched = reactive({
  username: false,
  email: false,
  password: false,
  confirmPassword: false,
})

const isLoading = ref(false)

const isFormValid = computed(() => {
  return (
    form.username &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword
  )
})

const getPasswordStrength = (password: string): string => {
  if (!password) return 'none'
  if (password.length < 8) return 'weak'

  let strength = 0
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  if (strength >= 3) return 'strong'
  if (strength >= 2) return 'medium'
  return 'weak'
}

const passwordStrength = computed(() => getPasswordStrength(form.password))

const passwordStrengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 'strong':
      return '#10b981'
    case 'medium':
      return '#f59e0b'
    case 'weak':
      return '#ef4444'
    default:
      return '#d1d5db'
  }
})

const validateUsername = (): void => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!form.username) {
    errors.username = 'register.errors.usernameRequired'
  } else if (form.username.length < 3) {
    errors.username = 'register.errors.usernameLength'
  } else if (!usernameRegex.test(form.username)) {
    errors.username = 'register.errors.usernameInvalid'
  } else {
    errors.username = ''
  }
}

const validateEmail = (): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email) {
    errors.email = 'register.errors.emailRequired'
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'register.errors.emailInvalid'
  } else {
    errors.email = ''
  }
}

const validatePassword = (): void => {
  if (!form.password) {
    errors.password = 'register.errors.passwordRequired'
  } else if (form.password.length < 8) {
    errors.password = 'register.errors.passwordComplexity'
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'register.errors.passwordComplexity'
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = 'register.errors.passwordComplexity'
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'register.errors.passwordComplexity'
  } else {
    errors.password = ''
  }
}

const validateConfirmPassword = (): void => {
  if (!form.confirmPassword) {
    errors.confirmPassword = 'register.confirmPasswordPlaceholder'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'register.errors.passwordMismatch'
  } else {
    errors.confirmPassword = ''
  }
}

const handleUsernameBlur = (): void => {
  touched.username = true
  validateUsername()
}

const handleEmailBlur = (): void => {
  touched.email = true
  validateEmail()
}

const handlePasswordBlur = (): void => {
  touched.password = true
  validatePassword()
}

const handleConfirmPasswordBlur = (): void => {
  touched.confirmPassword = true
  validateConfirmPassword()
}

const validateForm = (): boolean => {
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  touched.username = true
  touched.email = true
  touched.password = true
  touched.confirmPassword = true

  return !errors.username && !errors.email && !errors.password && !errors.confirmPassword
}

const handleRegister = async () => {
  if (!validateForm()) return

  if (!form.agreeToTerms) {
    // Show an error or prevent submission
    return
  }

  isLoading.value = true

  const result = await authStore.register(form.username, form.email, form.password)

  isLoading.value = false

  if (result.success) {
    trackSignUp('email')
    router.push('/')
  } else {
    errors.email = result.message || 'Registration failed'
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
          {{ t('register.brandTitle') }}
        </div>
        <div style="font-size: 1rem; opacity: 0.9; font-style: italic">
          {{ t('register.brandSubtitle') }}
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
        position: relative;
      "
    >
      <!-- Language Switcher -->
      <div style="position: absolute; top: 1.5rem; right: 1.5rem">
        <LanguageSwitcher />
      </div>

      <div style="width: 100%; max-width: 420px">
        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem">
          <LogoSvg style="width: 2rem; height: 2rem; fill: #1f7d51" />
          <span style="font-size: 1.25rem; font-weight: bold; color: #1f2937">Gaji</span>
        </div>

        <h1 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 0.5rem; color: #111827">
          {{ t('register.title') }}
        </h1>
        <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.875rem">
          {{ t('register.subtitle') }}
        </p>

        <form
          style="display: flex; flex-direction: column; gap: 1.25rem"
          @submit.prevent="handleRegister"
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
              {{ t('register.emailLabel') }}
            </label>
            <input
              id="email"
              ref="emailInputRef"
              v-model="form.email"
              type="email"
              :placeholder="t('register.emailPlaceholder')"
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
              data-testid="email-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ t(errors.email) }}
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
              {{ t('register.usernameLabel') }}
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              :placeholder="t('register.usernamePlaceholder')"
              required
              minlength="3"
              maxlength="50"
              autocomplete="username"
              data-testid="username-input"
              aria-required="true"
              :aria-invalid="touched.username && !!errors.username"
              :aria-describedby="errors.username ? 'username-error' : undefined"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border:
                  errors.username && touched.username ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }"
              @blur="handleUsernameBlur"
            />
            <span
              v-if="errors.username && touched.username"
              id="username-error"
              role="alert"
              data-testid="username-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ t(errors.username) }}
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
              {{ t('register.passwordLabel') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('register.passwordPlaceholder')"
              required
              autocomplete="new-password"
              data-testid="password-input"
              aria-required="true"
              :aria-invalid="touched.password && !!errors.password"
              :aria-describedby="errors.password ? 'password-error' : 'password-strength'"
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
            <!-- Password Strength Indicator -->
            <div
              v-if="form.password && passwordStrength !== 'none'"
              id="password-strength"
              style="margin-top: 0.5rem"
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.25rem;
                "
              >
                <span style="font-size: 0.75rem; color: #6b7280">{{
                  t('register.passwordStrengthLabel')
                }}</span>
                <span
                  :style="{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: passwordStrengthColor,
                    textTransform: 'capitalize',
                  }"
                >
                  {{ t(`register.passwordStrength.${passwordStrength}`) }}
                </span>
              </div>
              <div
                style="
                  width: 100%;
                  height: 4px;
                  background-color: #e5e7eb;
                  border-radius: 2px;
                  overflow: hidden;
                "
              >
                <div
                  :style="{
                    width:
                      passwordStrength === 'weak'
                        ? '33%'
                        : passwordStrength === 'medium'
                          ? '66%'
                          : '100%',
                    height: '100%',
                    backgroundColor: passwordStrengthColor,
                    transition: 'width 0.3s, background-color 0.3s',
                  }"
                />
              </div>
            </div>
            <span
              v-if="errors.password && touched.password"
              id="password-error"
              role="alert"
              data-testid="password-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ t(errors.password) }}
            </span>
          </div>

          <!-- Confirm Password Input -->
          <!-- Confirm Password Input -->
          <div>
            <label
              for="confirmPassword"
              style="
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
                display: block;
                margin-bottom: 0.5rem;
              "
            >
              {{ t('register.confirmPasswordLabel') }}
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              :placeholder="t('register.confirmPasswordPlaceholder')"
              required
              autocomplete="new-password"
              data-testid="confirm-password-input"
              aria-required="true"
              :aria-invalid="touched.confirmPassword && !!errors.confirmPassword"
              :aria-describedby="errors.confirmPassword ? 'confirm-password-error' : undefined"
              :style="{
                width: '100%',
                padding: '0.75rem',
                border:
                  errors.confirmPassword && touched.confirmPassword
                    ? '2px solid #ef4444'
                    : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }"
              @blur="handleConfirmPasswordBlur"
            />
            <span
              v-if="errors.confirmPassword && touched.confirmPassword"
              id="confirm-password-error"
              role="alert"
              data-testid="confirm-password-error"
              style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 0.25rem"
            >
              {{ t(errors.confirmPassword) }}
            </span>
          </div>

          <!-- Terms Checkbox -->
          <!-- Terms of Service -->
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <input
              id="terms"
              v-model="form.agreeToTerms"
              type="checkbox"
              required
              data-testid="terms-checkbox"
            />
            <label for="terms" style="font-size: 0.875rem; color: #374151">
              {{ t('register.agreeToTerms') }}
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
            {{ isLoading ? t('register.submitting') : t('register.submit') }}
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
            {{ t('login.or') }}
          </span>
        </div>

        <!-- Footer -->
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: #6b7280">
          {{ t('register.alreadyHaveAccount') }}
          <router-link to="/login" style="color: #16a34a; text-decoration: none; font-weight: 600">
            {{ t('register.login') }}
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
