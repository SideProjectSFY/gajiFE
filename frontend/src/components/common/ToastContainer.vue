<template>
  <div :class="css(containerStyle)">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="css(toastStyle(toast.type))"
        @click="removeToast(toast.id)"
      >
        <span :class="css({ mr: '2' })">{{ getIcon(toast.type) }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { css } from 'styled-system/css'
import { useToast, type Toast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const removeToast = (id: string): void => {
  remove(id)
}

const getIcon = (type: Toast['type']): string => {
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  }
  return icons[type]
}

const containerStyle = {
  position: 'fixed' as const,
  top: '1rem',
  right: '1rem',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.5rem',
  maxWidth: '20rem',
}

const toastStyle = (type: Toast['type']) => {
  const baseStyle = {
    px: '4',
    py: '3',
    borderRadius: 'md',
    boxShadow: 'lg',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    _hover: {
      opacity: 0.8,
    },
  }

  const typeStyles = {
    success: {
      ...baseStyle,
      bg: 'green.500',
      color: 'white',
    },
    error: {
      ...baseStyle,
      bg: 'red.500',
      color: 'white',
    },
    info: {
      ...baseStyle,
      bg: 'blue.500',
      color: 'white',
    },
    warning: {
      ...baseStyle,
      bg: 'yellow.500',
      color: 'gray.900',
    },
  }

  return typeStyles[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
