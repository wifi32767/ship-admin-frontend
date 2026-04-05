import request from './request'

// 获取数据列表
export const getDataList = (params) => {
  return request.get('/api/data/list', { params })
}

// 获取数据详情
export const getDataDetail = (id) => {
  return request.get(`/api/data/${id}`)
}

// 更新数据
export const updateData = (data) => {
  return request.post('/api/data/update', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除数据
export const deleteData = (id) => {
  return request.delete(`/api/data/${id}`)
}

// 批量删除数据
export const batchDeleteData = (data) => {
  return request.post('/api/data/batch-delete', data)
}

// 批量导出数据
export const batchExport = (data) => {
  return request.post('/api/data/export', data, {
    responseType: 'blob'
  })
}

// 获取修改历史
export const getModifyHistory = (id) => {
  return request.get(`/api/data/history/${id}`)
}

// 获取分类列表
export const getCategoryList = () => {
  return request.get('/api/category/list')
}

// 获取分类树
export const getCategoryTree = () => {
  return request.get('/api/category/tree')
}

// 获取国家列表
export const getCountryList = () => {
  return request.get('/api/country/list')
}