import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function DashboardAbogadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'abogado') redirect('/dashboard')

  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('rut, bio, tarifa_hora, especialidades')
    .eq('id', user.id)
    .single()

  const perfilCompleto = !!(lawyerProfile?.rut && lawyerProfile?.bio && lawyerProfile?.tarifa_hora)

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {profile?.nombre ?? user.email} 👋
            </h1>
            {!profile?.verified && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Pendiente verificación
              </span>
            )}
          </div>
          <Link
            href="/dashboard/abogado/perfil"
            className="text-sm text-blue-600 hover:underline"
          >
            Editar perfil →
          </Link>
          <LogoutButton />
        </div>

        <p className="text-gray-500 mb-4">Panel de abogado</p>

        {/* Aviso si el perfil está incompleto */}
        {!perfilCompleto && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            Tu perfil profesional está incompleto.{" "}
            <Link href="/dashboard/abogado/perfil" className="font-medium underline">
              Complétalo aquí
            </Link>{" "}
            para aparecer en el marketplace.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TarjetaDashboard titulo="Casos activos" valor="0" />
          <TarjetaDashboard titulo="Consultas recibidas" valor="0" />
          <TarjetaDashboard titulo="Valoración" valor="—" />
        </div>
      </div>
    </main>
  )
}

function TarjetaDashboard({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <p className="text-sm text-gray-500 mb-1">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  )
}