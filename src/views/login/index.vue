<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h2>管理系统登录</h2>
                <p>欢迎回来，请登录您的账号</p>
            </div>
            
            <el-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="loginRules"
                class="login-form"
                @keyup.enter="handleLogin"
            >
                <el-form-item prop="username">
                    <el-input
                        v-model="loginForm.username"
                        placeholder="用户名"
                        :prefix-icon="User"
                        size="large"
                    />
                </el-form-item>
                
                <el-form-item prop="password">
                    <el-input
                        v-model="loginForm.password"
                        type="password"
                        placeholder="密码"
                        :prefix-icon="Lock"
                        size="large"
                        show-password
                    />
                </el-form-item>
                
                <el-form-item>
                    <el-button
                        type="primary"
                        size="large"
                        :loading="loading"
                        class="login-btn"
                        @click="handleLogin"
                    >
                        登录
                    </el-button>
                </el-form-item>
            </el-form>
            
            <div class="login-footer">
                <span>测试账号: root / asdasd</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
    username: '',
    password: ''
})

const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
    ]
}

const handleLogin = async () => {
    if (!loginFormRef.value) return
    
    try {
        await loginFormRef.value.validate()
        
        loading.value = true
        
        console.log('开始登录，用户名:', loginForm.username)
        
        const success = await userStore.login(loginForm.username, loginForm.password)
        
        console.log('登录结果:', success)
        
        if (success) {
            ElMessage.success('登录成功！正在跳转...')
            // 使用 replace 而不是 push，避免返回登录页
            await router.replace('/')
            console.log('跳转完成')
        } else {
            ElMessage.error('登录失败，请检查用户名和密码')
        }
    } catch (error) {
        console.error('登录过程出错:', error)
        ElMessage.error(error.message || '登录失败，请稍后重试')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
    width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-header h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
}

.login-header p {
    color: #666;
    font-size: 14px;
}

.login-form {
    margin-top: 24px;
}

.login-btn {
    width: 100%;
}

.login-footer {
    text-align: center;
    margin-top: 24px;
    color: #999;
    font-size: 12px;
}
</style>