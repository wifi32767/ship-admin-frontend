<template>
  <div class="data-entry-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>单一数据录入</h2>
      <p>填写船舶制造业数字化转型相关信息，带 <span class="required-star">*</span> 为必填项</p>
    </div>

    <!-- 表单区域 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="entry-form"
    >
      <!-- 基础信息区域 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>基础信息</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="信息名称" prop="deviceName" required>
              <el-input
                v-model="formData.deviceName"
                placeholder="请输入信息名称"
                maxlength="255"
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="详情介绍" prop="deviceIntroduce">
              <el-input
                v-model="formData.deviceIntroduce"
                type="textarea"
                :rows="6"
                placeholder="请输入详细描述，包括项目背景、实施内容、技术方案、成效等"
                maxlength="5000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="投入成本" prop="devicePrice">
              <el-input
                v-model="formData.devicePrice"
                type="number"
                clearable
              >
                <template #append>
                  <el-select v-model="formData.deviceUsingUnit" placeholder="单位" style="width: 80px">
                    <el-option label="万元" value="万元" />
                    <el-option label="亿元" value="亿元" />
                  </el-select>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投产年份" prop="deviceUseYear">
              <el-date-picker
                v-model="formData.deviceUseYear"
                type="year"
                placeholder="请选择年份"
                format="YYYY年"
                value-format="YYYY"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="deviceUsingUnit">
              <el-input
                v-model="formData.deviceUsingUnit"
                placeholder="请输入单位"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 分类信息区域 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Collection /></el-icon>
            <span>分类信息</span>
            <el-tag type="info" size="small">三级分类体系</el-tag>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="一级分类" prop="deviceClassId" required>
              <el-select
                v-model="formData.deviceClassId"
                placeholder="请选择维度"
                clearable
                @change="handleClassChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="二级分类" prop="deviceStyleId" required>
              <el-select
                v-model="formData.deviceStyleId"
                placeholder="请选择子维度"
                clearable
                :disabled="!formData.deviceClassId"
                @change="handleStyleChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in styleList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="三级分类" prop="deviceTypeId" required>
              <el-select
                v-model="formData.deviceTypeId"
                placeholder="请选择具体方向"
                clearable
                :disabled="!formData.deviceStyleId"
                style="width: 100%"
              >
                <el-option
                  v-for="item in typeList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 分类预览 -->
        <el-row v-if="categoryPreview" :gutter="20">
          <el-col :span="24">
            <el-alert
              :title="categoryPreview"
              type="info"
              :closable="false"
              show-icon
            />
          </el-col>
        </el-row>
      </el-card>

      <!-- 地理位置区域 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>地理位置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属国家" prop="deviceCountryId">
              <el-select
                v-model="formData.deviceCountryId"
                placeholder="请选择国家"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in countryList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="具体地址" prop="deviceLocation">
              <el-input
                v-model="formData.deviceLocation"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="经度" prop="deviceLongitude">
              <el-input
                v-model="formData.deviceLongitude"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="纬度" prop="deviceLatitude">
              <el-input
                v-model="formData.deviceLatitude"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" plain @click="getLocationByAddress" :loading="geocodeLoading">
              <el-icon><Search /></el-icon>
              根据地址获取
            </el-button>
          </el-col>
        </el-row>

        <!-- 地图选点 -->
        <el-row>
          <el-col :span="24">
            <div class="map-container">
              <div id="mapContainer" ref="mapContainerRef" style="height: 300px; width: 100%"></div>
              <div class="map-tip">点击地图可获取经纬度坐标</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 多媒体区域 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Picture /></el-icon>
            <span>图片上传</span>
          </div>
        </template>

        <el-row>
          <el-col :span="24">
            <el-upload
              class="image-uploader"
              action="/api/upload/image"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleImageSuccess"
              :before-upload="beforeImageUpload"
              :on-error="handleUploadError"
              accept="image/jpeg,image/png,image/gif"
            >
              <div class="upload-trigger">
                <div v-if="formData.deviceImg" class="image-preview">
                  <img :src="formData.deviceImg" alt="预览图片" />
                  <div class="image-actions">
                    <el-button link type="danger" @click.stop="removeImage">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <div>点击上传图片</div>
                  <div class="upload-tip">支持 jpg/png/gif，不超过 5MB</div>
                </div>
              </div>
            </el-upload>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><VideoCamera /></el-icon>
            <span>视频上传</span>
          </div>
        </template>

        <el-row>
          <el-col :span="24">
            <el-upload
              class="video-uploader"
              action="/api/upload/video"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleVideoSuccess"
              :before-upload="beforeVideoUpload"
              :on-error="handleUploadError"
              accept="video/mp4,video/avi,video/mov"
            >
              <div class="upload-trigger">
                <div v-if="formData.deviceVideo" class="video-preview">
                  <video :src="formData.deviceVideo" controls></video>
                  <div class="video-actions">
                    <el-button link type="danger" @click.stop="removeVideo">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon><Plus /></el-icon>
                  <div>点击上传视频</div>
                  <div class="upload-tip">支持 mp4/avi/mov，不超过 200MB</div>
                </div>
              </div>
            </el-upload>
          </el-col>
        </el-row>
      </el-card>

      <!-- 来源信息区域 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Link /></el-icon>
            <span>来源信息</span>
            <el-tag type="warning" size="small">可选</el-tag>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="新闻标题" prop="deviceNewsTitle">
              <el-input
                v-model="formData.deviceNewsTitle"
                placeholder="请输入新闻标题"
                maxlength="255"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="新闻链接" prop="deviceNewsLink">
              <el-input
                v-model="formData.deviceNewsLink"
                placeholder="https://..."
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="新闻时间" prop="deviceNewsTime">
              <el-date-picker
                v-model="formData.deviceNewsTime"
                type="datetime"
                placeholder="请选择时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          <el-icon><Check /></el-icon>
          提交录入
        </el-button>
        <el-button type="success" plain @click="submitAndContinue">
          提交并继续录入
        </el-button>
      </div>
    </el-form>

    <!-- 提交结果弹窗 -->
    <el-dialog v-model="resultDialog.visible" title="录入结果" width="400px">
      <div class="result-content">
        <el-icon :size="48" :color="resultDialog.success ? '#67C23A' : '#F56C6C'">
          <CircleCheck v-if="resultDialog.success" />
          <CircleClose v-else />
        </el-icon>
        <div class="result-message">{{ resultDialog.message }}</div>
        <div v-if="resultDialog.success && resultDialog.deviceId" class="result-id">
          信息ID: {{ resultDialog.deviceId }}
        </div>
      </div>
      <template #footer>
        <el-button @click="resultDialog.visible = false">关闭</el-button>
        <el-button v-if="resultDialog.success" type="primary" @click="goToDetail">
          查看详情
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  Document, Collection, Location, Picture, VideoCamera, 
  Link, Plus, Delete, Search, Check, CircleCheck, CircleClose
} from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const userStore = useUserStore()

// 表单引用
const formRef = ref(null)

// 加载状态
const submitting = ref(false)
const geocodeLoading = ref(false)

// 地图相关
const mapContainerRef = ref(null)
let map = null
let marker = null

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 表单数据
const formData = reactive({
  // 基础信息
  deviceName: '',
  deviceIntroduce: '',
  devicePrice: '',
  deviceUsingUnit: '万元',
  deviceUseYear: '',
  
  // 分类信息
  deviceClassId: null,
  deviceStyleId: null,
  deviceTypeId: null,
  
  // 地理位置
  deviceCountryId: null,
  deviceLocation: '',
  deviceLongitude: '',
  deviceLatitude: '',
  
  // 多媒体
  deviceImg: '',
  deviceVideo: '',
  
  // 来源信息
  deviceNewsTitle: '',
  deviceNewsLink: '',
  deviceNewsTime: ''
})

// 下拉列表数据
const classList = ref([])
const styleList = ref([])
const typeList = ref([])
const countryList = ref([])

// 分类预览文本
const categoryPreview = computed(() => {
  const classItem = classList.value.find(c => c.id === formData.deviceClassId)
  const styleItem = styleList.value.find(s => s.id === formData.deviceStyleId)
  const typeItem = typeList.value.find(t => t.id === formData.deviceTypeId)
  
  if (classItem && styleItem && typeItem) {
    return `${classItem.name} → ${styleItem.name} → ${typeItem.name}`
  }
  return ''
})

// 表单校验规则
const formRules = {
  deviceName: [
    { required: true, message: '请输入信息名称', trigger: 'blur' },
    { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
  ],
  deviceClassId: [
    { required: true, message: '请选择一级分类', trigger: 'change' }
  ],
  deviceStyleId: [
    { required: true, message: '请选择二级分类', trigger: 'change' }
  ],
  deviceTypeId: [
    { required: true, message: '请选择三级分类', trigger: 'change' }
  ]
}

// 提交结果弹窗
const resultDialog = reactive({
  visible: false,
  success: false,
  message: '',
  deviceId: null
})

// ========== 方法 ==========

/**
 * 加载一级分类列表
 */
const loadClassList = async () => {
  try {
    const res = await fetch('/api/category/classList')
    const data = await res.json()
    if (data.code === 200) {
      classList.value = data.data
    }
  } catch (error) {
    console.error('加载分类列表失败', error)
  }
}

/**
 * 加载二级分类列表
 */
const loadStyleList = async (classId) => {
  if (!classId) {
    styleList.value = []
    return
  }
  try {
    const res = await fetch(`/api/category/styles/${classId}`)
    const data = await res.json()
    if (data.code === 200) {
      styleList.value = data.data
    }
  } catch (error) {
    console.error('加载二级分类失败', error)
  }
}

/**
 * 加载三级分类列表
 */
const loadTypeList = async (styleId) => {
  if (!styleId) {
    typeList.value = []
    return
  }
  try {
    const res = await fetch(`/api/category/types/${styleId}`)
    const data = await res.json()
    if (data.code === 200) {
      typeList.value = data.data
    }
  } catch (error) {
    console.error('加载三级分类失败', error)
  }
}

/**
 * 加载国家列表
 */
const loadCountryList = async () => {
  try {
    const res = await fetch('/api/country/list')
    const data = await res.json()
    if (data.code === 200) {
      countryList.value = data.data
    }
  } catch (error) {
    console.error('加载国家列表失败', error)
  }
}

/**
 * 一级分类变化
 */
const handleClassChange = (value) => {
  formData.deviceStyleId = null
  formData.deviceTypeId = null
  loadStyleList(value)
}

/**
 * 二级分类变化
 */
const handleStyleChange = (value) => {
  formData.deviceTypeId = null
  loadTypeList(value)
}

/**
 * 根据地址获取经纬度
 */
const getLocationByAddress = async () => {
  if (!formData.deviceLocation) {
    ElMessage.warning('请先输入具体地址')
    return
  }
  
  geocodeLoading.value = true
  try {
    const res = await fetch('/api/map/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: formData.deviceLocation })
    })
    const data = await res.json()
    if (data.code === 200 && data.data) {
      formData.deviceLongitude = data.data.lng
      formData.deviceLatitude = data.data.lat
      updateMapMarker(data.data.lng, data.data.lat)
      ElMessage.success('经纬度获取成功')
    } else {
      ElMessage.warning('未找到该地址的经纬度信息')
    }
  } catch (error) {
    ElMessage.error('获取经纬度失败')
  } finally {
    geocodeLoading.value = false
  }
}

/**
 * 初始化地图
 */
const initMap = () => {
  if (!mapContainerRef.value || window.AMap === undefined) {
    console.warn('地图API未加载')
    return
  }
  
  map = new window.AMap.Map('mapContainer', {
    zoom: 12,
    center: [116.397428, 39.90923], // 默认北京
    resizeEnable: true
  })
  
  // 点击地图获取经纬度
  map.on('click', (e) => {
    const lng = e.lnglat.getLng()
    const lat = e.lnglat.getLat()
    formData.deviceLongitude = lng.toFixed(6)
    formData.deviceLatitude = lat.toFixed(6)
    updateMapMarker(lng, lat)
  })
}

/**
 * 更新地图标记
 */
const updateMapMarker = (lng, lat) => {
  if (!map) return
  
  if (marker) {
    marker.setPosition([lng, lat])
  } else {
    marker = new window.AMap.Marker({
      position: [lng, lat],
      draggable: true
    })
    marker.on('dragend', (e) => {
      const position = e.target.getPosition()
      formData.deviceLongitude = position.getLng().toFixed(6)
      formData.deviceLatitude = position.getLat().toFixed(6)
    })
    map.add(marker)
  }
  map.setCenter([lng, lat])
  map.setZoom(14)
}

/**
 * 图片上传前校验
 */
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

/**
 * 视频上传前校验
 */
const beforeVideoUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  const isLt200M = file.size / 1024 / 1024 < 200
  
  if (!isVideo) {
    ElMessage.error('只能上传视频文件')
    return false
  }
  if (!isLt200M) {
    ElMessage.error('视频大小不能超过 200MB')
    return false
  }
  return true
}

/**
 * 图片上传成功
 */
const handleImageSuccess = (response) => {
  if (response.code === 200) {
    formData.deviceImg = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

/**
 * 视频上传成功
 */
const handleVideoSuccess = (response) => {
  if (response.code === 200) {
    formData.deviceVideo = response.data.url
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error(response.message || '视频上传失败')
  }
}

/**
 * 上传错误处理
 */
const handleUploadError = (error) => {
  console.error('上传失败', error)
  ElMessage.error('文件上传失败，请重试')
}

/**
 * 删除图片
 */
const removeImage = () => {
  formData.deviceImg = ''
}

/**
 * 删除视频
 */
const removeVideo = () => {
  formData.deviceVideo = ''
}

/**
 * 重置表单
 */
const resetForm = () => {
  formRef.value?.resetFields()
  Object.keys(formData).forEach(key => {
    if (key === 'deviceUsingUnit') {
      formData[key] = '万元'
    } else if (typeof formData[key] === 'string') {
      formData[key] = ''
    } else {
      formData[key] = null
    }
  })
  // 清空地图标记
  if (marker) {
    map?.remove(marker)
    marker = null
  }
}

/**
 * 提交表单
 */
const submitForm = async () => {
  // 表单校验
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  submitting.value = true
  try {
    const res = await fetch('/api/admin/data/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    
    if (data.code === 200) {
      resultDialog.success = true
      resultDialog.message = '数据录入成功'
      resultDialog.deviceId = data.data.deviceId
      resultDialog.visible = true
      resetForm()
    } else {
      resultDialog.success = false
      resultDialog.message = data.message || '录入失败'
      resultDialog.visible = true
    }
  } catch (error) {
    console.error('提交失败', error)
    resultDialog.success = false
    resultDialog.message = '网络错误，请重试'
    resultDialog.visible = true
  } finally {
    submitting.value = false
  }
}

/**
 * 提交并继续录入
 */
const submitAndContinue = async () => {
  await submitForm()
  // 重置表单但不清空分类数据
  if (resultDialog.success) {
    // 保留分类和国家数据
    const savedClassId = formData.deviceClassId
    const savedStyleId = formData.deviceStyleId
    const savedTypeId = formData.deviceTypeId
    const savedCountryId = formData.deviceCountryId
    
    resetForm()
    
    formData.deviceClassId = savedClassId
    formData.deviceStyleId = savedStyleId
    formData.deviceTypeId = savedTypeId
    formData.deviceCountryId = savedCountryId
    
    // 重新加载下级分类
    if (savedClassId) loadStyleList(savedClassId)
    if (savedStyleId) loadTypeList(savedStyleId)
  }
}

/**
 * 跳转详情页
 */
const goToDetail = () => {
  resultDialog.visible = false
  if (resultDialog.deviceId) {
    router.push(`/detail/${resultDialog.deviceId}`)
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadClassList()
  loadCountryList()
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
    map = null
  }
})

// 监听经纬度变化，同步地图标记
watch([() => formData.deviceLongitude, () => formData.deviceLatitude], ([lng, lat]) => {
  if (lng && lat && map) {
    updateMapMarker(parseFloat(lng), parseFloat(lat))
  }
})
</script>

<style scoped lang="scss">
.data-entry-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  
  .page-header {
    margin-bottom: 24px;
    
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #303133;
    }
    
    p {
      margin: 0;
      color: #909399;
      font-size: 14px;
      
      .required-star {
        color: #f56c6c;
      }
    }
  }
  
  .entry-form {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .form-card {
    margin-bottom: 24px;
    border-radius: 12px;
    
    :deep(.el-card__header) {
      background: #fafbfc;
      border-bottom: 1px solid #ebeef5;
      padding: 12px 20px;
      
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .el-icon {
          font-size: 18px;
          color: #409eff;
        }
        
        span {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 24px;
    }
  }
  
  .map-container {
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 8px;
    
    .map-tip {
      padding: 8px 12px;
      background: #f5f7fa;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }
  
  .upload-trigger {
    .upload-placeholder {
      width: 200px;
      height: 150px;
      border: 1px dashed #dcdfe6;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
      }
      
      .el-icon {
        font-size: 32px;
        color: #c0c4cc;
        margin-bottom: 8px;
      }
      
      .upload-tip {
        font-size: 12px;
        color: #c0c4cc;
        margin-top: 4px;
      }
    }
    
    .image-preview,
    .video-preview {
      position: relative;
      width: 300px;
      
      img, video {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #ebeef5;
      }
      
      .image-actions,
      .video-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        padding: 4px;
      }
    }
  }
  
  .form-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }
  
  .result-content {
    text-align: center;
    padding: 20px;
    
    .el-icon {
      margin-bottom: 16px;
    }
    
    .result-message {
      font-size: 16px;
      color: #303133;
      margin-bottom: 8px;
    }
    
    .result-id {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>