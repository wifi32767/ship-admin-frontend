import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/portal',
        name: 'Portal',
        component: () => import('@/views/visitor/layout.vue'),
        meta: { requiresAuth: false },
        redirect: '/portal/home',
        children: [
            {
                path: 'home',
                name: 'PortalHome',
                component: () => import('@/views/visitor/home.vue'),
                meta: { title: '门户首页' }
            },
            {
                path: 'industry',
                name: 'PortalIndustry',
                component: () => import('@/views/visitor/industry.vue'),
                meta: { title: '行业动态' }
            },
            {
                path: 'cases',
                name: 'PortalCases',
                component: () => import('@/views/visitor/cases.vue'),
                meta: { title: '典型案例' }
            },
            {
                path: 'infrastructure',
                name: 'PortalInfrastructure',
                component: () => import('@/views/visitor/infrastructure.vue'),
                meta: { title: '基础设施建设信息' }
            },
            {
                path: 'device/:id',
                name: 'PortalDevice',
                component: () => import('@/views/visitor/device.vue'),
                meta: { title: '设备详情' }
            }
        ]
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