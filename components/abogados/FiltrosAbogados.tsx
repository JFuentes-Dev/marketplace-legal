// components/abogados/FiltrosAbogados.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, Suspense } from 'react'

interface Props {
  especialidades: string[]
}

function FiltrosInner({ especialidades }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const actualizar = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/abogados?${params.toString()}`)
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
    width: '100%',
    letterSpacing: '0.02em',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        background: 'var(--dls-white)',
        border: '1px solid var(--dls-hairline)',
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {/* Búsqueda */}
      <div style={{ flex: '1 1 220px', minWidth: 200 }}>
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad…"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(e) => actualizar('q', e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
        />
      </div>

      {/* Especialidad */}
      <select
        defaultValue={searchParams.get('especialidad') ?? ''}
        onChange={(e) => actualizar('especialidad', e.target.value)}
        style={{ ...inputStyle, width: 'auto', flex: '0 1 200px', cursor: 'pointer' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Todas las especialidades</option>
        {especialidades.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      {/* Tarifa máxima */}
      <select
        defaultValue={searchParams.get('tarifa_max') ?? ''}
        onChange={(e) => actualizar('tarifa_max', e.target.value)}
        style={{ ...inputStyle, width: 'auto', flex: '0 1 180px', cursor: 'pointer' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Cualquier tarifa</option>
        <option value="50000">Hasta $50.000/hr</option>
        <option value="100000">Hasta $100.000/hr</option>
        <option value="200000">Hasta $200.000/hr</option>
      </select>

      {/* Años de experiencia */}
      <select
        defaultValue={searchParams.get('experiencia_min') ?? ''}
        onChange={(e) => actualizar('experiencia_min', e.target.value)}
        style={{ ...inputStyle, width: 'auto', flex: '0 1 180px', cursor: 'pointer' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--dls-champagne)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--dls-hairline)')}
      >
        <option value="">Cualquier experiencia</option>
        <option value="1">1+ años</option>
        <option value="3">3+ años</option>
        <option value="5">5+ años</option>
        <option value="10">10+ años</option>
      </select>
    </div>
  )
}

export function FiltrosAbogados({ especialidades }: Props) {
  return (
    <Suspense
      fallback={
        <div style={{ height: 60, background: 'var(--dls-white)', border: '1px solid var(--dls-hairline)', animation: 'champagnePulse 1.5s ease infinite' }} />
      }
    >
      <FiltrosInner especialidades={especialidades} />
    </Suspense>
  )
}