<template>
  <div class="countries-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">国家信息管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增国家
            </el-button>
            <el-button type="success" @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索国家名称"
              style="width: 220px"
              clearable
              @clear="fetchCountryList"
              @keyup.enter="fetchCountryList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <!-- 国家列表表格 -->
      <el-table
        :data="countryList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="countryName" label="中文名称" min-width="150">
          <template #default="{ row }">
            <div class="country-name">
              <span class="flag-emoji">{{ getCountryFlag(row.countryCode) }}</span>
              <span>{{ row.countryName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="englishName" label="英文名称" min-width="150" />
        <el-table-column prop="dataCount" label="关联数据量" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewRelatedData(row)">
              {{ row.dataCount || 0 }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteCountry(row)"
              :disabled="row.dataCount > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <div class="batch-actions" v-if="selectedRows.length > 0">
          <span class="selected-info">已选择 {{ selectedRows.length }} 条数据</span>
          <el-button type="danger" plain @click="batchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button type="primary" plain @click="batchExport">
            <el-icon><Download /></el-icon>
            批量导出
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchCountryList"
          @current-change="fetchCountryList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑国家对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >

        <el-form-item label="中文名称" prop="countryName">
          <el-input
            v-model="formData.countryName"
            placeholder="请输入中文名称，如：中国、美国"
            maxlength="64"
          />
        </el-form-item>

        <el-form-item label="英文名称" prop="englishName">
          <el-input
            v-model="formData.englishName"
            placeholder="请输入英文名称，如：China、United States"
            maxlength="128"
          />
        </el-form-item>
    </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCountry" :loading="saving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入国家" width="600px">
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul>
              <li>请先下载模板文件，按照模板格式填写国家数据</li>
              <li>国家代码为唯一标识，已存在的代码将更新原有数据</li>
              <li>支持的国家代码标准：ISO 3166-1</li>
            </ul>
          </template>
        </el-alert>

        <div class="import-actions">
          <el-button type="primary" link @click="downloadImportTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
        </div>

        <el-upload
          drag
          :auto-upload="false"
          :on-change="handleImportFileChange"
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
            </div>
          </template>
        </el-upload>

        <div v-if="importResult" class="import-result">
          <el-alert
            :title="`导入完成：成功 ${importResult.success} 条，失败 ${importResult.fail} 条`"
            :type="importResult.fail > 0 ? 'warning' : 'success'"
            :closable="false"
          />
          <div v-if="importResult.errors?.length" class="import-errors">
            <div class="errors-title">错误详情：</div>
            <ul>
              <li v-for="(err, idx) in importResult.errors" :key="idx">
                {{ err }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="doImport" :loading="importing">
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 关联数据查看对话框 -->
    <el-dialog
      v-model="relatedDataVisible"
      :title="`${currentCountry?.countryName} - 关联数据`"
      width="800px"
    >
      <el-table :data="relatedDataList" stripe max-height="500">
        <el-table-column prop="deviceName" label="信息名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="deviceClass" label="一级分类" width="150" />
        <el-table-column prop="deviceStyle" label="二级分类" width="150" />
        <el-table-column prop="deviceType" label="三级分类" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
      </el-table>
      <template #footer">
        <el-button @click="relatedDataVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, Delete, Download, UploadFilled } from '@element-plus/icons-vue'
import {
  getCountryList,
  getCountryStats,
  saveCountry as saveCountryApi,
  updateCountry,
  deleteCountry as deleteCountryApi,
  batchDeleteCountries,
  batchImportCountries,
  downloadTemplate,
  getRelatedData
} from '@/api/system'

// 列表相关
const countryList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  asia: 0,
  europe: 0,
  other: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  countryId: null,
  countryName: '',
  englishName: '',
})

// 表单验证规则
const formRules = {
  countryName: [
    { required: true, message: '请输入中文名称', trigger: 'blur' },
    { min: 1, max: 64, message: '长度在 1 到 64 个字符', trigger: 'blur' }
  ],
  englishName: [
    { required: true, message: '请输入英文名称', trigger: 'blur' }
  ],
}

// 批量导入相关
const importDialogVisible = ref(false)
const importFile = ref(null)
const importing = ref(false)
const importResult = ref(null)

// 关联数据相关
const relatedDataVisible = ref(false)
const currentCountry = ref(null)
const relatedDataList = ref([])

// 获取国家旗帜表情
const getCountryFlag = (countryCode) => {
  if (!countryCode) return '🏳️'
  // 将国家代码转换为旗帜表情符号
  const code = countryCode.toUpperCase()
  const flag = String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
  return flag
}

// 获取国家列表
const fetchCountryList = async () => {
  loading.value = true
  try {
    const res = await getCountryList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    })
    if (res.code === 200 && res.data) {
      countryList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取国家列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getCountryStats()
    if (res.code === 200 && res.data) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 显示新增对话框
const showAddDialog = () => {
  dialogTitle.value = '新增国家'
  formData.countryId = null
  formData.countryName = ''
  formData.englishName = ''
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row) => {
  dialogTitle.value = '编辑国家'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 保存国家
const saveCountry = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      let res
      if (formData.countryId) {
        res = await updateCountry(formData)
      } else {
        res = await saveCountryApi(formData)
      }

      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchCountryList()
        fetchStats()
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

// 删除国家
const deleteCountry = (row) => {
  if (row.dataCount > 0) {
    ElMessage.warning(`该国家关联了 ${row.dataCount} 条数据，无法删除`)
    return
  }

  ElMessageBox.confirm(
    `确定要删除国家"${row.countryName}"吗？此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await deleteCountryApi(row.countryId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchCountryList()
        fetchStats()
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
    ElMessage.warning('请先选择要删除的国家')
    return
  }

  const hasDataRef = selectedRows.value.some(row => row.dataCount > 0)
  if (hasDataRef) {
    ElMessage.warning('部分国家关联了数据，无法删除')
    return
  }

  const names = selectedRows.value.map(row => row.countryName).join('、')
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 个国家吗？\n${names}`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.countryId)
      const res = await batchDeleteCountries({ ids })
      if (res.code === 200) {
        ElMessage.success(`成功删除 ${res.data} 条数据`)
        fetchCountryList()
        fetchStats()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 批量导出
const batchExport = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的国家')
    return
  }

  try {
    const ids = selectedRows.value.map(row => row.countryId)
    const res = await batchExportCountries({ ids })
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `国家数据导出_${new Date().getTime()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 查看关联数据
const viewRelatedData = async (row) => {
  currentCountry.value = row
  try {
    const res = await getRelatedData(row.countryId)
    if (res.code === 200) {
      relatedDataList.value = res.data || []
      relatedDataVisible.value = true
    }
  } catch (error) {
    console.error('获取关联数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 批量导入相关
const showImportDialog = () => {
  importFile.value = null
  importResult.value = null
  importDialogVisible.value = true
}

const handleImportFileChange = (file) => {
  importFile.value = file.raw
}

const downloadImportTemplate = async () => {
  try {
    const res = await downloadTemplate()
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = '国家导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  }
}

const doImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await batchImportCountries(formData)
    if (res.code === 200) {
      importResult.value = res.data
      if (res.data.fail === 0) {
        ElMessage.success(`成功导入 ${res.data.success} 条国家数据`)
        fetchCountryList()
        fetchStats()
        importDialogVisible.value = false
      } else {
        ElMessage.warning(`导入完成：成功 ${res.data.success} 条，失败 ${res.data.fail} 条`)
      }
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchCountryList()
  fetchStats()
})
</script>

<style scoped>
.countries-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header .title {
  font-size: 16px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-row {
  margin-bottom: 20px;
}

.country-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-emoji {
  font-size: 20px;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.import-content {
  padding: 0 20px;
}

.import-content ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

.import-content li {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.import-actions {
  margin: 16px 0;
  text-align: right;
}

.import-result {
  margin-top: 20px;
}

.import-errors {
  margin-top: 12px;
  max-height: 200px;
  overflow: auto;
  background-color: #fef0f0;
  padding: 12px;
  border-radius: 4px;
}

.import-errors .errors-title {
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 8px;
}

.import-errors ul {
  margin: 0;
  padding-left: 20px;
}

.import-errors li {
  font-size: 12px;
  color: #f56c6c;
  margin: 4px 0;
}
</style>