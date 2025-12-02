import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Views
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ScenarioList from '@/views/ScenarioList.vue'
import ScenarioCreate from '@/views/ScenarioCreate.vue'
import ConversationChat from '@/views/ConversationChat.vue'
import Profile from '@/views/Profile.vue'
import ProfileEdit from '@/views/ProfileEdit.vue'
import Health from '@/views/Health.vue'
import NotFound from '@/views/NotFound.vue'
import BookBrowsePage from '@/views/BookBrowsePage.vue'
import BookDetail from '@/views/BookDetail.vue'
import ScenarioBrowsePage from '@/views/ScenarioBrowsePage.vue'
import ScenarioDetailPage from '@/views/ScenarioDetailPage.vue'
import ScenarioSearchPage from '@/views/ScenarioSearchPage.vue'
import ScenarioTreeTestPage from '@/views/ScenarioTreeTestPage.vue'
import FollowerList from '@/views/FollowerList.vue'
import FollowingList from '@/views/FollowingList.vue'
import LikedConversations from '@/views/LikedConversations.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false },
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
    path: '/books',
    name: 'BookBrowse',
    component: BookBrowsePage,
    meta: { requiresAuth: false },
  },
  {
    path: '/books/:id',
    name: 'BookDetail',
    component: BookDetail,
    meta: { requiresAuth: false },
  },
  {
    path: '/books/:bookId/scenarios/:scenarioId',
    name: 'ScenarioDetail',
    component: ScenarioCreate, // Placeholder - will be replaced with ScenarioDetail view
    meta: { requiresAuth: false },
  },
  {
    path: '/scenarios',
    name: 'ScenarioList',
    component: ScenarioList,
    meta: { requiresAuth: false },
  },
  {
    path: '/scenarios/browse',
    name: 'ScenarioBrowse',
    component: ScenarioBrowsePage,
    meta: { requiresAuth: false },
  },
  {
    path: '/scenarios/search',
    name: 'ScenarioSearch',
    component: ScenarioSearchPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/scenarios/:id',
    name: 'ScenarioDetail',
    component: ScenarioDetailPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/scenarios/create',
    name: 'ScenarioCreate',
    component: ScenarioCreate,
    meta: { requiresAuth: true },
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
    meta: { requiresAuth: false },
  },
  {
    path: '/profile/:username/followers',
    name: 'FollowerList',
    component: FollowerList,
    meta: { requiresAuth: false },
  },
  {
    path: '/profile/:username/following',
    name: 'FollowingList',
    component: FollowingList,
    meta: { requiresAuth: false },
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: ProfileEdit,
    meta: { requiresAuth: true },
  },
  {
    path: '/health',
    name: 'Health',
    component: Health,
    meta: { requiresAuth: false },
  },
  {
    path: '/test/scenario-tree',
    name: 'ScenarioTreeTest',
    component: ScenarioTreeTestPage,
    meta: { requiresAuth: false },
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

export default router
