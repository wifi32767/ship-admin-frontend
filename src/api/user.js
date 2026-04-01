import request from './request'

// 用户登录
export const login = (username, password) => {
    return request({
        url: '/api/user/login',
        method: 'post',
        params: { username, password }
    })
}

// 用户登出
export const logout = () => {
    return request({
        url: '/api/user/logout',
        method: 'post'
    })
}

// 用户注册
export const register = (user) => {
    return request({
        url: '/api/user/register',
        method: 'post',
        params: { user }
    })
}

// 获取所有用户
export const getAllUsers = () => {
    return request({
        url: '/api/user/all',
        method: 'get'
    })
}

// 删除用户
export const deleteUser = (username) => {
    return request({
        url: '/api/user/delete',
        method: 'delete',
        params: { username }
    })
}