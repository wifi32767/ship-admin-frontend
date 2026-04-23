import request from './request'

// 获取分页列表
export const getPageList = (params) => {
  return request.get('/api/device/page', { params })
}

// 获取信息总数量
export const getDeviceCount = () => {
  return request.get('/api/device/count')
}

// 修改信息
export const updateData = (data) => {
  return request.put('/api/device', data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

// 删除信息
export const deleteDevice = (id) => {
  return request.delete(`/api/device/${id}`)
}