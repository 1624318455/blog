import { useEffect, useState, useMemo } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleTocProps {
  content: string
}

export default function ArticleToc({ content }: ArticleTocProps) {
  const [activeId, setActiveId] = useState('')
  
  const toc = useMemo(() => {
    const headings: TocItem[] = []
    
    // 移除代码块后再匹配标题
    const contentWithoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    let match
    
    while ((match = headingRegex.exec(contentWithoutCode)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
      headings.push({ id, text, level })
    }
    
    return headings
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    document.querySelectorAll('.markdown-body h2, .markdown-body h3').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [content])

  if (toc.length < 2) return null

  return (
    <div 
      className="article-toc"
      style={{
        position: 'sticky',
        top: 80,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '16px',
        background: 'var(--color-card-bg)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ 
        fontSize: 14, 
        fontWeight: 600, 
        marginBottom: 12, 
        color: 'var(--color-text)',
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border)'
      }}>
        📑 目录
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {toc.map((item) => (
          <li 
            key={item.id}
            style={{
              marginBottom: 8,
              paddingLeft: (item.level - 1) * 12,
            }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                setActiveId(item.id)
              }}
              style={{
                display: 'block',
                fontSize: 13,
                color: activeId === item.id ? '#4F46E5' : 'var(--color-text-muted)',
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                background: activeId === item.id ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                transition: 'all 0.2s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}