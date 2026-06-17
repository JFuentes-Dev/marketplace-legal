'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Link from 'next/link'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface PostulacionConAbogado {
  id: string
  abogado_id: string
  mensaje: string | null
  created_at: string
  perfil: {
    nombre: string
    apellido: string
    avatar_url?: string | null
  }
  lawyerProfile: {
    especialidades: string[]
    years_experiencia?: number | null
    tarifa_hora?: number | null
  }
}

interface Props {
  postulaciones: PostulacionConAbogado[]
  casoId: string
  puedeSeleccionar: boolean   // false si ya tiene abogado asignado o caso cerrado
  codigoSeguimiento?: string  // para casos anónimos
}

// ── Íconos ────────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,10.5 12,3.5" />
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
  </svg>
)
const IconArrow = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

// ── Modal de confirmación ─────────────────────────────────────────────────────
function ConfirmModal({
  abogado,
  onConfirm,
  onCancel,
  loading,
}: {
  abogado: PostulacionConAbogado
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const iniciales = `${abogado.perfil.nombre[0]}${abogado.perfil.apellido[0]}`
  return createPortal(
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(8,18,42,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(8,18,42,0.4)' }}>
        <div style={{ background: '#0f1e3a', padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,163,90,0.65)', marginBottom: 5 }}>Confirmar selección</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: '#faf4ed', margin: 0 }}>¿Asignar este abogado?</h2>
        </div>
        <div style={{ padding: '24px' }}>
          {/* Lawyer info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#f7f3ee', border: '1px solid #e0d8d0', marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(15,30,58,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: '#0f1e3a', fontWeight: 500 }}>{iniciales}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#0f1e3a', margin: '0 0 3px' }}>
                {abogado.perfil.nombre} {abogado.perfil.apellido}
              </p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(abogado.lawyerProfile.especialidades ?? []).slice(0, 2).map(e => (
                  <span key={e} style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c9a35a', background: 'rgba(201,163,90,0.1)', padding: '2px 7px' }}>{e}</span>
                ))}
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#a68f85', lineHeight: 1.65, marginBottom: 22 }}>
            Una vez asignado, el abogado tendrá acceso completo a tu caso y se iniciará la comunicación. Las demás postulaciones serán descartadas.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onConfirm} disabled={loading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0f1e3a', color: '#c9a35a', border: 'none', padding: '13px 0', fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Asignando…' : <><IconCheck /> Confirmar asignación</>}
            </button>
            <button type="button" onClick={onCancel} disabled={loading}
              style={{ flex: 1, background: 'none', border: '1px solid #e0d8d0', padding: '13px 0', fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#a68f85', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function PostulacionesPanel({ postulaciones, casoId, puedeSeleccionar, codigoSeguimiento }: Props) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState<PostulacionConAbogado | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  async function handleSeleccionar() {
    if (!confirmando) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/casos/seleccionar-abogado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caso_id: casoId,
        postulacion_id: confirmando.id,
        codigo_seguimiento: codigoSeguimiento,
      }),
    })

    const data = await res.json()
    setLoading(false)
    setConfirmando(null)

    if (!res.ok) { setError(data.error ?? 'No se pudo asignar el abogado'); return }
    setExito(`${confirmando.perfil.nombre} ${confirmando.perfil.apellido} ha sido asignado a tu caso.`)
    router.refresh()
  }

  if (postulaciones.length === 0) {
    return (
      <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px', marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--dls-navy)' }}>Abogados interesados</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-taupe)', fontStyle: 'italic', margin: 0 }}>
          Aún no hay abogados interesados en tu caso. Cuando un abogado postule, aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px', marginTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--dls-navy)' }}>Abogados interesados</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 20, color: 'var(--dls-navy)', margin: 0 }}>
              {postulaciones.length} abogado{postulaciones.length !== 1 ? 's' : ''} {postulaciones.length !== 1 ? 'han postulado' : 'ha postulado'}
            </h3>
          </div>
          {puedeSeleccionar && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
              Selecciona el que prefiereas →
            </span>
          )}
        </div>

        {/* Error / Éxito */}
        {error && (
          <div style={{ padding: '11px 16px', background: 'rgba(220,38,38,0.06)', borderLeft: '2px solid #dc2626', fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
        )}
        {exito && (
          <div style={{ padding: '11px 16px', background: 'rgba(5,150,105,0.06)', borderLeft: '2px solid #059669', fontFamily: 'var(--font-body)', fontSize: 13, color: '#059669', marginBottom: 16 }}>
            <strong>✓ Asignado.</strong> {exito}
          </div>
        )}

        {/* Cards de postulantes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {postulaciones.map(p => {
            const iniciales = `${p.perfil.nombre[0]}${p.perfil.apellido[0]}`
            return (
              <div key={p.id} style={{ border: '1px solid var(--dls-hairline)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Fila principal: avatar + info + acciones */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(15,30,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {p.perfil.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.perfil.avatar_url} alt={iniciales} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--dls-navy)', fontWeight: 500 }}>{iniciales}</span>
                    }
                  </div>

                  {/* Info abogado */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--dls-navy)', margin: 0 }}>
                        {p.perfil.nombre} {p.perfil.apellido}
                      </p>
                      {p.lawyerProfile.years_experiencia != null && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>
                          {p.lawyerProfile.years_experiencia} año{p.lawyerProfile.years_experiencia !== 1 ? 's' : ''} exp.
                        </span>
                      )}
                      {p.lawyerProfile.tarifa_hora != null && (
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--dls-champagne)', fontWeight: 500 }}>
                          ${p.lawyerProfile.tarifa_hora.toLocaleString('es-CL')}/hr
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(p.lawyerProfile.especialidades ?? []).slice(0, 3).map(e => (
                        <span key={e} style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '2px 8px' }}>{e}</span>
                      ))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <Link href={`/abogados/${p.abogado_id}`} target="_blank"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-taupe)', textDecoration: 'none', border: '1px solid var(--dls-hairline)', padding: '7px 12px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}>
                      Ver perfil <IconArrow />
                    </Link>
                    {puedeSeleccionar && !exito && (
                      <button type="button" onClick={() => setConfirmando(p)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--dls-navy)', color: 'var(--dls-champagne)', border: 'none', padding: '7px 14px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                        <IconCheck /> Seleccionar
                      </button>
                    )}
                  </div>
                </div>

                {/* Mensaje de presentación — como chat bubble */}
                {p.mensaje && (
                  <div style={{ marginLeft: 64, position: 'relative' }}>
                    {/* Línea conectora */}
                    <div style={{ position: 'absolute', left: -32, top: 14, width: 20, height: 1, background: 'var(--dls-hairline)' }} />
                    <div style={{ background: '#f0f4f8', borderRadius: '0 12px 12px 12px', padding: '12px 16px', position: 'relative', maxWidth: 540 }}>
                      {/* Triángulo */}
                      <div style={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderRight: '8px solid #f0f4f8', borderTop: '8px solid transparent' }} />
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a68f85', marginBottom: 6 }}>
                        Mensaje de presentación
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#2a3a5c', lineHeight: 1.7, margin: 0 }}>
                        {p.mensaje}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#a68f85', marginTop: 8, margin: '6px 0 0', textAlign: 'right' }}>
                        {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmando && (
        <ConfirmModal
          abogado={confirmando}
          onConfirm={handleSeleccionar}
          onCancel={() => setConfirmando(null)}
          loading={loading}
        />
      )}
    </>
  )
}