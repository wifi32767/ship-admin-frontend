import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 开发环境使用空baseURL，让请求走代理
// 生产环境使用完整URL
const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '')

const request = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    // 开发环境不需要 withCredentials，因为代理会处理
    // 如果需要cookie，代理也会处理
    withCredentials: import.meta.env.DEV ? false : true,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        // 打印请求信息用于调试
        if (import.meta.env.DEV) {
            console.log('请求URL:', config.url)
            console.log('请求方法:', config.method)
            console.log('请求参数:', config.params || config.data)
        }
        
        return config
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        if (import.meta.env.DEV) {
            console.log('响应数据:', response.data)
        }
        
        const res = response.data
        
        // 根据后端返回的code判断
        if (res.code !== undefined && res.code !== 200) {
            ElMessage.error(res.message || '请求失败')
            return Promise.reject(new Error(res.message || '请求失败'))
        }
        
        return res
    },
    error => {
        console.error('响应错误:', error)
        
        if (error.response) {
            const { status, data } = error.response
            switch (status) {
                case 401:
                    ElMessage.error('未授权，请重新登录')
                    const userStore = useUserStore()
                    userStore.logout()
                    window.location.href = '/login'
                    break
                case 403:
                    ElMessage.error('拒绝访问')
                    break
                case 404:
                    ElMessage.error('请求的资源不存在')
                    break
                case 500:
                    ElMessage.error('服务器内部错误')
                    break
                default:
                    ElMessage.error(data?.message || `请求失败: ${status}`)
            }
        } else if (error.request) {
            ElMessage.error('网络连接失败，请检查后端服务是否正常运行')
            console.error('网络错误详情:', error.request)
        } else {
            ElMessage.error(error.message || '请求失败')
        }
        
        return Promise.reject(error)
    }
)

export default request