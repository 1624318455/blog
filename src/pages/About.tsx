import { Card, Typography, Divider } from 'antd'
import {
  GithubOutlined,
  MailOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

const skills = [
  'React / Vue / Angular',
  'TypeScript',
  'Node.js',
  'Vite / Webpack',
  'Ant Design',
  'Tailwind CSS',
  'Git',
  'Docker',
]

export default function About() {
  return (
    <div>
      <Card
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: '48px 52px' } }}
      >
        {/* 头像区 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              boxShadow: '0 4px 16px rgba(24,144,255,0.3)',
            }}
          >
            🧑‍💻
          </div>
          <Title level={2} style={{ marginBottom: 4 }}>
            我的博客
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            全栈开发者 · 技术写作者
          </Paragraph>
        </div>

        <Divider />

        {/* 关于我 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 14 }}>
            👤 关于我
          </Title>
          <Paragraph style={{ fontSize: 15, lineHeight: 2 }}>
            你好！我是一名热爱技术的前端开发者，专注于 React 生态系统，
            同时也在探索全栈开发的道路上不断成长。这个博客是我的技术笔记
            和学习分享空间，希望对来访的朋友们有所启发。
          </Paragraph>
          <Paragraph style={{ fontSize: 15, lineHeight: 2 }}>
            工作之余，我享受编程、阅读和音乐。在代码的世界里，每一次
            解决难题都是一次成长。保持热爱，持续学习 ✨
          </Paragraph>
        </div>

        <Divider />

        {/* 技术栈 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 14 }}>
            🛠 技术栈
          </Title>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {skills.map((s) => (
              <span
                key={s}
                style={{
                  padding: '6px 16px',
                  background: '#f0f0f0',
                  borderRadius: 20,
                  fontSize: 14,
                  color: '#333',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <Divider />

        {/* 联系方式 */}
        <div>
          <Title level={4} style={{ marginBottom: 14 }}>
            📬 联系方式
          </Title>
          <Paragraph style={{ fontSize: 15 }}>
            <GithubOutlined style={{ marginRight: 8, color: '#333' }} />
            GitHub:{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1890ff' }}
            >
              github.com
            </a>
          </Paragraph>
          <Paragraph style={{ fontSize: 15 }}>
            <MailOutlined style={{ marginRight: 8, color: '#333' }} />
            邮箱: hello@example.com
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}
