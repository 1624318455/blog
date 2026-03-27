import { Button, Card, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
      }}
    >
      <Card
        style={{ borderRadius: 16, textAlign: 'center', maxWidth: 480, width: '100%' }}
        styles={{ body: { padding: '56px 40px' } }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
        <Title level={2}>404</Title>
        <Title level={4} type="secondary">
          页面不存在
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 28 }}>
          你访问的页面似乎迷路了，点击下方按钮返回首页吧。
        </Paragraph>
        <Link to="/">
          <Button type="primary" size="large">
            返回首页
          </Button>
        </Link>
      </Card>
    </div>
  )
}
