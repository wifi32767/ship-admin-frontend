import request from './request'

// 获取模型列表
export const getModelList = (params) => {
  return request.get('/api/model/list', { params })
}

// 获取模型详情
export const getModelDetail = (id) => {
  return request.get(`/api/model/${id}`)
}

// 保存模型（新增/编辑）
export const saveModel = (data) => {
  return request.post('/api/model/save', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新模型
export const updateModel = (data) => {
  return request.post('/api/model/update', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除模型
export const deleteModel = (id) => {
  return request.delete(`/api/model/${id}`)
}

// 启动模型
export const startModel = (id) => {
  return request.post(`/api/model/${id}/start`)
}

// 停止模型
export const stopModel = (id) => {
  return request.post(`/api/model/${id}/stop`)
}

// 获取运行日志
export const getRunLogs = (params) => {
  return request.get('/api/model/logs', { params })
}

// 清空运行日志
export const clearRunLogs = (modelId) => {
  return request.delete(`/api/model/${modelId}/logs`)
}

// 导入CSV到数据库
export const importCsvToDatabase = (data) => {
  return request.post('/api/model/import-csv', data)
}

// 下载CSV文件
export const downloadCsvFile = (filePath) => {
  return request.get('/api/model/download-csv', {
    params: { filePath },
    responseType: 'blob'
  })
}

// 获取关键词列表
export const getKeywords = (modelId) => {
  return request.get(`/api/model/${modelId}/keywords`)
}

// 添加关键词
export const addKeyword = (data) => {
  return request.post('/api/model/keyword', data)
}

// 删除关键词
export const deleteKeyword = (id) => {
  return request.delete(`/api/model/keyword/${id}`)
}