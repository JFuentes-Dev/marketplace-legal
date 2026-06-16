// app/abogados/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FiltrosAbogados } from '@/components/abogados/FiltrosAbogados'
import { AbogadoCard } from '@/components/abogados/AbogadoCard'
import { NavLogo } from '@/components/shared/NavLogo'
import { LogoutButton } from '@/components/shared/LogoutButton'

interface SearchParams {
  especialidad?: string
  tarifa_max?: string
  experiencia_min?: string
  q?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export const metadata = {
  title: 'Abogados | Marketplace Legal',
  description: 'Encuentra el abogado ideal para tu caso. Filtra por especialidad, tarifa y experiencia.',
}

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

export default async function AbogadosPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()

  // Usuario logueado para nav
  const { data: { user } } = await supabase.auth.getUser()
  let perfil: { nombre: string | null; role: string | null } | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('nombre, role').eq('id', user.id).single()
    perfil = data
  }
  const dashboardHref =
    perfil?.role === 'abogado' ? '/dashboard/abogado' :
    perfil?.role === 'admin'   ? '/dashboard/admin' :
                                 '/dashboard/cliente'

  let query = supabase
    .from('lawyer_profiles')
    .select(`
      id,
      especialidades,
      bio,
      tarifa_hora,
      years_experiencia,
      verified,
      profiles!inner(nombre, apellido, avatar_url)
    `)
    .eq('verified', true)

  if (sp.especialidad) query = query.contains('especialidades', [sp.especialidad])
  if (sp.tarifa_max)   query = query.lte('tarifa_hora', parseInt(sp.tarifa_max))
  if (sp.experiencia_min) query = query.gte('years_experiencia', parseInt(sp.experiencia_min))

  const { data: abogados } = await query.order('years_experiencia', { ascending: false })

  // Reviews promedio
  const abogadoIds = (abogados ?? []).map((a) => a.id)
  const reviewsPorAbogado: Record<string, { promedio: number; total: number }> = {}

  if (abogadoIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('abogado_id, puntuacion')
      .in('abogado_id', abogadoIds)

    for (const id of abogadoIds) {
      const propias = (reviews ?? []).filter((r) => r.abogado_id === id)
      if (propias.length > 0) {
        const sum = propias.reduce((acc, r) => acc + r.puntuacion, 0)
        reviewsPorAbogado[id] = {
          promedio: Math.round((sum / propias.length) * 10) / 10,
          total: propias.length,
        }
      }
    }
  }

  // Filtro texto en memoria
  let resultado = abogados ?? []
  if (sp.q) {
    const q = sp.q.toLowerCase()
    resultado = resultado.filter((a) => {
      const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
      const nombre = `${p?.nombre} ${p?.apellido}`.toLowerCase()
      const bio = (a.bio ?? '').toLowerCase()
      const specs = (a.especialidades ?? []).join(' ').toLowerCase()
      return nombre.includes(q) || bio.includes(q) || specs.includes(q)
    })
  }

  const especialidadesUnicas = Array.from(
    new Set((abogados ?? []).flatMap((a) => a.especialidades ?? []))
  ).sort()

  const hayFiltros = !!(sp.q || sp.especialidad || sp.tarifa_max || sp.experiencia_min)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--dls-navy)', borderBottom: '1px solid rgba(201,163,90,0.2)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'rgba(250,244,237,0.45)',
                textDecoration: 'none',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Inicio
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(201,163,90,0.2)' }} />
            <NavLogo />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {user && perfil ? (
              <>
                <Link href={dashboardHref} className="nav-link">Mis casos</Link>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(250,244,237,0.4)', letterSpacing: '0.04em' }}>
                  {perfil.nombre}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Iniciar sesión</Link>
                <Link href="/registro" className="btn-primary" style={{ padding: '9px 18px', fontSize: 10 }}>
                  <span>Registrarse</span>
                  <IconArrow />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero section ───────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--dls-navy)',
          padding: '56px 24px 48px',
          borderBottom: '1px solid rgba(201,163,90,0.15)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Directorio verificado
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: 'var(--dls-cream)',
              lineHeight: 1.08,
              marginBottom: 12,
            }}
          >
            Encuentra tu{' '}
            <em style={{ color: 'var(--dls-champagne)', fontStyle: 'italic' }}>abogado</em>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'rgba(250,244,237,0.55)',
              marginBottom: 0,
            }}
          >
            {resultado.length} abogado{resultado.length !== 1 ? 's' : ''} verificado{resultado.length !== 1 ? 's' : ''} disponible{resultado.length !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* ── Filtros ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
        <FiltrosAbogados especialidades={especialidadesUnicas} />
      </div>

      {/* ── Grid de cards ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        {resultado.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--dls-white)',
              border: '1px solid var(--dls-hairline)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 28,
                color: 'var(--dls-navy)',
                opacity: 0.35,
                marginBottom: 16,
              }}
            >
              Sin resultados
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--dls-taupe)',
                marginBottom: 24,
              }}
            >
              No se encontraron abogados con esos filtros
            </p>
            {hayFiltros && (
              <Link
                href="/abogados"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--dls-champagne)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--dls-champagne)',
                  paddingBottom: 2,
                }}
              >
                Limpiar filtros
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
            }}
          >
            {resultado.map((abogado) => {
              const p = Array.isArray(abogado.profiles) ? abogado.profiles[0] : abogado.profiles
              return (
                <AbogadoCard
                  key={abogado.id}
                  id={abogado.id}
                  nombre={p?.nombre ?? ''}
                  apellido={p?.apellido ?? ''}
                  avatarUrl={p?.avatar_url}
                  especialidades={abogado.especialidades ?? []}
                  bio={abogado.bio}
                  tarifaHora={abogado.tarifa_hora}
                  yearsExperiencia={abogado.years_experiencia}
                  rating={reviewsPorAbogado[abogado.id]}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}