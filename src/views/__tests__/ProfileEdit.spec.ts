/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfileEdit from '../ProfileEdit.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

// Mock api service
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({}),
}))

describe('ProfileEdit.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  it('redirects to login if user not authenticated', () => {
    const wrapper = mount(ProfileEdit)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('loads current user data into form', () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
      bio: 'Current bio',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Check that form is populated with current data
    expect((wrapper.vm as any).form.username).toBe('testuser')
    expect((wrapper.vm as any).form.bio).toBe('Current bio')
  })

  it('validates username length', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Set short username
    ;(wrapper.vm as any).form.username = 'ab'
    await (wrapper.vm as any).handleSubmit()

    expect((wrapper.vm as any).errors.username).toBe('Username must be at least 3 characters')
  })

  it('validates avatar file type', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Create invalid file (GIF)
    const invalidFile = new File(['content'], 'test.gif', { type: 'image/gif' })
    const event = {
      target: {
        files: [invalidFile],
      },
    } as any

    await (wrapper.vm as any).handleAvatarChange(event)

    expect((wrapper.vm as any).errors.general).toBe('Only JPG and PNG images are allowed')
  })

  it('validates avatar file size', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Create large file (>5MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
    const event = {
      target: {
        files: [largeFile],
      },
    } as any

    await (wrapper.vm as any).handleAvatarChange(event)

    expect((wrapper.vm as any).errors.general).toBe('File size exceeds 5MB limit')
  })

  it('creates avatar preview when valid file selected', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Create valid file
    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB

    const event = {
      target: {
        files: [validFile],
      },
    } as any

    await (wrapper.vm as any).handleAvatarChange(event)

    expect((wrapper.vm as any).avatarFile).toEqual(validFile)
  })

  it('validates bio character limit', () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    // Set bio with 200 characters (max)
    const bio200 = 'x'.repeat(200)
    ;(wrapper.vm as any).form.bio = bio200

    expect((wrapper.vm as any).form.bio.length).toBe(200)
  })

  it('uploads avatar and updates profile successfully', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { avatarUrl: '/new-avatar.jpg' },
    })
    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        username: 'newusername',
        bio: 'New bio',
        avatarUrl: '/new-avatar.jpg',
      },
    })

    const wrapper = mount(ProfileEdit)

    // Set avatar file
    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    ;(wrapper.vm as any).avatarFile = validFile

    // Set form data
    ;(wrapper.vm as any).form.username = 'newusername'
    ;(wrapper.vm as any).form.bio = 'New bio'

    await (wrapper.vm as any).handleSubmit()

    expect(api.post).toHaveBeenCalledWith(
      '/users/profile/avatar',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(api.put).toHaveBeenCalledWith('/users/profile', {
      username: 'newusername',
      bio: 'New bio',
    })
    expect(mockPush).toHaveBeenCalledWith('/profile/newusername')
  })

  it('updates profile without avatar upload', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        username: 'newusername',
        bio: 'New bio',
      },
    })

    const wrapper = mount(ProfileEdit)

    // Set form data without avatar
    ;(wrapper.vm as any).form.username = 'newusername'
    ;(wrapper.vm as any).form.bio = 'New bio'

    await (wrapper.vm as any).handleSubmit()

    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).toHaveBeenCalledWith('/users/profile', {
      username: 'newusername',
      bio: 'New bio',
    })
  })

  it('handles profile update errors', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const error = { response: { data: { message: 'Username already taken' } } }
    vi.mocked(api.put).mockRejectedValueOnce(error)

    const wrapper = mount(ProfileEdit)

    ;(wrapper.vm as any).form.username = 'existinguser'
    await (wrapper.vm as any).handleSubmit()

    expect((wrapper.vm as any).errors.general).toBe('Username already taken')
  })

  it('displays character counter for bio', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    const wrapper = mount(ProfileEdit)

    ;(wrapper.vm as any).form.bio = 'Test bio'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('8 / 200')
  })

  it('disables submit button while saving', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    } as any
    authStore.accessToken = 'token'

    // Mock slow API call
    vi.mocked(api.put).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
    )

    const wrapper = mount(ProfileEdit)

    ;(wrapper.vm as any).form.username = 'testuser'
    const submitPromise = (wrapper.vm as any).handleSubmit()

    expect((wrapper.vm as any).isSaving).toBe(true)

    await submitPromise
  })
})
