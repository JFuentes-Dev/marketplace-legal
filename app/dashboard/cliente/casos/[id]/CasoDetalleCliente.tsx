'use client'

// app/dashboard/cliente/casos/[id]/CasoDetalleCliente.tsx

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
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { MensajesPanel } from '@/components/casos/MensajesPanel'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { FormularioReview } from '@/components/casos/FormularioReview'
import { UploadDocumento } from '@/components/casos/UploadDocumento'
import { ResumenIA } from '@/components/casos/ResumenIA'

// ─── Tipos ────────────────────────────────────────────────────

interface Caso {
  id: string
  titulo: string
  descripcion: string
  area_legal: string
  estado: 'pendiente' | 'asignado' | 'en_progreso' | 'cerrado'
  created_at: string
  abogado_id: string | null
  cliente_id: string
}

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

const ESTADOS_ORDEN = ['pendiente', 'asignado', 'en_progreso', 'cerrado'] as const

const ESTADOS_LABEL: Record<string, string> = {
  pendiente:   'Iniciado',
  asignado:    'Asignado',
  en_progreso: 'En proceso',
  cerrado:     'Cerrado',
}

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

  const estadoIndex  = ESTADOS_ORDEN.indexOf(caso.estado as (typeof ESTADOS_ORDEN)[number])
  const especialidades = parseEspecialidades(lawyerProfile?.especialidades)
  const progressPct  = estadoIndex >= 0
    ? (estadoIndex / (ESTADOS_ORDEN.length - 1)) * 100
    : 0
  const casoCerrado  = caso.estado === 'cerrado'

  return (
    <div className="min-h-screen bg-[#f5f0e8]">

      {/* ── Nav superior ─────────────────────────────────── */}
      <div className="bg-[#0f1f3d] text-white px-4 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard/cliente"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mis casos
          </Link>
          <EstadoBadge estado={caso.estado} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Encabezado ───────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0f1f3d] mb-1">{caso.titulo}</h1>
          <p className="text-sm text-gray-500">
            Área: <span className="font-medium text-gray-700">{caso.area_legal}</span>
            {' · '}Creado el {formatFecha(caso.created_at)}
          </p>
        </div>

        {/* ── Barra de progreso ─────────────────────────────── */}
        <div className="bg-white rounded-2xl px-8 py-6 mb-6 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Progreso del caso
          </p>
          <div className="relative flex items-start justify-between">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
            {ESTADOS_ORDEN.map((estado, i) => {
              const isPast    = i < estadoIndex
              const isCurrent = i === estadoIndex
              return (
                <div key={estado} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                  <div className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                      : isPast
                        ? 'bg-white border-blue-400'
                        : 'bg-white border-gray-300'}
                  `}>
                    {isPast    ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> :
                     isCurrent ? <Clock className="w-3.5 h-3.5 text-white" /> :
                     <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <span className={`
                    text-xs font-medium text-center whitespace-nowrap
                    ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-500' : 'text-gray-400'}
                  `}>
                    {ESTADOS_LABEL[estado]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Resumen IA — debajo del stepper, dentro de la misma card */}
          <ResumenIA casoId={caso.id} />
        </div>

        {/* ── Grid principal ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Columna izquierda ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card abogado */}
            {abogado ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Abogado asignado
                </p>
                <div className="flex items-start gap-5">
                  {abogado.avatar_url ? (
                    <img
                      src={abogado.avatar_url}
                      alt={`${abogado.nombre} ${abogado.apellido}`}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ring-2 ring-gray-100">
                      {getInitials(abogado.nombre, abogado.apellido)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-[#0f1f3d] leading-tight">
                        {abogado.nombre} {abogado.apellido}
                      </h3>
                      {lawyerProfile?.verified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          <Shield className="w-3 h-3" />
                          Verificado
                        </span>
                      )}
                    </div>
                    {lawyerProfile?.years_experiencia != null && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        {lawyerProfile.years_experiencia}{' '}
                        {lawyerProfile.years_experiencia === 1 ? 'año' : 'años'} de experiencia
                      </p>
                    )}
                    <div className="mt-3 space-y-2">
                      <a
                        href={`mailto:${abogado.email}`}
                        className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors group"
                      >
                        <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                        <span className="truncate">{abogado.email}</span>
                      </a>
                      {abogado.telefono && (
                        <a
                          href={`tel:${abogado.telefono}`}
                          className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors group"
                        >
                          <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                          {abogado.telefono}
                        </a>
                      )}
                    </div>
                    {especialidades.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {especialidades.map((esp) => (
                          <span key={esp} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                    {lawyerProfile?.bio && (
                      <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">
                        {lawyerProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Abogado asignado
                </p>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">
                    Tu caso está en revisión. Te asignaremos un abogado a la brevedad.
                  </p>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Descripción
              </p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {caso.descripcion}
              </p>
            </div>

            {/* Próximos eventos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Próximos eventos
              </p>
              {eventos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <Calendar className="w-10 h-10 mb-2" />
                  <p className="text-sm text-gray-400">No hay eventos programados</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Tu abogado actualizará esta sección cuando haya novedades
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventos.map((evento) => {
                    const info   = TIPO_EVENTO[evento.tipo] ?? TIPO_EVENTO.otro
                    const isPast = !evento.completado && new Date(evento.fecha) < new Date()
                    return (
                      <div
                        key={evento.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                          ${evento.completado
                            ? 'bg-gray-50 border-gray-100 opacity-60'
                            : isPast
                              ? 'bg-red-50 border-red-100'
                              : info.bg}
                        `}
                      >
                        <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#0f1f3d]">{evento.titulo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${evento.completado
                                ? 'bg-gray-100 text-gray-500'
                                : isPast
                                  ? 'bg-red-100 text-red-600'
                                  : info.text}
                            `}>
                              {evento.completado ? 'Completado' : isPast ? 'Vencido' : info.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatFecha(evento.fecha)}
                          </p>
                          {evento.descripcion && (
                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{evento.descripcion}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Documentos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Documentos
              </p>
              {documentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm text-gray-400">No hay documentos adjuntos aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate">{doc.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatFecha(doc.created_at)}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* Upload — oculto si caso cerrado */}
              <UploadDocumento casoId={caso.id} cerrado={casoCerrado} />
            </div>

            {/* Review — solo si caso cerrado */}
            {casoCerrado && caso.abogado_id && abogado && (
              <FormularioReview
                casoId={caso.id}
                abogadoId={caso.abogado_id}
                nombreAbogado={`${abogado.nombre} ${abogado.apellido}`}
                reviewExistente={reviewExistente}
              />
            )}

          </div>

          {/* ── Columna derecha (chat) ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">

              {/* Toggle header */}
              <button
                onClick={() => setChatOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-5 py-4 bg-[#0f1f3d] text-white rounded-t-2xl hover:bg-[#1a3260] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-semibold text-sm tracking-wide">Mensajes</span>
                </div>
                {chatOpen
                  ? <ChevronUp className="w-4 h-4 text-white/60" />
                  : <ChevronDown className="w-4 h-4 text-white/60" />}
              </button>

              {/* Sin abogado asignado aún */}
              {!caso.abogado_id ? (
                <div className="border border-t-0 border-yellow-200 rounded-b-2xl bg-yellow-50 px-5 py-4">
                  <p className="text-sm text-yellow-800">
                    La mensajería se habilitará cuando un abogado sea asignado a tu caso.
                  </p>
                </div>
              ) : chatOpen ? (
                <div
                  className="border border-t-0 border-gray-200 rounded-b-2xl overflow-hidden bg-white"
                  style={{ height: '540px' }}
                >
                  <MensajesPanel
                    casoId={caso.id}
                    userId={userId}
                    cerrado={casoCerrado}
                  />
                </div>
              ) : (
                <div className="border border-t-0 border-gray-200 rounded-b-2xl bg-white/50 px-4 py-4 text-center">
                  <p className="text-xs text-gray-400">
                    Haz clic para ver los mensajes con tu abogado
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}