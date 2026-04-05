import request from './request'

// 获取导入日志
export const getImportLogs = (params) => {
  return request.get('/api/logs/import', { params })
}

// 获取操作日志
export const getOperationLogs = (params) => {
  return request.get('/api/logs/operation', { params })
}

// 获取爬虫运行日志
export const getSpiderLogs = (params) => {
  return request.get('/api/logs/spider', { params })
}

// 获取系统日志
export const getSystemLogs = (params) => {
  return request.get('/api/logs/system', { params })
}

// 获取大模型调用日志
export const getLlmLogs = (params) => {
  return request.get('/api/logs/llm', { params })
}

// 删除单条日志
export const deleteLog = (data) => {
  return request.delete('/api/logs', { data })
}

// 批量删除日志
export const batchDeleteLogs = (data) => {
  return request.post('/api/logs/batch-delete', data)
}

// 清空日志
export const clearLogs = (params) => {
  return request.delete('/api/logs/clear', { params })
}

// 导出日志
export const exportLogs = (params) => {
  return request.get('/api/logs/export', { params, responseType: 'blob' })
}

// 获取日志统计
export const getLogStatistics = (params) => {
  return request.get('/api/logs/statistics', { params })
}

// 获取爬虫模型列表
export const getModelList = () => {
  return request.get('/api/model/list')
}

// 导入CSV到数据库
export const importCsvToDatabase = (data) => {
  return request.post('/api/logs/import-csv', data)
}

// 下载CSV文件
export const downloadCsvFile = (filePath) => {
  return request.get('/api/logs/download-csv', {
    params: { filePath },
    responseType: 'blob'
  })
}

// 提交大模型反馈
export const submitLlmFeedback = (data) => {
  return request.post('/api/logs/llm-feedback', data)
}