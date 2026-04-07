import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, Spin } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import Layout from './components/Layout'
import AdminLayout from './pages/admin/AdminLayout'

const Home = lazy(() => import('./pages/Home'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Category = lazy(() => import('./pages/Category'))
const About = lazy(() => import('./pages/About'))
const Profile = lazy(() => import('./pages/Profile'))
const Center = lazy(() => import('./pages/Center'))
const Settings = lazy(() => import('./pages/Settings'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles'))
const ArticleEditor = lazy(() => import('./pages/admin/ArticleEditor'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  const antdTheme = useMemo(() => ({
    token: {
      colorPrimary: '#4F46E5',
      borderRadius: 8,
      fontFamily: "'Quicksand', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif",
      colorSuccess: '#22C55E',
      colorError: '#EF4444',
      colorWarning: '#F59E0B',
      ...(theme === 'dark' 
        ? {
            colorBgContainer: '#27272A',
            colorBgElevated: '#27272A',
            colorBorder: '#3F3F46',
            colorText: '#E4E4E7',
            colorTextSecondary: '#A1A1AA',
          }
        : {
            colorBgContainer: '#FFFEF9',
            colorBgElevated: '#FFFFFF',
            colorBorder: '#E7E5E0',
            colorText: '#3C3A39',
            colorTextSecondary: '#78716C',
          }
      ),
    },
  }), [theme])

  return (
    <ConfigProvider theme={antdTheme}>
      {children}
    </ConfigProvider>
  )
}

function AppContent() {
  return (
    <AntdThemeProvider>
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 前台路由 */}
              <Route path="/" element={<Layout />}>
                <Route index element={<LazyPage><Home /></LazyPage>} />
                <Route path="article/:id" element={<LazyPage><ArticleDetail /></LazyPage>} />
                <Route path="category/:tag" element={<LazyPage><Category /></LazyPage>} />
                <Route path="about" element={<LazyPage><About /></LazyPage>} />
                <Route path="profile" element={<LazyPage><Profile /></LazyPage>} />
                <Route path="settings" element={<LazyPage><Settings /></LazyPage>} />
                <Route path="center/:username" element={<LazyPage><Center /></LazyPage>} />
                <Route path="user/:username" element={<LazyPage><UserProfile /></LazyPage>} />
                <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
              </Route>

              {/* 后台管理路由 */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<LazyPage><AdminDashboard /></LazyPage>} />
                <Route path="articles" element={<LazyPage><AdminArticles /></LazyPage>} />
                <Route path="articles/new" element={<LazyPage><ArticleEditor /></LazyPage>} />
                <Route path="articles/edit/:id" element={<LazyPage><ArticleEditor /></LazyPage>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </AntdThemeProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App