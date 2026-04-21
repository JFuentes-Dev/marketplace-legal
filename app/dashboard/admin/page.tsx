import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function DashboardAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nombre')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()

  const { data: casos } = await adminClient
    .from('casos')
    .select('id, titulo, area_legal, estado, created_at, cliente_id')
    .order('created_at', { ascending: false })

  const { data: abogados } = await adminClient
    .from('lawyer_profiles')
    .select('id')
    .eq('verified', true)

  // Traer nombres de clientes por separado
  const clienteIds = [...new Set(casos?.map(c => c.cliente_id) ?? [])]
  const { data: clientes } = clienteIds.length > 0
    ? await adminClient
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', clienteIds)
    : { data: [] }

  const clienteMap = Object.fromEntries(
    (clientes ?? []).map(c => [c.id, c])
  )

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
            <p className="text-gray-500">Gestión de casos y abogados</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tarjeta titulo="Total casos" valor={String(casos?.length ?? 0)} />
          <Tarjeta titulo="Pendientes" valor={String(casos?.filter(c => c.estado === 'pendiente').length ?? 0)} />
          <Tarjeta titulo="En progreso" valor={String(casos?.filter(c => c.estado === 'en_progreso').length ?? 0)} />
          <Tarjeta titulo="Abogados" valor={String(abogados?.length ?? 0)} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Todos los casos</h2>
          {!casos || casos.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
              No hay casos registrados.
            </div>
          ) : (
            <div className="space-y-2">
              {casos.map((caso) => {
                const cliente = clienteMap[caso.cliente_id]
                return (
                  <Link
                    key={caso.id}
                    href={`/dashboard/admin/casos/${caso.id}`}
                    className="bg-white border rounded-xl p-4 flex items-center justify-between hover:border-primary transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{caso.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {caso.area_legal} · {cliente?.nombre} {cliente?.apellido}
                      </p>
                    </div>
                    <EstadoBadge estado={caso.estado} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <p className="text-sm text-gray-500 mb-1">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-700",
    asignado: "bg-blue-100 text-blue-700",
    en_progreso: "bg-purple-100 text-purple-700",
    cerrado: "bg-gray-100 text-gray-500",
  }
  const etiquetas: Record<string, string> = {
    pendiente: "Pendiente",
    asignado: "Asignado",
    en_progreso: "En progreso",
    cerrado: "Cerrado",
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[estado] ?? "bg-gray-100"}`}>
      {etiquetas[estado] ?? estado}
    </span>
  )
}