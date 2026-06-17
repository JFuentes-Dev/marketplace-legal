'use client'
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PostularButton } from '@/components/pool/PostularButton'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import type { EstadoCaso } from '@/lib/types/caso'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Documento {
  id: string
  nombre: string
  url: string
  tipo: string
  created_at: string
}
interface Caso {
  id: string
  titulo: string
  descripcion: string
  area_legal: string
  estado: string
  created_at: string
  postulaciones_count: number | null
  nombre_contacto: string | null
  email_contacto: string | null
  telefono_contacto: string | null
  profiles: { nombre: string; apellido: string } | { nombre: string; apellido: string }[] | null
}
// ── NUEVO ─────────────────────────────────────────────────────────────────────
interface MiPostulacion {
  id: string
  caso_id: string
  mensaje: string | null
  estado: string
  created_at: string
  caso: {
    id: string
    titulo: string
    area_legal: string
    estado: string
    abogado_id: string | null
  } | null
}
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  casos: Caso[]
  casosPostulados: Set<string>
  puntosRestantes: number
  postulacionesHoy: number
  noVerificado: boolean
  documentosPorCaso: Record<string, Documento[]>
  misPostulaciones: MiPostulacion[]  // ← NUEVO
}

// ── Áreas para filtros ────────────────────────────────────────────────────────
const AREAS = [
  'Derecho de Familia', 'Derecho Laboral', 'Derecho Civil',
  'Derecho Penal', 'Derecho Comercial', 'Derecho Inmobiliario',
  'Derecho Tributario', 'Otro',
]

// ── Íconos SVG ────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="13" y2="13" />
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
  </svg>
)
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 2v7M4.5 6.5L7 9l2.5-2.5"/><path d="M2 11h10"/>
  </svg>
)
const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2H2v8h8V7M7 2h3v3M10 2L5.5 6.5"/>
  </svg>
)

// ── Icono por tipo de documento ───────────────────────────────────────────────
function DocIcon({ tipo }: { tipo: string }) {
  const t = tipo?.toUpperCase()
  if (t === 'PDF')
    return (
      <div style={{ width: 36, height: 44, background: '#fee2e2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '8px solid #fca5a5', borderTop: '8px solid transparent' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 800, color: '#dc2626', letterSpacing: '0.05em' }}>PDF</span>
      </div>
    )
  if (t === 'WORD' || t === 'DOC')
    return (
      <div style={{ width: 36, height: 44, background: '#dbeafe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '8px solid #93c5fd', borderTop: '8px solid transparent' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.05em' }}>DOC</span>
      </div>
    )
  if (t === 'EXCEL' || t === 'XLS')
    return (
      <div style={{ width: 36, height: 44, background: '#dcfce7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '8px solid #86efac', borderTop: '8px solid transparent' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 800, color: '#15803d', letterSpacing: '0.05em' }}>XLS</span>
      </div>
    )
  if (t === 'IMAGEN' || t === 'IMG')
    return (
      <div style={{ width: 36, height: 44, background: '#f3e8ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '8px solid #d8b4fe', borderTop: '8px solid transparent' }} />
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1" y="1" width="14" height="12" rx="1"/><circle cx="5" cy="5" r="1.5"/><polyline points="1,10 5,6 8,9 11,7 15,10"/>
        </svg>
      </div>
    )
  return (
    <div style={{ width: 36, height: 44, background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '8px solid #cbd5e1', borderTop: '8px solid transparent' }} />
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 1h7l3 3v11H2V1z"/><polyline points="9,1 9,4 12,4"/><line x1="4" y1="7" x2="10" y2="7"/><line x1="4" y1="10" x2="8" y2="10"/>
      </svg>
    </div>
  )
}

// ── Modal de preview de documento ─────────────────────────────────────────────
function DocPreviewModal({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const tipo = doc.tipo?.toUpperCase()
  const esImagen = tipo === 'IMAGEN' || tipo === 'IMG'
  const esPDF = tipo === 'PDF'
  const esOffice = tipo === 'WORD' || tipo === 'DOC' || tipo === 'EXCEL' || tipo === 'XLS'
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])
  const nombreCorto = doc.nombre.length > 50 ? doc.nombre.slice(0, 47) + '…' : doc.nombre
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(8,18,42,0.85)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(8,18,42,0.5)' }}>
        <div style={{ background: '#0f1e3a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <DocIcon tipo={doc.tipo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#faf4ed', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombreCorto}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(250,244,237,0.45)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{doc.tipo}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <a href={doc.url} download={doc.nombre} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c9a35a', background: 'rgba(201,163,90,0.12)', border: '1px solid rgba(201,163,90,0.3)', padding: '7px 14px', textDecoration: 'none' }}>
              <IconDownload /> Descargar
            </a>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,244,237,0.4)', padding: 4, lineHeight: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#faf4ed')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,244,237,0.4)')}>
              <IconX />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, background: '#f8f8f8' }}>
          {esImagen && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.url} alt={doc.nombre} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} />
            </div>
          )}
          {esPDF && <iframe src={doc.url} title={doc.nombre} style={{ width: '100%', height: '70vh', border: 'none' }} />}
          {esOffice && (
            <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`} title={doc.nombre} style={{ width: '100%', height: '70vh', border: 'none' }} />
          )}
          {!esImagen && !esPDF && !esOffice && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 16 }}>
              <DocIcon tipo={doc.tipo} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#64748b' }}>Vista previa no disponible para este tipo de archivo.</p>
              <a href={doc.url} download={doc.nombre} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0f1e3a', background: '#f1f5f9', border: '1px solid #e0d8d0', padding: '10px 20px', textDecoration: 'none' }}>
                <IconDownload /> Descargar archivo
              </a>
            </div>
          )}
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.3)', marginTop: 14, letterSpacing: '0.06em' }}>
        ESC o clic fuera para cerrar
      </p>
    </div>,
    document.body
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function PoolExplorar({ casos, casosPostulados, puntosRestantes, postulacionesHoy, noVerificado, documentosPorCaso, misPostulaciones }: Props) {
  const [tab, setTab] = useState<'pool' | 'mis'>('pool')          // ← NUEVO
  const [seleccionado, setSeleccionado] = useState<Caso | null>(casos[0] ?? null)
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [fecha, setFecha] = useState('')
  const [docPreview, setDocPreview] = useState<Documento | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const resultado = useMemo(() => {
    return casos.filter(c => {
      if (area && c.area_legal !== area) return false
      if (q) {
        const query = q.toLowerCase()
        if (!c.titulo.toLowerCase().includes(query) && !c.descripcion.toLowerCase().includes(query)) return false
      }
      if (fecha) {
        const diff = Date.now() - new Date(c.created_at).getTime()
        if (fecha === 'hoy'    && diff > 86400000) return false
        if (fecha === 'semana' && diff > 7 * 86400000) return false
        if (fecha === 'mes'    && diff > 30 * 86400000) return false
      }
      return true
    })
  }, [casos, q, area, fecha])

  const yaPostulo = seleccionado ? casosPostulados.has(seleccionado.id) : false
  const lleno = (seleccionado?.postulaciones_count ?? 0) >= 3
  const clienteSel = seleccionado
    ? (Array.isArray(seleccionado.profiles) ? seleccionado.profiles[0] : seleccionado.profiles)
    : null
  const docsSeleccionado = seleccionado ? (documentosPorCaso[seleccionado.id] ?? []) : []
  const esAnonimo = seleccionado && !clienteSel && !!seleccionado.nombre_contacto

  // ── Pestañas (compartidas por ambas vistas) ───────────────────────────────
  const tabBar = (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--dls-hairline)', marginBottom: 20, flexShrink: 0 }}>
      {([
        { key: 'pool' as const, label: 'Pool de casos',     badge: resultado.length },
        { key: 'mis'  as const, label: 'Mis postulaciones', badge: misPostulaciones.length },
      ]).map(t => (
        <button key={t.key} type="button" onClick={() => setTab(t.key)}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tab === t.key ? 'var(--dls-navy)' : 'var(--dls-taupe)',
            fontWeight: tab === t.key ? 700 : 400,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px 12px',
            borderBottom: tab === t.key ? '2px solid var(--dls-navy)' : '2px solid transparent',
            marginBottom: -2,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'color 0.15s',
          }}>
          {t.label}
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10, padding: '1px 7px', borderRadius: 20,
            background: tab === t.key ? 'var(--dls-navy)' : 'var(--dls-hairline)',
            color: tab === t.key ? 'var(--dls-champagne)' : 'var(--dls-taupe)',
          }}>
            {t.badge}
          </span>
        </button>
      ))}
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: MIS POSTULACIONES
  // ════════════════════════════════════════════════════════════════════════════
  if (tab === 'mis') {
    const aceptadas = misPostulaciones.filter(p => p.estado === 'aceptada').length
    const pendientes = misPostulaciones.filter(p => p.estado === 'pendiente').length

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 144px)', minHeight: 500 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Explorar casos</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, color: 'var(--dls-navy)', lineHeight: 1, margin: 0 }}>
              Mis postulaciones
            </h1>
          </div>
          <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Puntos hoy</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: puntosRestantes > 30 ? 'var(--dls-navy)' : puntosRestantes > 0 ? '#b45309' : '#dc2626' }}>{puntosRestantes}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>/ 100</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ width: 100, height: 3, background: 'var(--dls-hairline)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${puntosRestantes}%`, background: puntosRestantes > 30 ? 'var(--dls-champagne)' : puntosRestantes > 0 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-taupe)' }}>{10 - postulacionesHoy} postulaciones restantes</div>
            </div>
          </div>
        </div>

        {tabBar}

        {misPostulaciones.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--dls-taupe)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <rect x="6" y="6" width="28" height="28" rx="2"/><line x1="12" y1="14" x2="28" y2="14"/><line x1="12" y1="20" x2="22" y2="20"/><line x1="12" y1="26" x2="20" y2="26"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--dls-taupe)', opacity: 0.5, margin: 0 }}>
              Aún no has postulado a ningún caso
            </p>
            <button type="button" onClick={() => setTab('pool')}
              style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'none', border: '1px solid rgba(201,163,90,0.3)', padding: '9px 20px', cursor: 'pointer' }}>
              Explorar el pool →
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)' }}>
            {/* Resumen */}
            {(aceptadas > 0 || pendientes > 0) && (
              <div style={{ display: 'flex', borderBottom: '1px solid var(--dls-hairline)' }}>
                {aceptadas > 0 && (
                  <div style={{ flex: 1, padding: '14px 24px', borderRight: '1px solid var(--dls-hairline)', background: 'rgba(5,150,105,0.04)' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669', marginBottom: 2 }}>Aceptadas</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 26, color: 'var(--dls-navy)' }}>{aceptadas}</div>
                  </div>
                )}
                {pendientes > 0 && (
                  <div style={{ flex: 1, padding: '14px 24px', background: 'rgba(180,83,9,0.03)' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b45309', marginBottom: 2 }}>En revisión</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 26, color: 'var(--dls-navy)' }}>{pendientes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Lista */}
            {misPostulaciones.map(p => {
              const esAceptadaAMi = p.estado === 'aceptada'
              const colorBarra = p.estado === 'aceptada' ? '#059669' : p.estado === 'rechazada' ? '#dc2626' : '#f59e0b'
              const badgeColor = p.estado === 'aceptada'
                ? { color: '#059669', bg: 'rgba(5,150,105,0.1)', label: '✓ Aceptada' }
                : p.estado === 'rechazada'
                ? { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Rechazada' }
                : { color: '#b45309', bg: 'rgba(180,83,9,0.08)', label: 'En revisión' }

              return (
                <div key={p.id} style={{ padding: '18px 24px', borderBottom: '1px solid var(--dls-hairline)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Barra lateral de color */}
                  <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, background: colorBarra, borderRadius: 2 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--dls-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.caso?.titulo ?? 'Caso no disponible'}
                      </h3>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: badgeColor.color, background: badgeColor.bg, padding: '3px 9px', flexShrink: 0 }}>
                        {badgeColor.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: p.mensaje ? 10 : 0 }}>
                      {p.caso?.area_legal && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '2px 7px' }}>
                          {p.caso.area_legal}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>
                        Postulé el {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {p.caso?.estado && (
                        <EstadoBadge estado={p.caso.estado as EstadoCaso} />
                      )}
                    </div>

                    {/* Mensaje enviado como chat bubble */}
                    {p.mensaje && (
                      <div style={{ background: '#f0f4f8', borderRadius: '0 10px 10px 10px', padding: '10px 14px', marginTop: 8, maxWidth: 540 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a68f85', marginBottom: 4 }}>
                          Tu mensaje de presentación
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#2a3a5c', lineHeight: 1.65, margin: 0 }}>{p.mensaje}</p>
                      </div>
                    )}
                  </div>

                  {/* Ver caso si fue aceptada */}
                  {esAceptadaAMi && p.caso?.id && (
                    <Link href={`/dashboard/abogado/casos/${p.caso.id}`}
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--dls-navy)', color: 'var(--dls-champagne)', padding: '9px 16px', textDecoration: 'none' }}>
                      Ver caso <IconExternalLink />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: POOL (código original sin cambios)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 144px)', minHeight: 500 }}>
      {/* Header de página */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Explorar casos</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, color: 'var(--dls-navy)', lineHeight: 1, margin: 0 }}>
            Pool de casos
          </h1>
        </div>
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Puntos hoy</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: puntosRestantes > 30 ? 'var(--dls-navy)' : puntosRestantes > 0 ? '#b45309' : '#dc2626' }}>{puntosRestantes}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ width: 100, height: 3, background: 'var(--dls-hairline)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${puntosRestantes}%`, background: puntosRestantes > 30 ? 'var(--dls-champagne)' : puntosRestantes > 0 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-taupe)' }}>{10 - postulacionesHoy} postulaciones restantes</div>
          </div>
        </div>
      </div>

      {tabBar}

      {/* Layout dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', flex: 1, minHeight: 0, border: '1px solid var(--dls-hairline)', background: 'var(--dls-white)' }}>
        {/* ══ IZQUIERDA ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--dls-hairline)', minHeight: 0 }}>
          <div style={{ padding: '14px', borderBottom: '1px solid var(--dls-hairline)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--dls-taupe)', pointerEvents: 'none' }}><IconSearch /></span>
              <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por título o descripción…"
                style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', background: 'var(--dls-cream)', border: '1px solid var(--dls-hairline)', padding: '8px 10px 8px 30px', outline: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { value: area, onChange: setArea, options: [['', 'Todas las áreas'], ...AREAS.map(a => [a, a])] },
                { value: fecha, onChange: setFecha, options: [['', 'Cualquier fecha'], ['hoy', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes']] },
              ].map((sel, i) => (
                <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
                  style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-navy)', background: 'var(--dls-cream)', border: '1px solid var(--dls-hairline)', padding: '6px 6px', outline: 'none', cursor: 'pointer' }}>
                  {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', margin: 0 }}>
              {resultado.length} caso{resultado.length !== 1 ? 's' : ''} disponible{resultado.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {resultado.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--dls-taupe)', opacity: 0.5 }}>Sin resultados</p>
              </div>
            ) : resultado.map(caso => {
              const activo = seleccionado?.id === caso.id
              const postulado = casosPostulados.has(caso.id)
              const nDocs = (documentosPorCaso[caso.id] ?? []).length
              return (
                <button key={caso.id} type="button" onClick={() => setSeleccionado(caso)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottom: '1px solid var(--dls-hairline)',
                    borderLeft: activo ? '3px solid var(--dls-champagne)' : '3px solid transparent',
                    background: activo ? 'rgba(201,163,90,0.06)' : 'transparent',
                    transition: 'background 0.12s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => { if (!activo) e.currentTarget.style.background = 'rgba(15,30,58,0.03)' }}
                  onMouseLeave={e => { if (!activo) e.currentTarget.style.background = activo ? 'rgba(201,163,90,0.06)' : 'transparent' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--dls-navy)', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: postulado ? 70 : 0 }}>
                    {caso.titulo}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '2px 6px' }}>{caso.area_legal}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>{new Date(caso.created_at).toLocaleDateString('es-CL')}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: (caso.postulaciones_count ?? 0) >= 2 ? '#b45309' : 'var(--dls-taupe)' }}>{caso.postulaciones_count ?? 0}/3</span>
                    {nDocs > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#7c3aed' }}>📎 {nDocs}</span>}
                  </div>
                  {postulado && (
                    <span style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#059669', background: 'rgba(5,150,105,0.1)', padding: '2px 6px' }}>✓ Postulado</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {/* ══ DERECHA ══ */}
        {seleccionado ? (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--dls-hairline)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '3px 9px' }}>{seleccionado.area_legal}</span>
                    <EstadoBadge estado={seleccionado.estado as EstadoCaso} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>{seleccionado.postulaciones_count ?? 0}/3 postulaciones</span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: 'var(--dls-navy)', lineHeight: 1.2, margin: 0 }}>{seleccionado.titulo}</h2>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {noVerificado
                    ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)' }}>Verificación pendiente</span>
                    : <PostularButton casoId={seleccionado.id} yaPostuló={yaPostulo} puntosRestantes={puntosRestantes} casosLlenos={lleno} />
                  }
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 8 }}>Descripción</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.8, color: 'var(--dls-navy-mid)', margin: 0 }}>{seleccionado.descripcion}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '18px 0', borderTop: '1px solid var(--dls-hairline)', borderBottom: '1px solid var(--dls-hairline)' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Fecha</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)', fontWeight: 500 }}>
                    {new Date(seleccionado.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Postulaciones</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 3, background: 'var(--dls-hairline)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((seleccionado.postulaciones_count ?? 0) / 3) * 100}%`, background: (seleccionado.postulaciones_count ?? 0) >= 2 ? '#f59e0b' : 'var(--dls-champagne)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--dls-navy)' }}>
                      {seleccionado.postulaciones_count ?? 0}<span style={{ fontSize: 12, color: 'var(--dls-taupe)', fontWeight: 400 }}>/3</span>
                    </span>
                  </div>
                </div>
                {clienteSel && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Cliente</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)', fontWeight: 500 }}>{clienteSel.nombre} {clienteSel.apellido}</p>
                  </div>
                )}
              </div>
              {esAnonimo && (
                <div style={{ background: 'rgba(201,163,90,0.05)', border: '1px solid rgba(201,163,90,0.2)', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-champagne)' }}>Contacto</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {seleccionado.nombre_contacto && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Nombre</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', fontWeight: 500, margin: 0 }}>{seleccionado.nombre_contacto}</p>
                      </div>
                    )}
                    {seleccionado.email_contacto && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Email</p>
                        <a href={`mailto:${seleccionado.email_contacto}`} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', textDecoration: 'none', borderBottom: '1px solid rgba(15,30,58,0.2)' }}>{seleccionado.email_contacto}</a>
                      </div>
                    )}
                    {seleccionado.telefono_contacto && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Teléfono</p>
                        <a href={`tel:${seleccionado.telefono_contacto}`} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', textDecoration: 'none' }}>{seleccionado.telefono_contacto}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {docsSeleccionado.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 12 }}>
                    Documentos adjuntos ({docsSeleccionado.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {docsSeleccionado.map(doc => (
                      <button key={doc.id} type="button" onClick={() => setDocPreview(doc)}
                        style={{ textAlign: 'left', background: 'var(--dls-cream)', border: '1px solid var(--dls-hairline)', padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--dls-champagne)'; e.currentTarget.style.background = 'rgba(201,163,90,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dls-hairline)'; e.currentTarget.style.background = 'var(--dls-cream)' }}>
                        <DocIcon tipo={doc.tipo} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-navy)', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--dls-taupe)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{doc.tipo}</span>
                            <span style={{ color: 'var(--dls-champagne)', opacity: 0.7 }}><IconExternalLink /></span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!yaPostulo && !lleno && puntosRestantes > 0 && (
                <div style={{ background: 'rgba(201,163,90,0.06)', border: '1px solid rgba(201,163,90,0.2)', padding: '12px 16px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', margin: 0 }}>
                    Postular costará <strong>10 puntos</strong>. Te quedarán <strong>{puntosRestantes - 10} puntos</strong> disponibles hoy.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--dls-taupe)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
              <rect x="6" y="6" width="28" height="28" rx="2"/><line x1="12" y1="14" x2="28" y2="14"/><line x1="12" y1="20" x2="22" y2="20"/><line x1="12" y1="26" x2="20" y2="26"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, margin: 0, opacity: 0.4 }}>Selecciona un caso</p>
          </div>
        )}
      </div>
      {mounted && docPreview && (
        <DocPreviewModal doc={docPreview} onClose={() => setDocPreview(null)} />
      )}
    </div>
  )
}