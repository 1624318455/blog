import { useParams, Link } from 'react-router-dom'
import { Card, Row, Col, Tag, Typography, Empty, Breadcrumb } from 'antd'
import { CalendarOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import { articles } from '../data/articles'

const { Title, Paragraph } = Typography

export default function Category() {
  const { tag } = useParams<{ tag: string }>()
  const tagUpper = tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : ''
  const filtered = articles.filter(
    (a) =>
      a.tags.some((t) => t.toLowerCase() === tag?.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(tag?.toLowerCase() || ''))
  )

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/">首页</Link> },
          { title: `分类: ${tagUpper}` },
        ]}
      />

      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 6 }}>
          📂 {tagUpper}
        </Title>
        <Paragraph type="secondary">
          共找到 {filtered.length} 篇文章
        </Paragraph>
      </div>

      {filtered.length === 0 ? (
        <Empty description="该分类下暂无文章" />
      ) : (
        <Row gutter={[24, 24]}>
          {filtered.map((article) => (
            <Col xs={24} sm={12} key={article.id}>
              <Link to={`/article/${article.id}`} style={{ textDecoration: 'none' }}>
                <Card
                  hoverable
                  style={{ borderRadius: 12 }}
                  className="article-card"
                  cover={
                    <div
                      style={{
                        height: 120,
                        background: `linear-gradient(135deg, hsl(${(article.id * 47) % 360}, 70%, 60%) 0%, hsl(${((article.id * 47) % 360 + 40) % 360}, 70%, 50%) 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 40,
                      }}
                    >
                      📝
                    </div>
                  }
                >
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                    {article.tags.slice(0, 3).map((t) => (
                      <Tag key={t} color="blue" style={{ borderRadius: 8, fontSize: 12 }}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                  <Title
                    level={4}
                    style={{
                      fontSize: 17,
                      marginBottom: 8,
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
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: 12,
                    }}
                  >
                    {article.excerpt}
                  </Paragraph>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#999',
                      borderTop: '1px solid #f0f0f0',
                      paddingTop: 10,
                    }}
                  >
                    <span>
                      <UserOutlined style={{ marginRight: 3 }} />
                      {article.author}
                    </span>
                    <span>
                      <CalendarOutlined style={{ marginRight: 3 }} />
                      {article.date}
                    </span>
                    <span>
                      <EyeOutlined style={{ marginRight: 3 }} />
                      {article.views.toLocaleString()}
                    </span>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}

      <style>{`
        .article-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(24,144,255,0.12) !important;
        }
      `}</style>
    </div>
  )
}
