<template>
    <div class="visitor-home">

        <!-- ===== 统计板 ===== -->
        <section class="stats-board">
            <div v-if="statsLoading" class="stats-grid">
                <el-skeleton v-for="i in 3" :key="i" :rows="2" animated class="stat-skeleton" />
            </div>
            <div v-else class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">收录总量</div>
                    <div class="stat-value">{{ stats.totalIndexed?.toLocaleString() ?? '--' }}</div>
                    <div class="stat-diff" :class="diffClass(stats.indexdDiff)">
                        <el-icon><component :is="diffIcon(stats.indexdDiff)" /></el-icon>
                        较昨日 {{ diffText(stats.indexdDiff) }}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">今日新增</div>
                    <div class="stat-value">{{ stats.todayIndexed?.toLocaleString() ?? '--' }}</div>
                    <div class="stat-diff" :class="diffClass(stats.indexdDiff)">
                        <el-icon><component :is="diffIcon(stats.indexdDiff)" /></el-icon>
                        较昨日 {{ diffText(stats.indexdDiff) }}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">今日校错</div>
                    <div class="stat-value">{{ stats.todayCorrected?.toLocaleString() ?? '--' }}</div>
                    <div class="stat-diff" :class="diffClass(stats.correctedDiff)">
                        <el-icon><component :is="diffIcon(stats.correctedDiff)" /></el-icon>
                        较昨日 {{ diffText(stats.correctedDiff) }}
                    </div>
                </div>
            </div>
        </section>

        <!-- ===== 行业动态新闻 ===== -->
        <section class="content-section">
            <div class="section-header">
                <div class="section-title-group">
                    <span class="section-label-en">INDUSTRY UPDATES</span>
                    <h2 class="section-title">行业动态新闻</h2>
                </div>
                <router-link to="/portal/industry" class="view-more">查看更多 →</router-link>
            </div>

            <div v-if="newsLoading" class="grid-2col">
                <el-skeleton v-for="i in 6" :key="i" :rows="2" animated class="skeleton-card" />
            </div>
            <div v-else-if="newsList.length" class="grid-2col">
                <div
                    v-for="item in newsList"
                    :key="item.sourceLink + item.publishTime"
                    class="news-card"
                    @click="openLink(item.sourceLink)"
                >
                    <span class="news-title">{{ item.title }}</span>
                    <span class="news-date">{{ formatDate(item.publishTime) }}</span>
                </div>
            </div>
            <el-empty v-else description="暂无行业动态" :image-size="80" />
        </section>

        <!-- ===== 数字化典型案例 ===== -->
        <section class="content-section">
            <div class="section-header">
                <div class="section-title-group">
                    <span class="section-label-en">TYPICAL CASES</span>
                    <h2 class="section-title">数字化典型案例</h2>
                </div>
                <router-link to="/portal/cases" class="view-more">查看更多 →</router-link>
            </div>

            <div v-if="casesLoading" class="grid-3col">
                <el-skeleton v-for="i in 6" :key="i" :rows="3" animated class="skeleton-card" />
            </div>
            <div v-else-if="casesList.length" class="grid-3col">
                <div
                    v-for="item in casesList"
                    :key="item.id"
                    class="case-card"
                    @click="openDevice(item)"
                >
                    <div class="case-img" :style="item.deviceImg ? `background-image:url(${item.deviceImg})` : ''">
                        <el-icon v-if="!item.deviceImg" class="case-img-placeholder"><Ship /></el-icon>
                    </div>
                    <div class="case-body">
                        <h3 class="case-title">{{ item.deviceName }}</h3>
                        <p class="case-desc">{{ item.deviceIntroduce || '暂无介绍' }}</p>
                        <div class="case-meta">
                            <span v-if="item.deviceUsingUnit" class="case-unit">{{ item.deviceUsingUnit }}</span>
                            <span class="case-date">{{ formatDateShort(item.deviceInsqlTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <el-empty v-else description="暂无典型案例" :image-size="80" />
        </section>

        <!-- ===== 基础设施建设信息 ===== -->
        <section class="content-section">
            <div class="section-header">
                <div class="section-title-group">
                    <span class="section-label-en">INFRASTRUCTURE</span>
                    <h2 class="section-title">基础设施建设信息</h2>
                </div>
                <router-link to="/portal/infrastructure" class="view-more">查看更多 →</router-link>
            </div>

            <div v-if="infraLoading" class="grid-3col">
                <el-skeleton v-for="i in 6" :key="i" :rows="3" animated class="skeleton-card" />
            </div>
            <div v-else-if="infraList.length" class="grid-3col">
                <div
                    v-for="item in infraList"
                    :key="item.id"
                    class="infra-card"
                    @click="openDevice(item)"
                >
                    <div class="infra-icon-wrap">
                        <el-icon class="infra-icon"><OfficeBuilding /></el-icon>
                    </div>
                    <div class="infra-body">
                        <h3 class="infra-name">{{ item.deviceName }}</h3>
                        <p v-if="item.deviceLocation" class="infra-location">
                            <el-icon><Location /></el-icon>{{ item.deviceLocation }}
                        </p>
                        <p class="infra-desc">{{ item.deviceIntroduce || '暂无介绍' }}</p>
                        <div class="infra-meta">
                            <span v-if="item.deviceUseYear">投产：{{ item.deviceUseYear }} 年</span>
                            <span class="infra-date">{{ formatDateShort(item.deviceInsqlTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <el-empty v-else description="暂无基础设施信息" :image-size="80" />
        </section>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { OfficeBuilding, Location, Top, Bottom, Minus } from '@element-plus/icons-vue'
import {
    getStatsBoard,
    getLatestNews,
    getRecommendations,
    getLatestRecords
} from '@/api/visitor'

import { Picture as Ship } from '@element-plus/icons-vue'

const router = useRouter()

/* ---- 日期格式化 ---- */
function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function formatDateShort(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

/* ---- 统计数据差值辅助 ---- */
function diffClass(val) {
    if (!val || val === 0) return 'diff-neutral'
    return val > 0 ? 'diff-up' : 'diff-down'
}
function diffIcon(val) {
    if (!val || val === 0) return Minus
    return val > 0 ? Top : Bottom
}
function diffText(val) {
    if (val == null) return '--'
    if (val === 0) return '持平'
    return `${val > 0 ? '+' : ''}${val}`
}

/* ---- 统计板 ---- */
const statsLoading = ref(false)
const stats = ref({})

async function fetchStats() {
    statsLoading.value = true
    try {
        const res = await getStatsBoard()
        stats.value = res.body ?? {}
    } catch (e) {
        // 接口不可用时不阻断页面
    } finally {
        statsLoading.value = false
    }
}

/* ---- 行业动态 ---- */
const newsLoading = ref(false)
const newsList = ref([])

async function fetchNews() {
    newsLoading.value = true
    try {
        const res = await getLatestNews()
        newsList.value = res.body ?? []
    } catch (e) {
        // ignore
    } finally {
        newsLoading.value = false
    }
}

function openLink(url) {
    if (url) window.open(url, '_blank', 'noopener')
}

/* ---- 数字化典型案例 ---- */
const casesLoading = ref(false)
const casesList = ref([])

async function fetchCases() {
    casesLoading.value = true
    try {
        const res = await getRecommendations()
        casesList.value = res.body ?? []
    } catch (e) {
        // ignore
    } finally {
        casesLoading.value = false
    }
}

/* ---- 基础设施建设信息 ---- */
const infraLoading = ref(false)
const infraList = ref([])

async function fetchInfra() {
    infraLoading.value = true
    try {
        const res = await getLatestRecords()
        // 首页只展示前6条
        infraList.value = (res.body ?? []).slice(0, 6)
    } catch (e) {
        // ignore
    } finally {
        infraLoading.value = false
    }
}

function openDevice(item) {
    // TODO: 跳转到设备详情页（待实现）
    router.push(`/portal/device/${item.id}`)
}

onMounted(() => {
    fetchStats()
    fetchNews()
    fetchCases()
    fetchInfra()
})
</script>

<style scoped>
.visitor-home {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

/* ===== 统计板 ===== */
.stats-board {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #e8eef8;
    border-radius: 8px;
    overflow: hidden;
}

.stat-card {
    background: #fff;
    padding: 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.stat-label {
    font-size: 13px;
    color: #8a9ab8;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #0e2044;
    line-height: 1.1;
}

.stat-diff {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
}
.diff-up    { color: #52c41a; }
.diff-down  { color: #ff4d4f; }
.diff-neutral { color: #8a9ab8; }

.stat-skeleton {
    padding: 20px;
    background: #fff;
}

/* ===== 区块通用 ===== */
.content-section {
    background: #ffffff;
    border-radius: 12px;
    padding: 28px 32px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
}

.section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
    border-bottom: 2px solid #e8eef8;
    padding-bottom: 16px;
}

.section-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.section-label-en {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1677ff;
}

.section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #0e2044;
    line-height: 1.2;
}

.view-more {
    color: #1677ff;
    font-size: 14px;
    text-decoration: none;
    padding-bottom: 2px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
    white-space: nowrap;
}
.view-more:hover { border-bottom-color: #1677ff; }

/* ===== 行业动态（2列）===== */
.grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.news-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 20px;
    border: 1px solid #e8eef8;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafbff;
}
.news-card:hover {
    border-color: #1677ff;
    background: #f0f6ff;
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.1);
}

.news-title {
    font-size: 14px;
    color: #1a2a4a;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
}

.news-date {
    font-size: 12px;
    color: #8a9ab8;
    white-space: nowrap;
    flex-shrink: 0;
}

/* ===== 3列布局 ===== */
.grid-3col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

/* 典型案例卡片 */
.case-card {
    border: 1px solid #e8eef8;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafbff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.case-card:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.12);
    transform: translateY(-2px);
}

.case-img {
    height: 130px;
    background: #e8f0fe;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.case-img-placeholder {
    font-size: 40px;
    color: #7aaaf0;
}

.case-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.case-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #0e2044;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
}

.case-desc {
    margin: 0;
    font-size: 13px;
    color: #5c6b8a;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.6;
    flex: 1;
}

.case-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #8a9ab8;
    padding-top: 8px;
    border-top: 1px solid #e8eef8;
}

.case-unit {
    background: #e8f0fe;
    color: #1677ff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    max-width: 60%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* 基础设施卡片 */
.infra-card {
    padding: 20px;
    border: 1px solid #e8eef8;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafbff;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}
.infra-card:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.12);
    transform: translateY(-2px);
}

.infra-icon-wrap {
    width: 44px;
    height: 44px;
    background: #e8f0fe;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.infra-icon { font-size: 22px; color: #1677ff; }

.infra-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.infra-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #0e2044;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.infra-location {
    margin: 0;
    font-size: 12px;
    color: #1677ff;
    display: flex;
    align-items: center;
    gap: 3px;
}

.infra-desc {
    margin: 0;
    font-size: 13px;
    color: #5c6b8a;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
}

.infra-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #8a9ab8;
    padding-top: 6px;
    border-top: 1px solid #e8eef8;
}

/* 骨架屏 */
.skeleton-card {
    background: #fff;
    border: 1px solid #e8eef8;
    border-radius: 8px;
    padding: 16px;
}

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
    .grid-3col { grid-template-columns: repeat(2, 1fr); }
    .stats-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 720px) {
    .grid-2col,
    .grid-3col,
    .stats-grid { grid-template-columns: 1fr; }
    .content-section { padding: 20px 16px; }
}
</style>
