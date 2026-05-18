const CACHE_KEY = 'portal_device_cache'

export function cachePortalDevice(item) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(item))
    } catch (e) {
        // ignore storage errors
    }
}

export function getPortalDeviceCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch (e) {
        return null
    }
}

export function buildPortalDetailQuery(item, { classId, styleId } = {}) {
    const query = {}
    if (classId != null) query.classId = classId
    if (styleId != null) query.styleId = styleId
    return query
}
