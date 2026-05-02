// entry.js
import request from './request'

// 获取国家列表
export const getCountryList = () => {
  return request.get('/api/country')
}

// 获取一级分类列表（含二三级）
export const getClassList = () => {
  return request.get('/api/class/list')
}

// 提交单条录入 (JSON)
export const submitSingleEntry = (deviceVO) => {
  return request.post('/api/entry/single', deviceVO, {
    headers: { 'Content-Type': 'application/json' }
    // 如果后端不支持 params 中传对象，可改用 data
    // 这里优先采用 OpenAPI 定义的 query 参数方式
  })
}

// 批量导入 (提交 JSON 数组)
export const batchImport = (devicesArray) => {
  return request.post('/api/entry/batch', devicesArray, {
    headers: { 'Content-Type': 'application/json' },
  })
}

// 获取导入日志（如有需要）
export const getImportLogs = (params) => {
  return request.get('/api/log/import', { params })
}