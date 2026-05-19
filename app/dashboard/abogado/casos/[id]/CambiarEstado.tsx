'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

export default function CambiarEstado({
  casoId,
  estadoActual,
}: Props) {
  const router = useRouter()

  const [loading, startTransition] = useTransition()

  async function actualizarEstado(
    estado: EstadoCaso
  ) {
    try {
      const res = await fetch('/api/casos/cambiar-estado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          casoId,
          estado,
        }),
      })

      if (!res.ok) {
        throw new Error()
      }

      router.refresh()
    } catch {
      alert('No se pudo actualizar el estado')
    }
  }

  return (
    <div className="space-y-2">

      {OPCIONES.map((opcion) => {
        const activo = opcion.value === estadoActual

        return (
          <button
            key={opcion.value}
            disabled={loading || activo}
            onClick={() => {
              startTransition(() => {
                actualizarEstado(opcion.value)
              })
            }}
            className={`
              w-full text-left px-3 py-2 rounded-xl text-sm border transition-all
              ${
                activo
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
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
  )
}