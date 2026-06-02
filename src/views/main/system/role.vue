<template>
  <div class="roles-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">角色管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增角色
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRoleList" stripe v-loading="loading">
        <el-table-column prop="roleId" label="角色ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column label="已有权限" min-width="250">
          <template #default="{ row }">
            <el-tag
              v-for="permId in row.modules"
              :key="permId"
              size="small"
              style="margin:2px"
              type="primary"
            >
              {{ getPermissionNameById(permId) }}
            </el-tag>
            <span v-if="!row.modules?.length" class="no-permission">无权限</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="configPermissions(row)">
              权限配置
            </el-button>
            <el-button type="danger" link @click="deleteRole(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredTotal"
        layout="total, sizes, prev, pager"
        @size-change="pageNum = 1"
        @current-change="() => {}"
        style="margin-top:20px;justify-content:flex-end"
      />
    </el-card>

    <!-- 新增角色对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增角色"
      width="700px"
      destroy-on-close
    >
      <el-form ref="addFormRef" :model="addFormData" :rules="addFormRules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="addFormData.roleName" placeholder="请输入角色名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="初始权限">
          <el-table :data="sortedPermissions" max-height="300" border>
            <el-table-column prop="id" label="权限ID" width="80" />
            <el-table-column prop="name" label="权限名称" min-width="150" />
            <el-table-column label="选择" width="80" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="addFormData.selectedPermIds" :label="row.id" />
              </template>
            </el-table-column>
          </el-table>
          <div class="form-tip">勾选后，角色创建成功将自动赋予这些权限</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole" :loading="addLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permDialogVisible"
      :title="`配置权限 - ${currentRole?.roleName}`"
      width="800px"
      destroy-on-close
    >
      <div class="perm-actions">
        <el-button size="small" @click="checkAll">全选</el-button>
        <el-button size="small" @click="uncheckAll">取消全选</el-button>
      </div>
      <el-table :data="sortedPermissions" max-height="400" border>
        <el-table-column prop="id" label="权限ID" width="80" />
        <el-table-column prop="name" label="权限名称" min-width="180" />
        <el-table-column label="选择" width="80" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="selectedPermIds" :label="row.id" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="savingPerm">
          保存配置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getAllUserRoles,
  getAllModules,
  addPermissionBatch,
  removePermissionBatch,
  addUserRole,
  removeUserRole
} from '@/api/system'

// 角色列表
const roleList = ref([])
const loading = ref(false)

const pageNum = ref(1)
const pageSize = ref(10)

// 新增角色
const addDialogVisible = ref(false)
const addFormRef = ref()
const addFormData = ref({
  roleName: '',
  selectedPermIds: []
})
const addLoading = ref(false)
const addFormRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度 2-30 个字符', trigger: 'blur' }
  ]
}

// 权限相关
const allPermissionsMap = ref({})      // { 权限ID: 权限名称 }
const permDialogVisible = ref(false)
const currentRole = ref(null)
const selectedPermIds = ref([])
const savingPerm = ref(false)

// 按ID排序后的权限列表
const sortedPermissions = computed(() => {
  return Object.entries(allPermissionsMap.value)
    .map(([id, name]) => ({ id: Number(id), name }))
    .sort((a, b) => a.id - b.id)
})

// 分页角色列表
const filteredRoleList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return roleList.value.slice(start, start + pageSize.value)
})
const filteredTotal = computed(() => roleList.value.length)

// 获取所有角色
const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getAllUserRoles()
    if (res.code === 200) {
      roleList.value = (res.data || []).map(r => ({
        ...r,
        modules: r.modules || []
      }))
    } else {
      ElMessage.error(res.message || '获取角色列表失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

// 获取所有权限（Map<Integer, String>）
const fetchAllPermissions = async () => {
  try {
    const res = await getAllModules()
    if (res.code === 200) {
      allPermissionsMap.value = res.data || {}
    } else {
      ElMessage.error(res.message || '获取权限列表失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('获取权限列表失败')
  }
}

// 根据权限ID获取名称
const getPermissionNameById = (id) => {
  return allPermissionsMap.value[id] || `未知权限(${id})`
}

// 新增角色
const showAddDialog = () => {
  addFormData.value = { roleName: '', selectedPermIds: [] }
  addDialogVisible.value = true
}

const saveRole = async () => {
  await addFormRef.value.validate()
  addLoading.value = true
  try {
    const addRes = await addUserRole({
      roleName: addFormData.value.roleName,
      modules: addFormData.value.selectedPermIds
    })
    if (addRes.code !== 200) throw new Error(addRes.message || '创建角色失败')
    ElMessage.success('角色创建成功')
    await fetchRoles()
    const newRole = roleList.value.find(r => r.roleName === addFormData.value.roleName)
    if (newRole && addFormData.value.selectedPermIds.length) {
      const permRes = await addPermissionBatch(newRole.roleId, addFormData.value.selectedPermIds)
      if (permRes.code !== 200) {
        ElMessage.warning('角色已创建，但权限分配失败：' + (permRes.message || ''))
      } else {
        ElMessage.success('初始权限分配成功')
      }
      await fetchRoles()
    }
    addDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.message || '创建失败')
  } finally {
    addLoading.value = false
  }
}

// 删除角色
const deleteRole = (row) => {
  ElMessageBox.confirm(
    `确定删除角色“${row.roleName}”吗？删除后该角色下的用户权限将受影响，请谨慎操作。`,
    '警告',
    { confirmButtonText: '删除', type: 'warning' }
  ).then(async () => {
    try {
      const res = await removeUserRole(row.roleId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await fetchRoles()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (err) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 权限配置
const configPermissions = (role) => {
  currentRole.value = role
  selectedPermIds.value = [...(role.modules || [])]
  permDialogVisible.value = true
}

const checkAll = () => {
  selectedPermIds.value = sortedPermissions.value.map(p => p.id)
}
const uncheckAll = () => {
  selectedPermIds.value = []
}

const savePermissions = async () => {
  const roleId = currentRole.value.roleId
  const allPermIds = sortedPermissions.value.map(p => p.id)
  const newPermIds = selectedPermIds.value

  savingPerm.value = true
  try {
    if (allPermIds.length) {
      await removePermissionBatch(roleId, allPermIds)
    }
    if (newPermIds.length) {
      await addPermissionBatch(roleId, newPermIds)
    }
    ElMessage.success('权限配置更新成功')
    permDialogVisible.value = false
    await fetchRoles()
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    savingPerm.value = false
  }
}

onMounted(async () => {
  await fetchAllPermissions()
  await fetchRoles()
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
}
.header-actions {
  display: flex;
  gap: 12px;
}
.perm-actions {
  margin-bottom: 16px;
}
.no-permission {
  color: #c0c4cc;
  font-size: 12px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>