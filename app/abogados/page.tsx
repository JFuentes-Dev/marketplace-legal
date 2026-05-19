// app/abogados/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/ui/star-rating'
import { FiltrosAbogados } from '@/components/abogados/FiltrosAbogados'

interface SearchParams {
  especialidad?: string
  tarifa_max?: string
  experiencia_min?: string
  q?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export const metadata = {
  title: 'Abogados | Marketplace Legal',
  description: 'Encuentra el abogado ideal para tu caso. Filtra por especialidad, tarifa y experiencia.',
}

export default async function AbogadosPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('lawyer_profiles')
    .select(`
      id,
      especialidades,
      bio,
      tarifa_hora,
      years_experiencia,
      verified,
      profiles!inner(nombre, apellido, avatar_url)
    `)
    .eq('verified', true)

  if (sp.especialidad) {
    query = query.contains('especialidades', [sp.especialidad])
  }
  if (sp.tarifa_max) {
    query = query.lte('tarifa_hora', parseInt(sp.tarifa_max))
  }
  if (sp.experiencia_min) {
    query = query.gte('years_experiencia', parseInt(sp.experiencia_min))
  }

  const { data: abogados } = await query.order('years_experiencia', { ascending: false })

  // Reviews promedio por abogado
  const abogadoIds = (abogados ?? []).map((a) => a.id)
  const reviewsPorAbogado: Record<string, { promedio: number; total: number }> = {}

  if (abogadoIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('abogado_id, puntuacion')
      .in('abogado_id', abogadoIds)

    for (const id of abogadoIds) {
      const propias = (reviews ?? []).filter((r) => r.abogado_id === id)
      if (propias.length > 0) {
        const sum = propias.reduce((acc, r) => acc + r.puntuacion, 0)
        reviewsPorAbogado[id] = {
          promedio: Math.round((sum / propias.length) * 10) / 10,
          total: propias.length,
        }
      }
    }
  }

  // Filtro por nombre en memoria (búsqueda de texto)
  let resultado = abogados ?? []
  if (sp.q) {
    const q = sp.q.toLowerCase()
    resultado = resultado.filter((a) => {
      const perfil = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
      const nombre = `${perfil?.nombre} ${perfil?.apellido}`.toLowerCase()
      const bio = (a.bio ?? '').toLowerCase()
      const specs = (a.especialidades ?? []).join(' ').toLowerCase()
      return nombre.includes(q) || bio.includes(q) || specs.includes(q)
    })
  }

  const especialidadesUnicas = Array.from(
    new Set((abogados ?? []).flatMap((a) => a.especialidades ?? []))
  ).sort()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Encuentra tu abogado</h1>
        <p className="text-gray-600 mt-2">
          {resultado.length} abogado{resultado.length !== 1 ? 's' : ''} disponible{resultado.length !== 1 ? 's' : ''}
        </p>
      </div>

      <FiltrosAbogados especialidades={especialidadesUnicas} />

      {resultado.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No se encontraron abogados con esos filtros</p>
          <Link href="/abogados" className="text-blue-700 text-sm mt-2 inline-block hover:underline">
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {resultado.map((abogado) => {
            const perfil = Array.isArray(abogado.profiles) ? abogado.profiles[0] : abogado.profiles
            const stats = reviewsPorAbogado[abogado.id]
            return (
              <Link
                key={abogado.id}
                href={`/abogados/${abogado.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                    {perfil?.nombre?.[0]}{perfil?.apellido?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900">
                      {perfil?.nombre} {perfil?.apellido}
                    </h2>
                    {stats && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating value={Math.round(stats.promedio)} readonly size="sm" />
                        <span className="text-xs text-gray-500">({stats.total})</span>
                      </div>
                    )}
                  </div>
                </div>
                {abogado.bio && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{abogado.bio}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {(abogado.especialidades ?? []).slice(0, 3).map((e: string) => (
                    <span key={e} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {abogado.years_experiencia} años exp.
                  </span>
                  <span className="font-semibold text-blue-700">
                    ${abogado.tarifa_hora?.toLocaleString('es-CL')}/hr
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}