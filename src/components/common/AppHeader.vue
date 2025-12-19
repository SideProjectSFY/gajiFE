<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { css } from 'styled-system/css'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isMenuOpen = ref(false)
const searchQuery = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)

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
        <span :class="css({ fontSize: '1.5rem' })">🌱</span>
        <span :class="css({ fontSize: '1.5rem', fontWeight: 'bold', color: 'green.500' })"
          >Gaji</span
        >
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
          About
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
          Books
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
          Conversations
        </router-link>
      </nav>

      <!-- Desktop Actions -->
      <div :class="css({ display: { base: 'none', md: 'flex' }, alignItems: 'center', gap: '4' })">
        <!-- Search Input -->
        <div :class="css({ position: 'relative' })">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search books, conversations..."
            aria-label="Search books, conversations"
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
            aria-label="Login to your account"
            @click="goToLogin"
          >
            Login
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
            aria-label="Sign up for a new account"
            @click="goToSignUp"
          >
            Sign Up
          </button>
        </template>
        <template v-else>
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
            aria-label="Go to your profile"
            @click="goToProfile"
          >
            Profile
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
            aria-label="Logout from your account"
            @click="handleLogout"
          >
            Logout
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
          About
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
          Books
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
          Conversations
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
          🔍 Search
        </button>
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
              Login
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
              Sign Up
            </button>
          </template>
          <template v-else>
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
              @click="goToProfile"
            >
              Profile
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
              Logout
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
