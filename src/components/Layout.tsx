import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Button, Dropdown, Avatar, Card, Typography } from 'antd'
import {
  HomeOutlined,
  FolderOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  LoginOutlined,
  SettingOutlined,
  HomeFilled,
} from '@ant-design/icons'
import { useState } from 'react'
import LoginModal from './LoginModal'
import { useAuth } from '../hooks/useAuth'

const { Text } = Typography

const menuItems = [
  { key: '/', label: <Link to="/">首页</Link>, icon: <HomeOutlined /> },
  { key: '/category/react', label: <Link to="/category/react">React</Link>, icon: <FolderOutlined /> },
  { key: '/category/typescript', label: <Link to="/category/typescript">TypeScript</Link>, icon: <FolderOutlined /> },
  { key: '/about', label: <Link to="/about">关于</Link>, icon: <UserOutlined /> },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const selectedKey = menuItems.find((item) =>
    location.pathname === item.key || location.pathname.startsWith(item.key + '/')
  )?.key || '/'

  // 用户下拉菜单内容（掘金风格）
  const userDropdownContent = (
    <Card
      style={{
        width: 240,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: 8,
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* 用户信息头部 */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Avatar
          size={48}
          style={{ background: '#4F46E5' }}
          src={user?.avatar}
        >
          {user?.username?.[0] || 'U'}
        </Avatar>
        <div>
          <Text strong style={{ fontSize: 16, display: 'block' }}>
            {user?.username}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            @{user?.username}
          </Text>
        </div>
      </div>

      {/* 菜单项 */}
      <div style={{ padding: '8px 0' }}>
        <div
          onClick={() => {
            setUserMenuOpen(false)
            navigate(`/center/${encodeURIComponent(user?.username || '')}`)
          }}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <HomeFilled style={{ fontSize: 16, color: '#666' }} />
          <span>我的主页</span>
        </div>
        <div
          onClick={() => {
            setUserMenuOpen(false)
            navigate('/settings')
          }}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <SettingOutlined style={{ fontSize: 16, color: '#666' }} />
          <span>我的设置</span>
        </div>
        <div
          onClick={() => {
            setUserMenuOpen(false)
            logout()
          }}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#ff4d4f',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fff1f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogoutOutlined style={{ fontSize: 16 }} />
          <span>退出登录</span>
        </div>
      </div>
    </Card>
  )

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
              color: '#4F46E5',
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
              <Dropdown
                dropdownRender={() => userDropdownContent}
                trigger={['click']}
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
                placement="bottomRight"
              >
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
                    {user.username?.[0] || 'U'}
                  </Avatar>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {user.username}
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
