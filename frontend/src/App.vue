<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

<style>
/* Global animations for ForkNavigationWidget */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
