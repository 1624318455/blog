import { useEffect, useRef, useState } from 'react'

interface WalineProps {
  path: string
}

export default function WalineComment({ path }: WalineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!containerRef.current || initialized.current) return
    
    const initWaline = async () => {
      try {
        const Waline = await import('@waline/client')
        
        Waline.init({
          el: containerRef.current!,
          path: path,
          serverURL: 'https://waline-demo-gray.vercel.app',
          lang: 'zh-CN',
          dark: document.documentElement.getAttribute('data-theme') === 'dark',
          pageSize: 10,
          requiredMeta: ['nick'],
        })
        initialized.current = true
      } catch (e) {
        console.warn('Waline init failed, using fallback')
        setError(true)
      }
    }

    initWaline()
  }, [path])

  if (error) {
    return (
      <div 
        className="waline-container"
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
          评论系统暂时不可用
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          请稍后刷新页面重试，或联系管理员
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="waline-container"
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