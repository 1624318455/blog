import { useEffect, useRef } from 'react'

interface TwikooProps {
  path: string
}

export default function TwikooComment({ path }: TwikooProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initTwikoo = async () => {
      try {
        const twikoo = await import('twikoo')
        
        twikoo.init({
          el: containerRef.current!,
          path: path,
          envId: 'https://twikoo-demo-5g1a.vercel.app',
          lang: 'zh-CN',
        })
      } catch (e) {
        console.error('Failed to init Twikoo:', e)
      }
    }

    initTwikoo()
  }, [path])

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