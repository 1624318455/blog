import { useEffect, useState } from 'react'
import { Card, Table, Button, Input, Space, message, Popconfirm } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'

interface Article {
  id: number
  title: string
  excerpt: string
  author_name: string
  tags: string[]
  views: number
  created_at: string
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('blog_token')
      const res = await fetch(`/api/admin/articles?page=${page}&pageSize=10&keyword=${encodeURIComponent(keyword)}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json())
      setArticles(res.articles || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('获取文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [page])

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('blog_token')
      await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      message.success('删除成功')
      fetchArticles()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', ellipsis: true, width: 200 },
    { title: '作者', dataIndex: 'author_name', width: 100, ellipsis: true },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 120,
      ellipsis: true,
      render: (tags: string[]) => (
        <span>{(Array.isArray(tags) ? tags : []).slice(0, 2).join(', ')}</span>
      )
    },
    { title: '阅读', dataIndex: 'views', width: 70, sorter: (a: Article, b: Article) => a.views - b.views },
    { title: '发布时间', dataIndex: 'created_at', width: 100, render: (d: string) => d?.slice(0, 10) },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Article) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => window.open(`/article/${record.id}`, '_blank')}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/articles/edit/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card title="文章管理" extra={
      <Link to="/admin/articles/new">
        <Button type="primary">发布文章</Button>
      </Link>
    }>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Input.Search
          placeholder="搜索文章标题"
          allowClear
          enterButton={<><SearchOutlined /> 搜索</>}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onSearch={() => { setPage(1); fetchArticles() }}
          style={{ maxWidth: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </Card>
  )
}
