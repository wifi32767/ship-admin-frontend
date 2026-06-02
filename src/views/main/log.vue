<template>
  <div class="logs-container">
    <!-- 日志类型标签页 -->
    <el-card>
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="导入日志" name="import">
          <template #label>
            <span class="tab-label">
              <el-icon><Upload /></el-icon>
              导入日志
              <el-badge :value="importUnreadCount" :hidden="importUnreadCount === 0" class="badge" />
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="爬虫运行日志" name="spider">
          <template #label>
            <span class="tab-label">
              <el-icon><Monitor /></el-icon>
              爬虫运行日志
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
            />
          </el-form-item>

          <el-form-item label="操作人" v-if="activeTab !== 'spider'">
            <el-input
              v-model="searchForm.operator"
              placeholder="请输入操作人"
              clearable
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option v-if="activeTab === 'spider'" label="无需录入" value="skipped" />
              <el-option v-else label="运行中" value="running" />
            </el-select>
          </el-form-item>

          <el-form-item label="关键词" v-if="activeTab === 'import' || activeTab === 'spider'">
            <el-input
              v-model="searchForm.keyword"
              placeholder="文件名/日志内容"
              clearable
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="模型名称" v-if="false && activeTab === 'spider'">
            <el-select
              v-model="searchForm.modelId"
              placeholder="请选择爬虫模型"
              clearable
              filterable
              style="width: 180px"
            >
              <el-option
                v-for="item in modelList"
                :key="item.mReptileModelId"
                :label="item.mReptileModelName"
                :value="item.mReptileModelId"
              />
            </el-select>
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
            <el-button v-if="activeTab !== 'spider'" type="success" @click="exportLogs" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="danger" @click="clearLogs" v-if="hasClearPermission && activeTab !== 'spider'">
              <el-icon><Delete /></el-icon>
              清空日志
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志统计卡片 -->
      <el-row :gutter="20" class="stats-row" v-if="activeTab === 'import'">
        <el-col :span="6">
          <el-statistic title="今日新增" :value="todayCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本周新增" :value="weekCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月新增" :value="monthCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="成功率" :value="successRate + '%'" />
        </el-col>
      </el-row>

      <!-- 导入日志表格 -->
      <el-table
        v-if="activeTab === 'import'"
        :data="logList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="logTime" label="导入时间" width="180" sortable />
        <el-table-column prop="userName" label="操作人员" width="120" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
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
            <el-button type="danger" link @click="deleteLog(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 爬虫运行日志表格 -->
      <el-table
        v-else-if="activeTab === 'spider'"
        :data="logList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="runTime" label="运行时间" width="180" sortable />
        <el-table-column prop="modelName" label="模型名称" width="150" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRunStateType(row.runState)">
              {{ getRunStateText(row.runState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resultDesc" label="结果描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="csvAddress" label="CSV文件" width="150">
          <template #default="{ row }">
            <el-button
              v-if="row.csvAddress"
              type="primary"
              link
              @click="downloadCsv(row.csvAddress)"
            >
              下载
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="录入状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.entryState === '已录入' ? 'success' : 'info'" size="small">
              {{ row.entryState || '未录入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entryTime" label="录入时间" width="160" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewLogDetail(row)">详情</el-button>
            <el-button
              v-if="false && row.entryState !== '已录入' && row.csvAddress"
              type="success"
              link
              @click="importToDatabase(row)"
            >
              录入
            </el-button>
            <el-button type="danger" link @click="deleteLog(row)">删除</el-button>
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
    <el-dialog
      v-model="detailVisible"
      :title="'日志详情'"
      width="800px"
      destroy-on-close
    >
      <div class="log-detail">
        <pre>{{ currentLogDetail }}</pre>
      </div>
      <template #footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyLogDetail" v-if="currentLogDetail">
          复制内容
        </el-button>
      </template>
    </el-dialog>

    <!-- 清空日志确认对话框 -->
    <el-dialog v-model="clearConfirmVisible" title="清空日志" width="500px">
      <el-alert
        title="警告"
        type="warning"
        description="清空日志操作不可恢复，请确认是否继续？"
        show-icon
        :closable="false"
      />
      <div class="clear-options" style="margin-top: 20px">
        <el-radio-group v-model="clearType">
          <el-radio label="all">清空所有日志</el-radio>
          <el-radio label="before">清空指定日期前日志</el-radio>
        </el-radio-group>
        <el-date-picker
          v-if="clearType === 'before'"
          v-model="clearBeforeDate"
          type="datetime"
          placeholder="选择日期"
          format="YYYY-MM-DD HH:mm:ss"
          style="margin-top: 12px; width: 100%"
        />
      </div>
      <template #footer">
        <el-button @click="clearConfirmVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmClear">确认清空</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Delete, Upload, Edit, Monitor, Setting, Cpu } from '@element-plus/icons-vue'
import {
  getImportLogs,
  getOperationLogs,
  getSpiderLogs,
  getSystemLogs,
  getLlmLogs,
  deleteLog as deleteLogApi,
  batchDeleteLogs,
  clearLogs as clearLogsApi,
  exportLogs as exportLogsApi,
  getLogStatistics,
  getModelList,
  importCsvToDatabase,
  downloadCsvFile,
  submitLlmFeedback
} from '@/api/log'

// 当前标签页
const activeTab = ref('import')

// 搜索表单
const searchForm = reactive({
  operator: '',
  status: '',
  keyword: '',
  modelId: ''
})
const dateRange = ref([])

// 列表数据
const logList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])

// 统计数据
const todayCount = ref(0)
const weekCount = ref(0)
const monthCount = ref(0)
const successRate = ref(0)

// 未读计数
const importUnreadCount = ref(0)

// 爬虫模型列表
const modelList = ref([])
const modelNameById = computed(() => {
  const map = new Map()
  modelList.value.forEach(item => {
    map.set(String(item.mReptileModelId), item.mReptileModelName)
  })
  return map
})

const resolveModelName = (row) => {
  const modelId = row.modelLogId || row.modelId || row.model_log_id
  if (modelId !== undefined && modelId !== null && modelNameById.value.has(String(modelId))) {
    return modelNameById.value.get(String(modelId))
  }
  return row.modelName || (modelId ? `模型 ${modelId}` : '-')
}

// 导出状态
const exporting = ref(false)

// 详情对话框
const detailVisible = ref(false)
const currentLogDetail = ref('')

// 反馈对话框
const feedbackVisible = ref(false)
const feedbackForm = reactive({
  logId: null,
  sqlCorrect: true,
  satisfaction: 5,
  suggestion: ''
})

// 清空确认
const clearConfirmVisible = ref(false)
const clearType = ref('all')
const clearBeforeDate = ref('')

// 是否有清空权限（根据用户角色判断）
const hasClearPermission = computed(() => {
  const userRole = localStorage.getItem('userRole')
  return userRole === 'admin'
})

// 日期快捷选项
const dateShortcuts = [
  { text: '今天', value: () => getDateRange('today') },
  { text: '最近7天', value: () => getDateRange('week') },
  { text: '最近30天', value: () => getDateRange('month') },
  { text: '本月', value: () => getDateRange('thisMonth') }
]

// 获取日期范围
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

// 操作类型映射
const getOperationTypeTag = (type) => {
  const map = {
    'create': 'success',
    'update': 'primary',
    'delete': 'danger',
    'query': 'info',
    'export': 'warning'
  }
  return map[type] || 'info'
}

const getOperationTypeText = (type) => {
  const map = {
    'create': '新增',
    'update': '修改',
    'delete': '删除',
    'query': '查询',
    'export': '导出'
  }
  return map[type] || type
}

// 爬虫运行状态
const getRunStateType = (state) => {
  const map = {
    'success': 'success',
    'failed': 'danger',
    'error': 'danger',
    'skipped': 'info',
    'running': 'warning',
    'unknown': 'info'
  }
  return map[state] || 'info'
}

const getRunStateText = (state) => {
  const map = {
    'success': '成功',
    'failed': '失败',
    'error': '失败',
    'skipped': '无需录入',
    'running': '运行中',
    'unknown': '未知'
  }
  return map[state] || state
}

// 日志级别
const getLevelType = (level) => {
  const map = {
    'ERROR': 'danger',
    'WARN': 'warning',
    'INFO': 'info',
    'DEBUG': 'info'
  }
  return map[level] || 'info'
}

// 获取日志列表
const fetchLogList = async () => {
  loading.value = true
  try {
    let res
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      startTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1],
      ...searchForm
    }

    switch (activeTab.value) {
      case 'import':
        res = await getImportLogs(params)
        break
      case 'operation':
        res = await getOperationLogs(params)
        break
      case 'spider':
        res = await getSpiderLogs(params)
        break
      case 'system':
        res = await getSystemLogs(params)
        break
      case 'llm':
        res = await getLlmLogs(params)
        break
      default:
        return
    }

    if (res.code === 200 && res.data) {
      const records = res.data.records || []
      if (activeTab.value === 'spider') {
        logList.value = records.map(row => ({
          ...row,
          modelName: resolveModelName(row)
        }))
      } else {
        logList.value = records
      }
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取日志列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await getLogStatistics({ logType: activeTab.value })
    if (res.code === 200 && res.data) {
      todayCount.value = res.data.todayCount || 0
      weekCount.value = res.data.weekCount || 0
      monthCount.value = res.data.monthCount || 0
      successRate.value = res.data.successRate || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取爬虫模型列表
const fetchModelList = async () => {
  try {
    const res = await getModelList()
    if (res.code === 200 && res.data) {
      modelList.value = res.data.records || []
      if (activeTab.value === 'spider' && logList.value.length > 0) {
        logList.value = logList.value.map(row => ({
          ...row,
          modelName: resolveModelName(row)
        }))
      }
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}

// 标签页切换
const handleTabChange = () => {
  pageNum.value = 1
  resetSearch()
  fetchLogList()
  if (activeTab.value === 'import' || activeTab.value === 'operation') {
    fetchStatistics()
  }
  if (activeTab.value === 'spider') {
    fetchModelList()
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  fetchLogList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.operator = ''
  searchForm.status = ''
  searchForm.keyword = ''
  searchForm.modelId = ''
  dateRange.value = []
  handleSearch()
}

// 导出日志
const exportLogs = async () => {
  exporting.value = true
  try {
    const params = {
      logType: activeTab.value,
      startTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1],
      ...searchForm
    }
    const res = await exportLogsApi(params)
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `${activeTab.value}_logs_${new Date().getTime()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 清空日志
const clearLogs = () => {
  clearConfirmVisible.value = true
}

const confirmClear = async () => {
  try {
    const params = {
      logType: activeTab.value,
      modelId: searchForm.modelId,
      clearType: clearType.value,
      beforeDate: clearType.value === 'before' ? clearBeforeDate.value : null
    }
    const res = await clearLogsApi(params)
    if (res.code === 200) {
      ElMessage.success(`成功清空 ${res.data} 条日志`)
      clearConfirmVisible.value = false
      fetchLogList()
      if (activeTab.value === 'import' || activeTab.value === 'operation') {
        fetchStatistics()
      }
    } else {
      ElMessage.error(res.message || '清空失败')
    }
  } catch (error) {
    console.error('清空失败:', error)
    ElMessage.error('清空失败')
  }
}

// 查看日志详情
const viewLogDetail = (row) => {
  currentLogDetail.value = JSON.stringify(row, null, 2)
  detailVisible.value = true
}

// 复制日志详情
const copyLogDetail = async () => {
  try {
    await navigator.clipboard.writeText(currentLogDetail.value)
    ElMessage.success('复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 删除单条日志
const deleteLog = (row) => {
  ElMessageBox.confirm('确定要删除这条日志吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteLogApi({
        logType: activeTab.value,
        logId: row.logId || row.id
      })
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchLogList()
        if (activeTab.value === 'import' || activeTab.value === 'operation') {
          fetchStatistics()
        }
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

  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条日志吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.logId || row.id)
      const res = await batchDeleteLogs({
        logType: activeTab.value,
        ids
      })
      if (res.code === 200) {
        ElMessage.success(`成功删除 ${res.data} 条日志`)
        fetchLogList()
        if (activeTab.value === 'import' || activeTab.value === 'operation') {
          fetchStatistics()
        }
        selectedRows.value = []
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 下载CSV文件
const downloadCsv = async (csvAddress) => {
  try {
    const res = await downloadCsvFile(csvAddress)
    const blob = new Blob([res], { type: 'text/csv' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = csvAddress.split('/').pop()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 导入数据库
const importToDatabase = async (row) => {
  ElMessageBox.confirm('确定要将CSV数据导入数据库吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await importCsvToDatabase({
        logId: row.logId,
        csvAddress: row.csvAddress
      })
      if (res.code === 200) {
        ElMessage.success('导入成功')
        fetchLogList()
      } else {
        ElMessage.error(res.message || '导入失败')
      }
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败')
    }
  }).catch(() => {})
}

// 大模型反馈
const provideFeedback = (row) => {
  feedbackForm.logId = row.logId || row.id
  feedbackForm.sqlCorrect = row.sqlValid !== false
  feedbackForm.satisfaction = 5
  feedbackForm.suggestion = ''
  feedbackVisible.value = true
}

const submitFeedback = async () => {
  try {
    const res = await submitLlmFeedback(feedbackForm)
    if (res.code === 200) {
      ElMessage.success('反馈提交成功，感谢您的建议！')
      feedbackVisible.value = false
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交失败')
  }
}

// 监听日期范围变化
watch(dateRange, () => {
  handleSearch()
})

onMounted(() => {
  fetchLogList()
  fetchStatistics()
  fetchModelList()
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

.badge {
  margin-left: 8px;
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

.stats-row {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
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

.slow {
  color: #f56c6c;
}

.clear-options {
  padding: 12px;
}
</style>