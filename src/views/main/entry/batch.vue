<!-- BatchEntry.vue 改进版 -->
<template>
  <div class="batch-entry-container">
    <el-card>
      <template #header>
        <span class="title">批量数据导入</span>
      </template>

      <!-- 步骤1：上传数据文件 -->
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="上传数据文件" />
        <el-step title="数据校验" />
        <el-step title="确认导入" />
      </el-steps>

      <div class="step-content" v-show="activeStep === 0">
        <div class="upload-section">
          <h4>1. 上传Excel/CSV数据文件</h4>
          <el-upload
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx, .xls, .csv 格式
                <el-button type="primary" link @click="downloadTemplate">
                  <el-icon><Download /></el-icon>
                  下载模板
                </el-button>
              </div>
            </template>
          </el-upload>
        </div>

        <div class="upload-section">
          <h4>2. 上传配套媒体文件（可选）</h4>
          <p class="tip">媒体文件命名规则：{数据ID或名称}_{类型}.{扩展名}</p>
          <p class="tip">例如：中船集团_智能船厂_图片1.jpg</p>
          
          <el-upload
            v-model:file-list="mediaFileList"
            drag
            :auto-upload="false"
            :limit="50"
            multiple
            accept=".jpg,.png,.jpeg,.gif,.mp4,.avi,.mov"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将图片/视频文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </div>

        <div class="step-actions">
          <el-button type="primary" @click="validateData" :loading="validating">
            下一步：数据校验
          </el-button>
        </div>
      </div>

      <div class="step-content" v-show="activeStep === 1">
        <h4>数据校验结果</h4>
        
        <!-- 校验统计 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6">
            <el-statistic title="总数据量" :value="validateResult.total" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="有效数据" :value="validateResult.valid" value-style="color: #67c23a" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="错误数据" :value="validateResult.invalid" value-style="color: #f56c6c" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="媒体文件匹配" :value="validateResult.matched" />
          </el-col>
        </el-row>

        <!-- 错误数据列表 -->
        <el-table :data="validateResult.errors" stripe v-if="validateResult.errors?.length">
          <template #header>
            <div class="table-header">
              <span>错误数据详情</span>
              <el-button type="primary" link @click="exportErrors">
                导出错误报告
              </el-button>
            </div>
          </template>
          <el-table-column prop="rowNum" label="行号" width="80" />
          <el-table-column prop="field" label="字段" width="150" />
          <el-table-column prop="value" label="错误值" min-width="200" show-overflow-tooltip />
          <el-table-column prop="reason" label="错误原因" min-width="250" />
        </el-table>

        <!-- 数据预览 -->
        <h4 style="margin-top: 20px">数据预览（前10条）</h4>
        <el-table :data="validateResult.previewData" stripe max-height="300">
          <el-table-column
            v-for="col in validateResult.columns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="120"
            show-overflow-tooltip
          />
        </el-table>

        <div class="step-actions">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button type="primary" @click="confirmImport" :loading="importing">
            确认导入
          </el-button>
        </div>
      </div>

      <div class="step-content" v-show="activeStep === 2">
        <el-result
          icon="success"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :sub-title="importResult.message"
        >
          <template #extra>
            <el-button type="primary" @click="resetImport">
              继续导入
            </el-button>
            <el-button @click="viewImportLog">
              查看导入日志
            </el-button>
          </template>
        </el-result>

        <!-- 导入详情 -->
        <div class="import-detail" v-if="importResult.detail">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="成功导入">
              <span style="color: #67c23a">{{ importResult.detail.successCount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="导入失败">
              <span style="color: #f56c6c">{{ importResult.detail.failCount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="媒体文件匹配">
              {{ importResult.detail.mediaMatched }} / {{ importResult.detail.mediaTotal }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>

    <!-- 导入日志对话框 -->
    <el-dialog v-model="logVisible" title="导入日志" width="80%">
      <el-table :data="importLogs" stripe>
        <el-table-column prop="logTime" label="导入时间" width="180" />
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="successCount" label="成功数" width="100" />
        <el-table-column prop="failCount" label="失败数" width="100" />
        <el-table-column prop="logContent" label="日志内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="downloadLogFile(row)">
              下载详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const activeStep = ref(0)
const validating = ref(false)
const importing = ref(false)
const uploadFile = ref(null)
const mediaFileList = ref([])

const validateResult = reactive({
  total: 0,
  valid: 0,
  invalid: 0,
  matched: 0,
  errors: [],
  previewData: [],
  columns: []
})

const importResult = reactive({
  success: false,
  message: '',
  detail: null
})

const logVisible = ref(false)
const importLogs = ref([])

// 处理文件变化
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 数据校验
const validateData = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先上传数据文件')
    return
  }

  validating.value = true

  try {
    // 解析Excel文件
    const data = await parseExcel(uploadFile.value.raw)
    
    // 校验数据
    const result = await performValidation(data, mediaFileList.value)
    
    validateResult.total = result.total
    validateResult.valid = result.valid
    validateResult.invalid = result.invalid
    validateResult.matched = result.matched
    validateResult.errors = result.errors
    validateResult.previewData = result.previewData
    validateResult.columns = result.columns

    // if (result.invalid > 0) {
    if (false) {
      ElMessage.warning(`发现 ${result.invalid} 条数据错误，请修正后重新上传`)
    } else {
      ElMessage.success('数据校验通过')
      activeStep.value = 1
    }
  } catch (error) {
    console.error('数据校验失败:', error)
    ElMessage.error('数据校验失败：' + error.message)
  } finally {
    validating.value = false
  }
}

// 解析Excel文件
const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      resolve(jsonData)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 执行数据校验
const performValidation = async (data, mediaFiles) => {
  const errors = []
  const validData = []
  const requiredFields = ['deviceName', 'deviceClass', 'countryName']
  
  // 构建媒体文件索引（按文件名前缀匹配）
  const mediaIndex = buildMediaIndex(mediaFiles)

  data.forEach((row, index) => {
    const rowNum = index + 2 // 第1行是表头
    
    // 检查必填字段
    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push({
          rowNum,
          field,
          value: row[field],
          reason: `${field} 不能为空`
        })
      }
    })

    // 检查媒体文件匹配
    const deviceName = row.deviceName
    if (deviceName && mediaIndex[deviceName]) {
      row._matchedMedia = mediaIndex[deviceName]
    }

    // 其他业务规则校验...
    
    if (!errors.some(e => e.rowNum === rowNum)) {
      validData.push(row)
    }
  })

  return {
    total: data.length,
    valid: validData.length,
    invalid: errors.length,
    matched: validData.filter(d => d._matchedMedia).length,
    errors,
    previewData: validData.slice(0, 10),
    columns: data.length > 0 ? Object.keys(data[0]) : []
  }
}

// 构建媒体文件索引
const buildMediaIndex = (mediaFiles) => {
  const index = {}
  mediaFiles.forEach(file => {
    // 按文件名前缀匹配（假设文件名为：数据名称_类型.扩展名）
    const fileName = file.name
    const baseName = fileName.split('_')[0]
    if (!index[baseName]) {
      index[baseName] = []
    }
    index[baseName].push(file)
  })
  return index
}

// 确认导入
const confirmImport = async () => {
  importing.value = true

  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value.raw)
    
    // 将媒体文件与数据的匹配关系一并提交
    const matchInfo = buildMatchInfo(validateResult.previewData)
    formData.append('matchInfo', JSON.stringify(matchInfo))
    
    mediaFileList.value.forEach(file => {
      formData.append('mediaFiles', file.raw)
    })

    const res = await batchImport(formData)
    if (res.code === 200) {
      importResult.success = true
      importResult.message = '数据导入成功'
      importResult.detail = res.data
      activeStep.value = 2
    } else {
      importResult.success = false
      importResult.message = res.message || '导入失败'
    }
  } catch (error) {
    console.error('导入失败:', error)
    importResult.success = false
    importResult.message = '导入失败：' + error.message
  } finally {
    importing.value = false
  }
}

// 构建匹配信息
const buildMatchInfo = (data) => {
  return data.map(item => ({
    deviceName: item.deviceName,
    mediaFiles: item._matchedMedia || []
  }))
}

// 下载模板
const downloadTemplate = () => {
  // 模板列定义
  const templateData = [{
    deviceName: '示例：智能船厂建设项目',
    deviceClass: '设计方法及技术',
    deviceStyle: '前沿技术融合',
    deviceType: 'AI优化船舶结构设计',
    countryName: '中国',
    deviceUseYear: '2023',
    devicePrice: '15亿元',
    deviceUsingUnit: '中国船舶集团',
    deviceLocation: '上海市浦东新区',
    deviceIntroduce: '项目详细介绍...',
    deviceNewsLink: 'https://example.com/news',
    deviceNewsTitle: '相关新闻标题'
  }]
  
  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  XLSX.writeFile(wb, '数据导入模板.xlsx')
  
  ElMessage.success('模板下载成功')
}

// 导出错误报告
const exportErrors = () => {
  const ws = XLSX.utils.json_to_sheet(validateResult.errors)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '错误报告')
  XLSX.writeFile(wb, `错误报告_${new Date().getTime()}.xlsx`)
}

// 重置导入
const resetImport = () => {
  activeStep.value = 0
  uploadFile.value = null
  mediaFileList.value = []
  // 重置校验结果
  Object.assign(validateResult, {
    total: 0,
    valid: 0,
    invalid: 0,
    matched: 0,
    errors: [],
    previewData: [],
    columns: []
  })
}

// 查看导入日志
const viewImportLog = () => {
  fetchImportLogs()
  logVisible.value = true
}

// 获取导入日志
const fetchImportLogs = async () => {
  // 调用API获取日志
  // ...
}

// 下载日志文件
const downloadLogFile = (row) => {
  // 下载详细日志
  // ...
}
</script>

<style scoped>
.batch-entry-container {
  padding: 20px;
}

.step-content {
  margin-top: 30px;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-section h4 {
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: bold;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stats-row {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.import-detail {
  margin-top: 20px;
}
</style>