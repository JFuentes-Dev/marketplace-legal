// components/pool/FiltrosPool.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, Suspense } from 'react'

const AREAS = [
  'Derecho de Familia',
  'Derecho Laboral',
  'Derecho Civil',
  'Derecho Penal',
  'Derecho Comercial',
  'Derecho Inmobiliario',
  'Derecho Tributario',
  'Otro',
]

function FiltrosInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const actualizar = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/dashboard/abogado/explorar?${params.toString()}`)
    },
    [router, searchParams]
  )

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--dls-navy)',
    background: 'var(--dls-white)',
    border: '1px solid var(--dls-hairline)',
    padding: '10px 14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        background: 'var(--dls-white)',
        border: '1px solid var(--dls-hairline)',
        padding: '18px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {/* Texto libre */}
      <input
        type="text"
        placeholder="Buscar por título o descripción…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => actualizar('q', e.target.value)}
        style={{ ...inputStyle, flex: '1 1 220px', minWidth: 180 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      />

      {/* Área legal */}
      <select
        defaultValue={searchParams.get('area') ?? ''}
        onChange={(e) => actualizar('area', e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', flex: '0 1 200px' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Todas las áreas</option>
        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      {/* Material penal */}
      <select
        defaultValue={searchParams.get('penal') ?? ''}
        onChange={(e) => actualizar('penal', e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', flex: '0 1 170px' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Cualquier materia</option>
        <option value="penal">Solo material penal</option>
        <option value="civil">Solo material civil</option>
      </select>

      {/* Fecha */}
      <select
        defaultValue={searchParams.get('fecha') ?? ''}
        onChange={(e) => actualizar('fecha', e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', flex: '0 1 160px' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Cualquier fecha</option>
        <option value="hoy">Hoy</option>
        <option value="semana">Esta semana</option>
        <option value="mes">Este mes</option>
      </select>

      {/* Limpiar */}
      {(searchParams.get('q') || searchParams.get('area') || searchParams.get('penal') || searchParams.get('fecha')) && (
        <button
          onClick={() => router.push('/dashboard/abogado/explorar')}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--dls-taupe)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '4px 0',
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

export function FiltrosPool() {
  return (
    <Suspense fallback={<div style={{ height: 56, background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', animation: 'champagnePulse 1.5s ease infinite' }} />}>
      <FiltrosInner />
    </Suspense>
  )
}