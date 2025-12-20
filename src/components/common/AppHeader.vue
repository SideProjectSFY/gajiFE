<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { css } from 'styled-system/css'
import { useAuthStore } from '../../stores/auth'
import LogoSvg from '@/assets/Logo.svg'
import GlobeSvg from '@/assets/Globe.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { locale, t } = useI18n()
const isMenuOpen = ref(false)
const searchQuery = ref('')
const isLanguageMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const changeLanguage = (lang: 'ko' | 'en') => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  isLanguageMenuOpen.value = false
}

const toggleLanguageMenu = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (isLanguageMenuOpen.value && !target.closest('.language-selector')) {
    isLanguageMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = (): void => {
  isMenuOpen.value = false
}

const goToHome = (): void => {
  router.push('/')
  closeMenu()
}

const goToSearch = (): void => {
  router.push('/search')
  closeMenu()
}

const goToLogin = (): void => {
  router.push('/login')
  closeMenu()
}

const goToSignUp = (): void => {
  router.push('/register')
  closeMenu()
}

const goToProfile = (): void => {
  if (authStore.currentUser?.username) {
    router.push(`/profile/${authStore.currentUser.username}`)
  }
  closeMenu()
}

const handleLogout = (): void => {
  authStore.logout()
  router.push('/')
  closeMenu()
}

const handleSearch = (): void => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    searchQuery.value = ''
  }
}

const handleSearchKeyup = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

const handleMenuKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isMenuOpen.value) {
    closeMenu()
  }
}
</script>

<template>
  <header
    :class="
      css({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bg: 'white',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        zIndex: 1000,
      })
    "
  >
    <div
      :class="
        css({
          maxW: '1200px',
          mx: 'auto',
          px: { base: '4', md: '8' },
          py: '4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })
      "
    >
      <!-- Logo -->
      <a
        :class="
          css({
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
          })
        "
        @click="goToHome"
      >
        <LogoSvg :class="css({ width: '2rem', height: '2rem' })" style="fill: #1f7d51" />
        <span :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'green.500' })">{{
          t('home.title')
        }}</span>
      </a>

      <!-- Desktop Navigation -->
      <nav
        :class="css({ display: { base: 'none', md: 'flex' }, alignItems: 'center', gap: '8' })"
        aria-label="Main navigation"
      >
        <router-link
          to="/about"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/about') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/about') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
        >
          {{ t('nav.about') }}
        </router-link>
        <router-link
          to="/books"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/books') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/books') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
        >
          {{ t('nav.books') }}
        </router-link>
        <router-link
          to="/conversations"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/conversations') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/conversations') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
        >
          {{ t('nav.conversations') }}
        </router-link>
      </nav>

      <!-- Desktop Actions -->
      <div :class="css({ display: { base: 'none', md: 'flex' }, alignItems: 'center', gap: '4' })">
        <!-- Search Input -->
        <div :class="css({ position: 'relative' })">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            :aria-label="t('search.ariaLabel')"
            :class="
              css({
                px: '4',
                py: '2',
                border: '1px solid',
                borderColor: 'gray.300',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                width: '250px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                _focus: {
                  outline: 'none',
                  borderColor: 'green.500',
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
                },
              })
            "
            @keyup="handleSearchKeyup"
          />
          <button
            :class="
              css({
                position: 'absolute',
                right: '2',
                top: '50%',
                transform: 'translateY(-50%)',
                bg: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'gray.500',
                transition: 'color 0.2s',
                _hover: { color: 'green.500' },
              })
            "
            aria-label="Search"
            @click="handleSearch"
          >
            🔍
          </button>
        </div>

        <!-- Language Selector -->
        <div :class="css({ position: 'relative' })" class="language-selector">
          <button
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bg: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'gray.700',
                p: '2',
                transition: 'all 0.2s',
                _hover: { color: 'green.500' },
              })
            "
            :aria-label="'Change language'"
            @click="toggleLanguageMenu"
          >
            <GlobeSvg :class="css({ width: '1.5rem', height: '1.5rem' })" />
          </button>
          <div
            v-if="isLanguageMenuOpen"
            :class="
              css({
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: '0',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                minW: '100px',
                zIndex: 1000,
                overflow: 'hidden',
              })
            "
          >
            <button
              :class="
                css({
                  display: 'block',
                  w: '100%',
                  textAlign: 'center',
                  px: '4',
                  py: '2.5',
                  bg: locale === 'ko' ? 'green.50' : 'white',
                  color: locale === 'ko' ? 'green.600' : 'gray.700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  _hover: { bg: 'green.50', color: 'green.600' },
                })
              "
              @click="changeLanguage('ko')"
            >
              {{ locale === 'ko' ? '한국어' : 'KOR' }}
            </button>
            <button
              :class="
                css({
                  display: 'block',
                  w: '100%',
                  textAlign: 'center',
                  px: '4',
                  py: '2.5',
                  bg: locale === 'en' ? 'green.50' : 'white',
                  color: locale === 'en' ? 'green.600' : 'gray.700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  _hover: { bg: 'green.50', color: 'green.600' },
                })
              "
              @click="changeLanguage('en')"
            >
              {{ locale === 'ko' ? '영어' : 'ENG' }}
            </button>
          </div>
        </div>

        <template v-if="!isAuthenticated">
          <button
            :class="
              css({
                bg: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'gray.700',
                px: '4',
                py: '2',
                transition: 'color 0.2s',
                _hover: { color: 'green.500' },
              })
            "
            @click="goToLogin"
          >
            {{ t('nav.login') }}
          </button>
          <button
            :class="
              css({
                px: '6',
                py: '2',
                bg: 'green.500',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                _hover: { bg: 'green.600' },
              })
            "
            @click="goToSignUp"
          >
            {{ t('nav.signup') }}
          </button>
        </template>
        <template v-else>
          <button
            :class="
              css({
                bg: isActive('/profile') ? 'green.50' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                color: isActive('/profile') ? 'green.600' : 'gray.700',
                px: '4',
                py: '2',
                borderRadius: '0.375rem',
                transition: 'all 0.2s',
                _hover: { color: 'green.500', bg: 'green.50' },
              })
            "
            @click="goToProfile"
          >
            {{ t('nav.profile') }}
          </button>
          <button
            :class="
              css({
                bg: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'gray.700',
                px: '4',
                py: '2',
                transition: 'color 0.2s',
                _hover: { color: 'green.500' },
              })
            "
            @click="handleLogout"
          >
            {{ t('nav.logout') }}
          </button>
        </template>
      </div>

      <!-- Mobile Hamburger Button -->
      <button
        :class="
          css({
            display: { base: 'flex', md: 'none' },
            flexDirection: 'column',
            gap: '1.5',
            p: '2',
            bg: 'transparent',
            border: 'none',
            cursor: 'pointer',
          })
        "
        aria-label="Toggle menu"
        :aria-expanded="isMenuOpen"
        @click="toggleMenu"
        @keydown="handleMenuKeydown"
      >
        <span
          :class="
            css({
              w: '6',
              h: '0.5',
              bg: 'gray.700',
              borderRadius: 'full',
              transition: 'all 0.3s',
              transform: isMenuOpen ? 'rotate(45deg) translateY(8px)' : 'rotate(0)',
            })
          "
        />
        <span
          :class="
            css({
              w: '6',
              h: '0.5',
              bg: 'gray.700',
              borderRadius: 'full',
              transition: 'all 0.3s',
              opacity: isMenuOpen ? 0 : 1,
            })
          "
        />
        <span
          :class="
            css({
              w: '6',
              h: '0.5',
              bg: 'gray.700',
              borderRadius: 'full',
              transition: 'all 0.3s',
              transform: isMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'rotate(0)',
            })
          "
        />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isMenuOpen"
      :class="
        css({
          display: { base: 'block', md: 'none' },
          bg: 'white',
          borderTop: '1px solid',
          borderColor: 'gray.200',
          py: '4',
          px: '4',
        })
      "
    >
      <nav
        :class="css({ display: 'flex', flexDirection: 'column', gap: '4' })"
        aria-label="Mobile navigation"
      >
        <router-link
          to="/about"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/about') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/about') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
          @click="closeMenu"
        >
          {{ t('nav.about') }}
        </router-link>
        <router-link
          to="/books"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/books') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/books') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
          @click="closeMenu"
        >
          {{ t('nav.books') }}
        </router-link>
        <router-link
          to="/conversations"
          :class="
            css({
              textDecoration: 'none',
              color: isActive('/conversations') ? 'green.600' : 'gray.700',
              fontSize: '1rem',
              fontWeight: '500',
              px: '4',
              py: '2',
              borderRadius: '0.375rem',
              bg: isActive('/conversations') ? 'green.50' : 'transparent',
              transition: 'all 0.2s',
              _hover: { color: 'green.500', bg: 'green.50' },
            })
          "
          @click="closeMenu"
        >
          {{ t('nav.conversations') }}
        </router-link>
        <button
          :class="
            css({
              bg: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              color: 'gray.700',
              py: '2',
              textAlign: 'left',
              transition: 'color 0.2s',
              _hover: { color: 'green.500' },
            })
          "
          @click="goToSearch"
        >
          🔍 {{ t('nav.search') }}
        </button>

        <!-- Mobile Language Selector -->
        <div
          :class="
            css({
              borderTop: '1px solid',
              borderColor: 'gray.200',
              pt: '4',
            })
          "
        >
          <div
            :class="
              css({ px: '4', mb: '3', fontSize: '0.875rem', fontWeight: '600', color: 'gray.600' })
            "
          >
            🌐 Language
          </div>
          <div :class="css({ display: 'flex', gap: '2', px: '4' })">
            <button
              :class="
                css({
                  flex: 1,
                  px: '3',
                  py: '2',
                  bg: locale === 'ko' ? 'green.500' : 'white',
                  color: locale === 'ko' ? 'white' : 'gray.700',
                  border: '1px solid',
                  borderColor: locale === 'ko' ? 'green.500' : 'gray.300',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  _hover: { bg: locale === 'ko' ? 'green.600' : 'gray.50' },
                })
              "
              @click="changeLanguage('ko')"
            >
              한국어
            </button>
            <button
              :class="
                css({
                  flex: 1,
                  px: '3',
                  py: '2',
                  bg: locale === 'en' ? 'green.500' : 'white',
                  color: locale === 'en' ? 'white' : 'gray.700',
                  border: '1px solid',
                  borderColor: locale === 'en' ? 'green.500' : 'gray.300',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  _hover: { bg: locale === 'en' ? 'green.600' : 'gray.50' },
                })
              "
              @click="changeLanguage('en')"
            >
              English
            </button>
          </div>
        </div>

        <div
          :class="
            css({
              borderTop: '1px solid',
              borderColor: 'gray.200',
              pt: '4',
              mt: '2',
              display: 'flex',
              flexDirection: 'column',
              gap: '3',
            })
          "
        >
          <template v-if="!isAuthenticated">
            <button
              :class="
                css({
                  bg: 'none',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'gray.700',
                  py: '2',
                  px: '4',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s',
                  _hover: { bg: 'gray.50' },
                })
              "
              @click="goToLogin"
            >
              {{ t('nav.login') }}
            </button>
            <button
              :class="
                css({
                  py: '2',
                  px: '4',
                  bg: 'green.500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  _hover: { bg: 'green.600' },
                })
              "
              @click="goToSignUp"
            >
              {{ t('nav.signup') }}
            </button>
          </template>
          <template v-else>
            <button
              :class="
                css({
                  bg: isActive('/profile') ? 'green.50' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: isActive('/profile') ? 'green.600' : 'gray.700',
                  py: '2',
                  px: isActive('/profile') ? '4' : '0',
                  borderRadius: '0.375rem',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  _hover: { color: 'green.500', bg: 'green.50', px: '4' },
                })
              "
              @click="goToProfile"
            >
              {{ t('nav.profile') }}
            </button>
            <button
              :class="
                css({
                  bg: 'none',
                  border: '1px solid',
                  borderColor: 'gray.300',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'gray.700',
                  py: '2',
                  px: '4',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s',
                  _hover: { bg: 'gray.50' },
                })
              "
              @click="handleLogout"
            >
              {{ t('nav.logout') }}
            </button>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}
</style>
