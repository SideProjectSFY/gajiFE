import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'

// Views
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import BookBrowsePage from '@/views/BookBrowsePage.vue'
import BookDetailPage from '@/views/BookDetailPage.vue'
import Conversations from '@/views/Conversations.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ConversationChat from '@/views/ConversationChat.vue'
import Profile from '@/views/Profile.vue'
import ProfileEdit from '@/views/ProfileEdit.vue'
import NotFound from '@/views/NotFound.vue'
import FollowerList from '@/views/FollowerList.vue'
import FollowingList from '@/views/FollowingList.vue'
import LikedConversations from '@/views/LikedConversations.vue'
import SearchPage from '@/views/SearchPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false },
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: { requiresAuth: false },
  },
  {
    path: '/books',
    name: 'Books',
    component: BookBrowsePage,
    meta: { requiresAuth: false },
  },
  {
    path: '/books/:id',
    name: 'BookDetail',
    component: BookDetailPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/conversations',
    name: 'Conversations',
    component: Conversations,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/conversations/:id',
    name: 'ConversationChat',
    component: ConversationChat,
    meta: { requiresAuth: true },
  },
  {
    path: '/liked',
    name: 'LikedConversations',
    component: LikedConversations,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:username',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:username/followers',
    name: 'FollowerList',
    component: FollowerList,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:username/following',
    name: 'FollowingList',
    component: FollowingList,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: ProfileEdit,
    meta: { requiresAuth: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

// GA4 페이지뷰 추적
router.afterEach((to) => {
  const { trackPageView } = useAnalytics()
  const pageTitle =
    typeof to.meta.title === 'string' ? to.meta.title : String(to.name || 'Unknown Page')
  trackPageView(to.fullPath, pageTitle)
})

export default router
