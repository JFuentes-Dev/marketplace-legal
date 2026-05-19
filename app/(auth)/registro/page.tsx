'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Rol = 'cliente' | 'abogado'

export default function RegistroPage() {
  const router = useRouter()
  const [rol, setRol] = useState<Rol>('cliente')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, apellido, role: rol } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dls-cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}
    >
      {/* Decoración */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: '35%',
          height: '100%',
          background: 'var(--dls-navy)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 960,
          background: 'var(--dls-white)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          boxShadow: '0 24px 80px -16px rgba(15,30,58,0.25)',
        }}
      >
        {/* Panel izquierdo — formulario */}
        <div style={{ padding: '56px 48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 18,
                color: 'var(--dls-navy)',
                marginBottom: 40,
              }}
            >
              ← Marketplace Legal
            </div>
          </Link>

          <div className="eyebrow" style={{ marginBottom: 16 }}>Nueva cuenta</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 36,
              color: 'var(--dls-navy)',
              marginBottom: 8,
            }}
          >
            Crear cuenta
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dls-taupe)', marginBottom: 36 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--dls-champagne)', textDecoration: 'none', borderBottom: '1px solid var(--dls-champagne)' }}>
              Inicia sesión
            </Link>
          </p>

          {/* Selector de rol */}
          <div style={{ marginBottom: 36 }}>
            <div className="label-dls" style={{ marginBottom: 12 }}>Tipo de cuenta</div>
            <div style={{ display: 'flex', gap: 0 }}>
              {(['cliente', 'abogado'] as Rol[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRol(r)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.2s',
                    background: rol === r ? 'var(--dls-navy)' : 'transparent',
                    color: rol === r ? 'var(--dls-cream)' : 'var(--dls-taupe)',
                    borderColor: rol === r ? 'var(--dls-navy)' : 'var(--dls-hairline)',
                  }}
                >
                  {r === 'cliente' ? 'Soy cliente' : 'Soy abogado'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label className="label-dls">Nombre</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-dls" placeholder="María" />
              </div>
              <div>
                <label className="label-dls">Apellido</label>
                <input type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)} className="input-dls" placeholder="González" />
              </div>
            </div>
            <div>
              <label className="label-dls">Correo electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-dls" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="label-dls">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-dls" placeholder="Mínimo 8 caracteres" />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(122,42,56,0.08)', borderLeft: '2px solid var(--dls-burgundy)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dls-burgundy)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.7 : 1 }}>
              <span>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</span>
            </button>
          </form>
        </div>

        {/* Panel derecho — navy decorativo */}
        <div
          style={{
            background: 'var(--dls-navy)',
            padding: '56px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="eyebrow" style={{ color: 'var(--dls-champagne)' }}>
            Por qué elegirnos
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { roman: 'I', text: 'Abogados verificados' },
              { roman: 'II', text: 'Seguimiento de tu caso en tiempo real' },
              { roman: 'III', text: 'Comunicación directa con tu Abogado' },
              { roman: 'IV', text: 'Sin costos ocultos ni compromisos' },
            ].map((item) => (
              <div key={item.roman} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: 'var(--dls-champagne)',
                    letterSpacing: '0.2em',
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                >
                  {item.roman}
                </div>
                <div
                  style={{
                    height: 1,
                    width: 24,
                    background: 'var(--dls-champagne)',
                    opacity: 0.3,
                    marginTop: 9,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'rgba(250,244,237,0.7)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                height: 1,
                background: 'linear-gradient(to right, var(--dls-champagne), transparent)',
                opacity: 0.2,
                marginBottom: 20,
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 18,
                color: 'var(--dls-cream)',
                opacity: 0.6,
              }}
            >
              "Cerrar una etapa, con serenidad."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}