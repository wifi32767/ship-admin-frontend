<template>
    <div class="visitor-layout">
        <!-- ===== 门户顶部 Header ===== -->
        <header class="portal-header">
            <div class="header-container">
                <!-- 品牌行：英文标题 + 管理员入口 -->
                <div class="brand-row">
                    <span class="brand-en">SHIPBUILDING DIGITAL INTELLIGENCE PORTAL</span>
                    <div class="header-actions">
                        <el-button class="btn-login" @click="router.push('/login')">管理员登录</el-button>
                        <el-button class="btn-ai" type="primary">AI助手</el-button>
                    </div>
                </div>

                <!-- 主标题区 -->
                <div class="title-block">
                    <h1 class="portal-title">船舶制造业数字化转型信息数据库</h1>
                    <p class="portal-subtitle">
                        整合行业动态、基础设施建设、典型案例与数字化专题研究，形成统一的船舶制造业数字化转型门户。
                    </p>
                </div>

                <!-- 导航栏 -->
                <nav class="portal-nav">
                    <router-link
                        v-for="item in navItems"
                        :key="item.path"
                        :to="item.path"
                        class="nav-link"
                        :class="{ 'nav-link-active': isNavActive(item.path) }"
                    >{{ item.label }}</router-link>
                </nav>

                <!-- 搜索栏 -->
                <div class="search-section">
                    <div class="search-bar">
                        <el-select v-model="searchType" class="search-type-select">
                            <el-option label="全文检索" value="fulltext" />
                            <el-option label="标题检索" value="title" />
                            <el-option label="案例检索" value="case" />
                        </el-select>
                        <el-input
                            v-model="searchQuery"
                            placeholder="请输入关键词进行查询"
                            class="search-input"
                            @keyup.enter="handleSearch"
                        />
                        <el-button type="primary" class="search-btn" @click="handleSearch">
                            <el-icon><Search /></el-icon>查询
                        </el-button>
                        <el-button class="map-btn" @click="handleGoMap">
                            <el-icon><MapLocation /></el-icon>进入产业地图
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 底部波浪装饰 -->
            <div class="header-wave">
                <svg viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z" fill="#f0f4f8" />
                </svg>
            </div>
        </header>

        <!-- ===== 页面主内容 ===== -->
        <main class="portal-main">
            <div class="page-container">
                <router-view />
            </div>
        </main>

        <!-- ===== 页脚 ===== -->
        <footer class="portal-footer">
            <p>© 2026 船舶制造业数字化转型信息数据库 版权所有</p>
        </footer>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, MapLocation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const searchType = ref('fulltext')
const searchQuery = ref('')

const navItems = [
    { label: '首页', path: '/portal/home' },
    { label: '行业动态', path: '/portal/industry' },
    { label: '典型案例', path: '/portal/cases' },
    { label: '基础设施建设信息', path: '/portal/infrastructure' },
    { label: '信息检索', path: '/portal/search' },
    { label: '产业地图', path: '/portal/map' },
    { label: '产业图谱', path: '/portal/atlas' },
    { label: '数字化转型体系架构', path: '/portal/framework' },
    { label: '数字化转型支撑体系', path: '/portal/support' },
]

function isNavActive(path) {
    return route.path === path || route.path.startsWith(path + '/')
}

function handleSearch() {
    if (!searchQuery.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
    }
    // TODO: 跳转到搜索结果页
    router.push({
        path: '/portal/search',
        query: { q: searchQuery.value.trim(), type: searchType.value }
    })
}

function handleGoMap() {
    // TODO: 跳转到产业地图页
    router.push('/portal/map')
}
</script>

<style scoped>
/* ===== 整体布局 ===== */
.visitor-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f0f4f8;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== Header ===== */
.portal-header {
    background: linear-gradient(160deg, #07194a 0%, #0e2d6e 45%, #1a4a8a 100%);
    position: relative;
    padding-bottom: 0;
}

.header-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px;
}

/* 品牌行 */
.brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-en {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.75);
}

.header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}

.btn-login {
    background: transparent;
    border: 1.5px solid rgba(255, 255, 255, 0.6);
    color: #fff;
    border-radius: 20px;
    padding: 6px 20px;
    font-size: 14px;
    transition: all 0.25s;
}
.btn-login:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #fff;
}

.btn-ai {
    border-radius: 20px;
    padding: 6px 20px;
    font-size: 14px;
    background: #1677ff;
    border-color: #1677ff;
}

/* 主标题 */
.title-block {
    padding: 28px 0 22px;
}

.portal-title {
    color: #ffffff;
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 10px;
    letter-spacing: 2px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.portal-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 15px;
    margin: 0;
    line-height: 1.6;
}

/* 导航栏 */
.portal-nav {
    display: flex;
    gap: 4px;
    padding: 0;
    flex-wrap: wrap;
}

.nav-link {
    display: inline-block;
    padding: 9px 18px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 14px;
    border-radius: 6px 6px 0 0;
    transition: all 0.2s;
    white-space: nowrap;
}
.nav-link:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
}
.nav-link-active {
    color: #0e2d6e !important;
    background: #ffffff !important;
    font-weight: 600;
}

/* 搜索栏 */
.search-section {
    padding: 18px 0 26px;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 0;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    max-width: 860px;
}

.search-type-select {
    width: 130px;
    flex-shrink: 0;
}
.search-type-select :deep(.el-input__wrapper) {
    border-radius: 0;
    border-right: 1px solid #e0e6f0;
    box-shadow: none !important;
}

.search-input {
    flex: 1;
}
.search-input :deep(.el-input__wrapper) {
    border-radius: 0;
    box-shadow: none !important;
}

.search-btn {
    border-radius: 0;
    padding: 0 24px;
    height: 40px;
    font-size: 15px;
    background: #1677ff;
    border-color: #1677ff;
    gap: 4px;
}

.map-btn {
    border-radius: 0 8px 8px 0;
    padding: 0 20px;
    height: 40px;
    background: #f5f7fa;
    border: none;
    border-left: 1px solid #e0e6f0;
    color: #1677ff;
    font-size: 14px;
    gap: 4px;
}
.map-btn:hover {
    background: #e8f0fe;
}

/* 波浪分隔 */
.header-wave {
    line-height: 0;
    overflow: hidden;
}
.header-wave svg {
    width: 100%;
    height: 48px;
    display: block;
}

/* ===== 主内容 ===== */
.portal-main {
    flex: 1;
    background-color: #f0f4f8;
}

.page-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 32px 48px;
}

/* ===== 页脚 ===== */
.portal-footer {
    background: #1a2a4a;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    padding: 20px;
    font-size: 13px;
}
.portal-footer p {
    margin: 0;
}
</style>
