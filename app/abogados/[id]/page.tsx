// app/abogados/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/ui/star-rating'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('lawyer_profiles')
    .select('profiles!inner(nombre, apellido), especialidades, bio')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Abogado | Marketplace Legal' }

  const perfil = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  return {
    title: `${perfil?.nombre} ${perfil?.apellido} | Marketplace Legal`,
    description: data.bio ?? `Abogado especializado en ${(data.especialidades ?? []).join(', ')}`,
  }
}

export default async function PerfilAbogadoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: abogado } = await supabase
    .from('lawyer_profiles')
    .select(`
      id, especialidades, bio, tarifa_hora, years_experiencia, verified,
      profiles!inner(nombre, apellido, email, telefono, avatar_url)
    `)
    .eq('id', id)
    .eq('verified', true)
    .single()

  if (!abogado) notFound()

  const perfil = Array.isArray(abogado.profiles) ? abogado.profiles[0] : abogado.profiles

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, puntuacion, comentario, created_at,
      profiles!reviews_cliente_id_fkey(nombre, apellido)
    `)
    .eq('abogado_id', id)
    .order('created_at', { ascending: false })

  const promedio = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.puntuacion, 0) / reviews.length) * 10) / 10
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
            {perfil?.nombre?.[0]}{perfil?.apellido?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {perfil?.nombre} {perfil?.apellido}
            </h1>
            {promedio && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={Math.round(promedio)} readonly size="sm" />
                <span className="text-sm text-gray-600">
                  {promedio} ({reviews?.length} calificación{reviews?.length !== 1 ? 'es' : ''})
                </span>
              </div>
            )}
            <p className="text-blue-700 font-semibold mt-2">
              ${abogado.tarifa_hora?.toLocaleString('es-CL')}/hora
            </p>
          </div>
        </div>

        {abogado.bio && (
          <p className="text-gray-700 mt-4">{abogado.bio}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {(abogado.especialidades ?? []).map((e: string) => (
            <span key={e} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
              {e}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Años de experiencia</p>
            <p className="font-semibold">{abogado.years_experiencia} años</p>
          </div>
          {perfil?.telefono && (
            <div>
              <p className="text-sm text-gray-500">Contacto</p>
              <p className="font-semibold">{perfil.telefono}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <Link
            href="/dashboard/cliente/casos/nuevo"
            className="inline-block bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Crear caso con este abogado
          </Link>
        </div>
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Calificaciones ({reviews.length})
          </h2>
          {reviews.map((r) => {
            const cliente = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {cliente?.nombre} {cliente?.apellido}
                    </p>
                    <StarRating value={r.puntuacion} readonly size="sm" />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
                {r.comentario && (
                  <p className="text-sm text-gray-600 mt-2">{r.comentario}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}