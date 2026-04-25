<template>
    <div class="industry-page">

        <!-- ===== 页头 ===== -->
        <div class="page-head">
            <div class="page-head-title">
                <span class="en-label">INDUSTRY UPDATES</span>
                <h1 class="page-title">行业动态</h1>
            </div>
            <p class="page-desc">聚焦船舶制造业政策、技术、市场与企业动态，持续跟踪行业发展趋势。</p>
        </div>

        <!-- ===== 分类 Tab ===== -->
        <div class="category-bar">
            <div
                v-for="tab in tabs"
                :key="tab.styleId ?? 'all'"
                class="cat-tab"
                :class="{ 'cat-tab-active': activeStyleId === tab.styleId }"
                @click="selectTab(tab.styleId)"
            >
                <el-icon v-if="tab.icon" class="cat-icon"><component :is="tab.icon" /></el-icon>
                {{ tab.name }}
                <span v-if="tab.styleId === null" class="tab-count">{{ totalCount }}</span>
            </div>
        </div>

        <!-- ===== 内容区 ===== -->
        <div class="content-area">
            <!-- 加载骨架 -->
            <div v-if="loading" class="news-grid">
                <div v-for="i in 6" :key="i" class="news-card skeleton-wrap">
                    <el-skeleton animated :rows="3" />
                </div>
            </div>

            <!-- 新闻列表 -->
            <div v-else-if="list.length" class="news-grid">
                <div
                    v-for="item in list"
                    :key="item.id"
                    class="news-card"
                    @click="openItem(item)"
                >
                    <!-- 左侧图片 -->
                    <div
                        class="card-thumb"
                        :style="item.deviceImg ? `background-image:url(${item.deviceImg})` : ''"
                    >
                        <el-icon v-if="!item.deviceImg" class="thumb-icon"><Document /></el-icon>
                    </div>

                    <!-- 右侧内容 -->
                    <div class="card-body">
                        <div class="card-tags">
                            <span class="style-tag">{{ styleNameMap[item.deviceStyleId] ?? '行业动态' }}</span>
                        </div>
                        <h3 class="card-title">{{ item.deviceName }}</h3>
                        <p class="card-desc">{{ item.deviceIntroduce || '暂无详细介绍' }}</p>
                        <div class="card-meta">
                            <span class="meta-date">
                                <el-icon><Calendar /></el-icon>
                                {{ formatDate(item.deviceInsqlTime) }}
                            </span>
                            <span v-if="item.deviceUsingUnit" class="meta-unit">
                                <el-icon><OfficeBuilding /></el-icon>
                                {{ item.deviceUsingUnit }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-wrap">
                <el-empty description="暂无相关动态" :image-size="100" />
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    Document, Calendar, OfficeBuilding,
    Files, Cpu, TrendCharts, Trophy, Star
} from '@element-plus/icons-vue'
import { searchDevices } from '@/api/visitor'
import { cachePortalDevice, buildPortalDetailQuery } from '@/utils/portalDeviceDetail'

const router = useRouter()
const route = useRoute()

// 行业动态 classId = 1（device_class 表中对应值）
const CLASS_ID = 1

// 四个子分类（来自 device_style 表，device_style_class_id = 1）
// TODO: 如需动态加载可改为从 /api/class/list 获取
const tabs = [
    { styleId: null,  name: '全部',           icon: Files    },
    { styleId: 11,    name: '政策与法规动态',   icon: Document  },
    { styleId: 12,    name: '技术创新与突破',   icon: Cpu       },
    { styleId: 13,    name: '市场与资本动向',   icon: TrendCharts },
    { styleId: 14,    name: '标杆企业与生态合作', icon: Trophy  },
]

const styleNameMap = {
    11: '政策与法规动态',
    12: '技术创新与突破',
    13: '市场与资本动向',
    14: '标杆企业与生态合作',
}

const activeStyleId = ref(null)  // null = 全部
const loading = ref(false)
const list = ref([])

const totalCount = computed(() => list.value.length || '')

function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

async function fetchList() {
    loading.value = true
    list.value = []
    try {
        const params = { classId: CLASS_ID }
        if (activeStyleId.value !== null) params.styleId = activeStyleId.value
        const res = await searchDevices(params)
        list.value = res.body ?? []
    } catch (e) {
        // ignore
    } finally {
        loading.value = false
    }
}

function selectTab(styleId) {
    activeStyleId.value = styleId
    // 同步到 URL query，方便分享
    router.replace({
        path: route.path,
        query: styleId !== null ? { style: styleId } : {}
    })
}

function openItem(item) {
    cachePortalDevice(item)
    router.push({
        path: `/portal/device/${item.id}`,
        query: buildPortalDetailQuery(item, {
            classId: CLASS_ID,
            styleId: activeStyleId.value,
        })
    })
}

// 监听 tab 切换时重新请求
watch(activeStyleId, fetchList)

onMounted(() => {
    // 从 URL 恢复选中状态
    const styleQuery = route.query.style
    if (styleQuery) {
        activeStyleId.value = Number(styleQuery)
    }
    fetchList()
})
</script>

<style scoped>
.industry-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* ===== 页头 ===== */
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

/* ===== 分类 Tab 栏 ===== */
.category-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.cat-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 22px;
    background: #fff;
    border: 1.5px solid #e0e8f8;
    border-radius: 40px;
    font-size: 14px;
    color: #3a4a6a;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 4px rgba(0, 30, 80, 0.05);
    user-select: none;
}
.cat-tab:hover {
    border-color: #1677ff;
    color: #1677ff;
    background: #f0f6ff;
}
.cat-tab-active {
    background: #1677ff !important;
    border-color: #1677ff !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}

.cat-icon {
    font-size: 15px;
}

.tab-count {
    background: rgba(255, 255, 255, 0.3);
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 12px;
    min-width: 20px;
    text-align: center;
}
.cat-tab:not(.cat-tab-active) .tab-count {
    background: #e8eef8;
    color: #8a9ab8;
}

/* ===== 内容区 ===== */
.content-area {
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
    min-height: 300px;
}

.news-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

/* 新闻卡片 */
.news-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    border: 1px solid #e8eef8;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafbff;
}
.news-card:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.1);
    transform: translateY(-1px);
}

/* 缩略图 */
.card-thumb {
    width: 110px;
    min-width: 110px;
    height: 90px;
    border-radius: 8px;
    background: #e8f0fe;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.thumb-icon {
    font-size: 32px;
    color: #7aaaf0;
}

/* 卡片内容 */
.card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.card-tags {
    display: flex;
    gap: 6px;
}

.style-tag {
    font-size: 11px;
    background: #e8f0fe;
    color: #1677ff;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #c5d8fc;
}

.card-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #0e2044;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
}

.card-desc {
    margin: 0;
    font-size: 13px;
    color: #5c6b8a;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
    flex: 1;
}

.card-meta {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 12px;
    color: #8a9ab8;
    padding-top: 6px;
    border-top: 1px solid #e8eef8;
}

.meta-date,
.meta-unit {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 50%;
}

/* 骨架 & 空状态 */
.skeleton-wrap {
    padding: 16px;
    background: #fafbff;
    border: 1px solid #e8eef8;
    border-radius: 10px;
}

.empty-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 0;
}

/* ===== 响应式 ===== */
@media (max-width: 960px) {
    .news-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
    .category-bar { gap: 8px; }
    .cat-tab { padding: 8px 16px; font-size: 13px; }
    .content-area { padding: 20px 16px; }
    .card-thumb { width: 80px; min-width: 80px; height: 70px; }
}
</style>
