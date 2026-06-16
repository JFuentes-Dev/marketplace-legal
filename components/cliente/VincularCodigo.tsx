// components/cliente/VincularCodigo.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function VincularCodigo() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [caso, setCaso] = useState<{ id: string; titulo: string; area_legal: string } | null>(null)

  async function handleVincular() {
    if (!codigo.trim()) return
    setLoading(true)
    setError(null)
    setCaso(null)

    const res = await fetch('/api/casos/vincular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigo.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'No se pudo vincular el caso.')
      return
    }

    setCaso(data.caso)
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--dls-champagne)',
          background: 'none',
          border: '1px solid rgba(201,163,90,0.3)',
          padding: '9px 16px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,163,90,0.3)')}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2l3 3-7 7H2v-3L9 2z" />
        </svg>
        Vincular código de seguimiento
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'var(--dls-white)',
        border: '1px solid var(--dls-hairline)',
        borderLeft: '2px solid var(--dls-champagne)',
        padding: '24px 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--dls-navy)' }}>Vincular caso</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', margin: 0, lineHeight: 1.6 }}>
            ¿Creaste un caso sin cuenta? Ingresa tu código de seguimiento (ej: <span style={{ fontFamily: 'monospace', color: 'var(--dls-navy)' }}>ML-A3F9B2</span>) para vincularlo aquí.
          </p>
        </div>
        <button
          onClick={() => { setAbierto(false); setError(null); setCaso(null); setCodigo('') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dls-taupe)', padding: 4 }}
          aria-label="Cerrar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </div>

      {/* Éxito */}
      {caso ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'rgba(5,150,105,0.07)',
              border: '1px solid rgba(5,150,105,0.2)',
              marginBottom: 16,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,8 6,12 14,4" />
            </svg>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#059669', fontWeight: 600, margin: 0 }}>
                ¡Caso vinculado exitosamente!
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', margin: 0 }}>
                {caso.titulo} · {caso.area_legal}
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/cliente/casos/${caso.id}`}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--dls-champagne)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(201,163,90,0.4)',
              paddingBottom: 1,
            }}
          >
            Ver mi caso →
          </Link>
        </div>
      ) : (
        /* Formulario */
        <div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ML-XXXXXX"
              maxLength={9}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: 16,
                letterSpacing: '0.1em',
                color: 'var(--dls-navy)',
                background: 'var(--dls-cream)',
                border: '1px solid var(--dls-hairline)',
                padding: '10px 14px',
                outline: 'none',
                textTransform: 'uppercase',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
              onKeyDown={(e) => { if (e.key === 'Enter') handleVincular() }}
            />
            <button
              onClick={handleVincular}
              disabled={loading || !codigo.trim()}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'var(--dls-navy)',
                color: 'var(--dls-champagne)',
                border: 'none',
                padding: '10px 20px',
                cursor: loading || !codigo.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !codigo.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s',
                flexShrink: 0,
              }}
            >
              {loading ? '…' : 'Vincular'}
            </button>
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', marginTop: 8, margin: '8px 0 0' }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}