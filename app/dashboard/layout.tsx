// app/dashboard/layout.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/shared/LogoutButton'
import { NavLogo } from '@/components/shared/NavLogo'
import { BackButton } from '@/components/shared/BackButton'
import { LegalAgentButton } from "@/components/legal-agent/LegalAgentButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let nombre = ''
  let rol = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, role')
      .eq('id', user.id)
      .single()
    nombre = profile?.nombre ?? ''
    rol = profile?.role ?? ''
  }

  const navLinks: Record<string, { href: string; label: string }[]> = {
    cliente: [
      { href: '/dashboard/cliente', label: 'Mis casos' },
      { href: '/abogados', label: 'Ver abogados' },
    ],
    abogado: [
      { href: '/dashboard/abogado', label: 'Mis casos' },
      { href: '/dashboard/abogado/perfil', label: 'Mi perfil' },
    ],
    admin: [
      { href: '/dashboard/admin', label: 'Casos' },
    ],
  }

  const links = navLinks[rol] ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <header
        style={{
          background: 'var(--dls-navy)',
          borderBottom: '1px solid rgba(201,163,90,0.2)',
          height: 64,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Izquierda: back + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackButton />
            <NavLogo />
          </div>

          {/* Nav central */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Usuario + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {nombre && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'rgba(250,244,237,0.55)',
                  letterSpacing: '0.04em',
                }}
              >
                {nombre}
              </span>
            )}
            <div
              style={{
                width: 1,
                height: 16,
                background: 'rgba(201,163,90,0.25)',
              }}
            />
            <LogoutButton />
            <LegalAgentButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Footer mínimo */}
      <footer
        style={{
          borderTop: '1px solid var(--dls-hairline)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--dls-taupe)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Marketplace Legal · Duoc UC
        </span>
      </footer>
    </div>
  )
}