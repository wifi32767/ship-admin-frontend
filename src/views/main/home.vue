<template>
    <div class="home-container">
        <el-card class="welcome-card">
            <h2>欢迎回来，{{ userStore.username }}！</h2>
            <p>这是管理系统的首页，您可以通过侧边栏导航到各个功能模块。</p>
            <el-divider />
        </el-card>
    </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.home-container {
    height: 100%;
}

.welcome-card {
    margin-bottom: 20px;
}

.welcome-card h2 {
    margin-bottom: 12px;
    color: #333;
}

.welcome-card p {
    color: #666;
}

.stat-card {
    cursor: pointer;
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
}

.stat-info {
    flex: 1;
}

.stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.stat-title {
    font-size: 14px;
    color: #999;
    margin-top: 4px;
}
</style>