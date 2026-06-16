// app/dashboard/admin/casos/[id]/AceptarPostulacion.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Postulacion {
  id: string
  abogado_id: string
  nombre: string
  apellido: string
  especialidades: string[]
  mensaje: string | null
  created_at: string
}

interface Props {
  casoId: string
  postulaciones: Postulacion[]
}

export default function AceptarPostulacion({ casoId, postulaciones }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAceptar(postulacionId: string) {
    setLoading(postulacionId)
    setError(null)

    const res = await fetch('/api/admin/aceptar-postulacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postulacion_id: postulacionId }),
    })

    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      setError(data.error ?? 'Error al aceptar la postulación')
      return
    }

    router.refresh()
  }

  if (postulaciones.length === 0) {
    return (
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', fontStyle: 'italic' }}>
        Aún no hay postulaciones para este caso.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}
      {postulaciones.map((p) => (
        <div
          key={p.id}
          style={{
            background: 'var(--dls-cream)',
            border: '1px solid var(--dls-hairline)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(15,30,58,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--dls-navy)', fontWeight: 500 }}>
              {p.nombre[0]}{p.apellido[0]}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--dls-navy)', marginBottom: 4 }}>
              {p.nombre} {p.apellido}
            </p>
            {p.especialidades.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {p.especialidades.slice(0, 3).map((e) => (
                  <span key={e} style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '2px 8px' }}>
                    {e}
                  </span>
                ))}
              </div>
            )}
            {p.mensaje && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{p.mensaje}"
              </p>
            )}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 6 }}>
              {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <button
            onClick={() => handleAceptar(p.id)}
            disabled={loading === p.id}
            style={{
              flexShrink: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--dls-navy)',
              color: 'var(--dls-champagne)',
              border: 'none',
              padding: '10px 18px',
              cursor: loading === p.id ? 'wait' : 'pointer',
              opacity: loading === p.id ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading === p.id ? 'Procesando…' : 'Aceptar'}
          </button>
        </div>
      ))}
    </div>
  )
}