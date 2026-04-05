import request from './request'

// 获取国家列表
export const getCountryList = () => {
  return request.get('/api/country/list')
}

// 获取分类树
export const getCategoryTree = () => {
  return request.get('/api/category/tree')
}

// 提交单条录入
export const submitSingleEntry = (data) => {
  return request.post('/api/entry/single', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 批量导入
export const batchImport = (data) => {
  return request.post('/api/entry/batch', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取导入日志
export const getImportLogs = (params) => {
  return request.get('/api/log/import', { params })
}

// 下载导入模板
export const downloadTemplate = () => {
  return request.get('/api/template/download', {
    responseType: 'blob'
  })
}