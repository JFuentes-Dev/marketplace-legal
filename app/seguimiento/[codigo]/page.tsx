// app/seguimiento/[codigo]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { NavLogo } from '@/components/shared/NavLogo'
import { ESTADO_LABELS, ESTADO_COLORS, type EstadoCaso } from '@/lib/types/caso'
import { PostulacionesPanel } from '@/components/casos/PostulacionesPanel'
import type { PostulacionConAbogado } from '@/components/casos/PostulacionesPanel'
import type { Metadata } from 'next'

interface Props { params: Promise<{ codigo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params
  return { title: `Seguimiento ${codigo.toUpperCase()} | Marketplace Legal` }
}

const HITOS = [
  { key: 'pendiente', label: 'Recibido' },
  { key: 'asignado',  label: 'Asignado' },
  { key: 'en_curso',  label: 'En curso' },
  { key: 'cerrado',   label: 'Cerrado' },
]
function hitoIndex(estado: string) {
  if (estado === 'pendiente') return 0
  if (estado === 'asignado')  return 1
  if (estado === 'cerrado')   return 3
  return 2
}

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)
const IconDoc = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="1" width="10" height="12" rx="1" /><line x1="4" y1="5" x2="10" y2="5" /><line x1="4" y1="8" x2="8" y2="8" />
  </svg>
)

export default async function SeguimientoCodigoPage({ params }: Props) {
  const { codigo } = await params
  const codigoUpper = codigo.toUpperCase()
  const admin = createAdminClient()

  const { data: caso, error } = await admin
    .from('casos')
    .select(`id, titulo, descripcion, area_legal, estado, created_at, updated_at,
             nombre_contacto, email_contacto, abogado_id, postulaciones_count`)
    .eq('codigo_seguimiento', codigoUpper)
    .single()

  if (error || !caso) notFound()

  // Abogado asignado
  let abogado: { nombre: string; apellido: string; especialidades: string[] } | null = null
  if (caso.abogado_id) {
    const { data: p }  = await admin.from('profiles').select('nombre, apellido').eq('id', caso.abogado_id).single()
    const { data: lp } = await admin.from('lawyer_profiles').select('especialidades').eq('id', caso.abogado_id).single()
    if (p) abogado = { nombre: p.nombre, apellido: p.apellido, especialidades: (lp?.especialidades as string[]) ?? [] }
  }

  // Documentos
  const { data: documentos } = await admin
    .from('caso_documentos')
    .select('id, nombre, url, tipo, created_at')
    .eq('caso_id', caso.id)
    .order('created_at', { ascending: true })

  // ── Postulaciones — dos queries separadas ─────────────────────────────────
  const postulaciones: PostulacionConAbogado[] = []

  if (!caso.abogado_id) {
    // 1. Postulaciones + perfil básico
    const { data: posts } = await admin
      .from('postulaciones')
      .select(`
        id, abogado_id, mensaje, estado, created_at,
        profiles!postulaciones_abogado_id_fkey(nombre, apellido, avatar_url)
      `)
      .eq('caso_id', caso.id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })

    if (posts && posts.length > 0) {
      // 2. Lawyer profiles separado
      const abogadoIds = posts.map(p => p.abogado_id)
      const { data: lps } = await admin
        .from('lawyer_profiles')
        .select('id, especialidades, years_experiencia, tarifa_hora')
        .in('id', abogadoIds)

      const lpMap: Record<string, { especialidades?: string[]; years_experiencia?: number | null; tarifa_hora?: number | null }> = {}
      for (const lp of lps ?? []) lpMap[(lp as { id: string }).id] = lp

      for (const p of posts) {
        const perfil = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        const lp = lpMap[p.abogado_id]
        postulaciones.push({
          id: p.id, abogado_id: p.abogado_id, mensaje: p.mensaje, created_at: p.created_at,
          perfil: {
            nombre:     (perfil as { nombre?: string })?.nombre     ?? '',
            apellido:   (perfil as { apellido?: string })?.apellido   ?? '',
            avatar_url: (perfil as { avatar_url?: string })?.avatar_url ?? null,
          },
          lawyerProfile: {
            especialidades:    lp?.especialidades    ?? [],
            years_experiencia: lp?.years_experiencia ?? null,
            tarifa_hora:       lp?.tarifa_hora       ?? null,
          },
        })
      }
    }
  }

  const estado = caso.estado as EstadoCaso
  const estadoColor = ESTADO_COLORS[estado] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', dot: '#9ca3af' }
  const hitoActual  = hitoIndex(estado)
  const porcentaje  = Math.round((hitoActual / 3) * 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)' }}>
      {/* Nav */}
      <nav style={{ background: 'var(--dls-navy)', borderBottom: '1px solid rgba(201,163,90,0.2)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/seguimiento" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.45)', textDecoration: 'none', letterSpacing: '0.06em' }}>← Seguimiento</Link>
            <div style={{ width: 1, height: 16, background: 'rgba(201,163,90,0.2)' }} />
            <NavLogo />
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/login" className="nav-link">Iniciar sesión</Link>
            <Link href="/registro" className="btn-primary" style={{ padding: '9px 18px', fontSize: 10 }}><span>Registrarse</span><IconArrow /></Link>
          </div>
        </div>
      </nav>

      {/* Banner código */}
      <div style={{ background: 'var(--dls-navy)', borderBottom: '1px solid rgba(201,163,90,0.15)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(201,163,90,0.65)' }}>Código</div>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--dls-champagne)', letterSpacing: '0.1em' }}>{codigoUpper}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: estadoColor.dot, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(250,244,237,0.6)', letterSpacing: '0.04em' }}>{ESTADO_LABELS[estado] ?? estado}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Barra de progreso */}
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--dls-navy)' }}>Estado actual</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: estadoColor.color, background: estadoColor.bg, padding: '5px 12px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: estadoColor.dot, display: 'inline-block' }} />
                {ESTADO_LABELS[estado] ?? estado}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, color: 'var(--dls-navy)' }}>{porcentaje}%</div>
          </div>
          <div style={{ height: 4, background: 'var(--dls-hairline)', marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${porcentaje}%`, background: 'var(--dls-champagne)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {HITOS.map((h, i) => {
              const completado = i <= hitoActual
              const activo = i === hitoActual
              return (
                <div key={h.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: completado ? 'var(--dls-navy)' : 'var(--dls-hairline)', border: activo ? '2px solid var(--dls-champagne)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {completado && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 4.5,8.5 10,3" stroke="var(--dls-champagne)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: completado ? 'var(--dls-navy)' : 'var(--dls-taupe)', fontWeight: activo ? 700 : 400 }}>{h.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Detalle caso */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
              <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--dls-navy)' }}>Detalle del caso</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, color: 'var(--dls-navy)', lineHeight: 1.2, marginBottom: 10 }}>{caso.titulo}</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '4px 10px' }}>{caso.area_legal}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>{new Date(caso.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.75, color: 'var(--dls-navy-mid)', margin: 0 }}>{caso.descripcion}</p>
            </div>

            {/* Abogado asignado */}
            {abogado && (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', borderLeft: '3px solid var(--dls-champagne)', padding: '24px 28px' }}>
                <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--dls-navy)' }}>Abogado asignado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(15,30,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--dls-navy)', fontWeight: 500 }}>{abogado.nombre[0]}{abogado.apellido[0]}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--dls-navy)', marginBottom: 4 }}>{abogado.nombre} {abogado.apellido}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {abogado.especialidades.slice(0, 3).map(e => (
                        <span key={e} style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.1)', padding: '2px 8px' }}>{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documentos */}
            {documentos && documentos.length > 0 && (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
                <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--dls-navy)' }}>Documentos adjuntos ({documentos.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documentos.map(doc => (
                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--dls-cream)', border: '1px solid var(--dls-hairline)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}>
                      <span style={{ color: 'var(--dls-champagne)', flexShrink: 0 }}><IconDoc /></span>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</p>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-champagne)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Abrir →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Panel de postulaciones con código para autorizacón anónima */}
            {!caso.abogado_id && caso.estado !== 'cerrado' && (
              <PostulacionesPanel
                postulaciones={postulaciones}
                casoId={caso.id}
                puedeSeleccionar={true}
                codigoSeguimiento={codigoUpper}
              />
            )}
          </div>

          {/* Columna lateral */}
          <div style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {caso.nombre_contacto && (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '24px' }}>
                <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--dls-navy)' }}>Tu información</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 3 }}>Nombre</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-navy)', fontWeight: 500 }}>{caso.nombre_contacto}</p>
              </div>
            )}
            <div style={{ background: 'var(--dls-navy)', padding: '24px' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Acceso completo</div>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--dls-cream)', lineHeight: 1.45, marginBottom: 18, opacity: 0.85 }}>
                Crea una cuenta para comunicarte con tu abogado directamente.
              </p>
              <Link href={`/registro${caso.email_contacto ? `?email=${encodeURIComponent(caso.email_contacto)}` : ''}`} className="btn-primary"
                style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', width: '100%', boxSizing: 'border-box', fontSize: 11 }}>
                <span>Crear cuenta gratis</span><IconArrow />
              </Link>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.4)', textAlign: 'center', marginTop: 10, letterSpacing: '0.04em' }}>
                El caso se vinculará automáticamente
              </p>
            </div>
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '16px 20px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 4 }}>Última actualización</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy)' }}>
                {new Date(caso.updated_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}