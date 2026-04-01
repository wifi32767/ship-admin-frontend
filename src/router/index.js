import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Main',
        component: () => import('@/views/main/index.vue'),
        meta: { requiresAuth: true },
        redirect: '/home',  // 添加重定向
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('@/views/main/home.vue'),
                meta: { title: '首页' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const requiresAuth = to.meta.requiresAuth !== false
    
    console.log('路由守卫:', { to: to.path, requiresAuth, isLoggedIn: userStore.isLoggedIn })
    
    if (requiresAuth && !userStore.isLoggedIn) {
        // 未登录，跳转到登录页
        next('/login')
    } else if (to.path === '/login' && userStore.isLoggedIn) {
        // 已登录，访问登录页，跳转到首页
        next('/')
    } else {
        next()
    }
})

export default router