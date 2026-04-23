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
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
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
              :disabled="hasChildren(row)"
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
        <!-- 显示父级分类 -->
        <el-form-item label="父级分类" v-if="formData.level > 1 && parentCategoryName">
          <div class="category-path">
            <span class="path-item">{{ parentCategoryName }}</span>
          </div>
        </el-form-item>

        <el-form-item :label="`分类名称`" prop="name">
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
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Folder, Document, Memo } from '@element-plus/icons-vue'
import {
  getCategoryTree,
  searchCategories,
  createClass,
  updateClass,
  deleteClass,
  createStyle,
  updateStyle,
  deleteStyle,
  createType,
  updateType,
  deleteType,
  convertToBackendData
} from '@/api/category'

// 列表相关
const tableData = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const originalTreeData = ref([]) // 存储原始完整树数据

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
  description: ''
})

// 父级分类名称（用于显示）
const parentCategoryName = ref('')

// 级别配置
const levelConfig = {
  1: { name: '一级分类', tagType: 'primary', color: '#409EFF' },
  2: { name: '二级分类', tagType: 'success', color: '#67C23A' },
  3: { name: '三级分类', tagType: 'warning', color: '#E6A23C' }
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

// 获取分类数据
const fetchCategories = async () => {
  loading.value = true
  try {
    let res
    if (searchKeyword.value) {
      res = await searchCategories(searchKeyword.value)
    } else {
      res = await getCategoryTree()
    }
    
    if (res.code === 200 && Array.isArray(res.data)) {
      originalTreeData.value = res.data
      // 如果有关键字，使用前端过滤（可选，后端搜索已返回匹配的树）
      if (searchKeyword.value) {
        tableData.value = originalTreeData.value
      } else {
        tableData.value = originalTreeData.value
      }
      const counts = countCategories(originalTreeData.value)
      Object.assign(stats, counts)
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 前端过滤搜索（保留，但后端搜索已实现，可简化）
const handleSearch = () => {
  if (!searchKeyword.value) {
    tableData.value = originalTreeData.value
  } else {
    // 如果希望前端过滤，可以调用 filterTreeData
    tableData.value = filterTreeData(originalTreeData.value, searchKeyword.value)
  }
}

// 在树中查找节点
const findNodeInTree = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

// 获取父级分类名称
const getParentName = (parentId, level) => {
  if (!parentId) return ''
  const parent = findNodeInTree(originalTreeData.value, parentId)
  return parent ? parent.name : ''
}

// 显示新增对话框
const showAddDialog = async (parentNode, level) => {
  dialogTitle.value = `新增${getLevelText(level)}`
  
  formData.id = null
  formData.parentId = parentNode?.id || null
  formData.level = level
  formData.name = ''
  formData.description = ''

  if (parentNode) {
    parentCategoryName.value = parentNode.name
  } else {
    parentCategoryName.value = ''
  }

  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row) => {
  dialogTitle.value = `编辑${getLevelText(row.level)}分类`
  
  formData.id = row.id
  formData.parentId = row.parentId
  formData.level = row.level
  formData.name = row.name
  formData.description = row.description || ''
  parentCategoryName.value = getParentName(row.parentId, row.level)

  dialogVisible.value = true
}

// 保存分类
const saveCategory = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const backendData = convertToBackendData(formData)
      let res
      
      if (formData.id) {
        // 更新操作
        switch (formData.level) {
          case 1:
            res = await updateClass(backendData)
            break
          case 2:
            res = await updateStyle(backendData)
            break
          case 3:
            res = await updateType(backendData)
            break
        }
      } else {
        // 新增操作
        switch (formData.level) {
          case 1:
            res = await createClass(backendData)
            break
          case 2:
            res = await createStyle(formData.parentId, backendData)
            break
          case 3:
            res = await createType(formData.parentId, backendData)
            break
        }
      }

      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        await fetchCategories()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error(error.response?.data?.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

// 判断是否有子分类
const hasChildren = (row) => {
  return row.children && row.children.length > 0
}

// 删除分类
const deleteCategory = async (row) => {
  if (hasChildren(row)) {
    ElMessage.warning(`请先删除${getLevelText(row.level + 1)}分类`)
    return
  }

  ElMessageBox.confirm(
    `确定要删除分类"${row.name}"吗？此操作不可恢复。`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      let res
      switch (row.level) {
        case 1:
          res = await deleteClass(row.id)
          break
        case 2:
          res = await deleteStyle(row.id)
          break
        case 3:
          res = await deleteType(row.id)
          break
      }
      
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await fetchCategories()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
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

.level-tag {
  margin-left: 8px;
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
</style>