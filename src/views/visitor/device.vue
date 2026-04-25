<template>
    <div class="device-page">
        <div class="page-head">
            <div>
                <span class="en-label">DEVICE DETAIL</span>
                <h1 class="page-title">案例详情</h1>
            </div>
            <p class="page-desc">该页面用于承接行业动态、典型案例、基础设施等列表项的详情跳转。</p>
        </div>

        <div class="content-card">
            <el-result
                icon="info"
                title="详情页建设中"
                sub-title="已修复点击跳转问题，当前详情内容将在后续版本补齐。"
            >
                <template #extra>
                    <el-button @click="goBack">返回上一页</el-button>
                    <el-button type="primary" @click="goHome">返回门户首页</el-button>
                </template>
            </el-result>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
    router.back()
}

function goHome() {
    router.push('/portal/home')
}
</script>

<style scoped>
.device-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.page-head {
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
}

.en-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1677ff;
}

.page-title {
    margin: 4px 0 10px;
    font-size: 26px;
    font-weight: 700;
    color: #0e2044;
}

.page-desc {
    margin: 0;
    font-size: 14px;
    color: #8a9ab8;
    line-height: 1.6;
}

.content-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
}
</style>
