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
import NotFound from '@/views/NotFound.vue'

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
    path: '/scenarios',
    name: 'ScenarioList',
    component: ScenarioList,
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
    path: '/profile',
    name: 'Profile',
    component: Profile,
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
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
