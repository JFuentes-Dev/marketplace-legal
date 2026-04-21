import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function DashboardClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nombre')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'cliente') redirect('/dashboard')

  const { data: casos } = await supabase
    .from('casos')
    .select('id, titulo, area_legal, estado, created_at')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {profile?.nombre ?? user.email} 👋
            </h1>
            <p className="text-gray-500">Panel de cliente</p>
          </div>
          <LogoutButton />
        </div>

        {/* Mis casos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mis casos</h2>
            <Link
              href="/dashboard/cliente/casos/nuevo"
              className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Nuevo caso
            </Link>
          </div>

          {!casos || casos.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
              No tienes casos aún.{" "}
              <Link href="/dashboard/cliente/casos/nuevo" className="text-primary underline">
                Crea tu primer caso
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {casos.map((caso) => (
                <div key={caso.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{caso.titulo}</p>
                    <p className="text-xs text-gray-500">{caso.area_legal}</p>
                  </div>
                  <EstadoBadge estado={caso.estado} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
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