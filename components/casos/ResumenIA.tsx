'use client'

// components/casos/ResumenIA.tsx

import { useState } from 'react'
import {
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

interface Props {
  casoId: string
}

type Estado =
  | 'idle'
  | 'loading'
  | 'done'
  | 'error'

export function ResumenIA({
  casoId,
}: Props) {
  const [estado, setEstado] =
    useState<Estado>('idle')

  const [texto, setTexto] =
    useState('')

  const [error, setError] =
    useState<string | null>(null)

  async function generarResumen() {
    setEstado('loading')
    setTexto('')
    setError(null)

    try {
      // 1. Actualizar memoria IA persistente
      const actualizarRes = await fetch(
        '/api/caso-resumen/actualizar',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            casoId,
          }),
        }
      )

      if (!actualizarRes.ok) {
        const data =
          await actualizarRes.json()

        throw new Error(
          data.error ??
            'Error al actualizar memoria IA'
        )
      }

      // 2. Generar resumen humano desde memoria persistente
      const res = await fetch(
        '/api/caso-resumen',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            casoId,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()

        throw new Error(
          data.error ??
            'Error al generar resumen'
        )
      }

      const reader =
        res.body?.getReader()

      if (!reader) {
        throw new Error(
          'No se pudo leer el stream'
        )
      }

      const decoder = new TextDecoder()

      let buffer = ''

      setEstado('done')

      while (true) {
        const {
          done,
          value,
        } = await reader.read()

        if (done) break

        buffer += decoder.decode(
          value,
          {
            stream: true,
          }
        )

        const lines =
          buffer.split('\n')

        buffer =
          lines.pop() ?? ''

        for (const line of lines) {
          const trimmed =
            line.trim()

          if (
            !trimmed.startsWith(
              'data: '
            )
          ) {
            continue
          }

          const raw =
            trimmed.replace(
              /^data:\s*/,
              ''
            )

          if (
            !raw ||
            raw === '[DONE]'
          ) {
            continue
          }

          try {
            const parsed =
              JSON.parse(raw)

            if (
              parsed.type ===
                'text' &&
              parsed.content
            ) {
              setTexto(prev =>
                prev +
                parsed.content
              )
            }
          } catch {
            // chunk parcial
          }
        }
      }
    } catch (e: unknown) {
      setEstado('error')

      setError(
        e instanceof Error
          ? e.message
          : 'Error desconocido'
      )
    }
  }

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>

          <span className="text-sm font-semibold text-gray-700">
            Resumen IA
          </span>
        </div>

        {estado === 'idle' ? (
          <button
            onClick={
              generarResumen
            }
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generar resumen
          </button>
        ) : estado ===
          'loading' ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analizando...
          </div>
        ) : (
          <button
            onClick={
              generarResumen
            }
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
            title="Regenerar resumen"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar
          </button>
        )}
      </div>

      {/* Idle */}
      {estado === 'idle' && (
        <p className="text-xs text-gray-400 leading-relaxed">
          El asistente analizará el estado del caso,
          los eventos, mensajes y documentos para
          construir una memoria inteligente y generar
          un resumen contextual del caso.
        </p>
      )}

      {/* Loading */}
      {estado ===
        'loading' && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-5/6" />
          <div className="h-3 bg-gray-100 rounded-full w-4/6" />
        </div>
      )}

      {/* Resultado */}
      {estado === 'done' &&
        texto && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {texto}
            </p>

            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />

              Generado por IA · puede contener errores · no reemplaza asesoría legal
            </div>
          </div>
        )}

      {/* Error */}
      {estado ===
        'error' && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">

          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />

          <div>
            <p className="font-medium">
              No se pudo generar el resumen
            </p>

            {error && (
              <p className="text-xs mt-0.5 text-red-500">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}