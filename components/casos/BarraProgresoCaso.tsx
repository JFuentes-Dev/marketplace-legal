// components/casos/BarraProgresoCaso.tsx

'use client'

import { useState, useTransition } from 'react'

import type { EstadoCaso } from '@/lib/types/caso'

interface Props {
  casoId?: string
  estado: EstadoCaso
  editable?: boolean
}

const PASOS: {
  key: EstadoCaso
  label: string
}[] = [
  {
    key: 'pendiente',
    label: 'Iniciado',
  },
  {
    key: 'asignado',
    label: 'Asignado',
  },
  {
    key: 'en_progreso',
    label: 'En progreso',
  },
  {
    key: 'cerrado',
    label: 'Cerrado',
  },
]

export function BarraProgresoCaso({
  casoId,
  estado,
  editable = false,
}: Props) {
  const [loading, startTransition] =
    useTransition()

  const [estadoLocal, setEstadoLocal] =
    useState<EstadoCaso>(estado)

  const indexActual = PASOS.findIndex(
    p => p.key === estadoLocal
  )

  async function cambiarEstado(
    nuevoEstado: EstadoCaso
  ) {
    if (!casoId) return

    if (nuevoEstado === estadoLocal) {
      return
    }

    const labels: Record<
      EstadoCaso,
      string
    > = {
      pendiente: 'Pendiente',
      asignado: 'Asignado',
      en_progreso: 'En progreso',
      cerrado: 'Cerrado',
    }

    const confirmar = window.confirm(
      `¿Deseas cambiar el estado del caso a "${labels[nuevoEstado]}"?`
    )

    if (!confirmar) return

    const estadoAnterior =
      estadoLocal

    // optimistic UI
    setEstadoLocal(nuevoEstado)

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            '/api/casos/cambiar-estado',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                casoId,
                estado: nuevoEstado,
              }),
            }
          )

          if (!res.ok) {
            throw new Error()
          }
        } catch {
          // rollback
          setEstadoLocal(
            estadoAnterior
          )

          alert(
            'No se pudo actualizar el estado'
          )
        }
      })()
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">

      <div className="flex items-center justify-between gap-3">

        {PASOS.map((paso, index) => {
          const completado =
            index <= indexActual

          const activo =
            paso.key === estadoLocal

          return (
            <div
              key={paso.key}
              className="flex-1 flex items-center"
            >

              <div className="flex flex-col items-center flex-shrink-0">

                <button
                  type="button"
                  disabled={
                    loading ||
                    !editable
                  }
                  onClick={() =>
                    cambiarEstado(
                      paso.key
                    )
                  }
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-200
                    ${
                      completado
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                    ${
                      editable
                        ? 'cursor-pointer hover:scale-105'
                        : 'cursor-default'
                    }
                    ${
                      activo
                        ? 'shadow-lg'
                        : ''
                    }
                  `}
                >
                  {loading &&
                  activo
                    ? '...'
                    : index + 1}
                </button>

                <span
                  className={`
                    text-xs mt-2 text-center transition-colors
                    ${
                      completado
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {paso.label}
                </span>
              </div>

              {index <
                PASOS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 bg-gray-200 relative top-[-10px] overflow-hidden rounded-full">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${
                        index <
                        indexActual
                          ? 'bg-blue-600 w-full'
                          : 'bg-gray-200 w-full'
                      }
                    `}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editable && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            Haz click en una etapa para actualizar el estado del caso.
          </p>
        </div>
      )}
    </div>
  )
}