<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import FollowButton from '@/components/common/FollowButton.vue'
import { css } from '../../styled-system/css'

interface UserProfile {
  id: string
  username: string
  bio?: string
  avatarUrl?: string
  joinedAt: string
  scenarioCount: number
  conversationCount: number
  followerCount: number
  followingCount: number
}

interface Scenario {
  id: string
  title: string
  description: string
}

const route = useRoute()
const authStore = useAuthStore()

const profile = ref<UserProfile | null>(null)
const scenarios = ref<Scenario[]>([])
const isLoading = ref(true)

const isOwnProfile = computed(() => {
  return authStore.currentUser?.username === route.params.username
})

onMounted(async () => {
  await loadProfile()
  await loadUserScenarios()
})

const loadProfile = async () => {
  try {
    const response = await api.get(`/users/${route.params.username}`)
    profile.value = response.data
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    isLoading.value = false
  }
}

const loadUserScenarios = async () => {
  try {
    const response = await api.get(`/scenarios?createdBy=${route.params.username}`)
    scenarios.value = response.data.content || response.data || []
  } catch (error) {
    console.error('Failed to load scenarios:', error)
  }
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })
}

const handleFollowChange = (data: { isFollowing: boolean; followerCount: number }): void => {
  if (profile.value) {
    profile.value.followerCount = data.followerCount
  }
}

// Static style definitions
const styles = {
  container: css({
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: 'neutral.50',
  }),
  loadingState: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  }),
  profileContainer: css({
    maxWidth: '1200px',
    margin: '0 auto',
  }),
  profileHeader: css({
    display: 'flex',
    gap: '2rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
  profileInfo: css({
    flex: 1,
  }),
  username: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  }),
  bio: css({
    color: 'neutral.600',
    marginBottom: '0.5rem',
  }),
  joinDate: css({
    color: 'neutral.500',
    fontSize: '0.875rem',
  }),
  profileStats: css({
    display: 'flex',
    gap: '2rem',
    margin: '1.5rem 0',
  }),
  stat: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    _hover: {
      transform: 'translateY(-2px)',
      '& strong': {
        color: 'primary.600',
      },
    },
  }),
  statValue: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'primary.500',
  }),
  statLabel: css({
    fontSize: '0.875rem',
    color: 'neutral.600',
  }),
  profileActions: css({
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
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
    textDecoration: 'none',
    display: 'inline-block',
    '&:hover': {
      backgroundColor: 'primary.600',
    },
  }),
  profileContent: css({
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }),
  sectionHeading: css({
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  }),
  emptyState: css({
    textAlign: 'center',
    padding: '3rem',
    color: 'neutral.600',
  }),
  scenarioGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  }),
  scenarioCard: css({
    padding: '1.5rem',
    border: '1px solid',
    borderColor: 'neutral.200',
    borderRadius: '8px',
    '&:hover': {
      borderColor: 'primary.500',
      backgroundColor: 'primary.50',
    },
  }),
  scenarioTitle: css({
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  }),
  scenarioDescription: css({
    color: 'neutral.600',
    fontSize: '0.875rem',
  }),
}
</script>

<template>
  <div :class="styles.container">
    <div
      v-if="isLoading"
      :class="styles.loadingState"
    >
      Loading profile...
    </div>

    <div
      v-else-if="profile"
      :class="styles.profileContainer"
    >
      <div :class="styles.profileHeader">
        <img
          :src="profile.avatarUrl || '/default-avatar.png'"
          alt="Avatar"
          :class="styles.avatarLarge"
        >

        <div :class="styles.profileInfo">
          <h1 :class="styles.username">
            {{ profile.username }}
          </h1>
          <p :class="styles.bio">
            {{ profile.bio || 'No bio yet.' }}
          </p>
          <p :class="styles.joinDate">
            Joined {{ formatDate(profile.joinedAt) }}
          </p>

          <div :class="styles.profileStats">
            <div :class="styles.stat">
              <strong :class="styles.statValue">{{ profile.scenarioCount }}</strong>
              <span :class="styles.statLabel">Scenarios</span>
            </div>
            <div :class="styles.stat">
              <strong :class="styles.statValue">{{ profile.conversationCount }}</strong>
              <span :class="styles.statLabel">Conversations</span>
            </div>
            <router-link
              :to="`/profile/${profile.username}/followers`"
              :class="styles.stat"
            >
              <strong :class="styles.statValue">{{ profile.followerCount }}</strong>
              <span :class="styles.statLabel">Followers</span>
            </router-link>
            <router-link
              :to="`/profile/${profile.username}/following`"
              :class="styles.stat"
            >
              <strong :class="styles.statValue">{{ profile.followingCount }}</strong>
              <span :class="styles.statLabel">Following</span>
            </router-link>
          </div>

          <div :class="styles.profileActions">
            <router-link
              v-if="isOwnProfile"
              to="/profile/edit"
              :class="styles.btnPrimary"
            >
              Edit Profile
            </router-link>
            <FollowButton
              v-else
              :user-id="profile.id"
              :username="profile.username"
              @follow-change="handleFollowChange"
            />
          </div>
        </div>
      </div>

      <!-- User's scenarios -->
      <div :class="styles.profileContent">
        <h2 :class="styles.sectionHeading">
          Scenarios Created
        </h2>
        <div
          v-if="scenarios.length === 0"
          :class="styles.emptyState"
        >
          <p>No scenarios created yet.</p>
        </div>
        <div
          v-else
          :class="styles.scenarioGrid"
        >
          <div
            v-for="scenario in scenarios"
            :key="scenario.id"
            :class="styles.scenarioCard"
          >
            <h3 :class="styles.scenarioTitle">
              {{ scenario.title }}
            </h3>
            <p :class="styles.scenarioDescription">
              {{ scenario.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
