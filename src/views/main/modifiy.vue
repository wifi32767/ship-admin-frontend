<template>
  <div class="data-modification-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">信息管理</span>
          <div class="header-actions">
            <!-- 关键字搜索框 -->
            <el-input
              v-model="searchKeyword"
              placeholder="请输入信息名称"
              style="width: 220px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="dataList" stripe v-loading="loading">
        <el-table-column prop="deviceName" label="信息名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.deviceClass || '-' }}</el-tag>
            <span v-if="row.deviceStyle" class="category-sep">/</span>
            <el-tag size="small" type="success">{{ row.deviceStyle || '-' }}</el-tag>
            <span v-if="row.deviceType" class="category-sep">/</span>
            <el-tag size="small" type="warning">{{ row.deviceType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceCountry" label="所属国家" width="120" />
        <el-table-column prop="deviceUsingUnit" label="实施单位" min-width="150" show-overflow-tooltip />
        <el-table-column prop="deviceUseYear" label="投产年份" width="100" align="center" />
        <el-table-column prop="devicePrice" label="投入成本" width="120" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editData(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteData(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        title="编辑信息"
        width="600px"
        destroy-on-close
        @close="closeEditDialog"
      >
        <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editFormRules"
          label-width="120px"
        >
          <el-form-item label="信息名称" prop="deviceName">
            <el-input v-model="editForm.deviceName" />
          </el-form-item>
          <el-form-item label="所属国家" prop="deviceCountry">
            <el-input v-model="editForm.deviceCountry" />
          </el-form-item>
          <el-form-item label="一级分类">
            <el-input v-model="editForm.deviceClass" />
          </el-form-item>
          <el-form-item label="二级分类">
            <el-input v-model="editForm.deviceStyle" />
          </el-form-item>
          <el-form-item label="三级分类">
            <el-input v-model="editForm.deviceType" />
          </el-form-item>
          <el-form-item label="投产年份">
            <el-input-number v-model="editForm.deviceUseYear" :min="1900" :max="2099" />
          </el-form-item>
          <el-form-item label="投入成本">
            <el-input v-model="editForm.devicePrice" />
          </el-form-item>
          <el-form-item label="实施单位">
            <el-input v-model="editForm.deviceUsingUnit" />
          </el-form-item>
          <el-form-item label="地理位置">
            <el-input v-model="editForm.deviceLocation" />
          </el-form-item>
          <el-form-item label="经度">
            <el-input v-model="editForm.deviceLongitude" />
          </el-form-item>
          <el-form-item label="纬度">
            <el-input v-model="editForm.deviceLatitude" />
          </el-form-item>
          <el-form-item label="图片URL">
            <el-input v-model="editForm.deviceImg" placeholder="多个图片用逗号分隔" />
          </el-form-item>
          <el-form-item label="视频URL">
            <el-input v-model="editForm.deviceVideo" placeholder="多个视频用逗号分隔" />
          </el-form-item>
          <el-form-item label="详情介绍">
            <el-input type="textarea" v-model="editForm.deviceIntroduce" rows="4" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveData" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getPageList, getDeviceCount, updateData, deleteDevice } from '@/api/modify'

// 列表相关
const dataList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')  // 关键字搜索

// 编辑相关（字段已适配字符串）
const editDialogVisible = ref(false)
const editFormRef = ref()
const saving = ref(false)

const editForm = reactive({
  id: null,
  deviceName: '',
  deviceClass: '',
  deviceStyle: '',
  deviceType: '',
  deviceUseYear: null,
  devicePrice: '',
  deviceUsingUnit: '',
  deviceCountry: '',
  deviceLocation: '',
  deviceLongitude: '',
  deviceLatitude: '',
  deviceImg: '',
  deviceVideo: '',
  deviceIntroduce: ''
})

const editFormRules = {
  deviceName: [{ required: true, message: '请输入信息名称', trigger: 'blur' }],
  deviceCountry: [{ required: true, message: '请输入所属国家', trigger: 'blur' }]
}

// 获取分页列表 + 总条数（支持 keyword 参数）
const fetchDataList = async () => {
  loading.value = true
  try {
    // 并行请求总数和分页数据（后端应支持 keyword 参数，若不支持可自行过滤）
    const [countRes, pageRes] = await Promise.all([
      getDeviceCount(),
      getPageList({ 
        page: pageNum.value, 
        size: pageSize.value,
        keyword: searchKeyword.value || undefined  // 若后端支持，传递 keyword
      })
    ])

    if (countRes.code === 200) {
      total.value = countRes.data || 0
    } else {
      total.value = 0
    }

    if (pageRes.code === 200 && pageRes.data) {
      if (Array.isArray(pageRes.data)) {
        dataList.value = pageRes.data
      } else if (pageRes.data.records) {
        dataList.value = pageRes.data.records
      } else {
        dataList.value = []
      }
    } else {
      dataList.value = []
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
    dataList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理搜索（重置页码）
const handleSearch = () => {
  pageNum.value = 1
  fetchDataList()
}

// 重置搜索条件
const resetSearch = () => {
  searchKeyword.value = ''
  pageNum.value = 1
  fetchDataList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNum.value = 1
  fetchDataList()
}

// 页码改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  fetchDataList()
}

// 编辑数据
const editData = (row) => {
  Object.assign(editForm, {
    id: row.id,
    deviceName: row.deviceName,
    deviceClass: row.deviceClass || '',
    deviceStyle: row.deviceStyle || '',
    deviceType: row.deviceType || '',
    deviceUseYear: row.deviceUseYear,
    devicePrice: row.devicePrice,
    deviceUsingUnit: row.deviceUsingUnit,
    deviceCountry: row.deviceCountry || '',
    deviceLocation: row.deviceLocation,
    deviceLongitude: row.deviceLongitude,
    deviceLatitude: row.deviceLatitude,
    deviceImg: row.deviceImg,
    deviceVideo: row.deviceVideo,
    deviceIntroduce: row.deviceIntroduce
  })
  editDialogVisible.value = true
}

// 保存修改
const saveData = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = { ...editForm }
      const res = await updateData(payload)
      if (res.code === 200) {
        ElMessage.success('保存成功')
        editDialogVisible.value = false
        fetchDataList()
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

// 关闭编辑对话框
const closeEditDialog = () => {
  editFormRef.value?.resetFields()
  Object.assign(editForm, {
    id: null,
    deviceName: '',
    deviceClass: '',
    deviceStyle: '',
    deviceType: '',
    deviceUseYear: null,
    devicePrice: '',
    deviceUsingUnit: '',
    deviceCountry: '',
    deviceLocation: '',
    deviceLongitude: '',
    deviceLatitude: '',
    deviceImg: '',
    deviceVideo: '',
    deviceIntroduce: ''
  })
}

// 删除数据
const deleteData = (row) => {
  ElMessageBox.confirm(`确定删除“${row.deviceName}”吗？`, '警告', {
    confirmButtonText: '删除',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteDevice(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchDataList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchDataList()
})
</script>

<style scoped>
.data-modification-container {
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
  gap: 10px;
  flex-wrap: wrap;
}
.category-sep {
  margin: 0 4px;
  color: #909399;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>