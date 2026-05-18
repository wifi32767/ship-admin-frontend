<template>
  <div class="batch-entry">
    <el-card>
      <template #header>批量数据导入</template>

      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="上传文件" />
        <el-step title="数据校验" />
        <el-step title="导入结果" />
      </el-steps>

      <!-- 步骤0：上传文件 -->
      <div v-show="activeStep === 0" class="step">
        <el-upload
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将 Excel/CSV 文件拖到此处，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx, .xls, .csv 格式
              <el-button type="primary" link @click="downloadTemplate">下载模板</el-button>
            </div>
          </template>
        </el-upload>

        <div class="step-actions">
          <el-button type="primary" @click="validateData" :loading="validating">下一步：数据校验</el-button>
        </div>
      </div>

      <!-- 步骤1：校验结果 -->
      <div v-show="activeStep === 1" class="step">
        <el-row :gutter="20" class="stats">
          <el-col :span="8"><el-statistic title="总数据量" :value="validateResult.total" /></el-col>
          <el-col :span="8"><el-statistic title="有效" :value="validateResult.valid" value-style="color:#67c23a" /></el-col>
          <el-col :span="8"><el-statistic title="错误" :value="validateResult.invalid" value-style="color:#f56c6c" /></el-col>
        </el-row>

        <el-table :data="validateResult.errors" stripe v-if="validateResult.errors.length" style="margin-top:20px">
          <el-table-column prop="rowNum" label="行号" width="80" />
          <el-table-column prop="field" label="字段" width="150" />
          <el-table-column prop="value" label="错误值" min-width="200" />
          <el-table-column prop="reason" label="原因" min-width="250" />
        </el-table>

        <h4 v-if="validateResult.valid">数据预览（前10条有效数据）</h4>
        <el-table :data="validateResult.previewData" stripe max-height="300">
          <el-table-column v-for="col in previewColumns" :key="col" :prop="col" :label="col" min-width="120" show-overflow-tooltip />
        </el-table>

        <div class="step-actions">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button type="primary" @click="confirmImport" :loading="importing">确认导入</el-button>
        </div>
      </div>

      <!-- 步骤2：导入结果 -->
      <div v-show="activeStep === 2" class="step">
        <el-result :icon="importResult.success ? 'success' : 'error'" :title="importResult.message">
          <template #extra>
            <el-button type="primary" @click="resetImport">继续导入</el-button>
          </template>
        </el-result>
        <div v-if="importResult.detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="成功导入">{{ importResult.detail.successCount }}</el-descriptions-item>
            <el-descriptions-item label="导入失败">{{ importResult.detail.failCount }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { batchImport } from '@/api/entry'

const activeStep = ref(0)
const validating = ref(false)
const importing = ref(false)
const uploadFile = ref(null)

const validateResult = reactive({
  total: 0,
  valid: 0,
  invalid: 0,
  errors: [],
  previewData: [],
  validDeviceList: []     // 存储校验通过的 DeviceJsonVO 对象
})

const previewColumns = ref([])
const importResult = reactive({ success: false, message: '', detail: null })

// 文件变化
const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

// 解析 Excel
const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)
      resolve(json)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 校验数据并构建 DeviceJsonVO
const validateData = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先上传文件')
    return
  }
  validating.value = true
  try {
    const rawData = await parseExcel(uploadFile.value)
    if (!rawData.length) throw new Error('文件无数据')

    const errors = []
    const validDevices = []

    rawData.forEach((row, idx) => {
      const rowNum = idx + 2
      const device = {}
      let valid = true

      // 必填字段校验（根据业务需求调整）
      if (!row.deviceName) {
        errors.push({ rowNum, field: 'deviceName', value: row.deviceName, reason: '设备名称不能为空' })
        valid = false
      } else {
        device.deviceName = row.deviceName
      }

      if (!row.deviceCountryName) {
        errors.push({ rowNum, field: 'deviceCountryName', value: row.deviceCountryName, reason: '国家名称不能为空' })
        valid = false
      } else {
        device.deviceCountryName = row.deviceCountryName
      }

      if (!row.deviceClassName) {
        errors.push({ rowNum, field: 'deviceClassName', value: row.deviceClassName, reason: '一级分类不能为空' })
        valid = false
      } else {
        device.deviceClassName = row.deviceClassName
      }

      if (!row.deviceStyleName) {
        errors.push({ rowNum, field: 'deviceStyleName', value: row.deviceStyleName, reason: '二级分类不能为空' })
        valid = false
      } else {
        device.deviceStyleName = row.deviceStyleName
      }

      // 三级分类非必填
      if (row.deviceTypeName && row.deviceTypeName.trim() !== '') {
        device.deviceTypeName = row.deviceTypeName
      }

      // 其他字段直接复制（可选字段）
      const optionalFields = ['deviceUseYear', 'devicePrice', 'deviceUsingUnit', 'deviceLocation',
        'deviceLongitude', 'deviceLatitude', 'deviceImg', 'deviceVideo', 'deviceIntroduce']
      optionalFields.forEach(f => {
        if (row[f] !== undefined && row[f] !== '') device[f] = row[f]
      })

      if (valid) validDevices.push(device)
    })

    // 预览数据为原始行的前10条
    const preview = rawData.slice(0, 10)
    const columns = rawData.length ? Object.keys(rawData[0]) : []

    validateResult.total = rawData.length
    validateResult.valid = validDevices.length
    validateResult.invalid = errors.length
    validateResult.errors = errors
    validateResult.previewData = preview
    validateResult.validDeviceList = validDevices
    previewColumns.value = columns

    if (errors.length) {
      ElMessage.warning(`发现 ${errors.length} 条错误`)
    } else {
      ElMessage.success('校验通过')
      activeStep.value = 1
    }
  } catch (err) {
    ElMessage.error('文件解析失败：' + err.message)
  } finally {
    validating.value = false
  }
}

// 确认导入
const confirmImport = async () => {
  if (!validateResult.validDeviceList.length) {
    ElMessage.warning('无有效数据可导入')
    return
  }
  importing.value = true
  try {
    const res = await batchImport(validateResult.validDeviceList)
    if (res.code === 200) {
      importResult.success = true
      importResult.message = '导入完成'
      importResult.detail = res.data || { successCount: validateResult.valid, failCount: 0 }
      activeStep.value = 2
    } else {
      throw new Error(res.message || '导入失败')
    }
  } catch (err) {
    importResult.success = false
    importResult.message = err.message
    activeStep.value = 2
  } finally {
    importing.value = false
  }
}

// 下载模板（列名与 DeviceJsonVO 字段对应）
const downloadTemplate = () => {
  const template = [{
    deviceName: '智能船厂项目',
    deviceCountryName: '中国',
    deviceClassName: '设计方法及技术',
    deviceStyleName: '前沿技术融合',
    deviceTypeName: 'AI优化船舶结构设计',   // 可选，可不填
    deviceUseYear: 2023,
    devicePrice: '15亿元',
    deviceUsingUnit: '中国船舶集团',
    deviceLocation: '上海市浦东新区',
    deviceIntroduce: '项目详细介绍'
  }]
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  XLSX.writeFile(wb, '批量导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

const resetImport = () => {
  activeStep.value = 0
  uploadFile.value = null
  validateResult.total = 0
  validateResult.valid = 0
  validateResult.invalid = 0
  validateResult.errors = []
  validateResult.previewData = []
  validateResult.validDeviceList = []
}
</script>

<style scoped>
.batch-entry { padding: 20px; }
.step { margin-top: 30px; }
.stats { margin-bottom: 20px; }
.step-actions { display: flex; justify-content: center; gap: 16px; margin-top: 30px; }
</style>