import request from './request'

// ==================== 国家信息管理 ====================
// 获取国家列表（分页）
export const getCountryList = (params) => {
  return request.get('/api/country/list', { params })
}

// 获取所有国家（不分页，用于下拉选择）
export const getAllCountries = () => {
  return request.get('/api/country/all')
}

// 获取国家统计
export const getCountryStats = () => {
  return request.get('/api/country/stats')
}

// 获取国家详情
export const getCountryDetail = (id) => {
  return request.get(`/api/country/${id}`)
}

// 新增国家
export const saveCountry = (data) => {
  return request.post('/api/country/save', data)
}

// 更新国家
export const updateCountry = (data) => {
  return request.post('/api/country/update', data)
}

// 删除国家
export const deleteCountry = (id) => {
  return request.delete(`/api/country/${id}`)
}

// 批量删除国家
export const batchDeleteCountries = (data) => {
  return request.post('/api/country/batch-delete', data)
}

// 批量导出国家
export const batchExportCountries = (data) => {
  return request.post('/api/country/export', data, {
    responseType: 'blob'
  })
}

// 批量导入国家
export const batchImportCountries = (data) => {
  return request.post('/api/country/batch-import', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载导入模板
export const downloadTemplate = () => {
  return request.get('/api/country/template/download', {
    responseType: 'blob'
  })
}

// 获取国家关联的数据
export const getRelatedData = (id) => {
  return request.get(`/api/country/${id}/related-data`)
}

// ==================== 用户管理 ====================

// 获取用户列表
export const getUserList = (params) => {
  return request.get('/api/system/user/list', { params })
}

// 获取用户详情
export const getUserDetail = (id) => {
  return request.get(`/api/system/user/${id}`)
}

// 新增用户
export const addUser = (data) => {
  return request.post('/api/system/user/add', data)
}

// 更新用户
export const updateUser = (data) => {
  return request.post('/api/system/user/update', data)
}

// 删除用户
export const deleteUser = (id) => {
  return request.delete(`/api/system/user/${id}`)
}

// 重置密码
export const resetPassword = (data) => {
  return request.post('/api/system/user/reset-password', data)
}

// 切换用户状态
export const toggleUserStatus = (data) => {
  return request.post('/api/system/user/toggle-status', data)
}

// ==================== 角色管理 ====================

// 获取角色列表
export const getRoleList = (params) => {
  return request.get('/api/system/role/list', { params })
}

// 获取角色详情
export const getRoleDetail = (id) => {
  return request.get(`/api/system/role/${id}`)
}

// 新增角色
export const addRole = (data) => {
  return request.post('/api/system/role/add', data)
}

// 更新角色
export const updateRole = (data) => {
  return request.post('/api/system/role/update', data)
}

// 删除角色
export const deleteRole = (id) => {
  return request.delete(`/api/system/role/${id}`)
}

// 更新角色权限
export const updateRolePermissions = (data) => {
  return request.post('/api/system/role/permissions', data)
}

// 切换角色状态
export const toggleRoleStatus = (data) => {
  return request.post('/api/system/role/toggle-status', data)
}

// ==================== 操作日志 ====================

// 获取用户操作日志
export const getUserLogs = (params) => {
  return request.get('/api/system/log/user', { params })
}

// 获取登录日志
export const getLoginLogs = (params) => {
  return request.get('/api/system/log/login', { params })
}

// ==================== 权限管理 ====================

// 获取权限树
export const getPermissionTree = () => {
  return request.get('/api/system/permission/tree')
}

// 获取角色权限树
export const getRolePermissionTree = (roleId) => {
  return request.get(`/api/system/role/${roleId}/permissions`)
}
// ==================== 角色用户 ====================

// 获取角色下的用户
export const getRoleUsers = (params) => {
  return request.get('/api/system/role/users', { params })
}