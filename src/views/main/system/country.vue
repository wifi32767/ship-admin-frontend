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
            <el-input
              v-model="searchKeyword"
              placeholder="搜索国家名称"
              style="width: 220px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
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
        :data="paginatedCountries"
        stripe
        v-loading="loading"
      >
        <el-table-column prop="countryName" label="中文名称" min-width="150" />
        <el-table-column prop="englishName" label="英文名称" min-width="150" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteCountry(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 前端分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredCountries.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getAllCountries,
  saveCountry as saveCountryApi,
  updateCountry,
  deleteCountry as deleteCountryApi
} from '@/api/system'

// 所有国家数据（原始）
const allCountries = ref([])
const loading = ref(false)

// 搜索关键字
const searchKeyword = ref('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(20)

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

// 前端过滤：根据中文名称或英文名称搜索
const filteredCountries = computed(() => {
  if (!searchKeyword.value) {
    return allCountries.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return allCountries.value.filter(item =>
    item.countryName?.toLowerCase().includes(keyword) ||
    item.englishName?.toLowerCase().includes(keyword)
  )
})

// 前端分页切片
const paginatedCountries = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCountries.value.slice(start, end)
})

// 获取所有国家数据
const fetchAllCountries = async () => {
  loading.value = true
  try {
    const res = await getAllCountries()
    if (res.code === 200 && res.data) {
      allCountries.value = res.data || []
      // 重置分页到第一页
      currentPage.value = 1
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
    console.log('完整响应:', res)           // 查看 res 整体结构
    console.log('res.data:', res.data)     // 查看 data 字段内容
    console.log('res.data 类型:', Array.isArray(res.data))  // 是否为数组
  } catch (error) {
    console.error('获取国家列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理：重置到第一页
const handleSearch = () => {
  currentPage.value = 1
}

// 分页大小改变
const handlePageSizeChange = () => {
  currentPage.value = 1
}

// 当前页改变
const handleCurrentPageChange = () => {
  // 无需额外处理
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
        // 重新加载全部数据
        await fetchAllCountries()
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
  ElMessageBox.confirm(
    `确定要删除国家"${row.countryName}"吗？此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await deleteCountryApi(row.countryId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await fetchAllCountries()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchAllCountries()
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>