import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])

export function useToast(): {
  toasts: typeof toasts
  show: (message: string, type?: Toast['type'], duration?: number) => string
  remove: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
} {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    setTimeout(() => {
      remove(id)
    }, duration)

    return id
  }

  const remove = (id: string): void => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number): string => {
    return show(message, 'success', duration)
  }

  const error = (message: string, duration?: number): string => {
    return show(message, 'error', duration)
  }

  const info = (message: string, duration?: number): string => {
    return show(message, 'info', duration)
  }

  const warning = (message: string, duration?: number): string => {
    return show(message, 'warning', duration)
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    info,
    warning,
  }
}
