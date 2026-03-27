import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import Category from './pages/Category'
import About from './pages/About'
import Profile from './pages/Profile'
import Center from './pages/Center'
import Settings from './pages/Settings'
import UserProfile from './pages/UserProfile'
import NotFound from './pages/NotFound'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminArticles from './pages/admin/AdminArticles'
import ArticleEditor from './pages/admin/ArticleEditor'

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif",
  },
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 前台路由 */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="article/:id" element={<ArticleDetail />} />
                <Route path="category/:tag" element={<Category />} />
                <Route path="about" element={<About />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="center/:username" element={<Center />} />
                <Route path="user/:username" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* 后台管理路由 */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="articles" element={<AdminArticles />} />
                <Route path="articles/new" element={<ArticleEditor />} />
                <Route path="articles/edit/:id" element={<ArticleEditor />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
