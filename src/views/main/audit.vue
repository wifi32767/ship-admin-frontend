<template>
  <div class="audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">录入信息审核</span>
          <div class="header-actions">
            <el-radio-group v-model="auditStatus" @change="handleStatusChange">
              <el-radio-button label="pending">待审核</el-radio-button>
              <el-radio-button label="approved">已通过</el-radio-button>
              <el-radio-button label="rejected">已拒绝</el-radio-button>
              <el-radio-button label="all">全部</el-radio-button>
            </el-radio-group>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题名称"
              style="width: 200px; margin-left: 12px"
              clearable
              @clear="fetchAuditList"
              @keyup.enter="fetchAuditList"
            >
              <template #append>
                <el-button @click="fetchAuditList">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table :data="auditList" stripe v-loading="loading">
        <el-table-column prop="deviceName" label="信息名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="200">
          <template #default="{ row }">
            <template v-if="row.deviceClass?.name">
              <el-tag size="small" type="info">{{ row.deviceClass.name }}</el-tag>
            </template>
            <template v-if="row.deviceStyle?.name">
              <span class="category-sep">/</span>
              <el-tag size="small" type="success">{{ row.deviceStyle.name }}</el-tag>
            </template>
            <template v-if="row.deviceType?.name">
              <span class="category-sep">/</span>
              <el-tag size="small" type="warning">{{ row.deviceType.name }}</el-tag>
            </template>
            <template v-if="!row.deviceClass?.name && !row.deviceStyle?.name && !row.deviceType?.name">
              -
            </template>
          </template>
        </el-table-column>
        <el-table-column label="所属国家" width="120">
          <template #default="{ row }">
            {{ row.deviceCountry?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="deviceUsingUnit" label="实施单位" min-width="150" show-overflow-tooltip />
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.deviceInsqlTime) }}
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="100">
          <template #default>
            <span>未知</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.auditFlag)">
              {{ getStatusText(row.auditFlag) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button
              v-if="row.auditFlag === 0 || row.auditFlag === 2"
              type="success"
              link
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.auditFlag === 0 || row.auditFlag === 1"
              type="danger"
              link
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchAuditList"
        @current-change="fetchAuditList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="信息详情" width="800px" destroy-on-close>
      <div v-if="currentItem" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="信息名称" span="2">
            {{ currentItem.deviceName }}
          </el-descriptions-item>
          <el-descriptions-item label="分类" span="2">
            <template v-if="currentItem.deviceClass?.name">
              {{ currentItem.deviceClass.name }}
              <template v-if="currentItem.deviceStyle?.name"> / {{ currentItem.deviceStyle.name }}</template>
              <template v-if="currentItem.deviceType?.name"> / {{ currentItem.deviceType.name }}</template>
            </template>
            <template v-else>-</template>
          </el-descriptions-item>
          <el-descriptions-item label="所属国家">
            {{ currentItem.deviceCountry?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="投产年份">
            {{ currentItem.deviceUseYear || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="投入成本">
            {{ currentItem.devicePrice || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="实施单位" span="2">
            {{ currentItem.deviceUsingUnit || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="具体地址" span="2">
            {{ currentItem.deviceLocation || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="经纬度" span="2">
            {{ currentItem.deviceLongitude || '-' }}, {{ currentItem.deviceLatitude || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentItem.deviceIntroduce" class="section">
          <h4>详情介绍</h4>
          <div class="rich-text" v-html="currentItem.deviceIntroduce"></div>
        </div>

        <div v-if="imagesList.length" class="section">
          <h4>相关图片</h4>
          <div class="image-gallery">
            <el-image
              v-for="(img, idx) in imagesList"
              :key="idx"
              :src="img"
              :preview-src-list="imagesList"
              fit="cover"
              class="gallery-image"
            />
          </div>
        </div>

        <div v-if="videosList.length" class="section">
          <h4>相关视频</h4>
          <div class="video-list">
            <video
              v-for="(video, idx) in videosList"
              :key="idx"
              :src="video"
              controls
              class="video-item"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            v-if="currentItem && (currentItem.auditFlag === 0 || currentItem.auditFlag === 2)"
            type="success"
            @click="handleApprove(currentItem)"
          >
            审核通过
          </el-button>
          <el-button
            v-if="currentItem && (currentItem.auditFlag === 0 || currentItem.auditFlag === 1)"
            type="danger"
            @click="handleReject(currentItem)"
          >
            拒绝
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectVisible" title="拒绝原因" width="500px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因（将记录到审核备注）"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getAuditList, auditAction } from '@/api/audit'

const auditStatus = ref('pending')
const searchKeyword = ref('')
const auditList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const currentItem = ref(null)

const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectItem = ref(null)

// 处理图片和视频列表
const imagesList = computed(() => {
  if (!currentItem.value || !currentItem.value.deviceImg) return []
  return currentItem.value.deviceImg.split(',').filter(url => url.trim())
})
const videosList = computed(() => {
  if (!currentItem.value || !currentItem.value.deviceVideo) return []
  return currentItem.value.deviceVideo.split(',').filter(url => url.trim())
})

// 构造三级分类显示名称
const getCategoryName = (row) => {
  const parts = []
  if (row.deviceClass?.name) parts.push(row.deviceClass.name)
  if (row.deviceStyle?.name) parts.push(row.deviceStyle.name)
  if (row.deviceType?.name) parts.push(row.deviceType.name)
  return parts.length ? parts.join(' / ') : '未分类'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString('zh-CN')
}

const getStatusType = (flag) => {
  if (flag === 0) return 'warning'
  if (flag === 1) return 'success'
  if (flag === 2) return 'danger'
  return 'info'
}

const getStatusText = (flag) => {
  if (flag === 0) return '待审核'
  if (flag === 1) return '已通过'
  if (flag === 2) return '已拒绝'
  return '未知'
}

// 获取审核列表
const fetchAuditList = async () => {
  loading.value = true
  try {
    let status = ''
    if (auditStatus.value === 'pending') status = 0
    else if (auditStatus.value === 'approved') status = 1
    else if (auditStatus.value === 'rejected') status = 2
    else if (auditStatus.value === 'all') status = 3

    const res = await getAuditList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: status
    })
    
    // 新接口返回 code: 200 表示成功
    if (res.code === 200) {
      let list = []
      let totalCount = 0
      // 兼容两种返回： res.data 为数组，或 res.data 包含 list/total
      if (Array.isArray(res.data)) {
        list = res.data
        totalCount = list.length
        // 如果同时有 total 字段（例如分页响应）则优先使用
        if (res.total !== undefined) totalCount = res.total
      } else if (res.data && Array.isArray(res.data.list)) {
        list = res.data.list
        totalCount = res.data.total || list.length
      } else if (res.data && Array.isArray(res.data.records)) {
        list = res.data.records
        totalCount = res.data.total || list.length
      } else {
        list = []
      }
      auditList.value = list
      total.value = totalCount
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取审核列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = () => {
  pageNum.value = 1
  fetchAuditList()
}

const viewDetail = (row) => {
  currentItem.value = row
  detailVisible.value = true
}

const handleApprove = async (row) => {
  ElMessageBox.confirm(`确定要通过信息"${row.deviceName}"的审核吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await auditAction(row.id, 1)
      if (res.code === 0) {
        ElMessage.success('审核通过')
        detailVisible.value = false
        fetchAuditList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      ElMessage.error('操作失败')
    }
  }).catch(() => {})
}

const handleReject = (row) => {
  rejectItem.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    const res = await auditAction(rejectItem.value.id, 2)
    if (res.code === 0) {
      ElMessage.success(`已拒绝该信息，原因：${rejectReason.value}`)
      rejectVisible.value = false
      detailVisible.value = false
      fetchAuditList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchAuditList()
})
</script>

<style scoped>
.audit-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.card-header .title { font-size: 16px; font-weight: bold; }
.header-actions { display: flex; align-items: center; }
.detail-content { max-height: 60vh; overflow-y: auto; }
.section { margin-top: 20px; }
.section h4 { margin-bottom: 12px; font-size: 14px; font-weight: bold; color: #303133; border-left: 3px solid #409EFF; padding-left: 10px; }
.rich-text { background-color: #f5f7fa; padding: 12px; border-radius: 4px; line-height: 1.6; }
.image-gallery { display: flex; flex-wrap: wrap; gap: 10px; }
.gallery-image { width: 120px; height: 120px; border-radius: 4px; cursor: pointer; }
.video-list { display: flex; flex-direction: column; gap: 10px; }
.video-item { width: 100%; max-height: 300px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }
.category-sep {
  margin: 0 4px;
  color: #909399;
}
</style>