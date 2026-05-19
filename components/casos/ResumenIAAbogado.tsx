'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  casoId: string
  resumenInicial?: string | null
  generatedAt?: string | null
}

export function ResumenIAAbogado({
  casoId,
  resumenInicial,
  generatedAt,
}: Props) {
  const [texto, setTexto] = useState(resumenInicial ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function regenerar() {
    setLoading(true)
    setError(null)
    setTexto('')

    try {
      const res = await fetch('/api/caso-resumen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          casoId,
          guardar: true,
        }),
      })

      if (!res.ok) {
        throw new Error('No se pudo generar el análisis')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)

        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const raw = line.replace('data: ', '').trim()

          if (!raw) continue

          try {
            const parsed = JSON.parse(raw)

            if (parsed.type === 'text') {
              setTexto(prev => prev + parsed.content)
            }
          } catch {}
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Error desconocido'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!resumenInicial) {
      regenerar()
    }
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Análisis estratégico IA
            </h3>

            {generatedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Actualizado {new Date(generatedAt).toLocaleString('es-CL')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={regenerar}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}

          Actualizar análisis
        </button>
      </div>

      {loading && !texto && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-5/6" />
          <div className="h-3 bg-gray-100 rounded-full w-4/6" />
        </div>
      )}

      {texto && (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {texto}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}