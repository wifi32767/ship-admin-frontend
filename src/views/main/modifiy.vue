<template>
  <div class="data-modification-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">数据修改管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题名称"
              style="width: 220px"
              clearable
              @clear="fetchDataList"
              @keyup.enter="fetchDataList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="searchCategory"
              placeholder="分类筛选"
              clearable
              filterable
              style="width: 180px"
              @change="fetchDataList"
            >
              <el-option
                v-for="item in categoryList"
                :key="item.deviceClassId"
                :label="item.deviceClassName"
                :value="item.deviceClassId"
              />
            </el-select>
            <el-select
              v-model="searchCountry"
              placeholder="国家筛选"
              clearable
              filterable
              style="width: 150px"
              @change="fetchDataList"
            >
              <el-option
                v-for="item in countryList"
                :key="item.countryId"
                :label="item.countryName"
                :value="item.countryId"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 260px"
              @change="fetchDataList"
            />
            <el-button type="primary" @click="fetchDataList">
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
      <el-table
        ref="tableRef"
        :data="dataList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="deviceName" label="信息名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.deviceClass }}</el-tag>
            <span v-if="row.deviceStyle" class="category-sep">/</span>
            <el-tag size="small" type="success">{{ row.deviceStyle }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="countryName" label="所属国家" width="100" />
        <el-table-column prop="deviceUsingUnit" label="实施单位" min-width="150" show-overflow-tooltip />
        <el-table-column prop="deviceUseYear" label="投产年份" width="100" align="center" />
        <el-table-column prop="devicePrice" label="投入成本" width="120" show-overflow-tooltip />
        <el-table-column prop="modifyTime" label="最后修改" width="160" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.auditFlag === 1 ? 'success' : 'warning'">
              {{ row.auditFlag === 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editData(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteData(row)">
              删除
            </el-button>
            <el-button type="info" link @click="viewHistory(row)">
              历史记录
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
          @size-change="fetchDataList"
          @current-change="fetchDataList"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editMode === 'add' ? '新增信息' : '编辑信息'"
      width="900px"
      destroy-on-close
      @close="closeEditDialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="110px"
        label-position="right"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="信息名称" prop="deviceName">
                  <el-input v-model="editForm.deviceName" placeholder="请输入信息名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属国家" prop="countryId">
                  <el-select v-model="editForm.countryId" placeholder="请选择" filterable style="width: 100%">
                    <el-option
                      v-for="item in countryList"
                      :key="item.countryId"
                      :label="item.countryName"
                      :value="item.countryId"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分类信息" prop="categoryPath">
                  <el-cascader
                    v-model="categoryPath"
                    :options="cascaderOptions"
                    :props="cascaderProps"
                    placeholder="请选择分类"
                    clearable
                    style="width: 100%"
                    @change="handleCategoryChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="投产年份" prop="deviceUseYear">
                  <el-input-number
                    v-model="editForm.deviceUseYear"
                    :min="1900"
                    :max="new Date().getFullYear()"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="投入成本" prop="devicePrice">
                  <el-input v-model="editForm.devicePrice" placeholder="如：15亿元、500万美元" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="实施单位" prop="deviceUsingUnit">
                  <el-input v-model="editForm.deviceUsingUnit" placeholder="请输入实施单位" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="具体地址" prop="deviceLocation">
                  <el-input v-model="editForm.deviceLocation" placeholder="请输入详细地址">
                    <template #append>
                      <el-button @click="getCoordinates" :loading="geocodingLoading">
                        获取经纬度
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="经度" prop="deviceLongitude">
                  <el-input v-model="editForm.deviceLongitude" placeholder="自动获取" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="纬度" prop="deviceLatitude">
                  <el-input v-model="editForm.deviceLatitude" placeholder="自动获取" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="详细信息" name="detail">
            <el-form-item label="详情介绍" prop="deviceIntroduce">
              <el-editor
                v-model="editForm.deviceIntroduce"
                :height="300"
                placeholder="请输入详细信息"
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="新闻信息" name="news">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="新闻标题" prop="deviceNewsTitle">
                  <el-input v-model="editForm.deviceNewsTitle" placeholder="请输入相关新闻标题" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="新闻链接" prop="deviceNewsLink">
                  <el-input v-model="editForm.deviceNewsLink" placeholder="请输入新闻链接URL" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="新闻时间" prop="deviceNewsTime">
                  <el-date-picker
                    v-model="editForm.deviceNewsTime"
                    type="datetime"
                    placeholder="选择新闻时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="多媒体资料" name="media">
            <el-form-item label="图片">
              <el-upload
                v-model:file-list="imageFileList"
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :on-preview="handleImagePreview"
                :on-remove="handleImageRemove"
                :limit="9"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">支持上传多张图片，用于展示项目实景、技术示意图等</div>
            </el-form-item>

            <el-form-item label="视频">
              <el-upload
                v-model:file-list="videoFileList"
                action="#"
                :auto-upload="false"
                :on-remove="handleVideoRemove"
                :limit="5"
              >
                <el-button type="primary">
                  <el-icon><VideoCamera /></el-icon>
                  选择视频文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 mp4, avi, mov 格式，单个文件不超过 500MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <!-- 已有媒体文件展示 -->
            <div v-if="existingImages.length > 0 || existingVideos.length > 0" class="existing-media">
              <div class="section-title">已有媒体文件</div>
              <div class="image-list" v-if="existingImages.length">
                <div v-for="(img, idx) in existingImages" :key="idx" class="image-item">
                  <el-image :src="img.url" fit="cover" :preview-src-list="existingImageUrls" />
                  <el-button type="danger" circle size="small" class="delete-btn" @click="removeExistingImage(idx)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="video-list" v-if="existingVideos.length">
                <div v-for="(video, idx) in existingVideos" :key="idx" class="video-item">
                  <video :src="video.url" controls width="200" />
                  <el-button type="danger" circle size="small" class="delete-btn" @click="removeExistingVideo(idx)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveData" :loading="saving">
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="修改历史记录"
      width="800px"
    >
      <el-timeline>
        <el-timeline-item
          v-for="item in historyList"
          :key="item.historyId"
          :timestamp="item.modifyTime"
          placement="top"
          :type="item.actionType === 'update' ? 'primary' : 'danger'"
        >
          <el-card>
            <div class="history-header">
              <span class="operator">{{ item.operatorName }}</span>
              <span class="action">{{ getActionText(item.actionType) }}</span>
            </div>
            <div class="history-content">
              <div v-for="(change, field) in item.changes" :key="field" class="change-item">
                <span class="field">{{ field }}：</span>
                <span class="old-value">{{ change.old }}</span>
                <el-icon><Right /></el-icon>
                <span class="new-value">{{ change.new }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <div v-if="historyList.length === 0" class="empty-history">
        <el-empty description="暂无修改记录" />
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="600px">
      <img :src="previewImageUrl" style="width: 100%" alt="预览图片" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, Download, Plus, VideoCamera, Right } from '@element-plus/icons-vue'
import {
  getDataList,
  getDataDetail,
  updateData,
  deleteData as deleteDataApi,
  batchDeleteData,
  getModifyHistory,
  getCategoryList,
  getCountryList,
  getCategoryTree
} from '@/api/modify'
import axios from 'axios'

// 列表相关
const tableRef = ref()
const dataList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRows = ref([])

// 搜索条件
const searchKeyword = ref('')
const searchCategory = ref('')
const searchCountry = ref('')
const dateRange = ref([])

// 下拉选项
const categoryList = ref([])
const countryList = ref([])

// 编辑相关
const editDialogVisible = ref(false)
const editMode = ref('edit') // edit 或 add
const editFormRef = ref()
const activeTab = ref('basic')
const saving = ref(false)
const geocodingLoading = ref(false)

const editForm = reactive({
  deviceId: null,
  deviceName: '',
  deviceClassId: null,
  deviceStyleId: null,
  deviceTypeId: null,
  deviceUseYear: null,
  devicePrice: '',
  deviceUsingUnit: '',
  countryId: null,
  deviceLocation: '',
  deviceLongitude: '',
  deviceLatitude: '',
  deviceIntroduce: '',
  deviceNewsLink: '',
  deviceNewsTitle: '',
  deviceNewsTime: ''
})

// 表单验证规则
const editFormRules = {
  deviceName: [
    { required: true, message: '请输入信息名称', trigger: 'blur' },
    { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
  ],
  countryId: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
  categoryPath: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 级联选择器
const cascaderOptions = ref([])
const categoryPath = ref([])
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true
}

// 媒体文件
const imageFileList = ref([])
const videoFileList = ref([])
const existingImages = ref([])
const existingVideos = ref([])

// 历史记录
const historyDialogVisible = ref(false)
const historyList = ref([])

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 现有图片URL列表
const existingImageUrls = computed(() => {
  return existingImages.value.map(img => img.url)
})

// 获取数据列表
const fetchDataList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      categoryId: searchCategory.value,
      countryId: searchCountry.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    const res = await getDataList(params)
    if (res.code === 200 && res.data) {
      dataList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取数据列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    const res = await getCategoryList()
    if (res.code === 200) {
      categoryList.value = res.data || []
    }
    const treeRes = await getCategoryTree()
    if (treeRes.code === 200) {
      cascaderOptions.value = treeRes.data || []
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取国家列表
const fetchCountryList = async () => {
  try {
    const res = await getCountryList()
    if (res.code === 200) {
      countryList.value = res.data || []
    }
  } catch (error) {
    console.error('获取国家列表失败:', error)
  }
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  searchCategory.value = ''
  searchCountry.value = ''
  dateRange.value = []
  pageNum.value = 1
  fetchDataList()
}

// 选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 编辑数据
const editData = async (row) => {
  editMode.value = 'edit'
  editDialogVisible.value = true

  try {
    const res = await getDataDetail(row.deviceId)
    if (res.code === 200 && res.data) {
      const data = res.data
      Object.assign(editForm, {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        deviceUseYear: data.deviceUseYear,
        devicePrice: data.devicePrice,
        deviceUsingUnit: data.deviceUsingUnit,
        countryId: data.countryId,
        deviceLocation: data.deviceLocation,
        deviceLongitude: data.deviceLongitude,
        deviceLatitude: data.deviceLatitude,
        deviceIntroduce: data.deviceIntroduce,
        deviceNewsLink: data.deviceNewsLink,
        deviceNewsTitle: data.deviceNewsTitle,
        deviceNewsTime: data.deviceNewsTime
      })

      // 设置分类路径
      categoryPath.value = data.categoryPath ? data.categoryPath.split('/') : []

      // 设置已有媒体
      existingImages.value = data.images || []
      existingVideos.value = data.videos || []
    }
  } catch (error) {
    console.error('获取数据详情失败:', error)
    ElMessage.error('获取数据详情失败')
  }
}

// 分类变化
const handleCategoryChange = (value) => {
  if (value && value.length === 3) {
    editForm.deviceClassId = value[0]
    editForm.deviceStyleId = value[1]
    editForm.deviceTypeId = value[2]
  }
}

// 获取经纬度
const getCoordinates = async () => {
  if (!editForm.deviceLocation) {
    ElMessage.warning('请先输入具体地址')
    return
  }

  geocodingLoading.value = true
  try {
    const key = import.meta.env.VITE_AMAP_KEY || 'your_amap_key'
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(editForm.deviceLocation)}&key=${key}`
    const response = await axios.get(url)
    if (response.data.status === '1' && response.data.geocodes.length > 0) {
      const location = response.data.geocodes[0].location
      const [lng, lat] = location.split(',')
      editForm.deviceLongitude = lng
      editForm.deviceLatitude = lat
      ElMessage.success('经纬度获取成功')
    } else {
      ElMessage.warning('未找到该地址的经纬度信息')
    }
  } catch (error) {
    console.error('获取经纬度失败:', error)
    ElMessage.error('获取经纬度失败')
  } finally {
    geocodingLoading.value = false
  }
}

// 保存数据
const saveData = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整信息')
      return
    }

    saving.value = true
    try {
      const formData = new FormData()
      formData.append('deviceId', editForm.deviceId)
      formData.append('deviceName', editForm.deviceName)
      formData.append('deviceClassId', editForm.deviceClassId)
      formData.append('deviceStyleId', editForm.deviceStyleId)
      formData.append('deviceTypeId', editForm.deviceTypeId)
      formData.append('deviceUseYear', editForm.deviceUseYear || '')
      formData.append('devicePrice', editForm.devicePrice || '')
      formData.append('deviceUsingUnit', editForm.deviceUsingUnit || '')
      formData.append('countryId', editForm.countryId)
      formData.append('deviceLocation', editForm.deviceLocation || '')
      formData.append('deviceLongitude', editForm.deviceLongitude || '')
      formData.append('deviceLatitude', editForm.deviceLatitude || '')
      formData.append('deviceIntroduce', editForm.deviceIntroduce || '')
      formData.append('deviceNewsLink', editForm.deviceNewsLink || '')
      formData.append('deviceNewsTitle', editForm.deviceNewsTitle || '')
      formData.append('deviceNewsTime', editForm.deviceNewsTime || '')

      // 新增图片
      imageFileList.value.forEach(file => {
        if (file.raw) {
          formData.append('newImages', file.raw)
        }
      })

      // 新增视频
      videoFileList.value.forEach(file => {
        if (file.raw) {
          formData.append('newVideos', file.raw)
        }
      })

      // 删除的图片ID列表
      const deletedImageIds = existingImages.value.filter(img => img._deleted).map(img => img.id)
      if (deletedImageIds.length) {
        formData.append('deletedImageIds', JSON.stringify(deletedImageIds))
      }

      // 删除的视频ID列表
      const deletedVideoIds = existingVideos.value.filter(video => video._deleted).map(video => video.id)
      if (deletedVideoIds.length) {
        formData.append('deletedVideoIds', JSON.stringify(deletedVideoIds))
      }

      const res = await updateData(formData)
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
  Object.keys(editForm).forEach(key => {
    if (typeof editForm[key] !== 'function') {
      editForm[key] = null
    }
  })
  categoryPath.value = []
  imageFileList.value = []
  videoFileList.value = []
  existingImages.value = []
  existingVideos.value = []
  activeTab.value = 'basic'
}

// 删除数据
const deleteData = (row) => {
  ElMessageBox.confirm(`确定要删除信息"${row.deviceName}"吗？此操作不可恢复。`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteDataApi(row.deviceId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchDataList()
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
    ElMessage.warning('请先选择要删除的数据')
    return
  }

  const names = selectedRows.value.map(row => row.deviceName).join('、')
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条数据吗？\n${names}`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.deviceId)
      const res = await batchDeleteData({ ids })
      if (res.code === 200) {
        ElMessage.success(`成功删除 ${res.data} 条数据`)
        fetchDataList()
        tableRef.value?.clearSelection()
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
    ElMessage.warning('请先选择要导出的数据')
    return
  }

  try {
    const ids = selectedRows.value.map(row => row.deviceId)
    const res = await batchExport({ ids })
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `数据导出_${new Date().getTime()}.xlsx`
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

// 查看修改历史
const viewHistory = async (row) => {
  try {
    const res = await getModifyHistory(row.deviceId)
    if (res.code === 200) {
      historyList.value = res.data || []
      historyDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  }
}

// 获取操作类型文本
const getActionText = (actionType) => {
  const map = {
    'create': '创建',
    'update': '修改',
    'delete': '删除'
  }
  return map[actionType] || actionType
}

// 图片处理
const handleImagePreview = (file) => {
  previewImageUrl.value = file.url
  previewVisible.value = true
}

const handleImageRemove = (file, fileList) => {
  console.log('移除图片:', file)
}

const handleVideoRemove = (file, fileList) => {
  console.log('移除视频:', file)
}

// 删除已有图片
const removeExistingImage = (index) => {
  existingImages.value[index]._deleted = true
  existingImages.value.splice(index, 1)
}

// 删除已有视频
const removeExistingVideo = (index) => {
  existingVideos.value[index]._deleted = true
  existingVideos.value.splice(index, 1)
}

onMounted(() => {
  fetchDataList()
  fetchCategoryList()
  fetchCountryList()
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.existing-media {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #303133;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
}

.image-item .el-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.image-item .delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.video-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.video-item {
  position: relative;
}

.video-item .delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.operator {
  font-weight: bold;
  color: #409EFF;
}

.action {
  color: #909399;
}

.history-content {
  font-size: 13px;
}

.change-item {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.change-item .field {
  font-weight: bold;
  color: #606266;
}

.change-item .old-value {
  color: #f56c6c;
  text-decoration: line-through;
}

.change-item .new-value {
  color: #67c23a;
}

.empty-history {
  padding: 40px;
}
</style>