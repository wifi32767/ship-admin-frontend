import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || '')
    const username = ref(localStorage.getItem('username') || '')
    const isLoggedIn = ref(!!token.value)

    // 登录
    const login = async (usernameVal, passwordVal) => {
        try {
            console.log('开始登录请求...')
            const res = await loginApi(usernameVal, passwordVal)
            console.log('登录响应完整数据:', res)
            
            // 根据后端实际返回结构调整
            // 后端返回格式: { data: "token", code: 200, message: "success" }
            if (res && (res.data || res.token)) {
                const newToken = res.data || res.token
                token.value = newToken
                username.value = usernameVal
                isLoggedIn.value = true
                
                localStorage.setItem('token', newToken)
                localStorage.setItem('username', usernameVal)
                
                console.log('登录成功，token已保存')
                return true
            } else {
                console.error('登录失败，响应格式不正确:', res)
                ElMessage.error(res?.message || '登录失败')
                return false
            }
        } catch (error) {
            console.error('登录请求错误:', error)
            // 错误已经在拦截器中提示，这里不需要重复提示
            return false
        }
    }

    // 登出
    const logout = async () => {
        try {
            await logoutApi()
        } catch (error) {
            console.error('登出错误:', error)
        } finally {
            token.value = ''
            username.value = ''
            isLoggedIn.value = false
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            console.log('已登出，清除本地存储')
        }
    }

    return {
        token,
        username,
        isLoggedIn,
        login,
        logout
    }
})