// app/dashboard/abogado/explorar/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PoolExplorar } from '@/components/pool/PoolExplorar'

export default async function ExplorarPoolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'abogado') redirect('/dashboard')

  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles').select('verified').eq('id', user.id).single()

  const admin = createAdminClient()

  // Puntos del día
  const hoy = new Date().toISOString().split('T')[0]
  const { count: postulacionesHoy } = await admin
    .from('postulaciones')
    .select('id', { count: 'exact', head: true })
    .eq('abogado_id', user.id)
    .gte('created_at', `${hoy}T00:00:00.000Z`)
    .lt('created_at', `${hoy}T23:59:59.999Z`)

  const puntosRestantes = 100 - (postulacionesHoy ?? 0) * 10

  // Casos ya postulados
  const { data: misPostulaciones } = await admin
    .from('postulaciones').select('caso_id').eq('abogado_id', user.id)
  const casosPostuladosArr = (misPostulaciones ?? []).map(p => p.caso_id)

  // Pool de casos — incluye datos de contacto anónimo
  const { data: casos } = await admin
    .from('casos')
    .select(`
      id, titulo, descripcion, area_legal, estado, created_at, postulaciones_count,
      nombre_contacto, email_contacto, telefono_contacto,
      profiles!casos_cliente_id_fkey(nombre, apellido)
    `)
    .eq('estado', 'pendiente')
    .is('abogado_id', null)
    .lt('postulaciones_count', 3)
    .order('created_at', { ascending: false })

  // Documentos de todos los casos del pool (son pocos, es eficiente)
  const casoIds = (casos ?? []).map(c => c.id)
  let documentosPorCaso: Record<string, { id: string; nombre: string; url: string; tipo: string; created_at: string }[]> = {}

  if (casoIds.length > 0) {
    const { data: docs } = await admin
      .from('caso_documentos')
      .select('id, caso_id, nombre, url, tipo, created_at')
      .in('caso_id', casoIds)
      .order('created_at', { ascending: true })

    for (const doc of docs ?? []) {
      if (!documentosPorCaso[doc.caso_id]) documentosPorCaso[doc.caso_id] = []
      documentosPorCaso[doc.caso_id].push(doc)
    }
  }

  return (
    <PoolExplorar
      casos={casos ?? []}
      casosPostulados={new Set(casosPostuladosArr)}
      puntosRestantes={puntosRestantes}
      postulacionesHoy={postulacionesHoy ?? 0}
      noVerificado={!lawyerProfile?.verified}
      documentosPorCaso={documentosPorCaso}
    />
  )
}