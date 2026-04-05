<template>
  <div class="model-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">爬虫模型管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增模型
          </el-button>
        </div>
      </template>

      <!-- 模型列表 -->
      <el-table :data="modelList" stripe v-loading="loading" row-key="mReptileModelId">
        <el-table-column prop="mReptileModelName" label="模型名称" min-width="150" />
        <el-table-column prop="mReptileModelIntroduce" label="模型介绍" min-width="200" show-overflow-tooltip />
        <el-table-column prop="mReptileModelWeb" label="目标网址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link :href="row.mReptileModelWeb" target="_blank" type="primary">
              {{ row.mReptileModelWeb }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="mReptileModelState" label="运行状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStateType(row.mReptileModelState)">
              {{ getStateText(row.mReptileModelState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mReptileModelTime" label="录入时间" width="160" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editModel(row)">
              编辑
            </el-button>
            <el-button
              :type="row.mReptileModelState === 'running' ? 'warning' : 'success'"
              link
              @click="toggleModel(row)"
            >
              {{ row.mReptileModelState === 'running' ? '停止' : '启动' }}
            </el-button>
            <el-button type="info" link @click="viewLogs(row)">
              查看日志
            </el-button>
            <el-button type="danger" link @click="deleteModel(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchModelList"
        @current-change="fetchModelList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      destroy-on-close
      @close="closeDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="模型名称" prop="mReptileModelName">
          <el-input
            v-model="formData.mReptileModelName"
            placeholder="请输入模型名称，如：船舶行业动态爬虫"
            maxlength="255"
          />
        </el-form-item>

        <el-form-item label="模型介绍" prop="mReptileModelIntroduce">
          <el-input
            v-model="formData.mReptileModelIntroduce"
            type="textarea"
            :rows="3"
            placeholder="请输入模型功能描述"
          />
        </el-form-item>

        <el-form-item label="目标网址" prop="mReptileModelWeb">
          <el-input
            v-model="formData.mReptileModelWeb"
            placeholder="请输入要爬取的目标网站URL"
          />
          <div class="form-tip">支持多个网址，用英文分号(;)分隔</div>
        </el-form-item>

        <el-form-item label="爬虫脚本" prop="scriptFile">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleScriptChange"
            :on-remove="handleScriptRemove"
            accept=".py"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择Python脚本文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 .py 格式，脚本需遵循爬虫规范接口
              </div>
            </template>
          </el-upload>
          <div v-if="formData.existingScript" class="existing-file">
            <el-icon><Document /></el-icon>
            <span>当前脚本：{{ formData.existingScript }}</span>
            <el-button type="danger" link @click="removeExistingScript">
              删除
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="启动文件" prop="startupFile">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleStartupChange"
            :on-remove="handleStartupRemove"
            accept=".py"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择启动文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                爬虫的入口启动文件，需包含 main 函数
              </div>
            </template>
          </el-upload>
          <div v-if="formData.existingStartup" class="existing-file">
            <el-icon><Document /></el-icon>
            <span>当前启动文件：{{ formData.existingStartup }}</span>
            <el-button type="danger" link @click="removeExistingStartup">
              删除
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">关键词配置</el-divider>

        <el-form-item label="关键词列表" prop="keywords">
          <div class="keyword-container">
            <el-tag
              v-for="(keyword, index) in formData.keywords"
              :key="index"
              closable
              :disable-transitions="false"
              @close="removeKeyword(index)"
              class="keyword-tag"
            >
              {{ keyword.keywordName }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="keywordInputRef"
              v-model="inputKeyword"
              class="keyword-input"
              size="small"
              @keyup.enter="addKeyword"
              @blur="addKeyword"
            />
            <el-button v-else class="add-keyword-btn" size="small" @click="showKeywordInput">
              + 添加关键词
            </el-button>
          </div>
          <div class="form-tip">关键词用于定向爬取相关内容，支持增量爬虫</div>
        </el-form-item>

        <el-form-item label="增量爬虫时间" prop="incrementalSpiderTime">
          <el-date-picker
            v-model="formData.incrementalSpiderTime"
            type="datetime"
            placeholder="选择增量爬虫起始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <div class="form-tip">设置后，爬虫将只抓取该时间之后更新的内容</div>
        </el-form-item>

        <el-form-item label="定时任务" prop="cronExpression">
          <el-input
            v-model="formData.cronExpression"
            placeholder="如：0 0 8 * * ? (每天8点执行)"
          />
          <div class="form-tip">
            Cron表达式格式：秒 分 时 日 月 周
            <el-button type="primary" link @click="showCronHelp">Cron表达式说明</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveModel" :loading="saving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 运行日志对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="爬虫运行日志"
      width="900px"
    >
      <div class="log-controls">
        <el-radio-group v-model="logFilter" @change="fetchRunLogs" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="success">成功</el-radio-button>
          <el-radio-button label="failed">失败</el-radio-button>
          <el-radio-button label="running">运行中</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="refreshLogs">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button size="small" type="danger" @click="clearLogs">
          清空日志
        </el-button>
      </div>

      <el-table :data="runLogs" stripe v-loading="logLoading" max-height="500">
        <el-table-column prop="runTime" label="运行时间" width="160" />
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
        <el-table-column prop="entryState" label="录入状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.entryState === '已录入' ? 'success' : 'info'" size="small">
              {{ row.entryState || '未录入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entryTime" label="录入时间" width="160" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.entryState !== '已录入' && row.csvAddress"
              type="primary"
              link
              @click="importToDatabase(row)"
            >
              录入
            </el-button>
            <el-button type="info" link @click="viewLogDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="logPageNum"
        v-model:page-size="logPageSize"
        :total="logTotal"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchRunLogs"
        @current-change="fetchRunLogs"
        style="margin-top: 20px; justify-content: flex-end"
        size="small"
      />
    </el-dialog>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="logDetailVisible" title="日志详情" width="700px">
      <pre class="log-detail">{{ currentLogDetail }}</pre>
    </el-dialog>

    <!-- Cron表达式帮助对话框 -->
    <el-dialog v-model="cronHelpVisible" title="Cron表达式说明" width="600px">
      <div class="cron-help">
        <h4>格式说明</h4>
        <p>秒 分 时 日 月 周 (年)</p>
        <el-table :data="cronFields" border size="small">
          <el-table-column prop="field" label="字段" width="80" />
          <el-table-column prop="allowValues" label="允许值" />
          <el-table-column prop="specialChars" label="允许的特殊字符" />
        </el-table>

        <h4 style="margin-top: 20px">常用示例</h4>
        <el-table :data="cronExamples" border size="small">
          <el-table-column prop="expression" label="Cron表达式" width="200" />
          <el-table-column prop="description" label="说明" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Document, Refresh } from '@element-plus/icons-vue'
import {
  getModelList,
  getModelDetail,
  saveModel as saveModelApi,
  updateModel,
  deleteModel as deleteModelApi,
  startModel,
  stopModel,
  getRunLogs,
  clearRunLogs,
  importCsvToDatabase,
  downloadCsvFile
} from '@/api/model'

// 列表相关
const modelList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增模型')
const formRef = ref()
const uploadRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  mReptileModelId: null,
  mReptileModelName: '',
  mReptileModelIntroduce: '',
  mReptileModelWeb: '',
  mReptileModelScriptAddress: '',
  mReptileModelAddress: '',
  mReptileModelState: 'stopped',
  keywords: [],
  incrementalSpiderTime: '',
  cronExpression: ''
})

// 文件相关
const scriptFile = ref(null)
const startupFile = ref(null)

// 关键词相关
const inputVisible = ref(false)
const inputKeyword = ref('')
const keywordInputRef = ref()

// 表单验证规则
const formRules = {
  mReptileModelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
  ],
  mReptileModelWeb: [
    { required: true, message: '请输入目标网址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ]
}

// 日志相关
const logDialogVisible = ref(false)
const currentModelId = ref(null)
const currentModelName = ref('')
const runLogs = ref([])
const logLoading = ref(false)
const logFilter = ref('all')
const logPageNum = ref(1)
const logPageSize = ref(10)
const logTotal = ref(0)

// 日志详情
const logDetailVisible = ref(false)
const currentLogDetail = ref('')

// Cron帮助
const cronHelpVisible = ref(false)

// 状态映射
const getStateType = (state) => {
  if (state === 'running') return 'success'
  if (state === 'stopped') return 'info'
  if (state === 'error') return 'danger'
  return 'warning'
}

const getStateText = (state) => {
  const map = {
    'running': '运行中',
    'stopped': '已停止',
    'error': '异常'
  }
  return map[state] || state
}

const getRunStateType = (state) => {
  if (state === 'success') return 'success'
  if (state === 'failed') return 'danger'
  if (state === 'running') return 'warning'
  return 'info'
}

const getRunStateText = (state) => {
  const map = {
    'success': '成功',
    'failed': '失败',
    'running': '运行中'
  }
  return map[state] || state
}

// 获取模型列表
const fetchModelList = async () => {
  loading.value = true
  try {
    const res = await getModelList({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res.code === 200 && res.data) {
      modelList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
const showAddDialog = () => {
  dialogTitle.value = '新增模型'
  resetForm()
  dialogVisible.value = true
}

// 编辑模型
const editModel = async (row) => {
  dialogTitle.value = '编辑模型'
  dialogVisible.value = true

  try {
    const res = await getModelDetail(row.mReptileModelId)
    if (res.code === 200 && res.data) {
      const data = res.data
      formData.mReptileModelId = data.mReptileModelId
      formData.mReptileModelName = data.mReptileModelName
      formData.mReptileModelIntroduce = data.mReptileModelIntroduce || ''
      formData.mReptileModelWeb = data.mReptileModelWeb
      formData.mReptileModelState = data.mReptileModelState
      formData.keywords = data.keywords || []
      formData.incrementalSpiderTime = data.incrementalSpiderTime || ''
      formData.cronExpression = data.cronExpression || ''
      formData.existingScript = data.mReptileModelScriptAddress
      formData.existingStartup = data.mReptileModelAddress
    }
  } catch (error) {
    console.error('获取模型详情失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 重置表单
const resetForm = () => {
  formData.mReptileModelId = null
  formData.mReptileModelName = ''
  formData.mReptileModelIntroduce = ''
  formData.mReptileModelWeb = ''
  formData.mReptileModelState = 'stopped'
  formData.keywords = []
  formData.incrementalSpiderTime = ''
  formData.cronExpression = ''
  formData.existingScript = ''
  formData.existingStartup = ''
  scriptFile.value = null
  startupFile.value = null
  uploadRef.value?.clearFiles()
  formRef.value?.resetFields()
}

// 关闭对话框
const closeDialog = () => {
  resetForm()
}

// 脚本文件变化
const handleScriptChange = (file) => {
  scriptFile.value = file.raw
}

const handleScriptRemove = () => {
  scriptFile.value = null
}

// 启动文件变化
const handleStartupChange = (file) => {
  startupFile.value = file.raw
}

const handleStartupRemove = () => {
  startupFile.value = null
}

// 删除已有脚本
const removeExistingScript = () => {
  formData.existingScript = ''
}

// 删除已有启动文件
const removeExistingStartup = () => {
  formData.existingStartup = ''
}

// 关键词操作
const showKeywordInput = () => {
  inputVisible.value = true
  nextTick(() => {
    keywordInputRef.value?.focus()
  })
}

const addKeyword = () => {
  if (inputKeyword.value.trim()) {
    formData.keywords.push({
      keywordName: inputKeyword.value.trim(),
      useFlag: 1
    })
  }
  inputVisible.value = false
  inputKeyword.value = ''
}

const removeKeyword = (index) => {
  formData.keywords.splice(index, 1)
}

// 保存模型
const saveModel = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整信息')
      return
    }

    if (formData.keywords.length === 0) {
      ElMessage.warning('请至少添加一个关键词')
      return
    }

    saving.value = true

    try {
      const submitData = new FormData()
      submitData.append('mReptileModelId', formData.mReptileModelId || '')
      submitData.append('mReptileModelName', formData.mReptileModelName)
      submitData.append('mReptileModelIntroduce', formData.mReptileModelIntroduce)
      submitData.append('mReptileModelWeb', formData.mReptileModelWeb)
      submitData.append('incrementalSpiderTime', formData.incrementalSpiderTime || '')
      submitData.append('cronExpression', formData.cronExpression || '')
      submitData.append('keywords', JSON.stringify(formData.keywords))

      if (scriptFile.value) {
        submitData.append('scriptFile', scriptFile.value)
      }
      if (startupFile.value) {
        submitData.append('startupFile', startupFile.value)
      }

      const res = await saveModelApi(submitData)
      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchModelList()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  })
}

// 启动/停止模型
const toggleModel = async (row) => {
  const isRunning = row.mReptileModelState === 'running'
  const action = isRunning ? '停止' : '启动'

  ElMessageBox.confirm(`确定要${action}模型"${row.mReptileModelName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      let res
      if (isRunning) {
        res = await stopModel(row.mReptileModelId)
      } else {
        res = await startModel(row.mReptileModelId)
      }

      if (res.code === 200) {
        ElMessage.success(`${action}成功`)
        fetchModelList()
      } else {
        ElMessage.error(res.message || `${action}失败`)
      }
    } catch (error) {
      console.error(`${action}失败:`, error)
      ElMessage.error(`${action}失败`)
    }
  }).catch(() => {})
}

// 删除模型
const deleteModel = (row) => {
  ElMessageBox.confirm(`确定要删除模型"${row.mReptileModelName}"吗？此操作不可恢复。`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteModelApi(row.mReptileModelId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchModelList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 查看运行日志
const viewLogs = async (row) => {
  currentModelId.value = row.mReptileModelId
  currentModelName.value = row.mReptileModelName
  logPageNum.value = 1
  logDialogVisible.value = true
  await fetchRunLogs()
}

// 获取运行日志
const fetchRunLogs = async () => {
  logLoading.value = true
  try {
    const res = await getRunLogs({
      modelId: currentModelId.value,
      state: logFilter.value === 'all' ? '' : logFilter.value,
      pageNum: logPageNum.value,
      pageSize: logPageSize.value
    })
    if (res.code === 200 && res.data) {
      runLogs.value = res.data.records || []
      logTotal.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取运行日志失败:', error)
    ElMessage.error('获取日志失败')
  } finally {
    logLoading.value = false
  }
}

// 刷新日志
const refreshLogs = () => {
  fetchRunLogs()
}

// 清空日志
const clearLogs = () => {
  ElMessageBox.confirm(`确定要清空模型"${currentModelName.value}"的运行日志吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await clearRunLogs(currentModelId.value)
      if (res.code === 200) {
        ElMessage.success('清空成功')
        fetchRunLogs()
      } else {
        ElMessage.error(res.message || '清空失败')
      }
    } catch (error) {
      console.error('清空日志失败:', error)
      ElMessage.error('清空失败')
    }
  }).catch(() => {})
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
  ElMessageBox.confirm(`确定要将CSV数据导入数据库吗？`, '提示', {
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
        fetchRunLogs()
      } else {
        ElMessage.error(res.message || '导入失败')
      }
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败')
    }
  }).catch(() => {})
}

// 查看日志详情
const viewLogDetail = (row) => {
  currentLogDetail.value = JSON.stringify(row, null, 2)
  logDetailVisible.value = true
}

// Cron帮助
const showCronHelp = () => {
  cronHelpVisible.value = true
}

const cronFields = [
  { field: '秒', allowValues: '0-59', specialChars: ', - * /' },
  { field: '分', allowValues: '0-59', specialChars: ', - * /' },
  { field: '时', allowValues: '0-23', specialChars: ', - * /' },
  { field: '日', allowValues: '1-31', specialChars: ', - * / ? L W' },
  { field: '月', allowValues: '1-12 或 JAN-DEC', specialChars: ', - * /' },
  { field: '周', allowValues: '1-7 或 SUN-SAT', specialChars: ', - * / ? L #' }
]

const cronExamples = [
  { expression: '0 0 8 * * ?', description: '每天上午8点执行' },
  { expression: '0 0/30 9-17 * * ?', description: '每天9点到17点每30分钟执行' },
  { expression: '0 0 2 ? * MON', description: '每周一凌晨2点执行' },
  { expression: '0 0 0 1 * ?', description: '每月1号凌晨执行' }
]

onMounted(() => {
  fetchModelList()
})
</script>

<style scoped>
.model-management-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: bold;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.existing-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.keyword-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.keyword-tag {
  margin: 2px;
}

.keyword-input {
  width: 120px;
}

.add-keyword-btn {
  border-style: dashed;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.log-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.log-detail {
  max-height: 400px;
  overflow: auto;
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.cron-help h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  font-weight: bold;
}
</style>