import request from './request'

// 获取日志列表（后端分页）
export const getLogList = (params) => {
  return request.get('/api/log', { params })
}

// 删除单条日志（id 作为 query 参数）
export const deleteLog = (id) => {
  return request.delete('/api/log/delete', { params: { id } })
}

// 批量删除日志（请求体为整数数组）
export const batchDeleteLogs = (ids) => {
  return request.delete('/api/log/batch-delete', { data: ids })
}