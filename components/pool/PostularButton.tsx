// components/pool/PostularButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  casoId: string
  yaPostuló: boolean
  puntosRestantes: number
  casosLlenos: boolean // si el caso ya tiene 3 postulaciones
}

export function PostularButton({ casoId, yaPostuló, puntosRestantes, casosLlenos }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const sinPuntos = puntosRestantes <= 0
  const bloqueado = yaPostuló || sinPuntos || casosLlenos

  async function handlePostular() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/pool/postular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caso_id: casoId, mensaje }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al postular')
      return
    }

    setExito(true)
    setAbierto(false)
    router.refresh()
  }

  if (exito || yaPostuló) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polyline points="1.5,6 4.5,9 10.5,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Postulado
      </div>
    )
  }

  if (casosLlenos) {
    return (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
        Cupo lleno
      </span>
    )
  }

  if (sinPuntos) {
    return (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
        Sin puntos hoy
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--dls-champagne)',
          background: 'rgba(201,163,90,0.1)',
          border: '1px solid rgba(201,163,90,0.3)',
          padding: '8px 16px',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,163,90,0.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(201,163,90,0.1)')}
      >
        Postular →
      </button>

      {/* Modal de confirmación */}
      {abierto && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(15,30,58,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setAbierto(false)}
        >
          <div
            style={{
              background: 'var(--dls-white)',
              padding: '36px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 24px 80px -16px rgba(15,30,58,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--dls-navy)' }}>Confirmar postulación</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--dls-navy)', marginBottom: 8 }}>
              ¿Postularte a este caso?
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', marginBottom: 20 }}>
              Usarás 10 puntos. Te quedan {puntosRestantes} puntos hoy.
            </p>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Mensaje opcional para el cliente (¿por qué eres el indicado?)…"
              rows={3}
              style={{
                width: '100%',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--dls-navy)',
                border: '1px solid var(--dls-hairline)',
                padding: '10px 14px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            {error && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', marginBottom: 14 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handlePostular}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', opacity: loading ? 0.7 : 1 }}
              >
                <span>{loading ? 'Postulando…' : 'Confirmar'}</span>
              </button>
              <button
                onClick={() => setAbierto(false)}
                style={{
                  flex: 1, fontFamily: 'var(--font-body)', fontSize: 12,
                  border: '1px solid var(--dls-hairline)', background: 'none',
                  cursor: 'pointer', color: 'var(--dls-taupe)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}