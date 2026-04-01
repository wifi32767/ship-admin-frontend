<template>
    <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
            <div class="logo-container">
                <span v-if="!isCollapse" class="logo-text">管理系统</span>
                <span v-else class="logo-mini">M</span>
            </div>
            
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :collapse-transition="false"
                background-color="#304156"
                text-color="#bfcbd9"
                active-text-color="#409EFF"
                router
            >
                <el-menu-item index="/">
                    <el-icon><HomeFilled /></el-icon>
                    <span>首页</span>
                </el-menu-item>

                <el-menu-item index="/data-analysis">
                    <el-icon><Document /></el-icon>
                    <span>信息录入</span>
                </el-menu-item>

                <el-menu-item index="/data-review">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>录入审核</span>
                </el-menu-item>

                <el-menu-item index="/data-modification">
                    <el-icon><DocumentCopy /></el-icon>
                    <span>数据修改</span>
                </el-menu-item>

                <el-menu-item index="/model-management">
                    <el-icon><PieChart /></el-icon>
                    <span>模型管理</span>
                </el-menu-item>

                <el-sub-menu index="system-management">
                    <template #title>
                        <el-icon><User /></el-icon>
                        <span>系统管理</span>
                    </template>
                    <el-menu-item index="/data-types">
                        <el-icon><Document /></el-icon>
                        <span>数据类型</span>
                    </el-menu-item>
                    <el-menu-item index="/countries">
                        <el-icon><Location /></el-icon>
                        <span>国家信息</span>
                    </el-menu-item>
                    <el-menu-item index="/roles">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>角色信息</span>
                    </el-menu-item>
                    <el-menu-item index="/users">
                        <el-icon><User /></el-icon>
                        <span>管理员信息</span>
                    </el-menu-item>
                </el-sub-menu>

                <el-menu-item index="/questionnaire-management">
                    <el-icon><Calendar /></el-icon>
                    <span>问卷管理</span>
                </el-menu-item>

            </el-menu>
        </el-aside>
        
        <!-- 主内容区 -->
        <el-container>
            <!-- 顶部导航栏 -->
            <el-header class="header">
                <div class="header-left">
                    <el-icon 
                        :size="20" 
                        class="collapse-icon" 
                        @click="toggleCollapse"
                    >
                        <Fold v-if="!isCollapse" />
                        <Expand v-else />
                    </el-icon>
                </div>
                
                <div class="header-right">
                    <el-dropdown @command="handleCommand">
                        <div class="user-info">
                            <el-avatar :size="32" :icon="UserFilled" />
                            <span class="username">{{ userStore.username || '管理员' }}</span>
                            <el-icon><ArrowDown /></el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">
                                    <el-icon><User /></el-icon>
                                    个人中心
                                </el-dropdown-item>
                                <el-dropdown-item command="logout" divided>
                                    <el-icon><SwitchButton /></el-icon>
                                    退出登录
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>
            
            <!-- 内容区域 -->
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
    HomeFilled,
    DataAnalysis,
    Document,
    DocumentCopy,
    PieChart,
    User,
    Fold,
    Expand,
    UserFilled,
    ArrowDown,
    SwitchButton,
    Calendar,
    TrendCharts,
    Location,
    OfficeBuilding
} from '@element-plus/icons-vue'
import { el } from 'element-plus/es/locale/index.mjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}

const handleCommand = async (command) => {
    if (command === 'logout') {
        ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(async () => {
            await userStore.logout()
            ElMessage.success('已退出登录')
            router.push('/login')
        }).catch(() => {})
    } else if (command === 'profile') {
        ElMessage.info('个人中心开发中')
    }
}
</script>

<style scoped>
.main-container {
    height: 100vh;
    overflow: hidden;
}

.sidebar {
    background-color: #304156;
    transition: width 0.3s;
    overflow-x: hidden;
}

.logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b3a4a;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
}

.logo-text {
    letter-spacing: 2px;
}

.logo-mini {
    font-size: 20px;
}

.el-menu {
    border-right: none;
}

.header {
    background-color: #fff;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
}

.header-left {
    display: flex;
    align-items: center;
}

.collapse-icon {
    cursor: pointer;
    color: #666;
    transition: color 0.3s;
}

.collapse-icon:hover {
    color: #409EFF;
}

.header-right {
    display: flex;
    align-items: center;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background-color 0.3s;
}

.user-info:hover {
    background-color: #f5f5f5;
}

.username {
    font-size: 14px;
    color: #333;
}

.main-content {
    background-color: #f0f2f6;
    padding: 20px;
    overflow-y: auto;
}
</style>