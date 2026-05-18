<template>
  <div class="users-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">用户管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/昵称/手机号"
              style="width: 220px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select
              v-model="searchRoleId"
              placeholder="角色筛选"
              clearable
              style="width: 140px"
              @change="handleSearch"
            >
              <el-option
                v-for="role in roleList"
                :key="role.roleId"
                :label="role.roleName"
                :value="role.roleId"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="pagedUserList" stripe v-loading="loading">
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="nickName" label="昵称" min-width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.userRole?.roleName)" size="small">
              {{ row.userRole?.roleName || '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">编辑</el-button>
            <el-button type="warning" link @click="resetPassword(row)">重置密码</el-button>
            <el-button type="danger" link @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 前端分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredTotal"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="pageNum = 1"
        @current-change="() => {}"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      destroy-on-close
      @close="closeDialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="formData.userName" placeholder="请输入用户名" :disabled="isEdit" />
          <div class="form-tip">用户名只能包含字母、数字和下划线，且不可修改</div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="formData.nickName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phoneNumber">
          <el-input v-model="formData.phoneNumber" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色" clearable>
            <el-option
              v-for="role in roleList"
              :key="role.roleId"
              :label="role.roleName"
              :value="role.roleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" />
        </el-form-item>
        <!-- 密码：新增时必填，编辑时可选（用于重置密码） -->
        <el-form-item label="密码" prop="password" v-if="!isEdit || resetPwdMode">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
          <div class="form-tip">密码长度至少6位，编辑时留空表示不修改</div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit || resetPwdMode">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getAllUsers,
  register,
  updateUser,
  deleteUserByUsername,
  getAllUserRoles
} from '@/api/system'

const allUsers = ref([])          // 原始用户列表
const roleList = ref([])          // 所有角色
const loading = ref(false)
const searchKeyword = ref('')
const searchRoleId = ref('')

// 前端分页
const pageNum = ref(1)
const pageSize = ref(10)

// 筛选后的用户列表
const filteredUsers = computed(() => {
  let list = allUsers.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(u =>
      u.userName?.toLowerCase().includes(kw) ||
      u.nickName?.toLowerCase().includes(kw) ||
      u.phoneNumber?.includes(kw)
    )
  }
  if (searchRoleId.value) {
    list = list.filter(u => u.userRole?.roleId === searchRoleId.value)
  }
  return list
})
const filteredTotal = computed(() => filteredUsers.value.length)
const pagedUserList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const resetPwdMode = ref(false)   // 编辑时是否单独重置密码
const formRef = ref()
const saving = ref(false)

const formData = reactive({
  userId: null,
  userName: '',
  nickName: '',
  phoneNumber: '',
  email: '',
  roleId: null,
  remark: '',
  password: '',
  confirmPassword: ''
})

// 表单校验规则
const validatePhone = (rule, value, cb) => {
  if (!value) return cb()
  if (/^1[3-9]\d{9}$/.test(value)) cb()
  else cb(new Error('请输入正确手机号'))
}
const validateEmail = (rule, value, cb) => {
  if (!value) return cb()
  if (/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value)) cb()
  else cb(new Error('请输入正确邮箱'))
}
const validatePassword = (rule, value, cb) => {
  if (!isEdit.value && !value) return cb(new Error('请输入密码'))
  if (value && value.length < 6) return cb(new Error('密码至少6位'))
  cb()
}
const validateConfirm = (rule, value, cb) => {
  if ((!isEdit.value || resetPwdMode.value) && value !== formData.password) {
    cb(new Error('两次输入密码不一致'))
  } else cb()
}
const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '字母数字下划线', trigger: 'blur' },
    { min: 2, max: 30, message: '2-30字符', trigger: 'blur' }
  ],
  nickName: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phoneNumber: [{ validator: validatePhone, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirm, trigger: 'blur' }]
}

const getRoleTagType = (roleName) => {
  if (roleName === '管理员') return 'danger'
  if (roleName === '审核员') return 'warning'
  if (roleName === '数据录入员') return 'success'
  return 'info'
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getAllUsers(1, 1000) // 全量获取
    if (res.code === 200) {
      allUsers.value = (res.data || []).map(u => ({
        ...u,
        phoneNumber: u.phoneNumber || '',
        remark: u.remark || ''
      }))
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const fetchRoleList = async () => {
  try {
    const res = await getAllUserRoles()
    if (res.code === 200) roleList.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

const handleSearch = () => {
  pageNum.value = 1
}

const showAddDialog = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  resetPwdMode.value = false
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  resetPwdMode.value = false
  Object.assign(formData, {
    userId: row.userId,
    userName: row.userName,
    nickName: row.nickName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    roleId: row.userRole?.roleId || null,
    remark: row.remark,
    password: '',
    confirmPassword: ''
  })
  dialogVisible.value = true
}

const resetPassword = (row) => {
  resetPwdMode.value = true
  isEdit.value = true
  dialogTitle.value = '重置密码'
  Object.assign(formData, {
    userId: row.userId,
    userName: row.userName,
    nickName: row.nickName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    roleId: row.userRole?.roleId || null,
    remark: row.remark,
    password: '',
    confirmPassword: ''
  })
  dialogVisible.value = true
}

const resetForm = () => {
  formData.userId = null
  formData.userName = ''
  formData.nickName = ''
  formData.phoneNumber = ''
  formData.email = ''
  formData.roleId = null
  formData.remark = ''
  formData.password = ''
  formData.confirmPassword = ''
  formRef.value?.resetFields()
}

const closeDialog = () => {
  resetForm()
  resetPwdMode.value = false
}

const saveUser = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    const userVO = {
      userId: formData.userId,
      userName: formData.userName,
      nickName: formData.nickName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      remark: formData.remark,
      userRole: formData.roleId ? { roleId: formData.roleId } : null
    }
    // 密码处理
    if (!isEdit.value || resetPwdMode.value) {
      if (!formData.password) throw new Error('请输入密码')
      userVO.password = formData.password
    }

    let res
    if (!isEdit.value) {
      res = await register(userVO)
      if (res.code === 200) {
        ElMessage.success('注册成功')
      } else {
        throw new Error(res.message)
      }
    } else {
      res = await updateUser(userVO)
      if (res.code === 200) {
        ElMessage.success(resetPwdMode.value ? '密码重置成功' : '修改成功')
      } else {
        throw new Error(res.message)
      }
    }
    dialogVisible.value = false
    await fetchUserList()
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const deleteUser = (row) => {
  ElMessageBox.confirm(`确定删除用户“${row.userName}”吗？`, '警告', {
    confirmButtonText: '删除',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteUserByUsername(row.userName)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        await fetchUserList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchUserList()
  fetchRoleList()
})
</script>

<style scoped>
.users-management-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.form-tip {
  font-size: 12px;
  color: gray;
  margin-top: 4px;
}
</style>