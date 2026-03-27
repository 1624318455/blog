import { useState, useEffect, useRef } from 'react'
import { Card, Avatar, Typography, Form, Input, Button, message, Divider, Space, Modal, Spin, Progress } from 'antd'
import { UserOutlined, MailOutlined, CalendarOutlined, EditOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Cropper from 'react-easy-crop'
import Compressor from 'compressorjs'

const { Title, Text } = Typography

interface UserProfile {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  created_at: string
  article_count?: number
  comment_count?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<'nickname' | null>(null)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarModalVisible, setAvatarModalVisible] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 头像上传相关
  const [imageSrc, setImageSrc] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('blog_token')
      const res = await fetch('/api/auth/profile/detail', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json())
      
      if (res.user) {
        setProfile(res.user)
        form.setFieldsValue({
          nickname: res.user.nickname,
        })
      }
    } catch {
      message.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (field: string, value: string) => {
    try {
      const token = localStorage.getItem('blog_token')
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      }).then(r => r.json())

      if (res.success) {
        message.success('更新成功')
        setProfile(prev => prev ? { ...prev, [field]: value } : null)
        setEditMode(null)
        const storedUser = JSON.parse(localStorage.getItem('blog_user') || '{}')
        localStorage.setItem('blog_user', JSON.stringify({ ...storedUser, [field]: value }))
      } else {
        message.error(res.error || '更新失败')
      }
    } catch {
      message.error('网络异常，请稍后重试')
    }
  }

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setPasswordLoading(true)
    try {
      const token = localStorage.getItem('blog_token')
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      }).then(r => r.json())

      if (res.success) {
        message.success('密码修改成功，请重新登录')
        setPasswordModalVisible(false)
        passwordForm.resetFields()
        logout()
        navigate('/')
      } else {
        message.error(res.error || '修改失败')
      }
    } catch {
      message.error('网络异常，请稍后重试')
    } finally {
      setPasswordLoading(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message.error('仅支持 JPG、PNG、WebP 格式')
      return
    }

    // 验证文件大小（< 10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 处理裁剪完成
  const handleCropComplete = (_croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  // 上传裁剪后的图片
  const handleUploadAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      message.error('请先选择并裁剪图片')
      return
    }

    setUploadLoading(true)
    setUploadProgress(0)

    try {
      // 创建 canvas 进行裁剪
      const image = new Image()
      image.src = imageSrc
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )

        // 压缩图片
        canvas.toBlob((blob) => {
          if (!blob) {
            message.error('图片处理失败')
            setUploadLoading(false)
            return
          }

          new Compressor(blob as File, {
            quality: 0.5,
            maxWidth: 150,
            maxHeight: 150,
            success: async (compressedBlob) => {
              try {
                // 转换为 base64
                const reader = new FileReader()
                reader.onload = async () => {
                  const base64 = reader.result as string
                  setUploadProgress(50)
                  
                  // 检查大小（限制 50KB）
                  if (base64.length > 50 * 1024) {
                    message.error('头像图片太大，请选择更小的图片或裁剪更小的区域')
                    setUploadLoading(false)
                    return
                  }

                  // 上传到服务器
                  const token = localStorage.getItem('blog_token')
                  const res = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ avatar: base64 })
                  }).then(r => r.json())

                  setUploadProgress(100)

                  if (res.success) {
                    message.success('头像上传成功')
                    setProfile(prev => prev ? { ...prev, avatar: base64 } : null)
                    const storedUser = JSON.parse(localStorage.getItem('blog_user') || '{}')
                    localStorage.setItem('blog_user', JSON.stringify({ ...storedUser, avatar: base64 }))
                    setAvatarModalVisible(false)
                    setImageSrc('')
                    setCroppedAreaPixels(null)
                  } else {
                    message.error(res.error || '上传失败')
                  }
                }
                reader.readAsDataURL(compressedBlob as Blob)
              } catch {
                message.error('上传失败，请稍后重试')
              } finally {
                setUploadLoading(false)
              }
            },
            error: () => {
              message.error('图片压缩失败')
              setUploadLoading(false)
            }
          })
        }, 'image/jpeg', 0.8)
      }
    } catch {
      message.error('图片处理失败')
      setUploadLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Card loading={true} style={{ borderRadius: 16 }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: 60 }}>
          <Text type="secondary">请先登录</Text>
          <br />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* 头部卡片 */}
      <Card 
        style={{ 
          borderRadius: 16, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: '40px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ position: 'relative' }}>
            <Avatar 
              size={120} 
              src={profile.avatar} 
              style={{ 
                background: '#fff',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              <UserOutlined style={{ fontSize: 60, color: '#667eea' }} />
            </Avatar>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<CameraOutlined />}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onClick={() => setAvatarModalVisible(true)}
            />
          </div>
          <div style={{ color: '#fff', flex: 1 }}>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 12, fontSize: 28 }}>
              {profile.nickname || profile.username}
            </Title>
            <Space size="large" direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {profile.email || '未绑定邮箱'}
                </Text>
              </div>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  加入于 {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                </Text>
              </div>
            </Space>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff', fontSize: 32 }}>
              {profile.article_count || 0}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>发布文章</Text>
          </div>
          <Divider type="vertical" style={{ height: 60 }} />
          <div>
            <Title level={2} style={{ margin: 0, color: '#52c41a', fontSize: 32 }}>
              {profile.comment_count || 0}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>发表评论</Text>
          </div>
          <Divider type="vertical" style={{ height: 60 }} />
          <div>
            <Title level={2} style={{ margin: 0, color: '#faad14', fontSize: 32 }}>
              {Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>加入天数</Text>
          </div>
        </div>
      </Card>

      {/* 基本信息编辑 */}
      <Card 
        title={<span><EditOutlined style={{ marginRight: 8 }} />基本信息</span>}
        style={{ borderRadius: 16, marginBottom: 24 }}
      >
        <Form form={form} layout="vertical">
          {/* 昵称 */}
          <Form.Item label="昵称" name="nickname">
            {editMode === 'nickname' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Input 
                  placeholder="输入新昵称" 
                  maxLength={20}
                  style={{ flex: 1 }}
                />
                <Button 
                  type="primary" 
                  onClick={() => {
                    const nickname = form.getFieldValue('nickname')
                    if (nickname?.trim()) {
                      handleUpdateProfile('nickname', nickname.trim())
                    } else {
                      message.error('昵称不能为空')
                    }
                  }}
                >
                  保存
                </Button>
                <Button onClick={() => setEditMode(null)}>取消</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{profile.nickname || '未设置'}</Text>
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => setEditMode('nickname')}
                >
                  修改
                </Button>
              </div>
            )}
          </Form.Item>

          {/* 用户名（不可修改） */}
          <Form.Item label="用户名">
            <Text style={{ fontSize: 16 }}>{profile.username}</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>用户名不可修改</Text>
          </Form.Item>

          {/* 邮箱（不可修改） */}
          <Form.Item label="邮箱">
            <Text style={{ fontSize: 16 }}>{profile.email || '未绑定'}</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>邮箱不可修改</Text>
          </Form.Item>
        </Form>
      </Card>

      {/* 安全设置 */}
      <Card 
        title={<span><LockOutlined style={{ marginRight: 8 }} />安全设置</span>}
        style={{ borderRadius: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>登录密码</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              定期修改密码可以提高账号安全性
            </Text>
          </div>
          <Button 
            type="primary" 
            ghost
            onClick={() => setPasswordModalVisible(true)}
          >
            修改密码
          </Button>
        </div>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="输入当前密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="输入新密码（至少 6 位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setPasswordModalVisible(false)
                passwordForm.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={passwordLoading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 头像上传弹窗 */}
      <Modal
        title="上传头像"
        open={avatarModalVisible}
        onCancel={() => {
          setAvatarModalVisible(false)
          setImageSrc('')
          setCroppedAreaPixels(null)
        }}
        width={600}
        footer={null}
      >
        <Spin spinning={uploadLoading}>
          {!imageSrc ? (
            <div
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                padding: 40,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff'
                e.currentTarget.style.background = '#f5f7ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9'
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16, display: 'block' }} />
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                点击选择图片
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                支持 JPG、PNG、WebP 格式，文件大小不超过 10MB
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>裁剪头像</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  拖动图片和滚轮缩放，确保头像为正方形
                </Text>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 300, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={handleCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>缩放</Text>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginTop: 16 }}>
                  <Progress percent={uploadProgress} />
                </div>
              )}
              <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setImageSrc('')
                  setCroppedAreaPixels(null)
                }}>
                  重新选择
                </Button>
                <Button type="primary" onClick={handleUploadAvatar} loading={uploadLoading}>
                  上传头像
                </Button>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  )
}
