'use client'

// components/casos/CasoDetalleCliente.tsx

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Shield,
  Calendar,
  FileText,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { MensajesPanel } from '@/components/casos/MensajesPanel'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { FormularioReview } from '@/components/casos/FormularioReview'
import { UploadDocumento } from '@/components/casos/UploadDocumento'
import { ResumenIA } from '@/components/casos/ResumenIA'
import { ESTADO_LABELS, type EstadoCaso, type Caso } from '@/lib/types/caso'

// ─── Tipos ────────────────────────────────────────────────────

interface Abogado {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  avatar_url: string | null
}

interface LawyerProfile {
  especialidades: string[] | string | null
  bio: string | null
  tarifa_hora: number | null
  years_experiencia: number | null
  verified: boolean
}

interface Evento {
  id: string
  tipo: string
  titulo: string
  fecha: string
  descripcion: string | null
  completado: boolean
}

interface Documento {
  id: string
  nombre: string
  tipo: string
  url: string
  created_at: string
}

interface ReviewExistente {
  puntuacion: number
  comentario: string | null
}

interface Props {
  caso: Caso
  abogado: Abogado | null
  lawyerProfile: LawyerProfile | null
  eventos: Evento[]
  documentos: Documento[]
  userId: string
  reviewExistente?: ReviewExistente
}

// ─── Constantes ───────────────────────────────────────────────

// Hitos macro de la barra de progreso — igual que en CasoDetalleAbogado
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
  return 2 // cualquier estado intermedio = "En curso"
}

const ESTADOS_MACRO = new Set(['pendiente', 'asignado', 'cerrado'])
const esIntermedio = (e: string) => !ESTADOS_MACRO.has(e)

const TIPO_EVENTO: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  audiencia:   { label: 'Audiencia',   icon: '⚖️', bg: 'bg-blue-50   border-blue-100',   text: 'bg-blue-100   text-blue-700'   },
  mediacion:   { label: 'Mediación',   icon: '🤝', bg: 'bg-purple-50 border-purple-100', text: 'bg-purple-100 text-purple-700' },
  gestion:     { label: 'Gestión',     icon: '📋', bg: 'bg-green-50  border-green-100',  text: 'bg-green-100  text-green-700'  },
  vencimiento: { label: 'Vencimiento', icon: '⏰', bg: 'bg-red-50    border-red-100',    text: 'bg-red-100    text-red-600'    },
  reunion:     { label: 'Reunión',     icon: '👥', bg: 'bg-amber-50  border-amber-100',  text: 'bg-amber-100  text-amber-700'  },
  otro:        { label: 'Otro',        icon: '📌', bg: 'bg-gray-50   border-gray-100',   text: 'bg-gray-100   text-gray-600'   },
}

// ─── Helpers ──────────────────────────────────────────────────

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

function parseEspecialidades(raw: string[] | string | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [raw] }
}

// ─── Componente principal ─────────────────────────────────────

export default function CasoDetalleCliente({
  caso,
  abogado,
  lawyerProfile,
  eventos,
  documentos,
  userId,
  reviewExistente,
}: Props) {
  const [chatOpen, setChatOpen] = useState(true)

  const idx          = hitoIndex(caso.estado)
  const especialidades = parseEspecialidades(lawyerProfile?.especialidades)
  const casoCerrado  = caso.estado === 'cerrado'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)' }}>

      {/* ── Nav superior ─────────────────────────────────────── */}
      <div style={{ background: 'var(--dls-navy)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard/cliente" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(250,244,237,0.6)', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} />
            Mis casos
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <EstadoBadge estado={caso.estado} macro />
            {esIntermedio(caso.estado) && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(250,244,237,0.45)', letterSpacing: '0.06em' }}>
                {ESTADO_LABELS[caso.estado]}
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

        {/* ── Barra de progreso ────────────────────────────────── */}
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 20 }}>
            Progreso del caso
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
                    {/* Sub-etiqueta en el hito "En curso" activo */}
                    {activo && esIntermedio(caso.estado) && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--dls-champagne)', letterSpacing: '0.05em', marginTop: -4 }}>
                        {ESTADO_LABELS[caso.estado]}
                      </span>
                    )}
                  </div>
                  {i < HITOS.length - 1 && (
                    <div style={{ flex: 1, height: 2, marginBottom: 18, marginLeft: 6, marginRight: 6, background: i < idx ? 'var(--dls-champagne)' : 'var(--dls-hairline)' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Resumen IA */}
          <div style={{ borderTop: '1px solid var(--dls-hairline)', marginTop: 24, paddingTop: 20 }}>
            <ResumenIA casoId={caso.id} />
          </div>
        </div>

        {/* ── Grid principal ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── Columna izquierda ──────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Abogado asignado */}
            {abogado ? (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 16 }}>
                  Abogado asignado
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  {abogado.avatar_url ? (
                    <img src={abogado.avatar_url} alt={`${abogado.nombre} ${abogado.apellido}`} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--dls-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dls-cream)', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(abogado.nombre, abogado.apellido)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--dls-navy)' }}>
                        {abogado.nombre} {abogado.apellido}
                      </span>
                      {lawyerProfile?.verified && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                          <Shield size={10} /> Verificado
                        </span>
                      )}
                    </div>
                    {lawyerProfile?.years_experiencia != null && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', marginBottom: 10 }}>
                        {lawyerProfile.years_experiencia} {lawyerProfile.years_experiencia === 1 ? 'año' : 'años'} de experiencia
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <a href={`mailto:${abogado.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', textDecoration: 'none' }}>
                        <Mail size={13} /> {abogado.email}
                      </a>
                      {abogado.telefono && (
                        <a href={`tel:${abogado.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', textDecoration: 'none' }}>
                          <Phone size={13} /> {abogado.telefono}
                        </a>
                      )}
                    </div>
                    {especialidades.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {especialidades.map((esp) => (
                          <span key={esp} style={{ fontFamily: 'var(--font-body)', fontSize: 10, background: 'rgba(201,163,90,0.08)', color: 'var(--dls-champagne)', border: '1px solid rgba(201,163,90,0.2)', padding: '2px 8px', letterSpacing: '0.04em' }}>
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                    {lawyerProfile?.bio && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', lineHeight: 1.6, marginTop: 10 }}>
                        {lawyerProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', borderLeft: '2px solid var(--dls-champagne)', padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 12 }}>
                  Abogado asignado
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={16} style={{ color: 'var(--dls-champagne)', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)' }}>
                    Tu caso está en revisión. Te asignaremos un abogado a la brevedad.
                  </p>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 16 }}>
                Descripción
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--dls-navy)', whiteSpace: 'pre-wrap' }}>
                {caso.descripcion}
              </p>
            </div>

            {/* Próximos eventos */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 16 }}>
                Próximos eventos
              </div>
              {eventos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Calendar size={32} style={{ opacity: 0.2, margin: '0 auto 8px', color: 'var(--dls-taupe)' }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)' }}>No hay eventos programados</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 4, opacity: 0.7 }}>
                    Tu abogado actualizará esta sección cuando haya novedades
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {eventos.map((evento) => {
                    const info   = TIPO_EVENTO[evento.tipo] ?? TIPO_EVENTO.otro
                    const isPast = !evento.completado && new Date(evento.fecha) < new Date()
                    return (
                      <div key={evento.id} className={`${evento.completado ? 'bg-gray-50 border-gray-100 opacity-60' : isPast ? 'bg-red-50 border-red-100' : info.bg}`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', border: '1px solid var(--dls-hairline)' }}>
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{info.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--dls-navy)' }}>{evento.titulo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evento.completado ? 'bg-gray-100 text-gray-500' : isPast ? 'bg-red-100 text-red-600' : info.text}`}>
                              {evento.completado ? 'Completado' : isPast ? 'Vencido' : info.label}
                            </span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={10} /> {formatFecha(evento.fecha)}
                          </p>
                          {evento.descripcion && (
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-navy)', marginTop: 6, lineHeight: 1.5 }}>{evento.descripcion}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--dls-hairline)', textDecoration: 'none' }}>
                      <div style={{ width: 36, height: 36, background: 'rgba(201,163,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} style={{ color: 'var(--dls-champagne)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--dls-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 2 }}>{formatFecha(doc.created_at)}</div>
                      </div>
                      <ExternalLink size={13} style={{ color: 'var(--dls-taupe)', flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              )}
              <UploadDocumento casoId={caso.id} cerrado={casoCerrado} />
            </div>

            {/* Review */}
            {casoCerrado && caso.abogado_id && abogado && (
              <FormularioReview
                casoId={caso.id}
                abogadoId={caso.abogado_id}
                nombreAbogado={`${abogado.nombre} ${abogado.apellido}`}
                reviewExistente={reviewExistente}
              />
            )}

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
              {chatOpen ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.5 }} />}
            </button>

            {!caso.abogado_id ? (
              <div style={{ border: '1px solid var(--dls-hairline)', borderTop: 'none', padding: 16, background: 'rgba(201,163,90,0.04)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
                  La mensajería se habilitará cuando un abogado sea asignado a tu caso.
                </p>
              </div>
            ) : chatOpen ? (
              <div style={{ border: '1px solid var(--dls-hairline)', borderTop: 'none', background: 'var(--dls-white)', height: 540, overflow: 'hidden' }}>
                <MensajesPanel casoId={caso.id} userId={userId} cerrado={casoCerrado} />
              </div>
            ) : (
              <div style={{ border: '1px solid var(--dls-hairline)', borderTop: 'none', padding: 16, textAlign: 'center', background: 'var(--dls-white)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
                  Haz clic para ver los mensajes con tu abogado
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}