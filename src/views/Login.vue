<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import LogoSvg from '@/assets/Logo.svg'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import The3DLoginStage from '@/components/auth/The3DLoginStage.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const { trackLogin } = useAnalytics()

const loginStages = [
  {
    id: 0,
    title: '펼쳐지지 않은 이야기',
    description: 'The story yet to be written.',
  },
  {
    id: 1,
    title: '연결의 시작',
    description: 'A handshake that welcomes you.',
  },
  {
    id: 2,
    title: '감정의 공명',
    description: 'Feelings take shape and color.',
  },
  {
    id: 3,
    title: '마법 같은 순간',
    description: 'Your imagination sparkles.',
  },
]

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
    errors.email = 'login.errors.emailRequired'
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'login.errors.emailInvalid'
  } else {
    errors.email = ''
  }
}

const validatePassword = (): void => {
  if (!form.password) {
    errors.password = 'login.errors.passwordRequired'
  } else if (form.password.length < 8) {
    errors.password = 'login.errors.passwordLength'
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
    errors.password = result.message || 'login.errors.loginFailed'
  }
}

onMounted(() => {
  emailInputRef.value?.focus()
})
</script>

<template>
  <AuthLayout :stages="loginStages">
    <template #stage="{ progress, activeStage, stageBlend }">
      <The3DLoginStage :progress="progress" :active-stage="activeStage" :stage-blend="stageBlend" />
    </template>
    <template #overlay>
      <div style="text-align: center; color: white">
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem">
          {{ t('login.brandTitle') }}
        </div>
        <div style="font-size: 1rem; opacity: 0.9; font-style: italic">
          {{ t('login.brandSubtitle') }}
        </div>
      </div>
    </template>
    <template #form>
      <!-- Language Switcher -->
      <div style="position: absolute; top: 1.5rem; right: 1.5rem">
        <LanguageSwitcher />
      </div>

      <div style="width: 100%; max-width: 420px; margin: 0 auto">
        <!-- Logo -->
        <div
          style="
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
            cursor: pointer;
          "
          @click="router.push('/')"
        >
          <LogoSvg style="width: 2rem; height: 2rem; fill: #1f7d51" />
          <span style="font-size: 1.25rem; font-weight: bold; color: #1f2937">Gaji</span>
        </div>

        <h1
          style="
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #111827;
            margin-bottom: 2rem;
          "
        >
          {{ t('login.title') }}
        </h1>

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
              {{ t('login.emailLabel') }}
            </label>
            <input
              id="email"
              ref="emailInputRef"
              v-model="form.email"
              type="text"
              :placeholder="t('login.emailPlaceholder')"
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
              {{ t(errors.email) }}
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
              {{ t('login.passwordLabel') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('login.passwordPlaceholder')"
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
              {{ t(errors.password) }}
            </span>
          </div>

          <!-- Remember Me -->
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <input id="remember" v-model="form.rememberMe" type="checkbox" />
            <label for="remember" style="font-size: 0.875rem; color: #374151">{{
              t('login.rememberMe')
            }}</label>
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
            {{ isLoading ? t('login.submitting') : t('login.submit') }}
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
          {{ t('login.newToGaji') }}
          <router-link
            to="/register"
            style="color: #16a34a; text-decoration: none; font-weight: 600"
          >
            {{ t('login.createAccount') }}
          </router-link>
        </p>
      </div>
    </template>
  </AuthLayout>
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
