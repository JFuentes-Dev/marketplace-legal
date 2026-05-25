// app/dashboard/cliente/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { BadgeNoLeidos } from '@/components/ui/badge'
import { ESTADO_LABELS, type EstadoCaso } from '@/lib/types/caso'

const ESTADOS_MACRO = new Set(['pendiente', 'asignado', 'cerrado'])
const esIntermedio = (e: string) => !ESTADOS_MACRO.has(e)

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
  </svg>
)

export default async function DashboardClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const { data: casos } = await supabase
    .from('casos')
    .select('*')
    .eq('cliente_id', user.id)
    .order('updated_at', { ascending: false })

  const casosIds = (casos ?? []).map((c) => c.id)
  const noLeidosPorCaso: Record<string, number> = {}

  if (casosIds.length > 0) {
    const { data: mensajes } = await supabase
      .from('mensajes')
      .select('id, caso_id, autor_id')
      .in('caso_id', casosIds)
      .neq('autor_id', user.id)

    const mensajesAjenos = mensajes ?? []
    const mensajesIds = mensajesAjenos.map((m) => m.id)

    let leidosIds: string[] = []
    if (mensajesIds.length > 0) {
      const { data: lecturas } = await supabase
        .from('mensaje_lecturas')
        .select('mensaje_id')
        .in('mensaje_id', mensajesIds)
        .eq('user_id', user.id)
      leidosIds = (lecturas ?? []).map((l) => l.mensaje_id)
    }

    for (const msg of mensajesAjenos) {
      if (!leidosIds.includes(msg.id)) {
        noLeidosPorCaso[msg.caso_id] = (noLeidosPorCaso[msg.caso_id] ?? 0) + 1
      }
    }
  }

  const totalNoLeidos = Object.values(noLeidosPorCaso).reduce((a, b) => a + b, 0)
  const casosActivos = (casos ?? []).filter(c => c.estado !== 'cerrado').length
  const totalCasos = (casos ?? []).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Panel de cliente</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--dls-navy)', lineHeight: 1.1 }}>
            Bienvenido,{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--dls-champagne)' }}>
              {profile?.nombre ?? 'cliente'}
            </em>
          </h1>
        </div>
        <Link href="/dashboard/cliente/casos/nuevo" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconPlus />
          <span>Nuevo caso</span>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'Total casos',       valor: totalCasos },
          { label: 'Casos activos',     valor: casosActivos },
          { label: 'Mensajes sin leer', valor: totalNoLeidos },
        ].map((s, i) => (
          <div key={s.label} style={{ background: i === 0 ? 'var(--dls-navy)' : 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
            <div className="eyebrow" style={{ color: i === 0 ? 'rgba(201,163,90,0.7)' : 'var(--dls-champagne)', marginBottom: 12 }}>
              {s.label}
            </div>
            <div className="stat-number" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 48, lineHeight: 1, color: i === 0 ? 'var(--dls-cream)' : 'var(--dls-navy)' }}>
              {s.valor}
            </div>
          </div>
        ))}
      </div>

      {/* Lista de casos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="eyebrow">——— Mis casos</div>
          {totalCasos > 0 && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
              {totalCasos} caso{totalCasos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!casos || casos.length === 0 ? (
          <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', borderLeft: '2px solid var(--dls-champagne)', padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--dls-taupe)', marginBottom: 16 }}>
              No tienes casos aún
            </div>
            <Link href="/dashboard/cliente/casos/nuevo" className="btn-secondary">
              <span>Crear tu primer caso</span>
              <IconArrow />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(casos ?? []).map((caso) => (
              <Link
                key={caso.id}
                href={`/dashboard/cliente/casos/${caso.id}`}
                className="caso-link-card"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flex: 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--dls-navy)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {caso.titulo}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
                      {caso.area_legal}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <BadgeNoLeidos count={noLeidosPorCaso[caso.id] ?? 0} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <EstadoBadge estado={caso.estado} macro />
                      {esIntermedio(caso.estado) && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--dls-taupe)', letterSpacing: '0.05em' }}>
                          {ESTADO_LABELS[caso.estado as EstadoCaso] ?? caso.estado}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--dls-champagne)', opacity: 0.5 }}><IconArrow /></span>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 12, letterSpacing: '0.06em' }}>
                  Actualizado: {new Date(caso.updated_at).toLocaleDateString('es-CL')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}