import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CasoDetalleAbogado } from '@/components/casos/CasoDetalleAbogado'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DetalleCasoAbogadoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caso } = await supabase
    .from('casos')
    .select('*')
    .eq('id', id)
    .eq('abogado_id', user.id)
    .single()

  if (!caso) notFound()

  const admin = createAdminClient()

  const { data: cliente } = await admin
    .from('profiles')
    .select('nombre, apellido, email, telefono')
    .eq('id', caso.cliente_id)
    .single()

  const { data: resumenIA } = await supabase
    .from('case_ai_summaries')
    .select('*')
    .eq('caso_id', caso.id)
    .maybeSingle()

  const { data: documentos } = await supabase
    .from('caso_documentos')
    .select('*')
    .eq('caso_id', caso.id)
    .order('created_at', { ascending: false })

  return (
    <CasoDetalleAbogado
      caso={caso}
      cliente={cliente}
      resumenIA={resumenIA}
      userId={user.id}
      documentos={documentos ?? []}
    />
  )
}