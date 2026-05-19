'use client'
// components/shared/BackButton.tsx
import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      title="Volver atrás"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        background: 'transparent',
        border: '1px solid rgba(201,163,90,0.3)',
        cursor: 'pointer',
        color: 'rgba(250,244,237,0.6)',
        transition: 'border-color 0.2s, color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--dls-champagne)'
        el.style.color = 'var(--dls-champagne)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(201,163,90,0.3)'
        el.style.color = 'rgba(250,244,237,0.6)'
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7,2 3,6 7,10" />
        <line x1="3" y1="6" x2="11" y2="6" />
      </svg>
    </button>
  )
}