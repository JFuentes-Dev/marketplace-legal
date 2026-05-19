// app/dashboard/cliente/casos/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CasoDetalleCliente from './CasoDetalleCliente'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DetalleCasoClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Caso
  const { data: caso } = await supabase
    .from('casos')
    .select('*')
    .eq('id', id)
    .eq('cliente_id', user.id)
    .single()

  if (!caso) notFound()

  // Perfil del abogado — ampliado para mostrar contacto completo
  let abogado = null
  let lawyerProfile = null

  if (caso.abogado_id) {
    const { data: abogadoData } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email, telefono, avatar_url')
      .eq('id', caso.abogado_id)
      .single()

    abogado = abogadoData

    const { data: lpData } = await supabase
      .from('lawyer_profiles')
      .select('especialidades, bio, tarifa_hora, years_experiencia, verified')
      .eq('id', caso.abogado_id)
      .single()

    lawyerProfile = lpData
  }

  // Review existente (solo si caso cerrado)
  let reviewExistente = null
  if (caso.estado === 'cerrado' && caso.abogado_id) {
    const { data } = await supabase
      .from('reviews')
      .select('puntuacion, comentario')
      .eq('caso_id', id)
      .eq('cliente_id', user.id)
      .single()
    reviewExistente = data
  }

  // Eventos del caso
  const { data: eventos } = await supabase
    .from('caso_eventos')
    .select('*')
    .eq('caso_id', id)
    .order('fecha', { ascending: true })

  // Documentos del caso
  const { data: documentos } = await supabase
    .from('caso_documentos')
    .select('*')
    .eq('caso_id', id)
    .order('created_at', { ascending: false })

  return (
    <CasoDetalleCliente
      caso={caso}
      abogado={abogado}
      lawyerProfile={lawyerProfile}
      eventos={eventos ?? []}
      documentos={documentos ?? []}
      userId={user.id}
      reviewExistente={reviewExistente ?? undefined}
    />
  )
}