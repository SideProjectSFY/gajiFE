<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.logout()
  } finally {
    router.replace({ name: 'Login' })
  }
})
</script>

<template>
  <div
    :class="{
      'min-h-screen flex items-center justify-center text-gray-700': true,
    }"
  >
    <p>Logging out...</p>
  </div>
</template>
