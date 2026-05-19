'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Correo o contraseña incorrectos'); setLoading(false); return }
    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <label className="label-dls">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-dls"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label className="label-dls">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-dls"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(122,42,56,0.08)',
            borderLeft: '2px solid var(--dls-burgundy)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--dls-burgundy)',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px 28px', opacity: loading ? 0.7 : 1 }}
      >
        <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dls-cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Decoración fondo */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '40%',
          height: '100%',
          background: 'var(--dls-navy)',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', maxWidth: 900, minHeight: 560, boxShadow: '0 24px 80px -16px rgba(15,30,58,0.25)' }}>

        {/* Panel izquierdo navy */}
        <div
          style={{
            width: '40%',
            background: 'var(--dls-navy)',
            padding: '56px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 22,
                color: 'var(--dls-cream)',
                lineHeight: 1.1,
              }}
            >
              Marketplace{' '}
              <em style={{ color: 'var(--dls-champagne)', fontStyle: 'italic' }}>&</em>{' '}
              Legal
            </div>
            <div className="eyebrow" style={{ color: 'var(--dls-taupe)', fontSize: 9, marginTop: 4 }}>
              Chile · Verified
            </div>
          </Link>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 28,
                color: 'var(--dls-cream)',
                lineHeight: 1.35,
                marginBottom: 16,
                opacity: 0.85,
              }}
            >
              "Cerrar una etapa, con serenidad."
            </div>
            <div className="eyebrow" style={{ color: 'var(--dls-champagne)', fontSize: 9 }}>
              — Marketplace Legal
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'linear-gradient(to right, var(--dls-champagne), transparent)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* Panel derecho blanco */}
        <div
          style={{
            flex: 1,
            background: 'var(--dls-white)',
            padding: '56px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              Acceso a tu cuenta
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 36,
                color: 'var(--dls-navy)',
                marginBottom: 8,
              }}
            >
              Iniciar sesión
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-taupe)' }}>
              ¿No tienes cuenta?{' '}
              <Link
                href="/registro"
                style={{
                  color: 'var(--dls-champagne)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--dls-champagne)',
                }}
              >
                Regístrate
              </Link>
            </p>
          </div>

          <Suspense fallback={<div style={{ height: 200, background: 'var(--dls-cream)', animation: 'champagnePulse 1.5s ease infinite' }} />}>
            <LoginForm />
          </Suspense>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/recuperar-password"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--dls-taupe)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}