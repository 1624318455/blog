import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Tabs, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import api from '../api/auth'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

type TabKey = 'login' | 'register' | 'email'

// 记住密码相关常量
const REMEMBER_KEY = 'blog_remember'

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [form] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [testCode, setTestCode] = useState<string | null>(null)
  const { login, register, loginWithEmail } = useAuth()

  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const [autoLogin, setAutoLogin] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)

  // 打开时恢复记住的账号密码
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        try {
          const { username, password, autoLogin: savedAuto } = JSON.parse(saved)
          form.setFieldsValue({ username, password })
          setAutoLogin(savedAuto || false)
          setRememberPassword(true)
        } catch {}
      }
    }
  }, [open])

  // 关闭时重置状态
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setActiveTab('login')
        setSent(false)
        setTestCode(null)
        setCountdown(0)
        form.resetFields()
        emailForm.resetFields()
      }, 300)
    }
  }, [open])

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Tab 切换时重置 sent 状态
  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey)
    if (key !== 'email') {
      setSent(false)
      setTestCode(null)
    }
  }

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const { email } = await emailForm.validateFields(['email'])
      setSendLoading(true)
      const res: any = await api.post('/email/send-code', { email })
      setSendLoading(false)

      if (res.test_code) {
        setTestCode(res.test_code)
        message.warning(`测试模式：验证码是 ${res.test_code}`)
      } else {
        message.success(res.message || '验证码已发送')
      }

      setSent(true)
      setCountdown(60)
    } catch (err: any) {
      setSendLoading(false)
      message.error(err?.error || '发送失败，请稍后重试')
    }
  }

  // 邮箱注册提交
  const handleEmailRegister = async (values: { email: string; code: string; password: string; confirmPassword: string; username: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const res: any = await api.post('/email/verify-and-register', {
        email: values.email,
        code: values.code,
        password: values.password,
        username: values.username,
      })
      loginWithEmail(res)
      onClose()
    } catch (err: any) {
      message.error(err?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  // 普通登录
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const ok = await login(values.username, values.password, autoLogin)
      if (ok) {
        // 记住密码
        if (rememberPassword) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({
            username: values.username,
            password: values.password,
            autoLogin,
          }))
        } else {
          localStorage.removeItem(REMEMBER_KEY)
        }
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  // 普通注册
  const handleRegister = async (values: { username: string; password: string; nickname?: string }) => {
    setLoading(true)
    try {
      const ok = await register(values.username, values.password, values.nickname)
      if (ok) onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      destroyOnHidden
      styles={{ mask: { backdropFilter: 'blur(4px)' } }}
    >
      <div style={{ textAlign: 'center', paddingTop: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          {activeTab === 'login' ? '登录账号' : activeTab === 'register' ? '注册账号' : '📧 邮箱注册'}
        </h2>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
          {activeTab === 'login' ? '欢迎回来' : activeTab === 'register' ? '创建你的账号' : '用邮箱安全注册'}
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        centered
        items={[
          { key: 'login', label: '登录' },
          { key: 'register', label: '注册' },
          { key: 'email', label: '📧 邮箱注册' },
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* 邮箱注册 */}
      {activeTab === 'email' && (
        <div>
          {testCode && (
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#ad6800',
            }}>
              🧪 <strong>测试模式</strong>：你的验证码是 <code style={{ fontSize: 16, fontWeight: 'bold', color: '#d46b08' }}>{testCode}</code>
            </div>
          )}

          <Form form={emailForm} layout="vertical" onFinish={handleEmailRegister} size="large" requiredMark={false}>
            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效邮箱' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="your@email.com"
                disabled={sent}
              />
            </Form.Item>

            {!sent ? (
              <Button
                block
                onClick={handleSendCode}
                loading={sendLoading}
                style={{ marginBottom: 16, height: 40 }}
              >
                发送验证码
              </Button>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <Form.Item name="code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
                  <Input
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    prefix={<CheckCircleFilled style={{ color: '#52c41a' }} />}
                  />
                </Form.Item>
                <Button
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  loading={sendLoading}
                  style={{ marginBottom: 16, width: '100%' }}
                >
                  {countdown > 0 ? `${countdown}秒后可重发` : '重新发送验证码'}
                </Button>
              </div>
            )}

            {sent && (
              <>
                {/* 用户名 */}
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3位' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="设置用户名（字母、数字、下划线）"
                  />
                </Form.Item>

                {/* 密码 */}
                <Form.Item
                  name="password"
                  label="设置密码"
                  rules={[
                    { required: true, message: '请设置密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="设置登录密码（至少6位）"
                  />
                </Form.Item>

                {/* 确认密码 */}
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="再次输入密码"
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ height: 44, fontSize: 15 }}
                  >
                    完成注册
                  </Button>
                </Form.Item>
              </>
            )}
          </Form>

          {sent && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <a onClick={() => { setSent(false); setTestCode(null) }} style={{ color: '#888', fontSize: 13 }}>
                ← 重新输入邮箱
              </a>
            </div>
          )}
        </div>
      )}

      {/* 普通登录 */}
      {activeTab === 'login' && (
        <Form form={form} layout="vertical" onFinish={handleLogin} size="large" requiredMark={false}>
          <Form.Item name="username" label="用户名 / 邮箱" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="用户名或邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="密码" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Checkbox
              checked={rememberPassword}
              onChange={(e) => {
                const checked = e.target.checked
                setRememberPassword(checked)
                // 取消记住密码时，也取消自动登录
                if (!checked) setAutoLogin(false)
              }}
            >
              记住密码
            </Checkbox>
            <Checkbox
              checked={autoLogin}
              onChange={(e) => {
                const checked = e.target.checked
                setAutoLogin(checked)
                // 勾选自动登录时，自动勾选记住密码
                if (checked) setRememberPassword(true)
              }}
            >
              自动登录（30天）
            </Checkbox>
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 15 }}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      )}

      {/* 普通注册 */}
      {activeTab === 'register' && (
        <Form form={form} layout="vertical" onFinish={handleRegister} size="large" requiredMark={false}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="设置用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="设置密码（至少6位）" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称（可选）">
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="给自己起个昵称" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 15 }}>
              注 册
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
