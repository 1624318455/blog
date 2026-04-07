import { useEffect, useRef, useState } from 'react'

interface TwikooProps {
  path: string
}

export default function TwikooComment({ path }: TwikooProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const timer = setTimeout(() => {
      setShowFallback(true)
    }, 5000)

    const initTwikoo = async () => {
      try {
        const twikoo = await import('twikoo')
        
        twikoo.init({
          el: containerRef.current!,
          path: path,
          envId: import.meta.env.VITE_TWIKOO_ENV || 'https://twikoo-demo-5g1a.vercel.app',
          lang: 'zh-CN',
        })
        clearTimeout(timer)
      } catch (e) {
        console.warn('Twikoo init failed')
        setShowFallback(true)
        clearTimeout(timer)
      }
    }

    initTwikoo()

    return () => clearTimeout(timer)
  }, [path])

  if (showFallback) {
    return (
      <div 
        className="twikoo-container"
        style={{
          marginTop: 24,
          padding: '32px',
          background: 'var(--color-card-bg)',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
        <div style={{ color: 'var(--color-text)', fontSize: 15, marginBottom: 8 }}>
          评论系统正在配置中
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          部署自己的 Twikoo 服务后可正常使用
        </div>
        <a 
          href="https://twikoo.js.org/quick-start.html" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#4F46E5', fontSize: 13, marginTop: 8, display: 'inline-block' }}
        >
          部署 Twikoo →
        </a>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="twikoo-container"
      style={{
        marginTop: 24,
        padding: '24px',
        background: 'var(--color-card-bg)',
        borderRadius: 16,
        border: '1px solid var(--color-border)',
      }}
    />
  )
}