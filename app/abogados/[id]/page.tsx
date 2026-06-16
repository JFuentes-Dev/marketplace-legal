// app/abogados/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLogo } from '@/components/shared/NavLogo'
import { LogoutButton } from '@/components/shared/LogoutButton'
import { StarRating } from '@/components/ui/star-rating'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('lawyer_profiles')
    .select('profiles!inner(nombre, apellido), especialidades, bio')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Abogado | Marketplace Legal' }
  const perfil = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  return {
    title: `${perfil?.nombre} ${perfil?.apellido} | Marketplace Legal`,
    description: data.bio ?? `Abogado especializado en ${(data.especialidades ?? []).join(', ')}`,
  }
}

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

export default async function PerfilAbogadoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Usuario para nav
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

  const { data: abogado } = await supabase
    .from('lawyer_profiles')
    .select(`
      id, especialidades, bio, tarifa_hora, years_experiencia, verified,
      profiles!inner(nombre, apellido, email, telefono, avatar_url)
    `)
    .eq('id', id)
    .eq('verified', true)
    .single()

  if (!abogado) notFound()

  const p = Array.isArray(abogado.profiles) ? abogado.profiles[0] : abogado.profiles

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`id, puntuacion, comentario, created_at, profiles!reviews_cliente_id_fkey(nombre, apellido)`)
    .eq('abogado_id', id)
    .order('created_at', { ascending: false })

  const promedio = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length) * 10) / 10
    : null

  const iniciales = `${p?.nombre?.[0] ?? ''}${p?.apellido?.[0] ?? ''}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--dls-navy)', borderBottom: '1px solid rgba(201,163,90,0.2)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/abogados" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.45)', textDecoration: 'none', letterSpacing: '0.06em' }}>
              ← Abogados
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(201,163,90,0.2)' }} />
            <NavLogo />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {user && perfil ? (
              <>
                <Link href={dashboardHref} className="nav-link">Mis casos</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Iniciar sesión</Link>
                <Link href="/registro" className="btn-primary" style={{ padding: '9px 18px', fontSize: 10 }}>
                  <span>Registrarse</span><IconArrow />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Header del abogado ─────────────────────────────────── */}
        <div
          style={{
            background: 'var(--dls-navy)',
            padding: '40px',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decoración */}
          <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(201,163,90,0.1)', pointerEvents: 'none' }} />
          <div aria-hidden style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(201,163,90,0.08)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(201,163,90,0.15)',
                border: '2px solid rgba(201,163,90,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {p?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar_url} alt={iniciales} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--dls-champagne)', fontWeight: 500, lineHeight: 1 }}>
                  {iniciales}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Abogado verificado</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 32, color: 'var(--dls-cream)', lineHeight: 1.1, marginBottom: 10 }}>
                {p?.nombre} {p?.apellido}
              </h1>
              {promedio ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <StarRating value={Math.round(promedio)} readonly size="sm" />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(250,244,237,0.55)' }}>
                    {promedio} ({reviews?.length} calificación{reviews?.length !== 1 ? 'es' : ''})
                  </span>
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(250,244,237,0.4)', marginBottom: 16 }}>Sin valoraciones aún</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(abogado.especialidades ?? []).map((e: string) => (
                  <span key={e} style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-champagne)', background: 'rgba(201,163,90,0.12)', padding: '4px 10px' }}>
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Tarifa */}
            {abogado.tarifa_hora != null && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, color: 'var(--dls-champagne)', lineHeight: 1 }}>
                  ${abogado.tarifa_hora.toLocaleString('es-CL')}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.4)', letterSpacing: '0.06em', marginTop: 4 }}>por hora</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Grid info + CTA ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* Columna principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Bio */}
            {abogado.bio && (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
                <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--dls-navy)' }}>Sobre el abogado</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: 'var(--dls-navy-mid)' }}>
                  {abogado.bio}
                </p>
              </div>
            )}

            {/* Datos */}
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
              <div className="eyebrow" style={{ marginBottom: 20, color: 'var(--dls-navy)' }}>Datos profesionales</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {abogado.years_experiencia != null && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 6 }}>Experiencia</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, color: 'var(--dls-navy)' }}>{abogado.years_experiencia} años</p>
                  </div>
                )}
                {p?.telefono && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-taupe)', marginBottom: 6 }}>Contacto</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--dls-navy)' }}>{p.telefono}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
                <div className="eyebrow" style={{ marginBottom: 20, color: 'var(--dls-navy)' }}>
                  Valoraciones ({reviews.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map((r) => {
                    const cliente = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                    return (
                      <div key={r.id} style={{ borderBottom: '1px solid var(--dls-hairline)', paddingBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--dls-navy)', marginBottom: 4 }}>
                              {cliente?.nombre} {cliente?.apellido}
                            </p>
                            <StarRating value={r.puntuacion} readonly size="sm" />
                          </div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', letterSpacing: '0.04em' }}>
                            {new Date(r.created_at).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        {r.comentario && (
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.65, color: 'var(--dls-taupe)' }}>
                            {r.comentario}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna lateral - CTA */}
          <div style={{ position: 'sticky', top: 84 }}>
            <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '28px' }}>
              <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--dls-navy)' }}>¿Necesitas ayuda?</div>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--dls-navy)', lineHeight: 1.35, marginBottom: 20 }}>
                Abre un caso y {p?.nombre} lo revisará pronto.
              </p>
              <Link
                href="/dashboard/cliente/casos/nuevo"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', display: 'flex', boxSizing: 'border-box' }}
              >
                <span>Crear un caso</span>
                <IconArrow />
              </Link>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', textAlign: 'center', marginTop: 12, letterSpacing: '0.04em' }}>
                Sin costos ocultos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}