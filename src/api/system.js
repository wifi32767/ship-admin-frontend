import request from './request'

// ==================== 国家信息管理 ====================
// 获取所有国家（不分页，用于前端分页）
export const getAllCountries = () => {
  return request.get('/api/country')
}

// 新增国家
export const saveCountry = (data) => {
  return request.post('/api/country', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 更新国家
export const updateCountry = (data) => {
  return request.put('/api/country', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 删除国家
export const deleteCountry = (id) => {
  return request.delete('/api/country', { params: { countryId: id } })
}

// ==================== 用户管理 ====================

// 获取所有用户列表（分页）
export const getAllUsers = (pageNum = 1, pageSize = 1000) => {
  return request.get('/api/user/allUsers', {
    params: { pageNum, pageSize },
    headers: { 'Content-Type': 'application/json' }
  })
}

// 用户注册（新增）
export const register = (data) => {
  return request.post('/api/user/register', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 修改用户信息
export const updateUser = (userVO) => {
  return request.put('/api/user/updateUser', userVO, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 删除用户（用户名放在 body 中）
export const deleteUserByUsername = (username) => {
  return request.delete('/api/user/deleteUser', {
    data: username,
    headers: { 'Content-Type': 'application/json' }
  })
}

// ==================== 角色管理 ====================

// 获取所有角色列表
export const getAllUserRoles = () => {
  return request.get('/api/user/allUsersRole', {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 新增角色
export const addUserRole = (userRoleVO) => {
  return request.post('/api/user/addUserRole', userRoleVO, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 删除角色
export const removeUserRole = (roleId) => {
  return request.delete('/api/user/removeUserRole', {
    params: { roleId },
    headers: { 'Content-Type': 'application/json' }
  })
}

// 获取所有模块权限（Map<Integer, String>）
export const getAllModules = () => {
  return request.get('/api/user/allModules', {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 批量添加权限：roleId 作为 query 参数，permissionIds 作为 JSON 数组放在请求体
export const addPermissionBatch = (roleId, permissionIds) => {
  return request.post(`/api/user/addPermissionBatch?roleId=${roleId}`, permissionIds, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 批量删除权限：roleId 作为 query 参数，permissionIds 作为 JSON 数组放在请求体
export const removePermissionBatch = (roleId, permissionIds) => {
  return request.delete(`/api/user/removePermissionBatch?roleId=${roleId}`, {
    data: permissionIds,
    headers: { 'Content-Type': 'application/json' }
  })
}