import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, Avatar, Typography, List, Tag, Button, Empty, Skeleton } from 'antd'
import { CalendarOutlined, EyeOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
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
  email?: string
  avatar: string
  role: string
  created_at: string
  article_count: number
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [articles, setArticles] = useState<UserArticle[]>([])
  const [error, setError] = useState('')

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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Card style={{ borderRadius: 16 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: 60 }}>
          <Title level={4}>😢 {error}</Title>
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Card>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* 用户信息卡片 */}
      <Card 
        style={{ 
          borderRadius: 16, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
        }}
        styles={{ body: { padding: '40px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Avatar 
            size={120} 
            src={user.avatar} 
            style={{ 
              background: '#fff',
              border: '4px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <UserOutlined style={{ fontSize: 60, color: '#667eea' }} />
          </Avatar>
          <div style={{ color: '#fff', flex: 1 }}>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 12, fontSize: 28 }}>
              {user.username}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'block', marginBottom: 8 }}>
              @{user.username}
            </Text>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{user.article_count}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>文章</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {dayjs(user.created_at).fromNow()}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>加入</div>
              </div>
            </div>
          </div>
          <Button 
            type="default" 
            ghost 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            返回首页
          </Button>
        </div>
      </Card>

      {/* 文章列表 */}
      <Card 
        title={<span><UserOutlined style={{ marginRight: 8 }} />他的文章</span>}
        style={{ borderRadius: 16 }}
      >
        {articles.length === 0 ? (
          <Empty 
            description="还没有发布文章" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={articles}
            renderItem={(article) => (
              <List.Item
                key={article.id}
                extra={
                  <div style={{ color: '#999', fontSize: 13 }}>
                    <CalendarOutlined /> {dayjs(article.created_at).format('YYYY-MM-DD')}
                    <br />
                    <EyeOutlined style={{ marginTop: 8 }} /> {article.view_count || 0} 阅读
                  </div>
                }
              >
                <List.Item.Meta
                  title={
                    <Link 
                      to={`/article/${article.id}`}
                      style={{ fontSize: 18, fontWeight: 600 }}
                    >
                      {article.title}
                    </Link>
                  }
                />
                {article.excerpt && (
                  <Paragraph 
                    ellipsis={{ rows: 2, expandable: false }}
                    style={{ color: '#666', marginBottom: 12 }}
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
        )}
      </Card>
    </div>
  )
}
