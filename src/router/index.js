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
        meta: { requiresAuth: false },
        redirect: '/home',  // 添加重定向
        children: [
            {
                path: 'home',
                name: 'Home',
                component: () => import('@/views/main/home.vue'),
                meta: { title: '首页' }
            },
            {
                path: 'data-entry/single',
                name: 'SingleDataEntry',
                component: () => import('@/views/main/entry/single.vue'),
                meta: { title: '单条数据录入' }
            },
            {
                path: 'data-entry/batch',
                name: 'BatchDataEntry',
                component: () => import('@/views/main/entry/batch.vue'),
                meta: { title: '批量数据录入' }
            },
            {
                path: 'audit',
                name: 'Audit',
                component: () => import('@/views/main/audit.vue'),
                meta: { title: '录入审核' }
            },
            {
                path: 'data-modification',
                name: 'DataModification',
                component: () => import('@/views/main/modifiy.vue'),
                meta: { title: '数据修改' }
            },
            {
                path: 'model-management',
                name: 'ModelManagement',
                component: () => import('@/views/main/model.vue'),
                meta: { title: '模型管理' }
            },
            {
                path: 'category-management',
                name: 'CategoryManagement',
                component: () => import('@/views/main/category.vue'),
                meta: { title: '分类管理' }
            },
            {
                path: 'system-management/countries',
                name: 'CountryManagement',
                component: () => import('@/views/main/system/country.vue'),
                meta: { title: '国家信息' }
            },
            {
                path: 'system-management/roles',
                name: 'RoleManagement',
                component: () => import('@/views/main/system/role.vue'),
                meta: { title: '角色管理' }
            },
            {
                path: 'system-management/users',
                name: 'UserManagement',
                component: () => import('@/views/main/system/user.vue'),
                meta: { title: '用户管理' }
            },
            {
                path: 'logs',
                name: 'Logs',
                component: () => import('@/views/main/log.vue'),
                meta: { title: '日志管理' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 修改路由守卫（新写法）
router.beforeEach(async (to, from) => {
    const userStore = useUserStore()
    const requiresAuth = to.meta.requiresAuth !== false  // 默认需要认证（除了显式标记 false）
    
    console.log('路由守卫:', { to: to.path, requiresAuth, isLoggedIn: userStore.isLoggedIn })
    
    if (requiresAuth && !userStore.isLoggedIn) {
        // 未登录，跳转到登录页
        return '/login'
    }
    if (to.path === '/login' && userStore.isLoggedIn) {
        // 已登录，访问登录页，跳转到首页
        return '/'
    }
    // 允许访问
    return true
})

export default router