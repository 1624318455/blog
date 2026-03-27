import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, List, Typography } from 'antd'
import { FileTextOutlined, UserOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AdminDashboard() {
  const [stats, setStats] = useState({ articles: 0, users: 0, views: 0, comments: 0 })
  const [recentArticles, setRecentArticles] = useState<any[]>([])

  useEffect(() => {
    // 获取统计数据
    fetch('/api/articles?pageSize=100')
      .then(r => r.json())
      .then(data => {
        setStats(s => ({ ...s, articles: data.total || 0 }))
        setRecentArticles((data.articles || []).slice(0, 5))
      })
  }, [])

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>仪表盘</Title>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="文章总数" value={stats.articles} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="注册用户" value={stats.users} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总阅读量" value={stats.views} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="评论数" value={stats.comments} prefix={<MessageOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="最近文章" style={{ marginTop: 24 }}>
        <List
          dataSource={recentArticles}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={<a href={`/article/${item.id}`} target="_blank" rel="noreferrer">{item.title}</a>}
                description={`${item.author_name} · ${item.views} 阅读 · ${item.created_at?.slice(0, 10)}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
