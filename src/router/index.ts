import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignUpView from '../views/SignUpView.vue'
import HomeView from '../views/HomeView.vue'
import MeetingCreateView from '../views/MeetingCreateView.vue'
import MeetingDetailView from '../views/MeetingDetailView.vue'
import EditMeetingView from '../views/EditMeetingView.vue'
import MeetingConfirmView from '../views/MeetingConfirmView.vue'
import RevoteCreateView from '../views/RevoteCreateView.vue'
import RevoteView from '../views/RevoteView.vue'
import OAuthCallbackView from '../views/OAuthCallbackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/sign-up', name: 'sign-up', component: SignUpView, meta: { public: true } },
    { path: '/', name: 'home', component: HomeView },
    { path: '/meetings/new', name: 'meeting-create', component: MeetingCreateView },
    { path: '/meetings/:id', name: 'meeting-detail', component: MeetingDetailView },
    { path: '/meetings/:id/edit', name: 'meeting-edit', component: EditMeetingView },
    { path: '/meetings/:id/confirm', name: 'meeting-confirm', component: MeetingConfirmView },
    { path: '/meetings/:id/revote/new', name: 'revote-create', component: RevoteCreateView },
    { path: '/meetings/:id/revote', name: 'revote', component: RevoteView },
    { path: '/oauth/callback', name: 'oauth-callback', component: OAuthCallbackView, meta: { public: true } },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken')
  if (!to.meta.public && !token) {
    sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && token && (to.name === 'login' || to.name === 'sign-up')) {
    return { name: 'home' }
  }
})

export default router
