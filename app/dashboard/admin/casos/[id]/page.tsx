import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AsignarAbogado from './AsignarAbogado'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalleCasoAdmin({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // A partir de aquí usamos adminClient para bypasear RLS
  const adminClient = createAdminClient()

  const { data: caso } = await adminClient
    .from('casos')
    .select('id, titulo, descripcion, area_legal, estado, created_at, abogado_id, cliente_id')
    .eq('id', id)
    .single()

  if (!caso) redirect('/dashboard/admin')

  const { data: cliente } = await adminClient
    .from('profiles')
    .select('nombre, apellido, email')
    .eq('id', caso.cliente_id)
    .single()

  const { data: abogados } = await adminClient
    .from('lawyer_profiles')
    .select('id, especialidades, profiles(nombre, apellido)')
    .eq('verified', true)

  const ESTADO_ESTILOS: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-700",
    asignado: "bg-blue-100 text-blue-700",
    en_progreso: "bg-purple-100 text-purple-700",
    cerrado: "bg-gray-100 text-gray-500",
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard/admin"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver al panel
        </Link>

        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold">{caso.titulo}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${ESTADO_ESTILOS[caso.estado] ?? "bg-gray-100"}`}>
              {caso.estado}
            </span>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p><span className="font-medium text-gray-700">Área:</span> {caso.area_legal}</p>
            <p>
              <span className="font-medium text-gray-700">Cliente:</span>{" "}
              {cliente?.nombre} {cliente?.apellido} · {cliente?.email}
            </p>
            <p><span className="font-medium text-gray-700">Creado:</span> {new Date(caso.created_at).toLocaleDateString('es-CL')}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
            <p className="text-sm text-gray-600 leading-relaxed">{caso.descripcion}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Asignar abogado</h2>
          <AsignarAbogado
            casoId={caso.id}
            abogadoActualId={caso.abogado_id}
            abogados={(abogados ?? []).map((a) => {
              const perfil = a.profiles as { nombre: string; apellido: string } | { nombre: string; apellido: string }[] | null
              const p = Array.isArray(perfil) ? perfil[0] : perfil
              return {
                id: a.id,
                nombre: `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim(),
                especialidades: (a.especialidades as string[]) ?? [],
              }
            })}
          />
        </div>
      </div>
    </main>
  )
}