'use client'

import { EstadoBadge } from '@/components/casos/EstadoBadge'
import { MensajesPanel } from '@/components/casos/MensajesPanel'
import { ResumenIAAbogado } from '@/components/casos/ResumenIAAbogado'
import { BarraProgresoCaso } from '@/components/casos/BarraProgresoCaso'

import type { Caso } from '@/lib/types/caso'

interface Props {
  caso: Caso
  cliente: any
  resumenIA?: any
  userId: string
}

export function CasoDetalleAbogado({
  caso,
  cliente,
  resumenIA,
  userId,
}: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

      <div className="space-y-6">

        <BarraProgresoCaso
        casoId={caso.id}
        estado={caso.estado}
        editable
        />

        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          <div className="flex items-start justify-between gap-4 mb-5">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {caso.titulo}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                {caso.area_legal}
              </p>
            </div>

            <EstadoBadge estado={caso.estado} />
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Descripción del cliente
            </p>

            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {caso.descripcion}
            </p>
          </div>

          {cliente && (
            <div className="border-t pt-5 mt-5">

              <p className="text-sm font-medium text-gray-900 mb-3">
                Cliente
              </p>

              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  {cliente.nombre} {cliente.apellido}
                </p>

                <p className="text-gray-500">
                  {cliente.email}
                </p>

                {cliente.telefono && (
                  <p className="text-gray-500">
                    {cliente.telefono}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <ResumenIAAbogado
          casoId={caso.id}
          resumenInicial={resumenIA?.resumen_actual}
          generatedAt={resumenIA?.generated_at}
        />

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <MensajesPanel
            casoId={caso.id}
            userId={userId}
            cerrado={caso.estado === 'cerrado'}
          />
        </div>
      </div>

      <div className="space-y-6">

      </div>
    </div>
  )
}