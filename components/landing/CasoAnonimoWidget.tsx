'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

interface SuccessData {
  codigo: string
  email: string
  titulo: string
}

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="4" x2="14" y2="14" /><line x1="14" y1="4" x2="4" y2="14" />
  </svg>
)
const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5,11 8,15.5 18.5,5.5" />
  </svg>
)

const BTN_PRIMARY: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  background: '#0f1e3a', color: '#c9a35a',
  padding: '14px 28px',
  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  border: 'none', cursor: 'pointer', textDecoration: 'none', userSelect: 'none',
}
const INPUT: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-body)', fontSize: 14,
  color: '#0f1e3a', background: '#f7f3ee',
  border: '1px solid #e0d8d0', padding: '11px 14px',
  outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
}
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#2a3a5c',
  display: 'block', marginBottom: 7, fontWeight: 600,
}

export function CasoAnonimoWidget() {
  const [mounted, setMounted] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [archivos, setArchivos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<SuccessData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', descripcion: '' })

  // Necesario para que createPortal funcione solo en el cliente
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!abierto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [abierto])

  function cerrar() {
    setAbierto(false)
    document.body.style.overflow = ''
    setTimeout(() => {
      setExito(null); setError(null); setArchivos([])
      setForm({ nombre: '', email: '', telefono: '', descripcion: '' })
    }, 200)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? [])
    setArchivos(prev => [...prev, ...nuevos].slice(0, 5))
    e.target.value = ''
  }

  async function handleSubmit() {
    setError(null)
    if (!form.nombre.trim() || !form.email.trim() || !form.descripcion.trim()) {
      setError('Nombre, email y descripción son obligatorios.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un email válido.'); return
    }
    if (form.descripcion.trim().length < 30) {
      setError('Describe tu situación con más detalle (mínimo 30 caracteres).'); return
    }
    setLoading(true)
    const fd = new FormData()
    fd.append('nombre', form.nombre.trim())
    fd.append('email', form.email.trim())
    fd.append('telefono', form.telefono.trim())
    fd.append('descripcion', form.descripcion.trim())
    archivos.forEach(f => fd.append('archivos', f))
    try {
      const res = await fetch('/api/casos/anonimo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo enviar el caso.'); setLoading(false); return }
      setExito({ codigo: data.codigo, email: form.email, titulo: data.titulo })
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    }
    setLoading(false)
  }

  // ── El modal se renderiza en document.body via Portal ────────────────────
  const modal = abierto ? (
    // Overlay: clic fuera cierra
    <div
      onClick={cerrar}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 99999,
        background: 'rgba(8,18,42,0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', boxSizing: 'border-box',
      }}
    >
      {/* Modal — clic dentro NO cierra */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', width: '100%', maxWidth: 540,
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(8,18,42,0.5)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ background: '#0f1e3a', padding: '22px 28px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,163,90,0.65)', marginBottom: 5 }}>Sin cuenta requerida</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 26, color: '#faf4ed', lineHeight: 1.15, margin: 0 }}>
                Cuéntanos tu caso
              </h2>
            </div>
            <button type="button" onClick={cerrar} aria-label="Cerrar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,244,237,0.4)', padding: '4px', lineHeight: 0, marginTop: 2, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#faf4ed')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,244,237,0.4)')}>
              <IconX />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {exito ? (
            /* ── Éxito ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', border: '2px solid rgba(5,150,105,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: 14 }}>
                <IconCheck />
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#059669', marginBottom: 6 }}>Caso enviado con éxito</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 20, color: '#0f1e3a', marginBottom: 20, lineHeight: 1.2 }}>{exito.titulo}</h3>

              <div style={{ background: '#0f1e3a', padding: '22px 24px', width: '100%', boxSizing: 'border-box', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,163,90,0.7)', marginBottom: 10 }}>Código de seguimiento</div>
                <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: '#c9a35a', letterSpacing: '0.14em', marginBottom: 8 }}>{exito.codigo}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(250,244,237,0.5)', lineHeight: 1.6 }}>
                  Enviado a <strong style={{ color: 'rgba(250,244,237,0.8)' }}>{exito.email}</strong>
                </div>
              </div>

              <div style={{ background: '#f7f3ee', border: '1px solid #e0d8d0', padding: '14px 18px', width: '100%', boxSizing: 'border-box', textAlign: 'left', marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#0f1e3a', marginBottom: 10 }}>¿Qué sigue?</p>
                {['Guarda tu código — lo necesitarás para hacer seguimiento.',
                  'Regístrate con este email y tu caso se vinculará automáticamente.',
                  'O ingresa el código manualmente desde tu panel de cliente.'].map((paso, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 7 : 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', color: '#c9a35a', fontWeight: 500, fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>{i + 1}.</span>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#a68f85', lineHeight: 1.6, margin: 0 }}>{paso}</p>
                  </div>
                ))}
              </div>

              <Link href={`/registro?email=${encodeURIComponent(exito.email)}`} onClick={cerrar}
                style={{ ...BTN_PRIMARY, justifyContent: 'center', padding: '14px 0', width: '100%', display: 'flex', boxSizing: 'border-box', marginBottom: 8 }}>
                <span>Crear cuenta y ver mi caso</span><IconArrow />
              </Link>
              <button type="button" onClick={cerrar}
                style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a68f85', background: 'none', border: '1px solid #e0d8d0', padding: '12px 0', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          ) : (
            /* ── Formulario ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#a68f85', lineHeight: 1.7, margin: 0 }}>
                Describe tu situación y recibirás un <strong style={{ color: '#0f1e3a' }}>código de seguimiento</strong> por email. No necesitas crear una cuenta.
              </p>

              <div>
                <label style={LABEL}>Nombre completo *</label>
                <input name="nombre" type="text" value={form.nombre} onChange={handleChange}
                  placeholder="Ej: Juan Pérez" style={INPUT}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9a35a')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e0d8d0')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LABEL}>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="tu@email.com" style={INPUT}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9a35a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e0d8d0')} />
                </div>
                <div>
                  <label style={{ ...LABEL, color: '#a68f85' }}>Teléfono <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(opc.)</span></label>
                  <input name="telefono" type="tel" value={form.telefono} onChange={handleChange}
                    placeholder="+56 9 1234 5678" style={INPUT}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c9a35a')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e0d8d0')} />
                </div>
              </div>

              <div>
                <label style={LABEL}>Describe tu situación *</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4}
                  placeholder="¿Qué ocurrió? ¿Cuándo? ¿Qué necesitas resolver? Cuéntanos con detalle…"
                  style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7, minHeight: 96 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c9a35a')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e0d8d0')} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: form.descripcion.length < 30 ? '#c9a35a' : '#059669', marginTop: 4 }}>
                  {form.descripcion.length} caracteres {form.descripcion.length < 30 ? '— mín. 30' : '✓'}
                </p>
              </div>

              {/* Documentos */}
              <div>
                <label style={{ ...LABEL, color: '#a68f85' }}>
                  Documentos <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(opcional, máx. 5)</span>
                </label>
                <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFiles} style={{ display: 'none' }} />
                <button type="button"
                  onClick={() => archivos.length < 5 && fileRef.current?.click()}
                  disabled={archivos.length >= 5}
                  style={{ width: '100%', border: '1px dashed #c9b89a', background: '#fbf8f4', padding: '14px', cursor: archivos.length >= 5 ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: archivos.length >= 5 ? 0.5 : 1, boxSizing: 'border-box' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#a68f85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13V7M7 10l3-3 3 3"/><rect x="2" y="2" width="16" height="16" rx="2" opacity="0.2"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#2a3a5c' }}>{archivos.length >= 5 ? 'Máximo alcanzado' : 'Añadir documentos'}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#a68f85' }}>PDF, Word, imágenes</span>
                </button>
                {archivos.length > 0 && (
                  <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {archivos.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#f7f3ee', border: '1px solid #e0d8d0' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#0f1e3a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340 }}>{f.name}</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#a68f85', margin: 0 }}>{(f.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a68f85', padding: '4px', lineHeight: 0, flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: '11px 16px', background: 'rgba(220,38,38,0.06)', borderLeft: '2px solid #dc2626', fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer submit */}
        {!exito && (
          <div style={{ padding: '14px 28px 22px', borderTop: '1px solid #e8e0d8', flexShrink: 0, background: '#fff' }}>
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ ...BTN_PRIMARY, width: '100%', justifyContent: 'center', padding: '15px 0', boxSizing: 'border-box', display: 'flex', opacity: loading ? 0.65 : 1, cursor: loading ? 'wait' : 'pointer', fontSize: 12 }}>
              <span>{loading ? 'Enviando…' : 'Enviar mi caso'}</span>
              {!loading && <IconArrow />}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#a68f85', textAlign: 'center', marginTop: 10, letterSpacing: '0.04em' }}>
              Sin cuenta, sin compromiso · Recibirás un código por email
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Botón trigger — estilos 100% inline */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={BTN_PRIMARY}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span>Necesito un abogado</span>
        <IconArrow />
      </button>

      {/* Portal: renderiza el modal en document.body, fuera del árbol de transforms */}
      {mounted && createPortal(modal, document.body)}
    </>
  )
}