'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { MensajesPanel } from '@/components/casos/MensajesPanel'
import { ResumenIAAbogado } from '@/components/casos/ResumenIAAbogado'
import { ESTADO_LABELS, ESTADOS_ABOGADO, type EstadoCaso } from '@/lib/types/caso'
import type { Caso } from '@/lib/types/caso'

interface Documento {
  id: string
  nombre: string
  tipo: string
  url: string
  created_at: string
}

interface Props {
  caso: Caso
  cliente: { nombre: string; apellido: string; email: string; telefono?: string | null } | null
  resumenIA?: { resumen_actual: string; generated_at: string } | null
  userId: string
  documentos: Documento[]
}

// Hitos macro de la barra de progreso
const HITOS: { key: EstadoCaso; label: string }[] = [
  { key: 'pendiente',         label: 'Iniciado'  },
  { key: 'asignado',          label: 'Asignado'  },
  { key: 'proxima_audiencia', label: 'En curso'  },
  { key: 'cerrado',           label: 'Cerrado'   },
]

function hitoIndex(estado: EstadoCaso): number {
  if (estado === 'pendiente') return 0
  if (estado === 'asignado')  return 1
  if (estado === 'cerrado')   return 3
  return 2
}

// Estados macro (no intermedios)
const ESTADOS_MACRO = new Set<EstadoCaso>(['pendiente', 'asignado', 'cerrado'])

// Devuelve true si el estado es un estado intermedio (no macro)
function esEstadoIntermedio(estado: EstadoCaso): boolean {
  return !ESTADOS_MACRO.has(estado)
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function CasoDetalleAbogado({ caso, cliente, resumenIA, userId, documentos }: Props) {
  const router = useRouter()
  const [chatOpen, setChatOpen]               = useState(true)
  const [estadoLocal, setEstadoLocal]         = useState<EstadoCaso>(caso.estado)
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoCaso>(caso.estado)
  const [guardando, setGuardando]             = useState(false)
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [file, setFile]                       = useState<File | null>(null)
  const [subiendo, setSubiendo]               = useState(false)
  const [uploadMsg, setUploadMsg]             = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const idx         = hitoIndex(estadoLocal)
  const casoCerrado = estadoLocal === 'cerrado'

  // Hay cambio solo si el estado pendiente es distinto al guardado
  const hayCambio = estadoPendiente !== estadoLocal

  // Label que muestra el trigger del dropdown
  // Si es estado intermedio → mostrar "En curso" (macro), el detalle va en la sub-etiqueta
  // Si es asignado → placeholder
  // Si es cerrado → "Cerrado"
  const triggerLabel =
    estadoPendiente === 'asignado'
      ? 'Seleccionar estado…'
      : esEstadoIntermedio(estadoPendiente)
      ? 'En curso'
      : ESTADO_LABELS[estadoPendiente]

  // Sub-etiqueta: solo se muestra cuando hay un estado intermedio seleccionado
  const mostrarSubEtiqueta = esEstadoIntermedio(estadoPendiente)

  async function guardarEstado() {
    if (!hayCambio) return
    setGuardando(true)
    try {
      const res = await fetch('/api/casos/cambiar-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoId: caso.id, estado: estadoPendiente }),
      })
      if (!res.ok) throw new Error()
      // Sincronizar estadoLocal con lo que se acaba de guardar
      setEstadoLocal(estadoPendiente)
      router.refresh()
    } catch {
      alert('No se pudo actualizar el estado')
      // Revertir selección al estado guardado
      setEstadoPendiente(estadoLocal)
    } finally {
      setGuardando(false)
    }
  }

  async function handleSubir() {
    if (!file) return
    setSubiendo(true)
    setUploadMsg(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`/api/casos/${caso.id}/documentos`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error()
      setUploadMsg({ tipo: 'ok', texto: 'Documento subido correctamente' })
      setFile(null)
      router.refresh()
    } catch {
      setUploadMsg({ tipo: 'error', texto: 'Error al subir el documento' })
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)' }}>

      {/* ── Nav superior ─────────────────────────────────────── */}
      <div style={{ background: 'var(--dls-navy)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard/abogado" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(250,244,237,0.6)', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} />
            Mis casos
          </Link>
          {/* Nav: badge macro + sub-etiqueta solo si estado intermedio guardado */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <EstadoBadge estado={estadoLocal} macro />
            {esEstadoIntermedio(estadoLocal) && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(250,244,237,0.45)', letterSpacing: '0.06em' }}>
                {ESTADO_LABELS[estadoLocal]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Encabezado ───────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(24px,3vw,36px)', color: 'var(--dls-navy)', marginBottom: 6 }}>
            {caso.titulo}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)' }}>
            Área: <strong>{caso.area_legal}</strong> · Creado el {formatFecha(caso.created_at)}
          </p>
        </div>

        {/* ── Barra de progreso + selector estado ─────────────── */}
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '24px 28px', marginBottom: 24 }}>

          {/* Hitos */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {HITOS.map((hito, i) => {
              const completado = i <= idx
              const activo     = i === idx
              return (
                <div key={hito.key} style={{ display: 'flex', alignItems: 'center', flex: i < HITOS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: completado ? 'var(--dls-navy)' : 'var(--dls-hairline)', border: activo ? '2px solid var(--dls-champagne)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {completado && (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <polyline points="2,6.5 5,9.5 11,3.5" stroke="var(--dls-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: completado ? 'var(--dls-navy)' : 'var(--dls-taupe)', fontWeight: activo ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {hito.label}
                    </span>
                  </div>
                  {i < HITOS.length - 1 && (
                    <div style={{ flex: 1, height: 2, marginBottom: 18, marginLeft: 6, marginRight: 6, background: i < idx ? 'var(--dls-champagne)' : 'var(--dls-hairline)' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Selector estado */}
          {!casoCerrado && (
            <div style={{ borderTop: '1px solid var(--dls-hairline)', paddingTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 10 }}>
                Actualizar estado del caso
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  {/* Trigger */}
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
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
                      color: estadoPendiente === 'asignado' ? 'var(--dls-taupe)' : 'var(--dls-navy)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{triggerLabel}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points={dropdownOpen ? '2,8 6,4 10,8' : '2,4 6,8 10,4'} />
                    </svg>
                  </button>

                  {/* Sub-etiqueta debajo del trigger (solo estados intermedios) */}
                  {mostrarSubEtiqueta && (
                    <div style={{ paddingTop: 5, paddingLeft: 2, fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-taupe)', letterSpacing: '0.05em' }}>
                      Sub-estado: <strong style={{ color: 'var(--dls-navy)' }}>{ESTADO_LABELS[estadoPendiente]}</strong>
                      {hayCambio && (
                        <span style={{ marginLeft: 6, color: 'var(--dls-champagne)' }}>· sin guardar</span>
                      )}
                    </div>
                  )}

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', borderTop: 'none', zIndex: 50, maxHeight: 280, overflowY: 'auto' }}>
                      {ESTADOS_ABOGADO.map((est) => (
                        <button
                          key={est}
                          onClick={() => { setEstadoPendiente(est); setDropdownOpen(false) }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontFamily: 'var(--font-body)',
                            fontSize: 13,
                            color: est === estadoPendiente ? 'var(--dls-champagne)' : 'var(--dls-navy)',
                            background: est === estadoPendiente ? 'rgba(201,163,90,0.08)' : 'transparent',
                            fontWeight: est === estadoPendiente ? 600 : 400,
                            border: 'none',
                            borderBottom: '1px solid var(--dls-hairline)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {est === estadoPendiente && (
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

                <button
                  onClick={guardarEstado}
                  disabled={!hayCambio || guardando}
                  style={{
                    padding: '10px 20px',
                    background: hayCambio ? 'var(--dls-navy)' : 'var(--dls-hairline)',
                    color: hayCambio ? 'var(--dls-cream)' : 'var(--dls-taupe)',
                    border: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: hayCambio ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {/* Caso cerrado: mensaje informativo */}
          {casoCerrado && (
            <div style={{ borderTop: '1px solid var(--dls-hairline)', paddingTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', fontStyle: 'italic' }}>
                Este caso está cerrado y no admite cambios de estado.
              </div>
            </div>
          )}
        </div>

        {/* ── Grid principal ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── Columna izquierda ──────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Resumen IA */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
              <ResumenIAAbogado
                casoId={caso.id}
                resumenInicial={resumenIA?.resumen_actual}
                generatedAt={resumenIA?.generated_at}
              />
            </div>

            {/* Descripción + cliente */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 16 }}>
                Descripción del caso
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--dls-navy)', whiteSpace: 'pre-wrap' }}>
                {caso.descripcion}
              </p>

              {cliente && (
                <>
                  <div style={{ borderTop: '1px solid var(--dls-hairline)', margin: '20px 0' }} />
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 12 }}>
                    Cliente
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--dls-navy)' }}>
                      {cliente.nombre} {cliente.apellido}
                    </div>
                    <a href={`mailto:${cliente.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', textDecoration: 'none' }}>
                      <Mail size={13} /> {cliente.email}
                    </a>
                    {cliente.telefono && (
                      <a href={`tel:${cliente.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', textDecoration: 'none' }}>
                        <Phone size={13} /> {cliente.telefono}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Documentos */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 16 }}>
                Documentos
              </div>

              {documentos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <FileText size={32} style={{ opacity: 0.2, margin: '0 auto 8px', color: 'var(--dls-taupe)' }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)' }}>No hay documentos adjuntos aún</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {documentos.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--dls-hairline)', textDecoration: 'none' }}
                    >
                      <div style={{ width: 36, height: 36, background: 'rgba(201,163,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} style={{ color: 'var(--dls-champagne)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--dls-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.nombre}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 2 }}>
                          {formatFecha(doc.created_at)}
                        </div>
                      </div>
                      <ExternalLink size={13} style={{ color: 'var(--dls-taupe)', flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              )}

              {/* Upload */}
              {!casoCerrado && (
                <div style={{ borderTop: documentos.length > 0 ? '1px solid var(--dls-hairline)' : 'none', paddingTop: documentos.length > 0 ? 16 : 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 12 }}>
                    Subir documento
                  </div>

                  {!file ? (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 20px', border: '2px dashed var(--dls-hairline)', cursor: 'pointer', textAlign: 'center' }}>
                      <Upload size={24} style={{ color: 'var(--dls-taupe)', opacity: 0.5 }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy-mid)' }}>
                        Arrastra un archivo o{' '}
                        <span style={{ color: 'var(--dls-champagne)', textDecoration: 'underline' }}>selecciona desde tu equipo</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>
                        PDF, Word, Excel, JPG, PNG · Máx. 10 MB
                      </span>
                      <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
                    </label>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(201,163,90,0.06)', border: '1px solid rgba(201,163,90,0.2)' }}>
                        <FileText size={15} style={{ color: 'var(--dls-champagne)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dls-taupe)', padding: 0 }}>
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        onClick={handleSubir}
                        disabled={subiendo}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: 'var(--dls-navy)', color: 'var(--dls-cream)', border: 'none', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', cursor: subiendo ? 'not-allowed' : 'pointer', opacity: subiendo ? 0.7 : 1 }}
                      >
                        {subiendo
                          ? <><Loader2 size={13} className="animate-spin" /> Subiendo…</>
                          : <><Upload size={13} /> Subir documento</>
                        }
                      </button>
                    </div>
                  )}

                  {uploadMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: uploadMsg.tipo === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${uploadMsg.tipo === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      {uploadMsg.tipo === 'ok'
                        ? <CheckCircle2 size={13} style={{ color: '#059669' }} />
                        : <AlertCircle size={13} style={{ color: '#dc2626' }} />
                      }
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: uploadMsg.tipo === 'ok' ? '#059669' : '#dc2626' }}>
                        {uploadMsg.texto}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Columna derecha (chat) ─────────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <button
              onClick={() => setChatOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--dls-navy)', color: 'var(--dls-cream)', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={14} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em' }}>Mensajes</span>
              </div>
              {chatOpen
                ? <ChevronUp size={14} style={{ opacity: 0.5 }} />
                : <ChevronDown size={14} style={{ opacity: 0.5 }} />
              }
            </button>

            {chatOpen ? (
              <div style={{ border: '1px solid var(--dls-hairline)', borderTop: 'none', background: 'var(--dls-white)', height: 540, overflow: 'hidden' }}>
                <MensajesPanel casoId={caso.id} userId={userId} cerrado={casoCerrado} />
              </div>
            ) : (
              <div style={{ border: '1px solid var(--dls-hairline)', borderTop: 'none', padding: '16px', textAlign: 'center', background: 'var(--dls-white)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
                  Haz clic para ver los mensajes con el cliente
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}