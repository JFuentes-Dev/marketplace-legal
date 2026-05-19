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

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Búsqueda */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad..."
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(e) => actualizar('q', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Especialidad */}
        <select
          defaultValue={searchParams.get('especialidad') ?? ''}
          onChange={(e) => actualizar('especialidad', e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Cualquier experiencia</option>
          <option value="1">1+ años</option>
          <option value="3">3+ años</option>
          <option value="5">5+ años</option>
          <option value="10">10+ años</option>
        </select>
      </div>
    </div>
  )
}

export function FiltrosAbogados({ especialidades }: Props) {
  return (
    <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse" />}>
      <FiltrosInner especialidades={especialidades} />
    </Suspense>
  )
}