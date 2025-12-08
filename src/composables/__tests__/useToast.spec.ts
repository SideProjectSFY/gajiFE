import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear toasts before each test
    const { toasts } = useToast()
    toasts.value = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should add a toast', () => {
    const { toasts, show } = useToast()

    show('Test message', 'info')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('info')
  })

  it('should remove toast after duration', () => {
    const { toasts, show } = useToast()

    show('Test message', 'info', 1000)

    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1000)

    expect(toasts.value).toHaveLength(0)
  })

  it('should add success toast', () => {
    const { toasts, success } = useToast()

    success('Success message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].message).toBe('Success message')
  })

  it('should add error toast', () => {
    const { toasts, error } = useToast()

    error('Error message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].message).toBe('Error message')
  })

  it('should add info toast', () => {
    const { toasts, info } = useToast()

    info('Info message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('info')
    expect(toasts.value[0].message).toBe('Info message')
  })

  it('should add warning toast', () => {
    const { toasts, warning } = useToast()

    warning('Warning message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('warning')
    expect(toasts.value[0].message).toBe('Warning message')
  })

  it('should manually remove toast', () => {
    const { toasts, show, remove } = useToast()

    const id = show('Test message')
    expect(toasts.value).toHaveLength(1)

    remove(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('should handle multiple toasts', () => {
    const { toasts, success, error, info } = useToast()

    success('Success 1')
    error('Error 1')
    info('Info 1')

    expect(toasts.value).toHaveLength(3)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[1].type).toBe('error')
    expect(toasts.value[2].type).toBe('info')
  })

  it('should generate unique IDs for toasts', () => {
    const { toasts, show } = useToast()

    show('Message 1')
    show('Message 2')
    show('Message 3')

    const ids = toasts.value.map((t) => t.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(3)
  })

  it('should use default duration if not specified', () => {
    const { toasts, show } = useToast()

    show('Test message', 'info')

    expect(toasts.value[0].duration).toBe(3000)
  })

  it('should use custom duration', () => {
    const { toasts, show } = useToast()

    show('Test message', 'info', 5000)

    expect(toasts.value[0].duration).toBe(5000)
  })
})
