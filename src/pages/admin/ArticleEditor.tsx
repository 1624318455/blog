import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, Form, Input, Button, message, Select, Space, Modal, Typography, Segmented, Spin, Progress } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, SyncOutlined, EditOutlined, EyeOutlined, ColumnWidthOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { marked } from 'marked'

const { TextArea } = Input
const { Text } = Typography

// 配置 marked
marked.use({ gfm: true })

const AUTO_SAVE_KEY = 'blog_article_draft'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// Markdown 预览样式
const markdownStyles = `
  .markdown-preview h1 { font-size: 28px; font-weight: 700; margin: 24px 0 16px; border-bottom: 1px solid #e8e8e8; padding-bottom: 8px; }
  .markdown-preview h2 { font-size: 24px; font-weight: 700; margin: 24px 0 12px; }
  .markdown-preview h3 { font-size: 20px; font-weight: 600; margin: 20px 0 10px; }
  .markdown-preview h4 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
  .markdown-preview p { font-size: 15px; line-height: 1.8; margin-bottom: 16px; color: #333; }
  .markdown-preview ul, .markdown-preview ol { padding-left: 24px; margin-bottom: 16px; }
  .markdown-preview li { margin-bottom: 8px; line-height: 1.7; }
  .markdown-preview code:not(pre code) { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #c7254e; font-family: Consolas, Monaco, monospace; }
  .markdown-preview pre { background: #1e1e1e; color: #d4d4d4; border-radius: 8px; padding: 16px 20px; overflow-x: auto; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
  .markdown-preview pre code { background: transparent; color: inherit; padding: 0; font-family: Consolas, Monaco, monospace; }
  .markdown-preview strong { font-weight: 600; color: #000; }
  .markdown-preview a { color: #1890ff; text-decoration: none; }
  .markdown-preview a:hover { text-decoration: underline; }
  .markdown-preview blockquote { border-left: 4px solid #1890ff; padding-left: 16px; margin: 16px 0; color: #666; background: #f6f8fa; padding: 12px 16px; border-radius: 0 8px 8px 0; }
  .markdown-preview hr { border: none; border-top: 1px solid #e8e8e8; margin: 24px 0; }
  .markdown-preview table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  .markdown-preview th, .markdown-preview td { border: 1px solid #e8e8e8; padding: 8px 12px; text-align: left; }
  .markdown-preview th { background: #fafafa; font-weight: 600; }
  .markdown-preview img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
`

export default function ArticleEditor() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [content, setContent] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<any>(null)
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  // 自动保存到 localStorage
  const autoSave = useCallback(() => {
    const values = form.getFieldsValue()
    if (!values.title && !content) return
    
    setAutoSaving(true)
    const draftKey = isEdit ? `${AUTO_SAVE_KEY}_${id}` : AUTO_SAVE_KEY
    localStorage.setItem(draftKey, JSON.stringify({
      title: values.title,
      content: content,
      tags: values.tags,
      excerpt: values.excerpt,
      savedAt: new Date().toISOString(),
    }))
    setLastSaved(new Date())
    setTimeout(() => setAutoSaving(false), 500)
  }, [form, content, id, isEdit])

  // 每 30 秒自动保存
  useEffect(() => {
    const timer = setInterval(() => {
      autoSave()
    }, 30000)
    return () => clearInterval(timer)
  }, [autoSave])

  // 监听表单变化
  const handleValuesChange = () => {
    setHasUnsavedChanges(true)
  }

  // 浏览器关闭/刷新前提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // 恢复草稿
  const restoreDraft = () => {
    const draftKey = isEdit ? `${AUTO_SAVE_KEY}_${id}` : AUTO_SAVE_KEY
    const draft = localStorage.getItem(draftKey)
    if (draft) {
      try {
        const data = JSON.parse(draft)
        form.setFieldsValue({
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          excerpt: data.excerpt,
        })
        setContent(data.content || '')
        message.success('已恢复草稿')
      } catch {
        message.error('恢复草稿失败')
      }
    }
  }

  useEffect(() => {
    if (isEdit) {
      const token = localStorage.getItem('blog_token')
      fetch(`/api/admin/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.article) {
            form.setFieldsValue({
              title: data.article.title,
              content: data.article.content,
              excerpt: data.article.excerpt,
              tags: Array.isArray(data.article.tags) ? data.article.tags : (typeof data.article.tags === 'string' ? JSON.parse(data.article.tags) : []),
            })
            setContent(data.article.content || '')
          }
        })
        .catch(() => message.error('加载文章失败，请检查网络后重试'))
    }
  }, [id, isEdit, form])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('blog_token')
      const url = isEdit ? `/api/admin/articles/${id}` : '/api/admin/articles'
      const method = isEdit ? 'PUT' : 'POST'

      const submitData = {
        ...values,
        content: content,
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      }).then(r => r.json())

      if (res.success) {
        const draftKey = isEdit ? `${AUTO_SAVE_KEY}_${id}` : AUTO_SAVE_KEY
        localStorage.removeItem(draftKey)
        setHasUnsavedChanges(false)
        message.success(isEdit ? '更新成功' : '发布成功')
        navigate('/admin/articles')
      } else {
        message.error(res.error || '操作失败，请稍后重试')
      }
    } catch {
      message.error('网络异常，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '确定放弃编辑？',
        content: '您有未保存的内容，离开后将丢失',
        okText: '放弃',
        cancelText: '继续编辑',
        okButtonProps: { danger: true },
        onOk: () => navigate('/admin/articles'),
      })
    } else {
      navigate('/admin/articles')
    }
  }

  // ============ 图片上传功能 ============

  // 在光标位置插入文本
  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current?.resizableTextArea?.textArea
    if (!textarea) {
      // 如果找不到 textarea，直接追加到末尾
      setContent(prev => prev + '\n' + text)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    
    setContent(before + text + after)
    
    // 设置光标位置到插入文本之后
    setTimeout(() => {
      textarea.focus()
      const newPos = start + text.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  // 上传图片到服务器
  const uploadImage = async (base64Data: string): Promise<string> => {
    const token = localStorage.getItem('blog_token')
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        file: base64Data,
        type: 'article-image'
      })
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || '上传失败')
    }
    
    return data.url
  }

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      message.error('图片大小不能超过 5MB')
      return
    }

    setUploadingImage(true)
    setUploadProgress(30)

    try {
      // 转换为 Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setUploadProgress(60)

      // 压缩图片
      message.loading({ content: '正在压缩和上传图片...', key: 'upload', duration: 0 })
      
      // 上传图片
      setUploadProgress(80)
      const url = await uploadImage(base64Data)

      // 插入图片到编辑器
      const imageMarkdown = `![${file.name}](${url})`
      insertTextAtCursor(imageMarkdown)
      
      message.success({ content: '图片上传成功！', key: 'upload' })
      setUploadProgress(100)
    } catch (err: any) {
      message.error({ content: err.message || '图片上传失败', key: 'upload' })
    } finally {
      setTimeout(() => {
        setUploadingImage(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  // 处理粘贴事件
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          handleImageUpload(file)
        }
        return
      }
    }
  }, [content])

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file)
        return
      }
    }

    message.warning('请拖拽图片文件')
  }, [])

  // 点击上传按钮
  const handleClickUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    }
    input.click()
  }

  // 渲染编辑区域
  const renderEditor = () => (
    <div
      style={{
        position: 'relative',
        border: isDragOver ? '2px dashed #1890ff' : '1px solid #d9d9d9',
        borderRadius: 8,
        transition: 'all 0.3s',
        background: isDragOver ? '#f0f7ff' : '#fff',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(24, 144, 255, 0.1)',
            borderRadius: 8,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <div style={{ marginTop: 8, color: '#1890ff', fontWeight: 500 }}>
              拖拽图片到此处上传
            </div>
          </div>
        </div>
      )}
      
      {uploadingImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin tip="上传中..." />
            {uploadProgress > 0 && (
              <Progress percent={uploadProgress} style={{ marginTop: 16, width: 200 }} />
            )}
          </div>
        </div>
      )}

      <TextArea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          form.setFieldValue('content', e.target.value)
          setHasUnsavedChanges(true)
        }}
        onPaste={handlePaste}
        placeholder={`支持 Markdown 格式...

📷 图片上传方式：
• 直接粘贴（Ctrl+V / Cmd+V）
• 拖拽图片到此处
• 点击工具栏上传按钮

支持的格式：JPG、PNG、WebP，最大 5MB`}
        style={{ 
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 14,
          lineHeight: 1.6,
          resize: 'none',
          border: 'none',
          borderRadius: isDragOver ? 8 : 0,
        }}
        rows={viewMode === 'split' ? 28 : 20}
      />
    </div>
  )

  // 渲染预览区域
  const renderPreview = () => (
    <div 
      className="markdown-preview"
      style={{ 
        padding: 16, 
        minHeight: viewMode === 'split' ? 500 : 400,
        maxHeight: viewMode === 'split' ? 500 : 600,
        overflowY: 'auto',
        background: '#fafafa',
        borderRadius: 8,
      }}
    >
      <style>{markdownStyles}</style>
      {content ? (
        <div 
          dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }} 
          style={{ padding: '16px' }}
        />
      ) : (
        <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>
          开始输入内容，这里将实时预览 Markdown 渲染效果
        </div>
      )}
    </div>
  )

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{isEdit ? '编辑文章' : '发布文章'}</span>
          {lastSaved && (
            <span style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
              {autoSaving ? <SyncOutlined spin style={{ marginRight: 4 }} /> : '✓'}
              {autoSaving ? ' 保存中...' : ` 已自动保存 ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
        </div>
      }
      extra={
        <Space>
          <Button onClick={autoSave} icon={<SaveOutlined />}>
            暂存草稿
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            返回列表
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={{ tags: [] }}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="文章标题" size="large" maxLength={100} showCount />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="输入标签后按回车添加"
            style={{ width: '100%' }}
            maxTagCount={5}
          />
        </Form.Item>

        <Form.Item name="excerpt" label="摘要">
          <Input.TextArea rows={2} placeholder="文章摘要（可选，不填则自动截取前200字）" maxLength={300} showCount />
        </Form.Item>

        <Form.Item 
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>
                内容 (Markdown) 
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, fontWeight: 'normal' }}>
                  支持粘贴/拖拽上传图片
                </Text>
              </span>
              <Space>
                <Button 
                  size="small" 
                  icon={<UploadOutlined />} 
                  onClick={handleClickUpload}
                  disabled={uploadingImage}
                >
                  上传图片
                </Button>
                <Segmented
                  size="small"
                  value={viewMode}
                  onChange={(v) => setViewMode(v as 'edit' | 'preview' | 'split')}
                  options={[
                    { label: '编辑', value: 'edit', icon: <EditOutlined /> },
                    { label: '预览', value: 'preview', icon: <EyeOutlined /> },
                    { label: '分屏', value: 'split', icon: <ColumnWidthOutlined /> },
                  ]}
                />
              </Space>
            </div>
          }
        >
          <div style={{ display: viewMode === 'preview' ? 'none' : 'block' }}>
            {renderEditor()}
          </div>
        </Form.Item>

        {viewMode === 'preview' && (
          <Form.Item label="预览">
            {renderPreview()}
          </Form.Item>
        )}

        {viewMode === 'split' && (
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>编辑</Text>
              {renderEditor()}
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>预览</Text>
              {renderPreview()}
            </div>
          </div>
        )}

        <Form.Item style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {isEdit ? '更新文章' : '发布文章'}
            </Button>
            <Button onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 草稿恢复提示 */}
      {isEdit && !content && (
        <div style={{ textAlign: 'center', padding: 16, marginTop: 16, background: '#f6ffed', borderRadius: 8 }}>
          <Text>检测到草稿，</Text>
          <Button type="link" onClick={restoreDraft}>点击恢复</Button>
        </div>
      )}
    </Card>
  )
}
