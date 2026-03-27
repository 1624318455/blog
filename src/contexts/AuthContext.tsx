import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { message } from 'antd'
import { authApi } from '../api/auth'

export interface AuthUser {
  id: number
  username: string
  avatar: string
  email?: string
  created_at?: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string, autoLogin?: boolean) => Promise<boolean>
  register: (username: string, password: string, nickname?: string) => Promise<boolean>
  loginWithEmail: (userData: { token: string; user: AuthUser }) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const REMEMBER_KEY = 'blog_remember'

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('blog_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)
  const [loading, setLoading] = useState(true)

  // 自动登录检查
  useEffect(() => {
    const checkAutoLogin = async () => {
      const token = localStorage.getItem('blog_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())

        if (res.user) {
          setUser(res.user)
          localStorage.setItem('blog_user', JSON.stringify(res.user))
        } else {
          // Token 无效，清除
          localStorage.removeItem('blog_token')
          localStorage.removeItem('blog_user')
          setUser(null)
        }
      } catch {
        // 网络错误等，保持当前状态
      } finally {
        setLoading(false)
      }
    }

    checkAutoLogin()
  }, [])

  const login = useCallback(async (username: string, password: string, autoLogin = false) => {
    try {
      const res: any = await authApi.login(username, password, autoLogin)
      localStorage.setItem('blog_token', res.token)
      localStorage.setItem('blog_user', JSON.stringify(res.user))
      if (autoLogin) {
        localStorage.setItem('blog_auto_login', 'true')
      }
      setUser(res.user)
      message.success(`欢迎回来，${res.user.nickname}！`)
      return true
    } catch (err: any) {
      message.error(err?.error || '登录失败')
      return false
    }
  }, [])

  const register = useCallback(async (username: string, password: string, nickname?: string) => {
    try {
      const res: any = await authApi.register(username, password, nickname)
      localStorage.setItem('blog_token', res.token)
      localStorage.setItem('blog_user', JSON.stringify(res.user))
      setUser(res.user)
      message.success(`注册成功，欢迎 ${res.user.nickname}！`)
      return true
    } catch (err: any) {
      message.error(err?.error || '注册失败')
      return false
    }
  }, [])

  // 邮箱注册成功后直接调用此方法
  const loginWithEmail = useCallback((userData: { token: string; user: AuthUser }) => {
    localStorage.setItem('blog_token', userData.token)
    localStorage.setItem('blog_user', JSON.stringify(userData.user))
    setUser(userData.user)
    message.success(`注册成功，欢迎 ${userData.user.nickname}！`)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('blog_token')
    localStorage.removeItem('blog_user')
    localStorage.removeItem(REMEMBER_KEY)
    setUser(null)
    message.info('已退出登录')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithEmail, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
