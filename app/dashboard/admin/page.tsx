// app/dashboard/admin/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { EstadoBadge } from '@/components/casos/EstadoBadge'

interface SearchParams { estado?: string; q?: string; page?: string }
interface Props { searchParams: Promise<SearchParams> }
const PAGE_SIZE = 10

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

export default async function AdminPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const page = parseInt(sp.page ?? '1')
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [
    { count: totalCasos },
    { count: casosPendientes },
    { count: casosEnProgreso },
    { count: casosCerrados },
    { count: totalAbogados },
    { count: abogadosPendientes },
  ] = await Promise.all([
    admin.from('casos').select('*', { count: 'exact', head: true }),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'en_progreso'),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'cerrado'),
    admin.from('lawyer_profiles').select('*', { count: 'exact', head: true }),
    admin.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('verified', false),
  ])

  let query = admin.from('casos').select(`
    id, titulo, area_legal, estado, created_at, updated_at,
    profiles!casos_cliente_id_fkey(nombre, apellido)
  `, { count: 'exact' })
  if (sp.estado) query = query.eq('estado', sp.estado)

  const { data: casos, count: totalFiltrado } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPaginas = Math.ceil((totalFiltrado ?? 0) / PAGE_SIZE)

  const metricas = [
    { label: 'Total casos',    valor: totalCasos ?? 0,         navy: true },
    { label: 'Pendientes',     valor: casosPendientes ?? 0,    navy: false },
    { label: 'En progreso',    valor: casosEnProgreso ?? 0,    navy: false },
    { label: 'Cerrados',       valor: casosCerrados ?? 0,      navy: false },
    { label: 'Abogados',       valor: totalAbogados ?? 0,      navy: false },
    { label: 'Sin verificar',  valor: abogadosPendientes ?? 0, navy: false, alert: (abogadosPendientes ?? 0) > 0 },
  ]

  const filtros = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'en_progreso', label: 'En progreso' },
    { value: 'cerrado', label: 'Cerrado' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Header */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Panel de administración</div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: 'var(--dls-navy)',
            lineHeight: 1.1,
          }}
        >
          Vista general{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--dls-champagne)' }}>del sistema</em>
        </h1>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
        {metricas.map((m) => (
          <div
            key={m.label}
            style={{
              background: m.navy ? 'var(--dls-navy)' : m.alert ? 'rgba(122,42,56,0.06)' : 'var(--dls-white)',
              border: m.alert ? '1px solid rgba(122,42,56,0.2)' : '1px solid var(--dls-hairline)',
              padding: '20px 24px',
            }}
          >
            <div
              className="eyebrow"
              style={{
                color: m.navy ? 'rgba(201,163,90,0.65)' : m.alert ? 'var(--dls-burgundy)' : 'var(--dls-champagne)',
                marginBottom: 10,
                fontSize: 9,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 36,
                lineHeight: 1,
                color: m.navy ? 'var(--dls-cream)' : m.alert ? 'var(--dls-burgundy)' : 'var(--dls-navy)',
              }}
            >
              {m.valor}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <span className="eyebrow" style={{ marginRight: 12, fontSize: 9 }}>Filtrar:</span>
        {filtros.map((f) => {
          const activo = (sp.estado ?? '') === f.value
          return (
            <Link
              key={f.value}
              href={`/dashboard/admin?${f.value ? `estado=${f.value}` : ''}`}
              style={{
                padding: '6px 16px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                background: activo ? 'var(--dls-navy)' : 'var(--dls-white)',
                color: activo ? 'var(--dls-cream)' : 'var(--dls-taupe)',
                border: '1px solid',
                borderColor: activo ? 'var(--dls-navy)' : 'var(--dls-hairline)',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', overflow: 'hidden' }}>
        {/* Cabecera tabla */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
            gap: 0,
            background: 'var(--dls-navy)',
            padding: '12px 24px',
          }}
        >
          {['Caso', 'Cliente', 'Estado', 'Fecha', ''].map((h) => (
            <div
              key={h}
              className="eyebrow"
              style={{ color: 'rgba(201,163,90,0.65)', fontSize: 9 }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Filas */}
        {(casos ?? []).length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--dls-taupe)' }}>
            Sin casos para este filtro
          </div>
        ) : (
          (casos ?? []).map((caso, i) => {
            const cliente = Array.isArray(caso.profiles) ? caso.profiles[0] : caso.profiles
            return (
              <div
                key={caso.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
                  gap: 0,
                  padding: '16px 24px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--dls-hairline)',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--dls-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                    {caso.titulo}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', marginTop: 2 }}>
                    {caso.area_legal}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-navy-mid)' }}>
                  {cliente?.nombre} {cliente?.apellido}
                </div>
                <div><EstadoBadge estado={caso.estado} /></div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
                  {new Date(caso.created_at).toLocaleDateString('es-CL')}
                </div>
                <Link
                  href={`/dashboard/admin/casos/${caso.id}`}
                  className="btn-secondary"
                  style={{ fontSize: 10, gap: 6, whiteSpace: 'nowrap' }}
                >
                  <span>Ver</span>
                  <IconArrow />
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)' }}>
            Mostrando {from + 1}–{Math.min(to + 1, totalFiltrado ?? 0)} de {totalFiltrado} casos
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {page > 1 && (
              <Link href={`/dashboard/admin?${sp.estado ? `estado=${sp.estado}&` : ''}page=${page - 1}`} className="btn-secondary" style={{ fontSize: 10 }}>
                ← Anterior
              </Link>
            )}
            {page < totalPaginas && (
              <Link href={`/dashboard/admin?${sp.estado ? `estado=${sp.estado}&` : ''}page=${page + 1}`} className="btn-primary" style={{ padding: '8px 20px', fontSize: 10 }}>
                <span>Siguiente →</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}