'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { EstadoCaso } from '@/lib/types/caso'

interface Props {
  casoId: string
  estadoActual: EstadoCaso
}

const OPCIONES: {
  value: EstadoCaso
  label: string
}[] = [
  {
    value: 'asignado',
    label: 'Asignado',
  },
  {
    value: 'en_progreso',
    label: 'En progreso',
  },
  {
    value: 'cerrado',
    label: 'Cerrado',
  },
]

export function GestionCasoCard({
  casoId,
  estadoActual,
}: Props) {
  const router = useRouter()

  const [loading, startTransition] =
    useTransition()

  async function cambiarEstado(
    estado: EstadoCaso
  ) {
    try {
      await fetch('/api/casos/cambiar-estado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          casoId,
          estado,
        }),
      })

      router.refresh()
    } catch {
      alert('No se pudo actualizar')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-6">

      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Gestión del caso
      </h3>

      <div className="space-y-2">

        {OPCIONES.map((opcion) => {
          const activo =
            opcion.value === estadoActual

          return (
            <button
              key={opcion.value}
              disabled={activo || loading}
              onClick={() => {
                startTransition(() => {
                  cambiarEstado(opcion.value)
                })
              }}
              className={`
                w-full px-4 py-3 rounded-xl border text-sm transition-all text-left
                ${
                  activo
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }
              `}
            >
              {activo
                ? `✓ ${opcion.label}`
                : `Cambiar a ${opcion.label}`}
            </button>
          )
        })}
      </div>
    </div>
  )
}