import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Tag, Typography, Button, Breadcrumb, Divider, List, Avatar, Input, message, Skeleton } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined,
  SendOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { useAuth } from '../hooks/useAuth'
import { articleApi } from '../api/auth'

const { TextArea } = Input
const { Title } = Typography

interface Article {
  id: number
  title: string
  excerpt: string
  content: string
  author_name: string
  tags: string[]
  views: number
  created_at: string
}

interface Comment {
  id: number
  article_id: number
  user_id: number | null
  user_name: string
  content: string
  created_at: string
}

// 文章详情骨架屏
const ArticleSkeleton = () => (
  <Card style={{ borderRadius: 16 }} styles={{ body: { padding: '40px 48px' } }}>
    <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 20 }} />
    <Skeleton.Input active size="large" style={{ width: '80%', marginBottom: 20 }} />
    <div style={{ display: 'flex', gap: 16, marginBottom: 30 }}>
      <Skeleton.Button active size="small" />
      <Skeleton.Button active size="small" />
      <Skeleton.Button active size="small" />
    </div>
    <Divider />
    <Skeleton active paragraph={{ rows: 10 }} />
  </Card>
)

// 错误状态组件
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <Card style={{ borderRadius: 16, textAlign: 'center', padding: 60 }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
    <Title level={3} style={{ marginBottom: 8 }}>加载失败了</Title>
    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
      网络可能不太稳定，请稍后重试
    </Typography.Text>
    <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
      点击重试
    </Button>
  </Card>
)

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  const fetchArticle = () => {
    if (!id) return
    setLoading(true)
    setError(false)
    articleApi.detail(Number(id))
      .then((res: any) => {
        setArticle(res.article)
        setComments(res.comments || [])
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchArticle()
  }, [id])

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const res: any = await articleApi.addComment(Number(id), commentText)
      setComments([res.comment, ...comments])
      setCommentText('')
      message.success('评论发布成功')
    } catch (err: any) {
      message.error(err?.error || '评论失败，请先登录')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <ArticleSkeleton />
  }

  if (error) {
    return <ErrorState onRetry={fetchArticle} />
  }

  if (!article) {
    return (
      <Card style={{ borderRadius: 12, textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
        <Title level={3}>文章不存在</Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          可能已被删除或链接有误
        </Typography.Text>
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          返回首页
        </Button>
      </Card>
    )
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/">首页</Link> },
          { title: <Link to={`/category/${(article.tags[0] || '').toLowerCase()}`}>{article.tags[0]}</Link> },
          { title: article.title },
        ]}
      />

      <Card
        className="article-detail-card"
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
        styles={{ body: { padding: '40px 48px' } }}
      >
        {/* 标签 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(article.tags || []).map((tag) => (
            <Tag key={tag} color="blue" style={{ borderRadius: 10, fontSize: 13 }}>
              {tag}
            </Tag>
          ))}
        </div>

        {/* 标题 */}
        <Title level={1} style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.3, marginBottom: 20 }}>
          {article.title}
        </Title>

        {/* 元信息 */}
        <div style={{ display: 'flex', gap: 20, color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 30, flexWrap: 'wrap' }}>
          <span>
            <UserOutlined style={{ marginRight: 6 }} />
            <Link to={`/user/${encodeURIComponent(article.author_name)}`}>
              {article.author_name}
            </Link>
          </span>
          <span>
            <CalendarOutlined style={{ marginRight: 6 }} />
            {article.created_at?.slice(0, 10)}
          </span>
          <span>
            <EyeOutlined style={{ marginRight: 6 }} />
            {article.views?.toLocaleString() || 0} 次阅读
          </span>
          <span>
            ⏱️ {Math.max(1, Math.ceil((article.content?.length || 500) / 1000))} 分钟阅读
          </span>
        </div>

        <Divider />

        {/* 正文 */}
        <div className="markdown-body" style={{ 
          lineHeight: 1.8,
          fontSize: 15,
          color: 'var(--color-text)',
        }}>
          <style>{`
            .markdown-body h2 {
              font-size: 22px;
              font-weight: 700;
              margin-top: 32px;
              margin-bottom: 16px;
              padding-top: 8px;
              border-top: 1px solid var(--color-border);
            }
            .markdown-body h3 {
              font-size: 18px;
              font-weight: 700;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            .markdown-body p {
              font-size: 15px;
              line-height: 1.9;
              margin-bottom: 16px;
            }
            .markdown-body ul, .markdown-body ol {
              padding-left: 24px;
              margin-bottom: 16px;
            }
            .markdown-body li {
              margin-bottom: 8px;
              line-height: 1.7;
            }
            .markdown-body code:not(pre code) {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 14px;
              color: #c7254e;
            }
            .markdown-body pre {
              background: #1e1e1e;
              color: #d4d4d4;
              border-radius: 8px;
              padding: 16px 20px;
              overflow-x: auto;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .markdown-body pre code {
              background: transparent;
              color: inherit;
              padding: 0;
            }
            .markdown-body strong {
              font-weight: 600;
            }
            .markdown-body a {
              color: #4F46E5;
              text-decoration: none;
            }
            .markdown-body a:hover {
              text-decoration: underline;
            }
            .markdown-body blockquote {
              border-left: 4px solid #4F46E5;
              padding-left: 16px;
              margin: 16px 0;
              color: #666;
            }
          `}</style>
          <style>{`
            .article-detail-card:hover {
              box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
              transform: none !important;
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: marked.parse(article.content?.replace(/\\n/g, '\n') || '', { async: false }) as string }} />
        </div>

        <Divider />

        {/* 返回按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              icon={<span>🔗</span>} 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                message.success('链接已复制到剪贴板');
              }}
            >
              复制链接
            </Button>
            <Button 
              icon={<span>📤</span>}
              onClick={() => {
                const shareData = {
                  title: article.title,
                  text: article.excerpt,
                  url: window.location.href
                };
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  message.success('链接已复制到剪贴板');
                }
              }}
            >
              分享
            </Button>
          </div>
        </div>
      </Card>

      {/* 评论区 */}
      <Card
        title={`💬 评论 (${comments.length})`}
        style={{ marginTop: 24, borderRadius: 16 }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        {/* 发表评论 */}
        <div style={{ marginBottom: 24 }}>
          <TextArea
            placeholder={user ? '写下你的评论...' : '请先登录后发表评论'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            disabled={!user}
          />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitComment}
              loading={submitting}
              disabled={!user || !commentText.trim()}
            >
              发表评论
            </Button>
          </div>
        </div>

        {/* 评论列表 */}
        {comments.length > 0 ? (
          <List
            dataSource={comments}
            renderItem={(item) => (
              <List.Item style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#1890ff' }}>{item.user_name?.[0] || '匿'}</Avatar>}
                  title={
                    <span>
                      <span style={{ fontWeight: 600 }}>{item.user_name}</span>
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 12 }}>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </span>
                  }
                  description={item.content}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            暂无评论，快来抢沙发吧~
          </div>
        )}
      </Card>
    </div>
  )
}
