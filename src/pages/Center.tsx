import { useState, useEffect } from 'react'
import { Card, Avatar, Typography, Tabs, List, Tag, Button, Empty, Skeleton, Statistic, Row, Col } from 'antd'
import { CalendarOutlined, EyeOutlined, UserOutlined, FileTextOutlined, CommentOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Text, Paragraph } = Typography

interface UserArticle {
  id: number
  title: string
  excerpt: string
  tags: string[]
  created_at: string
  view_count: number
}

interface UserProfile {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
  created_at: string
  article_count: number
  comment_count: number
}

export default function Center() {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [articles, setArticles] = useState<UserArticle[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('articles')

  useEffect(() => {
    if (!username) return

    setLoading(true)
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setUser(data.user)
          setArticles(data.articles || [])
        }
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <Card style={{ borderRadius: 16 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: 60 }}>
          <Title level={4}>😢 {error || '用户不存在'}</Title>
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* 用户信息卡片 */}
      <Card 
        style={{ 
          borderRadius: 16,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            {/* 头像 */}
            <Avatar 
              size={100} 
              src={user.avatar}
              style={{ 
                background: '#fff',
                border: '4px solid rgba(255,255,255,0.3)',
              }}
            >
              <UserOutlined style={{ fontSize: 48, color: '#667eea' }} />
            </Avatar>

            {/* 用户信息 */}
            <div style={{ flex: 1, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  {user.nickname || user.username}
                </Title>
                <Tag style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none',
                  color: '#fff'
                }}>
                  {user.role === 'admin' ? '管理员' : '作者'}
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                @{user.username}
              </Text>

              {/* 统计信息 */}
              <Row gutter={48} style={{ marginTop: 20 }}>
                <Col>
                  <Statistic 
                    value={user.article_count || 0} 
                    valueStyle={{ color: '#fff', fontSize: 24 }}
                    suffix="篇"
                  />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>文章</Text>
                </Col>
                <Col>
                  <Statistic 
                    value={user.comment_count || 0} 
                    valueStyle={{ color: '#fff', fontSize: 24 }}
                    suffix="条"
                  />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>评论</Text>
                </Col>
                <Col>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
                      {dayjs(user.created_at).fromNow()}
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>加入</Text>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Card>

      {/* 文章列表 */}
      <Card style={{ borderRadius: 16 }}>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'articles',
              label: (
                <span>
                  <FileTextOutlined /> 文章 ({user.article_count || 0})
                </span>
              ),
              children: (
                articles.length === 0 ? (
                  <Empty description="暂无文章" />
                ) : (
                  <List
                    itemLayout="vertical"
                    dataSource={articles}
                    renderItem={(article) => (
                      <List.Item
                        key={article.id}
                        extra={
                          <div style={{ color: '#999', fontSize: 13, textAlign: 'right' }}>
                            <div><CalendarOutlined /> {dayjs(article.created_at).format('YYYY-MM-DD')}</div>
                            <div style={{ marginTop: 4 }}><EyeOutlined /> {article.view_count || 0} 阅读</div>
                          </div>
                        }
                      >
                        <List.Item.Meta
                          title={
                            <Link 
                              to={`/article/${article.id}`}
                              style={{ fontSize: 16, fontWeight: 600 }}
                            >
                              {article.title}
                            </Link>
                          }
                        />
                        {article.excerpt && (
                          <Paragraph 
                            ellipsis={{ rows: 2, expandable: false }}
                            style={{ color: '#666', marginBottom: 8 }}
                          >
                            {article.excerpt}
                          </Paragraph>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {article.tags.slice(0, 5).map((tag, index) => (
                              <Tag key={index} color="blue">{tag}</Tag>
                            ))}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                )
              ),
            },
            {
              key: 'comments',
              label: (
                <span>
                  <CommentOutlined /> 评论 ({user.comment_count || 0})
                </span>
              ),
              children: (
                <Empty description="暂无评论" />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
