// components/casos/FormularioReview.tsx
'use client'
import { useState, useTransition } from 'react'
import { StarRating } from '@/components/ui/star-rating'
import { Button } from '@/components/ui/button'
import { crearReview } from '@/app/dashboard/cliente/casos/[id]/actions'

interface FormularioReviewProps {
  casoId: string
  abogadoId: string
  nombreAbogado: string
  reviewExistente?: { puntuacion: number; comentario: string | null }
}

export function FormularioReview({
  casoId,
  abogadoId,
  nombreAbogado,
  reviewExistente,
}: FormularioReviewProps) {
  const [puntuacion, setPuntuacion] = useState(reviewExistente?.puntuacion ?? 0)
  const [comentario, setComentario] = useState(reviewExistente?.comentario ?? '')
  const [enviado, setEnviado] = useState(!!reviewExistente)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  if (enviado && reviewExistente) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium text-sm">✓ Ya calificaste este caso</p>
        <StarRating value={reviewExistente.puntuacion} readonly size="sm" />
        {reviewExistente.comentario && (
          <p className="text-gray-600 text-sm mt-1">{reviewExistente.comentario}</p>
        )}
      </div>
    )
  }

  const handleSubmit = () => {
    if (puntuacion === 0) {
      setError('Debes seleccionar al menos una estrella')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await crearReview({ casoId, abogadoId, puntuacion, comentario })
      if (result.error) {
        setError(result.error)
      } else {
        setEnviado(true)
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Califica a {nombreAbogado}</h3>
      <StarRating value={puntuacion} onChange={setPuntuacion} />
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)..."
        rows={3}
        maxLength={500}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button onClick={handleSubmit} disabled={isPending} size="sm">
        {isPending ? 'Enviando...' : 'Enviar calificación'}
      </Button>
    </div>
  )
}