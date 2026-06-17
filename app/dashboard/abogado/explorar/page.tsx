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

  // IDs de casos ya postulados
  const { data: misPostulaciones } = await admin
    .from('postulaciones')
    .select('caso_id')
    .eq('abogado_id', user.id)
  const casosPostuladosArr = (misPostulaciones ?? []).map(p => p.caso_id)

  // Pool: casos pendientes sin abogado, con menos de 3 postulaciones
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

  // Documentos del pool (todos los casos anteriores)
  const casoIds = (casos ?? []).map(c => c.id)
  const documentosPorCaso: Record<string, { id: string; nombre: string; url: string; tipo: string; created_at: string }[]> = {}
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

  // ── Mis postulaciones (historial completo del abogado) ───────────────────
  const { data: misPostsRaw } = await admin
    .from('postulaciones')
    .select(`
      id, caso_id, mensaje, estado, created_at,
      casos!postulaciones_caso_id_fkey(
        id, titulo, area_legal, estado, abogado_id, cliente_id
      )
    `)
    .eq('abogado_id', user.id)
    .order('created_at', { ascending: false })

  const misPostulacionesData = (misPostsRaw ?? []).map(p => {
    const caso = Array.isArray(p.casos) ? p.casos[0] : p.casos
    return {
      id:              p.id,
      caso_id:         p.caso_id,
      mensaje:         p.mensaje as string | null,
      estado:          p.estado as string,
      created_at:      p.created_at as string,
      caso: caso ? {
        id:         (caso as { id: string }).id,
        titulo:     (caso as { titulo: string }).titulo,
        area_legal: (caso as { area_legal: string }).area_legal,
        estado:     (caso as { estado: string }).estado,
        abogado_id: (caso as { abogado_id: string | null }).abogado_id,
        cliente_id: (caso as { cliente_id: string | null }).cliente_id,
      } : null,
    }
  })

  return (
    <PoolExplorar
      casos={casos ?? []}
      casosPostulados={new Set(casosPostuladosArr)}
      puntosRestantes={puntosRestantes}
      postulacionesHoy={postulacionesHoy ?? 0}
      noVerificado={!lawyerProfile?.verified}
      documentosPorCaso={documentosPorCaso}
      misPostulaciones={misPostulacionesData}
    />
  )
}