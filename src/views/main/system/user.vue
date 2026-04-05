<template>
  <div class="users-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">管理员账号管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加用户
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/昵称/手机号"
              style="width: 220px"
              clearable
              @clear="fetchUserList"
              @keyup.enter="fetchUserList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="searchRole"
              placeholder="角色筛选"
              clearable
              style="width: 140px"
              @change="fetchUserList"
            >
              <el-option
                v-for="item in roleList"
                :key="item.roleId"
                :label="item.roleName"
                :value="item.roleId"
              />
            </el-select>
            <!-- <el-select
              v-model="searchStatus"
              placeholder="状态筛选"
              clearable
              style="width: 120px"
              @change="fetchUserList"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select> -->
          </div>
        </div>
      </template>

      <!-- 用户表格 -->
      <el-table :data="userList" stripe v-loading="loading">
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="nickName" label="昵称" min-width="120" />
        <el-table-column prop="roleName" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.roleName)" size="small">
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phonenumber" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <!-- <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="toggleUserStatus(row)"
            />
          </template>
        </el-table-column> -->
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button type="warning" link @click="resetPassword(row)">
              重置密码
            </el-button>
            <el-button
              type="danger"
              link
              @click="deleteUser(row)"
              :disabled="row.userId === currentUserId"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchUserList"
        @current-change="fetchUserList"
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
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="formData.userName"
            placeholder="请输入用户名"
            :disabled="dialogTitle === '编辑用户'"
            maxlength="30"
          />
          <div class="form-tip">用户名只能包含字母、数字和下划线，且不能修改</div>
        </el-form-item>

        <el-form-item label="昵称" prop="nickName">
          <el-input
            v-model="formData.nickName"
            placeholder="请输入昵称"
            maxlength="30"
          />
        </el-form-item>

        <el-form-item label="手机号码" prop="phonenumber">
          <el-input
            v-model="formData.phonenumber"
            placeholder="请输入手机号码"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="item in roleList"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleId"
            >
              <div class="role-option">
                <span>{{ item.roleName }}</span>
                <el-tag :type="getRoleTagType(item.roleName)" size="small">
                  {{ item.roleKey }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item> -->

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 密码字段（仅新增时显示） -->
        <el-form-item label="密码" prop="password" v-if="dialogTitle === '新增用户'">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            maxlength="100"
          />
          <div class="form-tip">密码长度至少6位，建议包含字母和数字</div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword" v-if="dialogTitle === '新增用户'">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            maxlength="100"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPwdVisible"
      title="重置密码"
      width="450px"
    >
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdData"
        :rules="resetPwdRules"
        label-width="100px"
      >
        <el-form-item label="用户名">
          <span>{{ resetPwdData.userName }}</span>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPwdData.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer">
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword" :loading="resetPwdLoading">
          确认重置
        </el-button>
      </template>
    </el-dialog>

    <!-- 操作日志对话框 -->
    <el-dialog
      v-model="logDialogVisible"
      title="用户操作日志"
      width="900px"
    >
      <div class="log-filters">
        <el-date-picker
          v-model="logDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          size="small"
          @change="fetchUserLogs"
        />
        <el-select v-model="logType" placeholder="操作类型" clearable size="small" @change="fetchUserLogs">
          <el-option label="登录" value="login" />
          <el-option label="登出" value="logout" />
          <el-option label="新增" value="create" />
          <el-option label="修改" value="update" />
          <el-option label="删除" value="delete" />
          <el-option label="重置密码" value="resetPwd" />
        </el-select>
      </div>

      <el-table :data="userLogs" stripe v-loading="logLoading" max-height="500">
        <el-table-column prop="operationTime" label="操作时间" width="160" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTag(row.operationType)" size="small">
              {{ getLogTypeText(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationContent" label="操作内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="userAgent" label="设备信息" min-width="200" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="logPageNum"
        v-model:page-size="logPageSize"
        :total="logTotal"
        layout="total, sizes, prev, pager"
        @size-change="fetchUserLogs"
        @current-change="fetchUserLogs"
        style="margin-top: 20px; justify-content: flex-end"
        size="small"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getUserList,
  getUserDetail,
  addUser,
  updateUser,
  deleteUser as deleteUserApi,
  resetPassword as resetPasswordApi,
//   toggleUserStatus as toggleUserStatusApi,
  getRoleList,
  getUserLogs
} from '@/api/system'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.userId)

// 列表相关
const userList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索条件
const searchKeyword = ref('')
const searchRole = ref('')
// const searchStatus = ref('')

// 角色列表
const roleList = ref([])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = reactive({
  userId: null,
  userName: '',
  nickName: '',
  phonenumber: '',
  email: '',
  roleId: null,
//   status: 1,
  remark: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback()
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号码'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback()
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (dialogTitle.value === '新增用户' && !value) {
    callback(new Error('请输入密码'))
  } else if (value && value.length < 6) {
    callback(new Error('密码长度至少6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (dialogTitle.value === '新增用户' && !value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  nickName: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  phonenumber: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 重置密码相关
const resetPwdVisible = ref(false)
const resetPwdFormRef = ref()
const resetPwdLoading = ref(false)
const resetPwdData = reactive({
  userId: null,
  userName: '',
  newPassword: '',
  confirmPassword: ''
})

const resetPwdRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPwdData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 操作日志相关
const logDialogVisible = ref(false)
const currentLogUser = ref(null)
const userLogs = ref([])
const logLoading = ref(false)
const logDateRange = ref([])
const logType = ref('')
const logPageNum = ref(1)
const logPageSize = ref(10)
const logTotal = ref(0)

// 获取角色标签类型
const getRoleTagType = (roleName) => {
  if (roleName === '管理员') return 'danger'
  if (roleName === '审核员') return 'warning'
  if (roleName === '数据录入员') return 'success'
  return 'info'
}

// 获取日志标签类型
const getLogTypeTag = (type) => {
  const map = {
    'login': 'success',
    'logout': 'info',
    'create': 'primary',
    'update': 'warning',
    'delete': 'danger',
    'resetPwd': 'warning'
  }
  return map[type] || 'info'
}

const getLogTypeText = (type) => {
  const map = {
    'login': '登录',
    'logout': '登出',
    'create': '新增',
    'update': '修改',
    'delete': '删除',
    'resetPwd': '重置密码'
  }
  return map[type] || type
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      roleId: searchRole.value,
    //   status: searchStatus.value
    })
    if (res.code === 200 && res.data) {
      userList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const res = await getRoleList()
    if (res.code === 200) {
      roleList.value = res.data || []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 显示新增对话框
const showAddDialog = () => {
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = async (row) => {
  dialogTitle.value = '编辑用户'
  try {
    const res = await getUserDetail(row.userId)
    if (res.code === 200 && res.data) {
      const data = res.data
      formData.userId = data.userId
      formData.userName = data.userName
      formData.nickName = data.nickName
      formData.phonenumber = data.phonenumber
      formData.email = data.email
      formData.roleId = data.roleId
    //   formData.status = data.status
      formData.remark = data.remark
      formData.password = ''
      formData.confirmPassword = ''
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 重置表单
const resetForm = () => {
  formData.userId = null
  formData.userName = ''
  formData.nickName = ''
  formData.phonenumber = ''
  formData.email = ''
  formData.roleId = null
//   formData.status = 1
  formData.remark = ''
  formData.password = ''
  formData.confirmPassword = ''
  formRef.value?.resetFields()
}

// 关闭对话框
const closeDialog = () => {
  resetForm()
}

// 保存用户
const saveUser = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = {
        userId: formData.userId,
        userName: formData.userName,
        nickName: formData.nickName,
        phonenumber: formData.phonenumber,
        email: formData.email,
        roleId: formData.roleId,
        // status: formData.status,
        remark: formData.remark
      }

      let res
      if (formData.userId) {
        res = await updateUser(data)
      } else {
        data.password = formData.password
        res = await addUser(data)
      }

      if (res.code === 200) {
        ElMessage.success(dialogTitle.value === '新增用户' ? '添加成功' : '修改成功')
        dialogVisible.value = false
        fetchUserList()
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

// 重置密码
const resetPassword = (row) => {
  resetPwdData.userId = row.userId
  resetPwdData.userName = row.userName
  resetPwdData.newPassword = ''
  resetPwdData.confirmPassword = ''
  resetPwdVisible.value = true
}

const confirmResetPassword = async () => {
  if (!resetPwdFormRef.value) return

  await resetPwdFormRef.value.validate(async (valid) => {
    if (!valid) return

    resetPwdLoading.value = true
    try {
      const res = await resetPasswordApi({
        userId: resetPwdData.userId,
        newPassword: resetPwdData.newPassword
      })
      if (res.code === 200) {
        ElMessage.success('密码重置成功')
        resetPwdVisible.value = false
        // 记录操作日志
        fetchUserList()
      } else {
        ElMessage.error(res.message || '重置失败')
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error('重置失败')
    } finally {
      resetPwdLoading.value = false
    }
  })
}

// // 切换用户状态
// const toggleUserStatus = async (row) => {
//   try {
//     const res = await toggleUserStatusApi({
//       userId: row.userId,
//       status: row.status
//     })
//     if (res.code === 200) {
//       ElMessage.success(`已${row.status === 1 ? '启用' : '禁用'}用户`)
//     } else {
//       // 恢复状态
//       row.status = row.status === 1 ? 0 : 1
//       ElMessage.error(res.message || '操作失败')
//     }
//   } catch (error) {
//     row.status = row.status === 1 ? 0 : 1
//     ElMessage.error('操作失败')
//   }
// }

// 删除用户
const deleteUser = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户"${row.userName}"吗？此操作不可恢复。`,
    '警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteUserApi(row.userId)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchUserList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 查看操作日志
const viewUserLogs = (row) => {
  currentLogUser.value = row
  logDateRange.value = []
  logType.value = ''
  logPageNum.value = 1
  logDialogVisible.value = true
  fetchUserLogs()
}

// 获取用户操作日志
const fetchUserLogs = async () => {
  logLoading.value = true
  try {
    const res = await getUserLogs({
      userId: currentLogUser.value?.userId,
      startDate: logDateRange.value?.[0],
      endDate: logDateRange.value?.[1],
      operationType: logType.value,
      pageNum: logPageNum.value,
      pageSize: logPageSize.value
    })
    if (res.code === 200 && res.data) {
      userLogs.value = res.data.records || []
      logTotal.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取操作日志失败:', error)
  } finally {
    logLoading.value = false
  }
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
  flex-wrap: wrap;
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

.role-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.log-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
</style>