import request from './request'

// 获取审核列表（分页）
export const getAuditList = (params) => {
  const { pageNum, pageSize, keyword, status } = params
  // 构建请求体 AuditSearchParamsVO
  const body = {
    title: keyword || '',
    ...(status !== undefined && status !== '' ? { status: Number(status) } : {})
  }
  // 分页参数作为 query
  return request.post('/api/audit/page', body, {
    params: {
      page: pageNum,
      size: pageSize
    },
    headers: { 'Content-Type': 'application/json' }
  })
}

// 审核操作（通过/拒绝）
export const auditAction = (id, status) => {
  // status: 1-通过，2-拒绝
  return request.post('/api/audit', {
    id: Number(id),
    status: status
  }, {
    headers: { 'Content-Type': 'application/json' }
  })
}