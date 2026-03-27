import axios from 'axios'

// Vite dev server proxies /api -> localhost:3001, so use relative path
const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: false,
})

// 请求拦截器：自动带上 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('blog_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('blog_token')
      localStorage.removeItem('blog_user')
      // 触发重新登录事件
      window.dispatchEvent(new CustomEvent('blog:require-login'))
    }
    return Promise.reject(err.response?.data || err)
  }
)

// Auth APIs
export const authApi = {
  login: (username: string, password: string, autoLogin = false) =>
    api.post('/auth/login', { username, password, autoLogin }),

  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (data: { avatar?: string }) =>
    api.put('/auth/profile', data),
}

// Article APIs
export const articleApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; tag?: string }) =>
    api.get('/articles', { params }),

  detail: (id: number) =>
    api.get(`/articles/${id}`),

  addComment: (articleId: number, content: string) =>
    api.post(`/articles/${articleId}/comments`, { content }),
}

// 用户信息类型
export interface User {
  id: number
  username: string
  avatar: string
  email?: string
  created_at?: string
}

export interface LoginRes {
  success: boolean
  token: string
  user: User
}

export default api
