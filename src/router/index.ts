import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAnalytics } from '@/composables/useAnalytics'
import { useToast } from '@/composables/useToast'

// Views
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import BookBrowsePage from '@/views/BookBrowsePage.vue'
import BookDetailPage from '@/views/BookDetailPage.vue'
import Conversations from '@/views/Conversations.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ConversationChat from '@/views/ConversationChat.vue'
import ScenarioDetailPage from '@/views/ScenarioDetailPage.vue'
import Profile from '@/views/Profile.vue'
import ProfileEdit from '@/views/ProfileEdit.vue'
import NotFound from '@/views/NotFound.vue'
import FollowerList from '@/views/FollowerList.vue'
import FollowingList from '@/views/FollowingList.vue'
import LikedConversations from '@/views/LikedConversations.vue'
import SearchPage from '@/views/SearchPage.vue'
import Logout from '@/views/Logout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false,
      title: 'Gaji - 상상하고, 대화하고, 나누다',
      description: '홈페이지/랜딩 페이지',
    },
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      requiresAuth: false,
      title: 'About - Gaji',
      description: '서비스 소개',
    },
  },
  {
    path: '/books',
    name: 'Books',
    component: BookBrowsePage,
    meta: {
      requiresAuth: false,
      title: '책 목록 - Gaji',
      description: '콘텐츠 탐색 시작 지점',
    },
  },
  {
    path: '/books/:id',
    name: 'BookDetail',
    component: BookDetailPage,
    meta: {
      requiresAuth: false,
      title: '책 상세 - Gaji',
      description: '특정 책 관심도 측정',
    },
  },
  {
    path: '/conversations',
    name: 'Conversations',
    component: Conversations,
    meta: {
      requiresAuth: true,
      title: '내 대화 목록 - Gaji',
      description: '사용자 대화 히스토리',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '로그인 - Gaji',
      description: '사용자 로그인',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      requiresAuth: false,
      title: '회원가입 - Gaji',
      description: '신규 사용자 등록',
    },
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchPage,
    meta: {
      requiresAuth: false,
      title: '검색 - Gaji',
      description: '통합 검색 페이지',
    },
  },
  {
    path: '/scenarios',
    name: 'Scenarios',
    component: SearchPage,
    meta: {
      requiresAuth: false,
      title: '시나리오 목록 - Gaji',
      description: '시나리오 탐색',
    },
  },
  {
    path: '/scenarios/:id',
    name: 'ScenarioDetail',
    component: ScenarioDetailPage,
    meta: {
      requiresAuth: true,
      title: '시나리오 상세 - Gaji',
      description: '시나리오 상세 정보 및 대화 시작',
    },
  },
  {
    path: '/conversations/:id',
    name: 'ConversationChat',
    component: ConversationChat,
    meta: {
      requiresAuth: true,
      title: 'AI 대화 - Gaji',
      description: '핵심 기능 사용률 측정',
    },
  },
  {
    path: '/liked',
    name: 'LikedConversations',
    component: LikedConversations,
    meta: {
      requiresAuth: true,
      title: '좋아요한 대화 - Gaji',
      description: '사용자 참여도',
    },
  },
  {
    path: '/profile/:username',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: true,
      title: '프로필 - Gaji',
      description: '사용자 프로필',
    },
  },
  {
    path: '/profile/:username/followers',
    name: 'FollowerList',
    component: FollowerList,
    meta: {
      requiresAuth: true,
      title: '팔로워 목록 - Gaji',
      description: '소셜 기능',
    },
  },
  {
    path: '/profile/:username/following',
    name: 'FollowingList',
    component: FollowingList,
    meta: {
      requiresAuth: true,
      title: '팔로잉 목록 - Gaji',
      description: '소셜 기능',
    },
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: ProfileEdit,
    meta: {
      requiresAuth: true,
      title: '프로필 수정 - Gaji',
      description: '프로필 편집',
    },
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
    meta: {
      requiresAuth: false,
      title: '로그아웃 - Gaji',
      description: '사용자 로그아웃',
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: {
      requiresAuth: false,
      title: '페이지를 찾을 수 없음 - Gaji',
      description: '404 에러',
    },
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
  const { error } = useToast()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    error('로그인이 필요한 페이지입니다.')
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
