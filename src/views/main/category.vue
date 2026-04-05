<template>
  <div class="category-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">三级分类管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog(null, 1)">
              <el-icon><Plus /></el-icon>
              新增一级分类
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索分类名称"
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

      <!-- 分类统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="一级分类" :value="stats.level1" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="二级分类" :value="stats.level2" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="三级分类" :value="stats.level3" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总计" :value="stats.total" />
        </el-col>
      </el-row>

      <!-- 分类树形表格 -->
      <el-table
        :data="tableData"
        row-key="id"
        border
        v-loading="loading"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="name" label="分类名称" min-width="280">
          <template #default="{ row }">
            <div class="category-name" :style="{ paddingLeft: (row.level - 1) * 20 + 'px' }">
              <el-icon :color="getLevelColor(row.level)">
                <Folder v-if="row.level === 1" />
                <Document v-else-if="row.level === 2" />
                <Memo v-else />
              </el-icon>
              <span class="name-text">{{ row.name }}</span>
              <el-tag :type="getLevelTagType(row.level)" size="small" class="level-tag">
                {{ getLevelText(row.level) }}
              </el-tag>
              <el-tag v-if="row.status === 0" type="info" size="small" class="status-tag">
                已禁用
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button
              type="success"
              link
              @click="showAddDialog(row, row.level + 1)"
              v-if="row.level < 3"
            >
              添加{{ getLevelText(row.level + 1) }}
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteCategory(row)"
              :disabled="hasChildren(row) || hasReference(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑分类对话框 -->
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
      >
        <!-- 显示分类路径 -->
        <el-form-item label="分类路径" v-if="formData.level > 1">
          <div class="category-path">
            <template v-for="(ancestor, idx) in ancestorPath" :key="idx">
              <span class="path-item">{{ ancestor.name }}</span>
              <el-icon v-if="idx < ancestorPath.length - 1"><ArrowRight /></el-icon>
            </template>
          </div>
        </el-form-item>

        <el-form-item :label="`${getLevelText(formData.level)}名称`" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="`请输入${getLevelText(formData.level)}名称`"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="`请输入${getLevelText(formData.level)}描述`"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="排序序号" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="999"
            controls-position="right"
          />
          <div class="form-tip">数字越小，排序越靠前</div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 分类引用检查对话框 -->
    <el-dialog v-model="referenceDialogVisible" title="分类引用详情" width="800px">
      <el-alert
        :title="`分类【${currentCategory?.name}】被以下 ${referenceData.length} 条数据引用，无法删除`"
        type="warning"
        show-icon
      />
      <el-table :data="referenceData" stripe style="margin-top: 16px" max-height="400">
        <el-table-column prop="deviceName" label="信息名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="deviceClass" label="一级分类" width="150" />
        <el-table-column prop="deviceStyle" label="二级分类" width="150" />
        <el-table-column prop="deviceType" label="三级分类" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
      </el-table>
      <template #footer">
        <el-button @click="referenceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Folder, Document, Memo, ArrowRight } from '@element-plus/icons-vue'
import {
  getCategoryTree,
  getCategoryStats,
  saveCategory as saveCategoryApi,
  updateCategory,
  deleteCategory as deleteCategoryApi,
  checkCategoryReference
} from '@/api/category'

// 列表相关
const tableData = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 统计数据
const stats = reactive({
  level1: 0,
  level2: 0,
  level3: 0,
  total: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  id: null,
  parentId: null,
  level: 1,
  name: '',
  description: '',
  sortOrder: 0,
  status: 1
})

// 祖先路径
const ancestorPath = ref([])

// 引用检查
const referenceDialogVisible = ref(false)
const currentCategory = ref(null)
const referenceData = ref([])

// 引用缓存（用于快速判断）
const referenceCache = ref(new Map())

// 级别配置
const levelConfig = {
  1: { name: '一级分类', tagType: 'primary', color: '#409EFF', icon: 'Folder' },
  2: { name: '二级分类', tagType: 'success', color: '#67C23A', icon: 'Document' },
  3: { name: '三级分类', tagType: 'warning', color: '#E6A23C', icon: 'Memo' }
}

const getLevelColor = (level) => levelConfig[level]?.color || '#909399'
const getLevelTagType = (level) => levelConfig[level]?.tagType || 'info'
const getLevelText = (level) => levelConfig[level]?.name || '未知'

// 表单验证规则
const formRules = computed(() => ({
  name: [
    { required: true, message: `请输入${getLevelText(formData.level)}名称`, trigger: 'blur' },
    { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
  ]
}))

// 构建树形数据
const buildTreeData = (categories) => {
  const map = new Map()
  const roots = []

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach(cat => {
    const node = map.get(cat.id)
    if (!cat.parentId || cat.parentId === 0) {
      roots.push(node)
    } else {
      const parent = map.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  })

  // 递归排序
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    nodes.forEach(node => {
      if (node.children?.length) sortChildren(node.children)
    })
  }
  sortChildren(roots)

  return roots
}

// 过滤树形数据
const filterTreeData = (nodes, keyword) => {
  if (!keyword) return nodes

  const result = []
  for (const node of nodes) {
    const matches = node.name.includes(keyword)
    const filteredChildren = node.children ? filterTreeData(node.children, keyword) : []

    if (matches || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren
      })
    }
  }
  return result
}

// 统计分类数量
const countCategories = (nodes) => {
  let counts = { level1: 0, level2: 0, level3: 0 }
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (node.level === 1) counts.level1++
      else if (node.level === 2) counts.level2++
      else if (node.level === 3) counts.level3++
      if (node.children?.length) traverse(node.children)
    }
  }
  traverse(nodes)
  counts.total = counts.level1 + counts.level2 + counts.level3
  return counts
}

// 获取分类数据
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getCategoryTree()
    if (res.code === 200 && res.data) {
      const filtered = filterTreeData(res.data, searchKeyword.value)
      tableData.value = filtered
      const counts = countCategories(res.data)
      Object.assign(stats, counts)
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  fetchCategories()
}

// 获取祖先路径
const getAncestorPath = async (categoryId) => {
  try {
    const res = await getCategoryAncestors(categoryId)
    if (res.code === 200) {
      ancestorPath.value = res.data || []
    }
  } catch (error) {
    console.error('获取祖先路径失败:', error)
    ancestorPath.value = []
  }
}

// 显示新增对话框
const showAddDialog = async (parentNode, level) => {
  dialogTitle.value = `新增${getLevelText(level)}分类`
  
  formData.id = null
  formData.parentId = parentNode?.id || null
  formData.level = level
  formData.name = ''
  formData.description = ''
  formData.sortOrder = 0
  formData.status = 1

  if (parentNode && level > 1) {
    await getAncestorPath(parentNode.id)
  } else {
    ancestorPath.value = []
  }

  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = async (row) => {
  dialogTitle.value = `编辑${getLevelText(row.level)}分类`
  
  formData.id = row.id
  formData.parentId = row.parentId
  formData.level = row.level
  formData.name = row.name
  formData.description = row.description || ''
  formData.sortOrder = row.sortOrder || 0
  formData.status = row.status !== undefined ? row.status : 1

  if (row.parentId && row.parentId > 0) {
    await getAncestorPath(row.id)
  } else {
    ancestorPath.value = []
  }

  dialogVisible.value = true
}

// 保存分类
const saveCategory = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = { ...formData }
      let res
      
      if (formData.id) {
        res = await updateCategory(data)
      } else {
        res = await saveCategoryApi(data)
      }

      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchCategories()
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

// 判断是否有子分类
const hasChildren = (row) => {
  return row.children && row.children.length > 0
}

// 判断是否有引用
const hasReference = (row) => {
  return referenceCache.value.get(row.id) === true
}

// 删除分类
const deleteCategory = async (row) => {
  if (hasChildren(row)) {
    ElMessage.warning(`请先删除${getLevelText(row.level + 1)}分类`)
    return
  }

  try {
    const refRes = await checkCategoryReference(row.id)
    if (refRes.code === 200 && refRes.data && refRes.data.length > 0) {
      currentCategory.value = row
      referenceData.value = refRes.data
      referenceDialogVisible.value = true
      return
    }
  } catch (error) {
    console.error('检查引用失败:', error)
  }

  ElMessageBox.confirm(
    `确定要删除分类"${row.name}"吗？此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await deleteCategoryApi(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchCategories()
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
  fetchCategories()
})
</script>

<style scoped>
.category-management-container {
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

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-text {
  font-weight: 500;
}

.level-tag, .status-tag {
  margin-left: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.category-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.path-item {
  color: #409EFF;
  font-weight: 500;
}

/* 级联选择器自定义样式 */
:deep(.el-cascader-node) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cascader-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cascader-node .level-tag {
  margin-left: 8px;
}
</style>