<template>
  <div class="logs-container">
    <el-card>
      <!-- 只保留导入日志标签页 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="导入日志" name="import">
          <template #label>
            <span class="tab-label">
              <el-icon><Upload /></el-icon>
              导入日志
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索筛选栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :shortcuts="dateShortcuts"
              clearable
            />
          </el-form-item>

          <el-form-item label="操作人">
            <el-input
              v-model="searchForm.userName"
              placeholder="请输入操作人"
              clearable
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="文件名/日志内容"
              clearable
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button type="success" disabled>
              <el-icon><Download /></el-icon>
              导出 (开发中)
            </el-button>
            <el-button type="danger" disabled>
              <el-icon><Delete /></el-icon>
              清空日志 (开发中)
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 导入日志表格 -->
      <el-table
        :data="logList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="logTime" label="导入时间" width="180" sortable />
        <el-table-column prop="userName" label="操作人员" width="120" />
        <el-table-column prop="dataCount" label="数据量" width="100" align="center" />
        <el-table-column prop="successCount" label="成功数量" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #67c23a">{{ row.successCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failCount" label="失败数量" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c">{{ row.failCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.failCount === 0 ? 'success' : 'warning'">
              {{ row.failCount === 0 ? '成功' : '部分失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logContent" label="日志内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewLogDetail(row)">详情</el-button>
            <el-button type="danger" link @click="deleteLogItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div class="batch-actions" v-if="selectedRows.length > 0">
          <span class="selected-info">已选择 {{ selectedRows.length }} 条日志</span>
          <el-button type="danger" plain @click="batchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchLogList"
          @current-change="fetchLogList"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="800px" destroy-on-close>
      <div class="log-detail">
        <pre>{{ currentLogDetail }}</pre>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyLogDetail" v-if="currentLogDetail">
          复制内容
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Delete, Upload } from '@element-plus/icons-vue'
import { getLogList, deleteLog, batchDeleteLogs } from '@/api/log'

// 标签页
const activeTab = ref('import')

// 搜索表单
const searchForm = reactive({
  userName: '',
  keyword: ''
})
const dateRange = ref([])

// 分页数据
const logList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])

// 详情
const detailVisible = ref(false)
const currentLogDetail = ref('')

// 日期快捷选项
const dateShortcuts = [
  { text: '今天', value: () => getDateRange('today') },
  { text: '最近7天', value: () => getDateRange('week') },
  { text: '最近30天', value: () => getDateRange('month') },
  { text: '本月', value: () => getDateRange('thisMonth') }
]

const getDateRange = (type) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  switch (type) {
    case 'today':
      return [today, end]
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return [weekStart, end]
    case 'month':
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      return [monthStart, end]
    case 'thisMonth':
      const monthFirst = new Date(now.getFullYear(), now.getMonth(), 1)
      return [monthFirst, end]
    default:
      return []
  }
}

// 数据映射
const mapLogItem = (item) => {
  const dataCount = item.csvEnterNumber || 0
  const successCount = item.csvEnterSuccessNumber || 0
  const failCount = dataCount - successCount
  return {
    id: item.id,
    logTime: item.csvEnterLogsTime,
    userName: item.csvEnterUserName,
    fileName: item.csvEnterLogs || '未知文件',
    dataCount: dataCount,
    successCount: successCount,
    failCount: failCount,
    logContent: item.csvEnterLogs || '',
    rawData: item
  }
}

// 获取日志列表
const fetchLogList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      startTime: dateRange.value?.[0] || null,
      endTime: dateRange.value?.[1] || null,
      userName: searchForm.userName || null,
      keyword: searchForm.keyword || null
    }
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') delete params[key]
    })

    const res = await getLogList(params)
    if (res.code === 200) {
      if (res.data && typeof res.data.total !== 'undefined' && Array.isArray(res.data.records)) {
        total.value = res.data.total
        logList.value = res.data.records.map(mapLogItem)
      } else if (Array.isArray(res.data)) {
        logList.value = res.data.map(mapLogItem)
        total.value = res.data.length
      } else {
        logList.value = []
        total.value = 0
      }
    } else {
      ElMessage.error(res.message || '获取日志失败')
      logList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取日志列表失败:', error)
    ElMessage.error('请求失败，请检查网络')
    logList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索与重置
const handleSearch = () => {
  pageNum.value = 1
  fetchLogList()
}
const resetSearch = () => {
  searchForm.userName = ''
  searchForm.keyword = ''
  dateRange.value = []
  handleSearch()
}

// 详情
const viewLogDetail = (row) => {
  currentLogDetail.value = JSON.stringify(row.rawData, null, 2)
  detailVisible.value = true
}
const copyLogDetail = async () => {
  try {
    await navigator.clipboard.writeText(currentLogDetail.value)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 多选
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 删除单条
const deleteLogItem = (row) => {
  ElMessageBox.confirm('确定要删除这条日志吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteLog(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await refreshAfterDelete()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 批量删除
const batchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的日志')
    return
  }
  const ids = selectedRows.value.map(row => row.id)
  ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 条日志吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await batchDeleteLogs(ids)
      if (res.code === 200) {
        ElMessage.success(`成功删除 ${ids.length} 条日志`)
        selectedRows.value = []
        await refreshAfterDelete()
      } else {
        ElMessage.error(res.message || '批量删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}

// 删除后刷新（处理页码）
const refreshAfterDelete = async () => {
  await fetchLogList()
  if (logList.value.length === 0 && pageNum.value > 1) {
    pageNum.value--
    await fetchLogList()
  }
}

onMounted(() => {
  fetchLogList()
})
</script>

<style scoped>
.logs-container {
  padding: 20px;
}
.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-bar {
  margin: 16px 0 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.selected-info {
  font-size: 14px;
  color: #409EFF;
}
.log-detail {
  max-height: 500px;
  overflow: auto;
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}
.log-detail pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>