import request from './request'

// 获取导入日志
export const getImportLogs = (params) => {
  return request.get('/api/logs/import', { params })
}

// 获取操作日志
export const getOperationLogs = (params) => {
  return request.get('/api/logs/operation', { params })
}

const pick = (row, keys, fallback = '') => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') return row[key]
  }
  return fallback
}

const normalizeRunState = (row) => {
  const raw = String(pick(row, [
    'runState', 'run_state', 'enterState', 'enter_state', 'state', 'status'
  ], '')).toLowerCase()
  if (['error', 'failed', 'fail', '失败'].includes(raw)) return 'failed'
  if (['skipped', 'skip', '无需录入'].includes(raw)) return 'skipped'
  if (['running', '运行中'].includes(raw)) return 'running'
  if (['success', 'stopped', 'done', '已录入', '成功'].includes(raw)) return 'success'

  const message = String(pick(row, [
    'resultDesc', 'csvEnterLogs', 'csv_enter_logs', 'logContent', 'message'
  ], '')).toLowerCase()
  if (message.includes('异常') || message.includes('失败') || message.includes('error')) return 'failed'
  if (message.includes('返回空') || message.includes('无新数据') || message.includes('跳过')) return 'skipped'
  if (message.includes('终止')) return 'failed'
  return 'unknown'
}

const normalizeEntryState = (row, runState) => {
  const raw = pick(row, ['entryState', 'enterState', 'enter_state', 'state', 'status'], '')
  if (raw === 'error' || raw === 'failed') return '未录入'
  if (raw === 'skipped') return '无需录入'
  if (raw === 'success' || raw === 'done' || raw === 'stopped') return '已录入'
  if (runState === 'failed') return '未录入'
  if (runState === 'skipped') return '无需录入'
  if (runState === 'success') return '已录入'
  return raw || '未知'
}

const normalizeSpiderLog = (row) => {
  const runState = normalizeRunState(row)
  const total = Number(pick(row, ['total', 'csvEnterNumber', 'csv_enter_number', 'dataCount'], 0)) || 0
  const success = Number(pick(row, ['success', 'csvEnterSuccessNumber', 'csv_enter_success_number', 'successCount'], 0)) || 0
  return {
    ...row,
    logId: pick(row, ['logId', 'id', 'csvEnterLogsId', 'csv_enter_logs_id']),
    runTime: pick(row, ['runTime', 'csvEnterLogsTime', 'csv_enter_logs_time', 'createTime', 'logTime']),
    modelName: pick(row, ['modelName', 'mReptileModelName', 'reptileModelName'], pick(row, ['modelLogId', 'model_log_id'], '-')),
    runState,
    resultDesc: pick(row, ['resultDesc', 'csvEnterLogs', 'csv_enter_logs', 'logContent', 'message']),
    csvAddress: pick(row, ['csvAddress', 'csv_address', 'csvEnterAddress', 'csv_enter_address', 'filePath', 'fileName']),
    entryState: normalizeEntryState(row, runState),
    entryTime: pick(row, ['entryTime', 'csvEnterLogsTime', 'csv_enter_logs_time', 'createTime', 'logTime']),
    total,
    success,
    failCount: Number(pick(row, ['failCount', 'failed', 'failNumber'], Math.max(total - success, 0))) || 0,
    userId: pick(row, ['userId', 'csvEnterUserId', 'csv_enter_user_id', 'csvEnterUserName'])
  }
}

const normalizeListData = (data) => {
  const records = data?.records || data?.list || data?.rows || (Array.isArray(data) ? data : [])
  const total = data?.total ?? data?.totalCount ?? data?.count ?? records.length
  return { records, total }
}

const normalizeSearchStatus = (status) => {
  const map = {
    success: 'success',
    failed: 'failed',
    error: 'failed',
    skipped: 'skipped',
    skip: 'skipped'
  }
  return map[status] || status || ''
}

// 获取爬虫运行日志：Java 后端 /api/log
export const getSpiderLogs = async (params = {}) => {
  const statusMap = {
    success: 'success',
    failed: 'failed',
    error: 'failed',
    skipped: 'skipped'
  }
  const res = await request.get('/api/log', {
    params: {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
      startTime: params.startTime,
      endTime: params.endTime,
      status: statusMap[params.status] || params.status || undefined,
      keyword: params.keyword || undefined
    }
  })
  if (res.code === 200 && res.data) {
    const data = normalizeListData(res.data)
    const status = normalizeSearchStatus(params.status)
    const records = data.records
      .map(normalizeSpiderLog)
      .filter(row => !status || row.runState === status)
    res.data = {
      ...res.data,
      records,
      total: status ? records.length : data.total
    }
  }
  return res
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
  if (data?.logType === 'spider') {
    return request.delete('/api/log/delete', { params: { id: data.logId } })
  }
  return request.delete('/api/logs', { data })
}

// 批量删除日志
export const batchDeleteLogs = (data) => {
  if (data?.logType === 'spider') {
    return request.delete('/api/log/batch-delete', { data: data.ids || [] })
  }
  return request.post('/api/logs/batch-delete', data)
}

// 清空日志：Java 当前日志接口未提供清空全部，爬虫日志页用批量删除已选日志实现。
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