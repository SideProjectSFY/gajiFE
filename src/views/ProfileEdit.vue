<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { css } from '../../styled-system/css'

const router = useRouter()
const authStore = useAuthStore()

const profile = ref(authStore.currentUser)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const isSaving = ref(false)

const form = reactive({
  username: '',
  bio: '',
})

const errors = reactive({
  username: '',
  general: '',
})

onMounted(() => {
  if (!profile.value) {
    router.push('/login')
    return
  }
  form.username = profile.value.username
  form.bio = (profile.value as { bio?: string }).bio || ''
})

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.match(/image\/(jpeg|png)/)) {
      errors.general = 'Only JPG and PNG images are allowed'
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.general = 'File size exceeds 5MB limit'
      return
    }

    avatarFile.value = file
    errors.general = ''

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  errors.username = ''
  errors.general = ''

  if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    return
  }

  isSaving.value = true

  try {
    // Upload avatar if changed
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('file', avatarFile.value)

      await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    // Update profile
    const response = await api.put('/users/profile', {
      username: form.username,
      bio: form.bio,
    })

    // Update auth store with new user data
    if (authStore.user) {
      authStore.user.username = response.data.username
      ;(authStore.user as { bio?: string }).bio = response.data.bio
      if (response.data.avatarUrl) {
        (authStore.user as { avatarUrl?: string }).avatarUrl = response.data.avatarUrl
      }
    }

    // Show success message (toast would be better)
    alert('Profile updated successfully!')
    router.push(`/profile/${form.username}`)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errors.general = err.response?.data?.message || 'Failed to update profile'
  } finally {
    isSaving.value = false
  }
}

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: 'neutral.50',
    display: 'flex',
    justifyContent: 'center',
  }),
  card: css({
    maxWidth: '600px',
    width: '100%',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginTop: '2rem',
  }),
  heading: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
  }),
  avatarSection: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginBottom: '2rem',
  }),
  avatarLarge: css({
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid',
    borderColor: 'primary.500',
  }),
  avatarUpload: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  hint: css({
    fontSize: '0.875rem',
    color: 'neutral.600',
  }),
  formGroup: css({
    marginBottom: '1.5rem',
  }),
  label: css({
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
  }),
  input: css({
    width: '100%',
    padding: '0.75rem',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: '8px',
    fontSize: '1rem',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.500',
    },
  }),
  inputError: css({
    borderColor: 'red.500',
  }),
  textarea: css({
    width: '100%',
    padding: '0.75rem',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: 'primary.500',
    },
  }),
  charCount: css({
    textAlign: 'right',
    fontSize: '0.875rem',
    color: 'neutral.600',
    marginTop: '0.25rem',
  }),
  errorMessage: css({
    color: 'red.500',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  }),
  formActions: css({
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  }),
  btnPrimary: css({
    padding: '0.75rem 1.5rem',
    backgroundColor: 'primary.500',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'primary.600',
    },
    '&:disabled': {
      backgroundColor: 'neutral.400',
      cursor: 'not-allowed',
    },
  }),
  btnSecondary: css({
    padding: '0.75rem 1.5rem',
    backgroundColor: 'white',
    color: 'primary.500',
    border: '1px solid',
    borderColor: 'primary.500',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center',
    '&:hover': {
      backgroundColor: 'primary.50',
    },
  }),
  fileInput: css({
    padding: '0.5rem 1rem',
    backgroundColor: 'neutral.100',
    color: 'neutral.700',
    border: '1px solid',
    borderColor: 'neutral.300',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'neutral.200',
    },
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div :class="styles.card">
      <h1 :class="styles.heading">
        Edit Profile
      </h1>

      <form @submit.prevent="handleSubmit">
        <div :class="styles.avatarSection">
          <img
            :src="avatarPreview || (profile as any)?.avatarUrl || '/default-avatar.png'"
            alt="Avatar"
            :class="styles.avatarLarge"
          >
          <div :class="styles.avatarUpload">
            <label
              for="avatar"
              :class="styles.fileInput"
            > Choose Image </label>
            <input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png"
              style="display: none"
              @change="handleAvatarChange"
            >
            <p :class="styles.hint">
              JPG or PNG, max 5MB
            </p>
          </div>
        </div>

        <div
          v-if="errors.general"
          :class="styles.errorMessage"
        >
          {{ errors.general }}
        </div>

        <div :class="styles.formGroup">
          <label
            for="username"
            :class="styles.label"
          >Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            :class="[styles.input, errors.username && styles.inputError]"
          >
          <span
            v-if="errors.username"
            :class="styles.errorMessage"
          >{{ errors.username }}</span>
        </div>

        <div :class="styles.formGroup">
          <label
            for="bio"
            :class="styles.label"
          >Bio</label>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            maxlength="200"
            placeholder="Tell us about yourself..."
            :class="styles.textarea"
          />
          <p :class="styles.charCount">
            {{ form.bio.length }} / 200
          </p>
        </div>

        <div :class="styles.formActions">
          <button
            type="submit"
            :disabled="isSaving"
            :class="styles.btnPrimary"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link
            :to="`/profile/${profile?.username || ''}`"
            :class="styles.btnSecondary"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
