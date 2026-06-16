'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavLogo } from '@/components/shared/NavLogo'

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)

export default function SeguimientoPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleBuscar() {
    const clean = codigo.trim().toUpperCase()
    if (!clean) { setError('Ingresa tu código de seguimiento.'); return }
    if (!clean.startsWith('ML-') || clean.length < 6) {
      setError('El código debe tener el formato ML-XXXXXX.')
      return
    }
    setError(null)
    router.push(`/seguimiento/${clean}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dls-cream)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--dls-navy)', borderBottom: '1px solid rgba(201,163,90,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(250,244,237,0.45)', textDecoration: 'none', letterSpacing: '0.06em' }}>
              ← Inicio
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(201,163,90,0.2)' }} />
            <NavLogo />
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/login" className="nav-link">Iniciar sesión</Link>
            <Link href="/registro" className="btn-primary" style={{ padding: '9px 18px', fontSize: 10 }}>
              <span>Registrarse</span><IconArrow />
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido centrado */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--dls-navy)' }}>Sin cuenta requerida</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(32px, 5vw, 48px)', color: 'var(--dls-navy)', lineHeight: 1.1, marginBottom: 14 }}>
              Seguimiento{' '}
              <em style={{ color: 'var(--dls-champagne)', fontStyle: 'italic' }}>de caso</em>
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--dls-taupe)', lineHeight: 1.7 }}>
              Ingresa el código que recibiste por email para ver el estado actual de tu caso.
            </p>
          </div>

          {/* Card con formulario */}
          <div style={{ background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', padding: '36px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dls-navy)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Código de seguimiento
            </label>

            {/* Input de código */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <input
                type="text"
                value={codigo}
                onChange={e => { setCodigo(e.target.value.toUpperCase()); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                placeholder="ML-XXXXXX"
                maxLength={9}
                style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 20,
                  letterSpacing: '0.12em',
                  color: 'var(--dls-navy)',
                  background: 'var(--dls-cream)',
                  border: `1px solid ${error ? '#dc2626' : 'var(--dls-hairline)'}`,
                  padding: '12px 16px',
                  outline: 'none',
                  textTransform: 'uppercase',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => !error && (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
                onBlur={e => !error && (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
              />
              <button
                type="button"
                onClick={handleBuscar}
                disabled={!codigo.trim()}
                style={{
                  background: 'var(--dls-navy)',
                  color: 'var(--dls-champagne)',
                  border: 'none',
                  padding: '12px 20px',
                  cursor: !codigo.trim() ? 'not-allowed' : 'pointer',
                  opacity: !codigo.trim() ? 0.45 : 1,
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                Consultar →
              </button>
            </div>

            {error && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', marginBottom: 0 }}>{error}</p>
            )}

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--dls-taupe)', marginTop: 16, lineHeight: 1.6 }}>
              El código fue enviado al email que registraste al crear tu caso. Tiene el formato <span style={{ fontFamily: 'monospace', color: 'var(--dls-navy)' }}>ML-XXXXXX</span>.
            </p>
          </div>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--dls-hairline)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--dls-taupe)', letterSpacing: '0.06em' }}>o</span>
            <div style={{ flex: 1, height: 1, background: 'var(--dls-hairline)' }} />
          </div>

          {/* CTA crear cuenta */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-taupe)', marginBottom: 14 }}>
              ¿Quieres comunicarte con tu abogado y seguir el caso en detalle?
            </p>
            <Link
              href="/registro"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--dls-champagne)', textDecoration: 'none',
                borderBottom: '1px solid rgba(201,163,90,0.4)', paddingBottom: 2,
              }}
            >
              Crear cuenta gratis <IconArrow />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}