<template>
    <div class="cases-page">

        <div class="page-head">
            <div>
                <span class="en-label">TYPICAL CASES</span>
                <h1 class="page-title">典型案例</h1>
            </div>
            <p class="page-desc">聚焦船舶制造业数字化转型场景，按二级和三级分类快速筛选典型案例。</p>
        </div>

        <div class="level2-bar">
            <div
                v-for="tab in styleTabs"
                :key="tab.styleId ?? 'all'"
                class="l2-tab"
                :class="{ 'l2-tab-active': activeStyleId === tab.styleId }"
                @click="selectStyle(tab.styleId)"
            >
                <el-icon class="tab-icon"><component :is="tab.icon" /></el-icon>
                {{ tab.name }}
            </div>
        </div>

        <Transition name="type-slide">
            <div v-if="activeStyleId !== null" class="level3-bar">
                <div class="l3-label">细分类型：</div>
                <div
                    v-for="type in currentTypes"
                    :key="type.typeId ?? 'all'"
                    class="l3-tab"
                    :class="{ 'l3-tab-active': activeTypeId === type.typeId }"
                    @click="selectType(type.typeId)"
                >
                    {{ type.name }}
                </div>
            </div>
        </Transition>

        <div class="content-area">
            <div v-if="loading" class="case-grid">
                <div v-for="i in 6" :key="i" class="case-card skeleton-wrap">
                    <el-skeleton animated :rows="3" />
                </div>
            </div>

            <div v-else-if="list.length" class="case-grid">
                <div
                    v-for="item in list"
                    :key="item.id"
                    class="case-card"
                    @click="openItem(item)"
                >
                    <div
                        class="card-cover"
                        :style="item.deviceImg ? `background-image:url(${item.deviceImg})` : ''"
                    >
                        <el-icon v-if="!item.deviceImg" class="cover-icon"><Picture /></el-icon>
                        <span v-if="typeNameMap[item.deviceTypeId]" class="type-badge">
                            {{ typeNameMap[item.deviceTypeId] }}
                        </span>
                    </div>

                    <div class="card-body">
                        <h3 class="card-name">{{ item.deviceName }}</h3>

                        <p class="card-desc">{{ item.deviceIntroduce || '暂无介绍' }}</p>

                        <div class="card-footer">
                            <span v-if="item.deviceUsingUnit" class="footer-unit">
                                <el-icon><OfficeBuilding /></el-icon>
                                {{ item.deviceUsingUnit }}
                            </span>
                            <span class="footer-date">
                                <el-icon><Calendar /></el-icon>
                                {{ formatDate(item.deviceInsqlTime) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="empty-wrap">
                <el-empty description="暂无相关典型案例" :image-size="100" />
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, Cpu, TrendCharts, Picture, OfficeBuilding, Calendar, Setting } from '@element-plus/icons-vue'
import { searchDevices } from '@/api/visitor'

const router = useRouter()
const route = useRoute()

const CLASS_ID = 3

const styleTabs = [
    { styleId: null, name: '全部', icon: Setting },
    { styleId: 31, name: '设计与研发', icon: Document },
    { styleId: 32, name: '生产与制造', icon: Cpu },
    { styleId: 33, name: '运营与服务', icon: TrendCharts },
]

const styleTypesMap = {
    31: [
        { typeId: null, name: '全部' },
        { typeId: 311, name: '智能生产' },
        { typeId: 312, name: '流程管理' },
    ],
    32: [
        { typeId: null, name: '全部' },
        { typeId: 321, name: '供应链协同' },
        { typeId: 322, name: '远程运维' },
    ],
    33: [
        { typeId: null, name: '全部' },
        { typeId: 331, name: '数据驱动' },
    ],
}

const typeNameMap = Object.fromEntries(
    Object.values(styleTypesMap)
        .flat()
        .filter(t => t.typeId !== null)
        .map(t => [t.typeId, t.name])
)

const activeStyleId = ref(null)
const activeTypeId = ref(null)
const loading = ref(false)
const list = ref([])

const currentTypes = computed(() => {
    return activeStyleId.value !== null
        ? (styleTypesMap[activeStyleId.value] ?? [])
        : []
})

function selectStyle(styleId) {
    activeStyleId.value = styleId
    activeTypeId.value = null

    router.replace({
        path: route.path,
        query: styleId !== null ? { style: styleId } : {}
    })
}

function selectType(typeId) {
    activeTypeId.value = typeId

    const q = {}
    if (activeStyleId.value !== null) q.style = activeStyleId.value
    if (typeId !== null) q.type = typeId
    router.replace({ path: route.path, query: q })
}

function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function fetchList() {
    loading.value = true
    list.value = []
    try {
        const params = { classId: CLASS_ID }
        if (activeStyleId.value !== null) params.styleId = activeStyleId.value
        if (activeTypeId.value !== null) params.typeId = activeTypeId.value
        const res = await searchDevices(params)
        list.value = res.body ?? []
    } catch (e) {
        // ignore
    } finally {
        loading.value = false
    }
}

function openItem(item) {
    router.push(`/portal/device/${item.id}`)
}

watch([activeStyleId, activeTypeId], fetchList)

onMounted(() => {
    if (route.query.style) activeStyleId.value = Number(route.query.style)
    if (route.query.type) activeTypeId.value = Number(route.query.type)
    fetchList()
})
</script>

<style scoped>
.cases-page {
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

.level2-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.l2-tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 11px 24px;
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

.l2-tab:hover {
    border-color: #1677ff;
    color: #1677ff;
    background: #f0f6ff;
}

.l2-tab-active {
    background: #1677ff !important;
    border-color: #1677ff !important;
    color: #fff !important;
    box-shadow: 0 4px 14px rgba(22, 119, 255, 0.32);
}

.tab-icon {
    font-size: 15px;
}

.level3-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    background: #f0f6ff;
    border: 1.5px solid #d0e4fc;
    border-radius: 10px;
    padding: 12px 20px;
}

.l3-label {
    font-size: 13px;
    color: #8a9ab8;
    white-space: nowrap;
    margin-right: 4px;
}

.l3-tab {
    padding: 6px 18px;
    border-radius: 20px;
    font-size: 13px;
    color: #3a5a9a;
    background: #fff;
    border: 1px solid #c5d8fc;
    cursor: pointer;
    transition: all 0.18s;
    user-select: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.l3-tab:hover {
    background: #e0eeff;
    border-color: #1677ff;
    color: #1677ff;
}

.l3-tab-active {
    background: #1677ff !important;
    border-color: #1677ff !important;
    color: #fff !important;
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.28);
}

.type-slide-enter-active {
    transition: all 0.25s cubic-bezier(.22, .68, 0, 1.2);
}

.type-slide-leave-active {
    transition: all 0.18s ease;
}

.type-slide-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.type-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.content-area {
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
    min-height: 300px;
}

.case-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

.case-card {
    border: 1px solid #e8eef8;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.22s;
    background: #fafbff;
    display: flex;
    flex-direction: column;
}

.case-card:hover {
    border-color: #1677ff;
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.13);
    transform: translateY(-3px);
}

.card-cover {
    height: 110px;
    background: linear-gradient(135deg, #c8dffe 0%, #e8f0fe 100%);
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
}

.cover-icon {
    font-size: 42px;
    color: #4a8ad4;
}

.type-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(22, 119, 255, 0.85);
    color: #fff;
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
}

.card-body {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    flex: 1;
}

.card-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #0e2044;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
}

.card-desc {
    margin: 0;
    font-size: 13px;
    color: #5c6b8a;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.55;
    flex: 1;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #8a9ab8;
    padding-top: 8px;
    border-top: 1px solid #e8eef8;
    gap: 8px;
}

.footer-unit,
.footer-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.footer-date {
    flex-shrink: 0;
}

.skeleton-wrap {
    padding: 16px;
    background: #fafbff;
    border: 1px solid #e8eef8;
    border-radius: 12px;
}

.empty-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 0;
}

@media (max-width: 1100px) {
    .case-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 720px) {
    .case-grid {
        grid-template-columns: 1fr;
    }

    .content-area {
        padding: 20px 16px;
    }

    .l2-tab {
        padding: 8px 16px;
        font-size: 13px;
    }
}
</style>
