import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, Button, Dropdown, Avatar } from 'antd'
import {
  HomeOutlined,
  FolderOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import LoginModal from './LoginModal'
import { useAuth } from '../hooks/useAuth'

const menuItems = [
  { key: '/', label: <Link to="/">首页</Link>, icon: <HomeOutlined /> },
  { key: '/category/react', label: <Link to="/category/react">React</Link>, icon: <FolderOutlined /> },
  { key: '/category/typescript', label: <Link to="/category/typescript">TypeScript</Link>, icon: <FolderOutlined /> },
  { key: '/about', label: <Link to="/about">关于</Link>, icon: <UserOutlined /> },
]

export default function Layout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const { user, logout } = useAuth()

  const selectedKey = menuItems.find((item) =>
    location.pathname === item.key || location.pathname.startsWith(item.key + '/')
  )?.key || '/'

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">个人中心</Link>,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 导航栏 */}
      <header
        style={{
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 60,
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1890ff',
              textDecoration: 'none',
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>✍️</span>
            我的博客
          </Link>

          {/* 右侧区域 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 桌面端菜单 */}
            <div className="desktop-menu">
              <Menu
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={menuItems}
                style={{ border: 'none', minWidth: 400 }}
              />
            </div>

            {/* 登录/用户 */}
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar
                    size={32}
                    style={{ background: '#1890ff' }}
                    src={user.avatar}
                  >
                    {user.nickname?.[0] || user.username?.[0] || 'U'}
                  </Avatar>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {user.nickname || user.username}
                  </span>
                </div>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => setLoginOpen(true)}
                style={{ borderRadius: 8 }}
              >
                登录
              </Button>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 24,
                cursor: 'pointer',
                padding: '0 8px',
              }}
              className="mobile-menu-btn"
            >
              <MenuOutlined />
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileOpen && (
          <div
            style={{
              background: '#fff',
              borderTop: '1px solid #f0f0f0',
              padding: '12px 24px',
            }}
          >
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={() => setMobileOpen(false)}
            />
          </div>
        )}
      </header>

      {/* 主内容 */}
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer
        style={{
          background: '#001529',
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
          padding: '24px',
          fontSize: 14,
        }}
      >
        <div>© 2024 我的博客 · 用 ❤️ 和代码构建</div>
        <div style={{ marginTop: 4, opacity: 0.7 }}>
          Built with React + Vite + Ant Design · 后端 Express + MySQL
        </div>
      </footer>

      {/* 登录弹窗 */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}
