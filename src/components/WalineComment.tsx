import { useEffect, useRef } from 'react'

interface WalineProps {
  path: string
}

export default function WalineComment({ path }: WalineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

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
        console.error('Failed to init Waline:', e)
      }
    }

    initWaline()
  }, [path])

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