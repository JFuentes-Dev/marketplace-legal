import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const { data: caso } = await supabase
    .from('casos')
    .select(`
      id, titulo, descripcion, area_legal, estado, created_at, abogado_id,
      profiles!casos_cliente_id_fkey (nombre, apellido, email)
    `)
    .eq('id', id)
    .single()

  if (!caso) redirect('/dashboard/admin')

  const { data: abogados } = await supabase
    .from('lawyer_profiles')
    .select(`
      id,
      especialidades,
      profiles (nombre, apellido)
    `)
    .eq('verified', true)

  const clienteArr = caso.profiles as { nombre: string; apellido: string; email: string }[] | null
  const cliente = Array.isArray(clienteArr) ? clienteArr[0] : null

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

        {/* Cabecera caso */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold">{caso.titulo}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${ESTADO_ESTILOS[caso.estado] ?? "bg-gray-100"}`}>
              {caso.estado}
            </span>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p><span className="font-medium text-gray-700">Área:</span> {caso.area_legal}</p>
            <p><span className="font-medium text-gray-700">Cliente:</span> {cliente?.nombre} {cliente?.apellido} · {cliente?.email}</p>
            <p><span className="font-medium text-gray-700">Creado:</span> {new Date(caso.created_at).toLocaleDateString('es-CL')}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
            <p className="text-sm text-gray-600 leading-relaxed">{caso.descripcion}</p>
          </div>
        </div>

        {/* Asignación */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Asignar abogado</h2>
          <AsignarAbogado
            casoId={caso.id}
            abogadoActualId={caso.abogado_id}
            abogados={(abogados ?? []).map((a) => {
              const perfilArr = a.profiles as { nombre: string; apellido: string }[] | null
              const perfil = Array.isArray(perfilArr) ? perfilArr[0] : null
              return {
                id: a.id,
                nombre: `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim(),
                especialidades: (a.especialidades as string[]) ?? [],
              }
            })}
          />
        </div>
      </div>
    </main>
  )
}