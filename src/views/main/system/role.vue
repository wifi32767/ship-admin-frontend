<template>
  <div class="roles-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">角色权限管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增角色
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索角色名称/角色标识"
              style="width: 200px"
              clearable
              @clear="fetchRoleList"
              @keyup.enter="fetchRoleList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <!-- 角色列表 -->
      <el-table :data="roleList" stripe v-loading="loading">
        <el-table-column prop="roleId" label="角色ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.roleName)" size="small">
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roleKey" label="角色标识" width="150">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.roleKey }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roleSort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="toggleRoleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewRoleUsers(row)">
              {{ row.userCount || 0 }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button type="success" link @click="showPermissionDialog(row)">
              权限配置
            </el-button>
            <el-button type="danger" link @click="deleteRole(row)" :disabled="row.roleKey === 'admin'">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchRoleList"
        @current-change="fetchRoleList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      destroy-on-close
      @close="closeDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="formData.roleName"
            placeholder="请输入角色名称，如：数据录入员"
            maxlength="30"
          />
        </el-form-item>

        <el-form-item label="角色标识" prop="roleKey">
          <el-input
            v-model="formData.roleKey"
            placeholder="请输入角色标识，如：editor"
            maxlength="50"
          />
          <div class="form-tip">角色标识用于代码中判断权限，建议使用英文</div>
        </el-form-item>

        <el-form-item label="显示顺序" prop="roleSort">
          <el-input-number
            v-model="formData.roleSort"
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

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRole" :loading="saving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionVisible"
      title="权限配置"
      width="800px"
      destroy-on-close
    >
      <div class="permission-header">
        <span class="role-info">当前角色：{{ currentRole?.roleName }}</span>
        <div class="permission-actions">
          <el-button size="small" @click="expandAll">展开全部</el-button>
          <el-button size="small" @click="collapseAll">收起全部</el-button>
          <el-button size="small" @click="checkAll">全选</el-button>
          <el-button size="small" @click="uncheckAll">取消全选</el-button>
        </div>
      </div>

      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ data }">
          <div class="permission-node">
            <el-icon :color="getPermissionIconColor(data.type)">
              <component :is="getPermissionIcon(data.type)" />
            </el-icon>
            <span class="permission-name">{{ data.name }}</span>
            <span class="permission-code">{{ data.permission }}</span>
            <el-tag v-if="data.type" :type="getPermissionTagType(data.type)" size="small">
              {{ getPermissionTypeText(data.type) }}
            </el-tag>
          </div>
        </template>
      </el-tree>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissions" :loading="permissionSaving">
            保存权限配置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 角色用户列表对话框 -->
    <el-dialog
      v-model="userListVisible"
      :title="`角色用户 - ${currentRole?.roleName}`"
      width="700px"
    >
      <el-table :data="roleUsers" stripe v-loading="userListLoading">
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="nickName" label="昵称" min-width="120" />
        <el-table-column prop="phonenumber" label="手机号" width="120" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="userPageNum"
        v-model:page-size="userPageSize"
        :total="userTotal"
        layout="total, sizes, prev, pager"
        @size-change="fetchRoleUsers"
        @current-change="fetchRoleUsers"
        style="margin-top: 20px; justify-content: flex-end"
        size="small"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getRoleList,
  getRoleDetail,
  addRole,
  updateRole,
  deleteRole as deleteRoleApi,
  toggleRoleStatus as toggleRoleStatusApi,
  getRolePermissionTree,
  updateRolePermissions,
  getRoleUsers
} from '@/api/system'

// 列表相关
const roleList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  roleId: null,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: 1,
  remark: ''
})

// 表单验证规则
const formRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '角色标识只能包含小写字母和下划线', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 权限配置相关
const permissionVisible = ref(false)
const permissionTreeRef = ref()
const currentRole = ref(null)
const permissionTree = ref([])
const permissionSaving = ref(false)

const treeProps = {
  children: 'children',
  label: 'name'
}

// 用户列表相关
const userListVisible = ref(false)
const roleUsers = ref([])
const userListLoading = ref(false)
const userPageNum = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)

// 获取角色标签类型
const getRoleTagType = (roleName) => {
  if (roleName === '管理员') return 'danger'
  if (roleName === '审核员') return 'warning'
  if (roleName === '数据录入员') return 'success'
  return 'info'
}

// 获取权限图标
const getPermissionIcon = (type) => {
  const icons = {
    'menu': 'Grid',
    'button': 'Pointer',
    'api': 'Connection',
    'page': 'Document'
  }
  return icons[type] || 'Folder'
}

// 获取权限图标颜色
const getPermissionIconColor = (type) => {
  const colors = {
    'menu': '#409EFF',
    'button': '#67C23A',
    'api': '#E6A23C',
    'page': '#909399'
  }
  return colors[type] || '#909399'
}

// 获取权限标签类型
const getPermissionTagType = (type) => {
  const types = {
    'menu': 'primary',
    'button': 'success',
    'api': 'warning',
    'page': 'info'
  }
  return types[type] || 'info'
}

// 获取权限类型文本
const getPermissionTypeText = (type) => {
  const texts = {
    'menu': '菜单',
    'button': '按钮',
    'api': '接口',
    'page': '页面'
  }
  return texts[type] || type
}

// 获取角色列表
const fetchRoleList = async () => {
  loading.value = true
  try {
    const res = await getRoleList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    })
    if (res.code === 200 && res.data) {
      roleList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
const showAddDialog = () => {
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = async (row) => {
  dialogTitle.value = '编辑角色'
  try {
    const res = await getRoleDetail(row.roleId)
    if (res.code === 200 && res.data) {
      const data = res.data
      formData.roleId = data.roleId
      formData.roleName = data.roleName
      formData.roleKey = data.roleKey
      formData.roleSort = data.roleSort
      formData.status = data.status
      formData.remark = data.remark
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 重置表单
const resetForm = () => {
  formData.roleId = null
  formData.roleName = ''
  formData.roleKey = ''
  formData.roleSort = 0
  formData.status = 1
  formData.remark = ''
  formRef.value?.resetFields()
}

// 关闭对话框
const closeDialog = () => {
  resetForm()
}

// 保存角色
const saveRole = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      let res
      if (formData.roleId) {
        res = await updateRole(formData)
      } else {
        res = await addRole(formData)
      }

      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchRoleList()
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

// 切换角色状态
const toggleRoleStatus = async (row) => {
  if (row.roleKey === 'admin') {
    ElMessage.warning('管理员角色不能禁用')
    row.status = row.status === 1 ? 0 : 1
    return
  }

  try {
    const res = await toggleRoleStatusApi({
      roleId: row.roleId,
      status: row.status
    })
    if (res.code === 200) {
      ElMessage.success(`已${row.status === 1 ? '启用' : '禁用'}角色`)
    } else {
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

// 删除角色
const deleteRole = (row) => {
  if (row.userCount > 0) {
    ElMessage.warning(`该角色下还有 ${row.userCount} 个用户，请先转移或删除用户`)
    return
  }

  ElMessageBox.confirm(
    `确定要删除角色"${row.roleName}"吗？此操作不可恢复。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteRoleApi(row.roleId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchRoleList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 显示权限配置对话框
const showPermissionDialog = async (row) => {
  currentRole.value = row
  permissionVisible.value = true

  try {
    const res = await getRolePermissionTree(row.roleId)
    if (res.code === 200) {
      permissionTree.value = res.data.tree || []
      // 设置已选中的权限
      const checkedKeys = res.data.checkedKeys || []
      if (checkedKeys.length > 0) {
        permissionTreeRef.value?.setCheckedKeys(checkedKeys)
      }
    }
  } catch (error) {
    console.error('获取权限树失败:', error)
    ElMessage.error('获取权限数据失败')
  }
}

// 展开全部
const expandAll = () => {
  const nodes = permissionTreeRef.value?.getAllNodes() || []
  nodes.forEach(node => permissionTreeRef.value?.setCurrentNode(node))
  // 实际展开所有节点需要遍历设置
  const expandNode = (nodes) => {
    nodes.forEach(node => {
      if (node.childNodes && node.childNodes.length) {
        node.expanded = true
        expandNode(node.childNodes)
      }
    })
  }
  expandNode(permissionTreeRef.value?.root?.childNodes || [])
}

// 收起全部
const collapseAll = () => {
  const collapseNode = (nodes) => {
    nodes.forEach(node => {
      if (node.childNodes && node.childNodes.length) {
        node.expanded = false
        collapseNode(node.childNodes)
      }
    })
  }
  collapseNode(permissionTreeRef.value?.root?.childNodes || [])
}

// 全选
const checkAll = () => {
  permissionTreeRef.value?.setCheckedNodes(permissionTree.value)
}

// 取消全选
const uncheckAll = () => {
  permissionTreeRef.value?.setCheckedKeys([])
}

// 保存权限配置
const savePermissions = async () => {
  permissionSaving.value = true
  try {
    const checkedKeys = permissionTreeRef.value?.getCheckedKeys() || []
    const halfCheckedKeys = permissionTreeRef.value?.getHalfCheckedKeys() || []
    const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]

    const res = await updateRolePermissions({
      roleId: currentRole.value.roleId,
      permissionIds: allCheckedKeys
    })

    if (res.code === 200) {
      ElMessage.success('权限配置保存成功')
      permissionVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存失败')
  } finally {
    permissionSaving.value = false
  }
}

// 查看角色用户
const viewRoleUsers = async (row) => {
  currentRole.value = row
  userPageNum.value = 1
  userListVisible.value = true
  await fetchRoleUsers()
}

// 获取角色用户列表
const fetchRoleUsers = async () => {
  userListLoading.value = true
  try {
    const res = await getRoleUsers({
      roleId: currentRole.value.roleId,
      pageNum: userPageNum.value,
      pageSize: userPageSize.value
    })
    if (res.code === 200 && res.data) {
      roleUsers.value = res.data.records || []
      userTotal.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取角色用户失败:', error)
  } finally {
    userListLoading.value = false
  }
}

onMounted(() => {
  fetchRoleList()
})
</script>

<style scoped>
.roles-management-container {
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

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.role-info {
  font-size: 14px;
  font-weight: bold;
  color: #409EFF;
}

.permission-actions {
  display: flex;
  gap: 8px;
}

.permission-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.permission-name {
  font-weight: 500;
  color: #303133;
}

.permission-code {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
</style>