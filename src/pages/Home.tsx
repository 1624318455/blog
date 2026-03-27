import { Link } from 'react-router-dom'
import { Card, Row, Col, Tag, Typography, Input, Empty, Pagination, Skeleton } from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { articleApi } from '../api/auth'

const { Title, Paragraph } = Typography

interface Article {
  id: number
  title: string
  excerpt: string
  author_name: string
  tags: string[]
  views: number
  created_at: string
}

const colorPairs = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
  ['#d299c2', '#fef9d7'],
  ['#89f7fe', '#66a6ff'],
]

// 文章卡片骨架屏
const ArticleSkeleton = () => (
  <Col xs={24} sm={12} lg={8}>
    <Card style={{ height: '100%', borderRadius: 12 }} styles={{ body: { padding: '20px 22px' } }}>
      <Skeleton.Image active style={{ width: '100%', height: 160, borderRadius: 8 }} />
      <div style={{ marginTop: 16 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    </Card>
  </Col>
)

// 文章卡片骨架屏列表
const SkeletonList = ({ count = 6 }: { count?: number }) => (
  <Row gutter={[24, 24]}>
    {Array.from({ length: count }).map((_, i) => (
      <ArticleSkeleton key={i} />
    ))}
  </Row>
)

// 错误状态组件
const ErrorState = ({ keyword, onRetry }: { keyword: string; onRetry: () => void }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
    <Title level={4} style={{ color: '#666', marginBottom: 8 }}>
      {keyword ? '搜索出错了' : '加载失败了'}
    </Title>
    <Paragraph style={{ color: '#999', marginBottom: 20 }}>
      网络可能不太稳定，请稍后重试
    </Paragraph>
    <button
      onClick={onRetry}
      style={{
        padding: '8px 24px',
        background: '#1890ff',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      点击重试
    </button>
  </div>
)

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(9)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchArticles = async () => {
    setLoading(true)
    setError(false)
    try {
      const res: any = await articleApi.list({
        page,
        pageSize,
        keyword: keyword || undefined,
      })
      setArticles(res.articles || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('获取文章失败:', err)
      setError(true)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [page, keyword])

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    setPage(1)
  }

  return (
    <div>
      {/* Hero 区域 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #43a3fb 100%)',
          borderRadius: 16,
          padding: '48px 40px',
          marginBottom: 40,
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <Title
          level={1}
          style={{
            color: '#fff',
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: 2,
          }}
        >
          欢迎来到我的博客
        </Title>
        <Paragraph
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 18,
            marginBottom: 28,
          }}
        >
          分享前端技术、项目经验与生活感悟
        </Paragraph>
        <Input
          placeholder="搜索文章..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={keyword}
          onChange={handleKeywordChange}
          size="large"
          style={{ maxWidth: 480, borderRadius: 24, height: 48 }}
          allowClear
        />
      </div>

      {/* 文章列表 */}
      {loading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState keyword={keyword} onRetry={fetchArticles} />
      ) : articles.length === 0 ? (
        <Empty description={keyword ? "没有找到相关文章" : "暂无文章"} style={{ marginTop: 60 }} />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {articles.map((article, idx) => {
              const [c1, c2] = colorPairs[idx % colorPairs.length]
              return (
                <Col xs={24} sm={12} lg={8} key={article.id}>
                  <Link to={`/article/${article.id}`} style={{ textDecoration: 'none' }}>
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderRadius: 12,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      styles={{ body: { padding: '20px 22px' } }}
                      className="article-card"
                      cover={
                        <div
                          style={{
                            height: 160,
                            background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 52,
                          }}
                        >
                          📝
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        {(article.tags || []).slice(0, 3).map((tag) => (
                          <Tag key={tag} style={{ borderRadius: 10, fontSize: 12, background: '#e6f7ff', border: 'none', color: '#1890ff' }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>

                      <Title
                        level={4}
                        style={{
                          marginBottom: 8,
                          fontSize: 17,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.title}
                      </Title>

                      <Paragraph
                        style={{
                          color: '#666',
                          fontSize: 14,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.7,
                          marginBottom: 14,
                        }}
                      >
                        {article.excerpt || '暂无摘要'}
                      </Paragraph>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 13,
                          color: '#999',
                          borderTop: '1px solid #f0f0f0',
                          paddingTop: 12,
                          marginTop: 4,
                        }}
                      >
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          <Link 
                            to={`/user/${encodeURIComponent(article.author_name)}`}
                            style={{ color: '#666' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {article.author_name}
                          </Link>
                        </span>
                        <span>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {article.created_at?.slice(0, 10)}
                        </span>
                        <span>
                          <EyeOutlined style={{ marginRight: 4 }} />
                          {(article.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </Col>
              )
            })}
          </Row>

          {/* 分页 */}
          {total > pageSize && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 篇文章`}
              />
            </div>
          )}
        </>
      )}

      <style>{`
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15) !important;
        }
      `}</style>
    </div>
  )
}
