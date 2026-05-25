'use client'

import { useState, useTransition } from 'react'
import { ESTADO_LABELS, ESTADOS_ABOGADO, type EstadoCaso } from '@/lib/types/caso'

interface Props {
  casoId?: string
  estado: EstadoCaso
  editable?: boolean
}

// Progreso lineal simplificado: 4 hitos macro
const HITOS: { key: EstadoCaso; label: string }[] = [
  { key: 'pendiente', label: 'Iniciado' },
  { key: 'asignado',  label: 'Asignado' },
  { key: 'proxima_audiencia', label: 'En curso' },
  { key: 'cerrado',   label: 'Cerrado' },
]

function hitoIndex(estado: EstadoCaso): number {
  if (estado === 'pendiente') return 0
  if (estado === 'asignado') return 1
  if (estado === 'cerrado') return 3
  return 2 // todos los estados intermedios = "En curso"
}

export function BarraProgresoCaso({ casoId, estado, editable = false }: Props) {
  const [estadoLocal, setEstadoLocal] = useState<EstadoCaso>(estado)
  const [loading, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const idx = hitoIndex(estadoLocal)

  async function cambiarEstado(nuevoEstado: EstadoCaso) {
    if (!casoId || nuevoEstado === estadoLocal) return
    setOpen(false)

    const anterior = estadoLocal
    setEstadoLocal(nuevoEstado)

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/casos/cambiar-estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ casoId, estado: nuevoEstado }),
          })
          if (!res.ok) throw new Error()
        } catch {
          setEstadoLocal(anterior)
          alert('No se pudo actualizar el estado')
        }
      })()
    })
  }

  return (
    <div
      style={{
        background: 'var(--dls-white)',
        border: '1px solid var(--dls-hairline)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Barra de progreso de 4 hitos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {HITOS.map((hito, i) => {
          const completado = i <= idx
          const activo = i === idx
          return (
            <div key={hito.key} style={{ display: 'flex', alignItems: 'center', flex: i < HITOS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: completado ? 'var(--dls-navy)' : 'var(--dls-hairline)',
                    border: activo ? '2px solid var(--dls-champagne)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {completado && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <polyline points="2,6.5 5,9.5 11,3.5" stroke="var(--dls-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: completado ? 'var(--dls-navy)' : 'var(--dls-taupe)',
                    fontWeight: activo ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {hito.label}
                </span>
              </div>
              {i < HITOS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    marginBottom: 18,
                    marginLeft: 6,
                    marginRight: 6,
                    background: i < idx ? 'var(--dls-champagne)' : 'var(--dls-hairline)',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Selector de estado (solo abogado) */}
      {editable && (
        <div style={{ borderTop: '1px solid var(--dls-hairline)', paddingTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 10 }}>
            Actualizar estado del caso
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--dls-cream)',
                border: '1px solid var(--dls-hairline)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--dls-navy)',
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{loading ? 'Actualizando…' : ESTADO_LABELS[estadoLocal]}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={open ? '2,8 6,4 10,8' : '2,4 6,8 10,4'} />
              </svg>
            </button>

            {open && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--dls-white)',
                  border: '1px solid var(--dls-hairline)',
                  borderTop: 'none',
                  zIndex: 50,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {ESTADOS_ABOGADO.map((est) => (
                  <button
                    key={est}
                    onClick={() => cambiarEstado(est)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: est === estadoLocal ? 'var(--dls-champagne)' : 'var(--dls-navy)',
                      background: est === estadoLocal ? 'rgba(201,163,90,0.08)' : 'transparent',
                      fontWeight: est === estadoLocal ? 600 : 400,
                      border: 'none',
                      borderBottom: '1px solid var(--dls-hairline)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {est === estadoLocal && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1,5 4,8 9,2" stroke="var(--dls-champagne)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {ESTADO_LABELS[est]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}