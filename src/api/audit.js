import request from './request'

// 获取审核列表
export const getAuditList = (params) => {
  return request.get('/api/audit/list', { params })
}

// 审核通过
export const auditApprove = (id) => {
  return request.post('/api/audit/approve', { id })
}

// 审核拒绝
export const auditReject = (id, reason) => {
  return request.post('/api/audit/reject', { id, reason })
}

// 删除信息
export const deleteEntry = (id) => {
  return request.delete(`/api/entry/${id}`)
}