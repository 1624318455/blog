import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Button, Avatar, message } from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
  { key: '/admin', label: <Link to="/admin">仪表盘</Link>, icon: <DashboardOutlined /> },
  { key: '/admin/articles', label: <Link to="/admin/articles">文章管理</Link>, icon: <FileTextOutlined /> },
  { key: '/admin/articles/new', label: <Link to="/admin/articles/new">发布文章</Link>, icon: <PlusOutlined /> },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 检查是否是管理员
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('blog_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user?.role === 'admin') {
          setIsAdmin(true)
        } else {
          message.error('无权限访问管理后台')
          navigate('/')
        }
      })
      .catch(() => {
        message.error('请先登录')
        navigate('/')
      })
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isAdmin) {
    return <div style={{ textAlign: 'center', padding: 100 }}>验证权限中...</div>
  }

  // 计算选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname
    if (path === '/admin') return '/admin'
    if (path === '/admin/articles/new') return '/admin/articles/new'
    if (path.startsWith('/admin/articles')) return '/admin/articles'
    return '/admin'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* 侧边栏 */}
      <aside style={{
        width: 220,
        background: '#001529',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>
            <h1 style={{ color: '#1890ff', fontSize: 18, margin: 0 }}>📝 博客后台</h1>
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 'none', background: 'transparent', color: '#fff', flex: 1 }}
          theme="dark"
        />
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button block onClick={handleLogout} icon={<LogoutOutlined />}>
            退出登录
          </Button>
        </div>
      </aside>

      {/* 主内容 */}
      <main style={{ flex: 1, background: '#f5f5f5', overflow: 'auto' }}>
        {/* 顶部栏 */}
        <header style={{
          background: '#fff',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>管理后台</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" style={{ background: '#1890ff' }}>
              {user?.username?.[0] || 'A'}
            </Avatar>
            <span>{user?.username}</span>
          </div>
        </header>

        {/* 页面内容 */}
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
