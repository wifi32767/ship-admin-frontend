import request from './request'

// 获取分类树
export const getCategoryTree = () => {
  return request.get('/api/category/tree')
}

// 获取分类列表（平铺）
export const getCategoryList = (params) => {
  return request.get('/api/category/list', { params })
}

// 获取分类详情
export const getCategoryDetail = (id) => {
  return request.get(`/api/category/${id}`)
}

// 新增分类
export const saveCategory = (data) => {
  return request.post('/api/category/save', data)
}

// 更新分类
export const updateCategory = (data) => {
  return request.post('/api/category/update', data)
}

// 删除分类
export const deleteCategory = (id) => {
  return request.delete(`/api/category/${id}`)
}

// 检查分类是否被引用
export const checkCategoryReference = (id) => {
  return request.get(`/api/category/${id}/reference`)
}

// 批量导入分类
export const batchImportCategories = (data) => {
  return request.post('/api/category/batch-import', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载导入模板
export const downloadTemplate = () => {
  return request.get('/api/category/template/download', {
    responseType: 'blob'
  })
}

// 获取分类选项（用于下拉选择）
export const getCategoryOptions = (level) => {
  return request.get('/api/category/options', { params: { level } })
}

// 批量更新分类排序
export const batchUpdateSort = (data) => {
  return request.post('/api/category/batch-sort', data)
}

// 获取分类祖先路径
export const getCategoryAncestors = (id) => {
  return request.get(`/api/category/${id}/ancestors`)
}

// 获取分类统计
export const getCategoryStats = () => {
  return request.get('/api/category/stats')
}