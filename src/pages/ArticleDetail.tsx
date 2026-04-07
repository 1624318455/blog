import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Tag, Typography, Button, Breadcrumb, Divider, Skeleton, Row, Col } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, UserOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { articleApi } from '../api/auth'
import WalineComment from '../components/WalineComment'
import ArticleToc from '../components/ArticleToc'

const { Title, Text } = Typography

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
    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
      网络可能不太稳定，请稍后重试
    </Text>
    <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
      点击重试
    </Button>
  </Card>
)

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchArticle = () => {
    if (!id) return
    setLoading(true)
    setError(false)
    articleApi.detail(Number(id))
      .then((res: any) => {
        setArticle(res.article)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchArticle()
  }, [id])

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
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          可能已被删除或链接有误
        </Text>
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

      <Row gutter={32}>
        <Col xs={24} lg={18}>
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
                  background: var(--color-background-secondary);
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
                  color: var(--color-text-muted);
                }
              `}</style>
              <style>{`
                .article-detail-card:hover {
                  box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
                  transform: none !important;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: marked.parse(article.content?.replace(/\\n/g, '\n') || '', {
                gfm: true,
                breaks: false,
              }) as string }} />
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
                    }
                  }}
                >
                  分享
                </Button>
              </div>
            </div>
          </Card>

          {/* Waline 评论系统 */}
          <WalineComment path={`/article/${id}`} />
        </Col>

        {/* TOC 侧边栏 */}
        <Col xs={24} lg={6}>
          <ArticleToc content={article.content} />
        </Col>
      </Row>
    </div>
  )
}