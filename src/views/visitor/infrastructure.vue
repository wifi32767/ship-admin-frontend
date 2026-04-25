<template>
    <div class="infra-page">

        <!-- ===== 页头 ===== -->
        <div class="page-head">
            <div>
                <span class="en-label">INFRASTRUCTURE</span>
                <h1 class="page-title">基础设施建设信息</h1>
            </div>
            <p class="page-desc">涵盖硬件设备、软件系统、网络平台及绿色安全等船舶制造业基础设施建设信息。</p>
        </div>

        <!-- ===== 二级 Tab（device_style）===== -->
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

        <!-- ===== 三级 Tab（device_type）—— 选中二级后滑出 ===== -->
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

        <!-- ===== 内容区 ===== -->
        <div class="content-area">

            <div v-if="loading" class="infra-grid">
                <div v-for="i in 6" :key="i" class="infra-card skeleton-wrap">
                    <el-skeleton animated :rows="3" />
                </div>
            </div>

            <div v-else-if="list.length" class="infra-grid">
                <div
                    v-for="item in list"
                    :key="item.id"
                    class="infra-card"
                    @click="openItem(item)"
                >
                    <!-- 顶部图片或图标 -->
                    <div
                        class="card-cover"
                        :style="item.deviceImg ? `background-image:url(${item.deviceImg})` : ''"
                    >
                        <el-icon v-if="!item.deviceImg" class="cover-icon">
                            <component :is="coverIcon(item.deviceStyleId)" />
                        </el-icon>
                        <!-- 三级类型标签 -->
                        <span v-if="typeNameMap[item.deviceTypeId]" class="type-badge">
                            {{ typeNameMap[item.deviceTypeId] }}
                        </span>
                    </div>

                    <!-- 卡片主体 -->
                    <div class="card-body">
                        <h3 class="card-name">{{ item.deviceName }}</h3>

                        <div v-if="item.deviceLocation" class="card-location">
                            <el-icon><Location /></el-icon>{{ item.deviceLocation }}
                        </div>

                        <p class="card-desc">{{ item.deviceIntroduce || '暂无介绍' }}</p>

                        <div class="card-footer">
                            <span v-if="item.deviceUseYear" class="footer-year">
                                <el-icon><Calendar /></el-icon>{{ item.deviceUseYear }} 年
                            </span>
                            <span v-if="item.deviceUsingUnit" class="footer-unit">
                                {{ item.deviceUsingUnit }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="empty-wrap">
                <el-empty description="暂无相关基础设施信息" :image-size="100" />
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    Cpu, Monitor, Share, CircleCheck,  // 二级图标
    Setting, DataLine, Connection,
    Location, Calendar, OfficeBuilding
} from '@element-plus/icons-vue'
import { searchDevices } from '@/api/visitor'

const router = useRouter()
const route = useRoute()

// 基础设施 classId = 2
const CLASS_ID = 2

// ===== 二级分类（device_style，class_id = 2）=====
// TODO: 可改为从 /api/class/list 动态获取
const styleTabs = [
    { styleId: null, name: '全部',             icon: Setting    },
    { styleId: 21,   name: '硬件基础设施',      icon: Cpu        },
    { styleId: 22,   name: '软件基础设施',      icon: Monitor    },
    { styleId: 23,   name: '网络基础设施',      icon: Share      },
    { styleId: 24,   name: '绿色与安全基础设施', icon: CircleCheck },
]

// ===== 三级分类（device_type）按 styleId 映射 =====
// TODO: 可改为从 /api/class/list 动态获取
const styleTypesMap = {
    21: [
        { typeId: null, name: '全部' },
        { typeId: 211,  name: '智能设备' },
        { typeId: 212,  name: '船厂硬件优化' },
    ],
    22: [
        { typeId: null, name: '全部' },
        { typeId: 221,  name: '管理系统' },
        { typeId: 222,  name: '数据管理' },
    ],
    23: [
        { typeId: null, name: '全部' },
        { typeId: 231,  name: '工业网络' },
        { typeId: 232,  name: '数据平台' },
    ],
    24: [
        { typeId: null, name: '全部' },
        { typeId: 241,  name: '绿色动力' },
        { typeId: 242,  name: '安全防护' },
    ],
}

// typeId → 名称（用于卡片角标）
const typeNameMap = Object.fromEntries(
    Object.values(styleTypesMap).flat()
        .filter(t => t.typeId !== null)
        .map(t => [t.typeId, t.name])
)

// 二级图标复用到卡片封面
const styleIconMap = { 21: Cpu, 22: Monitor, 23: Share, 24: CircleCheck }
function coverIcon(styleId) {
    return styleIconMap[styleId] ?? OfficeBuilding
}

// ===== 状态 =====
const activeStyleId = ref(null)
const activeTypeId  = ref(null)
const loading = ref(false)
const list = ref([])

// 当前可见的三级 Tab 列表
const currentTypes = computed(() => {
    return activeStyleId.value !== null
        ? (styleTypesMap[activeStyleId.value] ?? [])
        : []
})

// ===== 操作 =====
function selectStyle(styleId) {
    activeStyleId.value = styleId
    activeTypeId.value  = null   // 切换二级时重置三级

    router.replace({
        path: route.path,
        query: styleId !== null ? { style: styleId } : {}
    })
}

function selectType(typeId) {
    activeTypeId.value = typeId

    const q = {}
    if (activeStyleId.value !== null) q.style = activeStyleId.value
    if (typeId !== null)              q.type  = typeId
    router.replace({ path: route.path, query: q })
}

async function fetchList() {
    loading.value = true
    list.value = []
    try {
        const params = { classId: CLASS_ID }
        if (activeStyleId.value !== null) params.styleId = activeStyleId.value
        if (activeTypeId.value  !== null) params.typeId  = activeTypeId.value
        const res = await searchDevices(params)
        list.value = res.body ?? []
    } catch (e) {
        // ignore
    } finally {
        loading.value = false
    }
}

function openItem(item) {
    // TODO: 跳转到设备详情页
    router.push(`/portal/device/${item.id}`)
}

// 二级或三级变化时重新请求
watch([activeStyleId, activeTypeId], fetchList)

onMounted(() => {
    // 从 URL 恢复选中状态
    if (route.query.style) activeStyleId.value = Number(route.query.style)
    if (route.query.type)  activeTypeId.value  = Number(route.query.type)
    fetchList()
})
</script>

<style scoped>
.infra-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
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

/* ===== 二级 Tab ===== */
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
.tab-icon { font-size: 15px; }

/* ===== 三级 Tab（滑出动画）===== */
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

/* 滑出/淡入动画 */
.type-slide-enter-active { transition: all 0.25s cubic-bezier(.22,.68,0,1.2); }
.type-slide-leave-active { transition: all 0.18s ease; }
.type-slide-enter-from  { opacity: 0; transform: translateY(-10px); }
.type-slide-leave-to    { opacity: 0; transform: translateY(-6px); }

/* ===== 内容区 ===== */
.content-area {
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 2px 12px rgba(0, 30, 80, 0.07);
    min-height: 300px;
}

.infra-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

/* 卡片 */
.infra-card {
    border: 1px solid #e8eef8;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.22s;
    background: #fafbff;
    display: flex;
    flex-direction: column;
}
.infra-card:hover {
    border-color: #1677ff;
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.13);
    transform: translateY(-3px);
}

/* 封面 */
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
.cover-icon { font-size: 42px; color: #4a8ad4; }

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

/* 卡片主体 */
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
    -webkit-box-orient: vertical;
    line-height: 1.4;
}

.card-location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #1677ff;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card-desc {
    margin: 0;
    font-size: 13px;
    color: #5c6b8a;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
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
    gap: 6px;
}

.footer-year {
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
}

.footer-unit {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: right;
    flex: 1;
}

/* 骨架 & 空状态 */
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

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
    .infra-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
    .infra-grid { grid-template-columns: 1fr; }
    .content-area { padding: 20px 16px; }
    .l2-tab { padding: 8px 16px; font-size: 13px; }
}
</style>
