import request from './request'

// ===== 门户首页数据 =====

export function getStatsBoard() {
    return request.get('/api/portal/stats-board')
}

export function getLatestNews() {
    return request.get('/api/portal/latest-news')
}

export function getRollingNews() {
    return request.get('/api/portal/rolling-news')
}

export function getRecommendations() {
    return request.get('/api/portal/recommendations')
}

export function getLatestRecords() {
    return request.get('/api/portal/latest-records')
}

// ===== 检索 =====

// params: { keyword, title, classId, styleId, typeId, country }
export function searchDevices(params) {
    return request.get('/api/search/search', { params })
}

export function getCountryStats(params) {
    return request.get('/api/search/country-stats', { params })
}

export function getClassStats(params) {
    return request.get('/api/search/class-stats', { params })
}

export function getYearAnalysis(params) {
    return request.get('/api/search/year-analysis', { params })
}
