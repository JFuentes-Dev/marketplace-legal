// app/dashboard/abogado/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { BadgeNoLeidos } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { ESTADOS_ABOGADO, ESTADO_LABELS, type EstadoCaso } from '@/lib/types/caso'
import { CasosCharts } from '@/components/casos/CasosCharts'

const ESTADOS_MACRO = new Set(['pendiente', 'asignado', 'cerrado'])
const esIntermedio = (e: string) => !ESTADOS_MACRO.has(e)

const ESTADO_COLORS_MAP: Record<string, string> = {
  proxima_audiencia:    '#4f46e5',
  proxima_mediacion:    '#7c3aed',
  espera_notificacion:  '#f59e0b',
  pendiente_documentos: '#ef4444',
  en_negociacion:       '#10b981',
  recurso_presentado:   '#06b6d4',
  sentencia_dictada:    '#22c55e',
  apelacion:            '#f97316',
  cerrado:              '#9ca3af',
  asignado:             '#2a3a5c',
}

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

export default async function DashboardAbogadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, apellido')
    .eq('id', user.id)
    .single()

  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('verified, tarifa_hora')
    .eq('id', user.id)
    .single()

  const { data: casos } = await supabase
    .from('casos')
    .select('*')
    .eq('abogado_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('puntuacion')
    .eq('abogado_id', user.id)

  const promedio =
    reviews && reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length) * 10) / 10
      : null

  const ESTADOS_ACTIVOS = ['asignado', ...ESTADOS_ABOGADO.filter(e => e !== 'cerrado')]
  const casosActivos = (casos ?? []).filter(c => ESTADOS_ACTIVOS.includes(c.estado)).length

  const tarifaHora = lawyerProfile?.tarifa_hora ?? 0
  const ingresosEstimados = tarifaHora * casosActivos
  const totalCasos = (casos ?? []).length

  // Construir data para charts
  const distribucion: Record<string, number> = {}
  for (const caso of (casos ?? [])) {
    distribucion[caso.estado] = (distribucion[caso.estado] ?? 0) + 1
  }

  const chartData = [
    // Asignado (macro)
    { estado: 'asignado', label: 'Asignado', count: distribucion['asignado'] ?? 0, color: '#2a3a5c', macro: 'asignado' as const },
    // Estados intermedios
    ...ESTADOS_ABOGADO.filter(e => e !== 'cerrado').map(e => ({
      estado: e,
      label: ESTADO_LABELS[e as EstadoCaso],
      count: distribucion[e] ?? 0,
      color: ESTADO_COLORS_MAP[e] ?? '#9ca3af',
      macro: 'en_curso' as const,
    })),
    // Cerrado
    { estado: 'cerrado', label: 'Cerrado', count: distribucion['cerrado'] ?? 0, color: '#9ca3af', macro: 'cerrado' as const },
  ]

  // Mensajes no leídos
  const casosIds = (casos ?? []).map((c) => c.id)
  const noLeidosPorCaso: Record<string, number> = {}

  if (casosIds.length > 0) {
    const { data: mensajes } = await supabase
      .from('mensajes').select('id, caso_id, autor_id')
      .in('caso_id', casosIds).neq('autor_id', user.id)
    const mensajesAjenos = mensajes ?? []
    const mensajesIds = mensajesAjenos.map(m => m.id)
    let leidosIds: string[] = []
    if (mensajesIds.length > 0) {
      const { data: lecturas } = await supabase
        .from('mensaje_lecturas').select('mensaje_id')
        .in('mensaje_id', mensajesIds).eq('user_id', user.id)
      leidosIds = (lecturas ?? []).map(l => l.mensaje_id)
    }
    for (const msg of mensajesAjenos) {
      if (!leidosIds.includes(msg.id)) {
        noLeidosPorCaso[msg.caso_id] = (noLeidosPorCaso[msg.caso_id] ?? 0) + 1
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Panel de abogado</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--dls-navy)', lineHeight: 1.1 }}>
            Hola,{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--dls-champagne)' }}>
              {perfil?.nombre ?? 'abogado'}
            </em>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lawyerProfile?.verified === false && (
            <div style={{ padding: '6px 14px', background: 'rgba(201,163,90,0.1)', border: '1px solid rgba(201,163,90,0.3)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dls-champagne)' }}>
              Pendiente de verificación
            </div>
          )}
          <Link href="/dashboard/abogado/perfil" className="btn-secondary">
            <span>Editar perfil</span>
            <IconArrow />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        <div style={{ background: 'var(--dls-navy)', padding: '28px 32px' }}>
          <div className="eyebrow" style={{ color: 'rgba(201,163,90,0.7)', marginBottom: 12 }}>Casos activos</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 48, lineHeight: 1, color: 'var(--dls-cream)', }} className="stat-number">
            {casosActivos}
          </div>
        </div>
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Casos totales</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 48, lineHeight: 1, color: 'var(--dls-navy)', }} className="stat-number">
            {totalCasos}
          </div>
        </div>
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Ingresos estimados</div>
          {tarifaHora > 0 ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 36, lineHeight: 1, color: 'var(--dls-navy)' }}>
                ${ingresosEstimados.toLocaleString('es-CL')}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 6 }}>
                ${tarifaHora.toLocaleString('es-CL')}/hr × {casosActivos} activo{casosActivos !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--dls-taupe)', marginTop: 8 }}>
              Sin tarifa definida
            </div>
          )}
        </div>
        <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px 32px' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Valoración</div>
          {promedio ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 48, lineHeight: 1, color: 'var(--dls-navy)' }}>
                {promedio}
              </div>
              <div>
                <StarRating value={Math.round(promedio)} readonly size="sm" />
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 2 }}>
                  {reviews?.length} reseña{reviews?.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--dls-taupe)', marginTop: 8 }}>
              Sin valoraciones
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <CasosCharts data={chartData} totalCasos={totalCasos} />

      {/* Lista casos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="eyebrow">——— Casos asignados</div>
          {totalCasos > 0 && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
              {totalCasos} caso{totalCasos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!casos || casos.length === 0 ? (
          <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', borderLeft: '2px solid var(--dls-champagne)', padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--dls-taupe)' }}>
              No tienes casos asignados aún
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(casos ?? []).map((caso) => (
              <Link
                key={caso.id}
                href={`/dashboard/abogado/casos/${caso.id}`}
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