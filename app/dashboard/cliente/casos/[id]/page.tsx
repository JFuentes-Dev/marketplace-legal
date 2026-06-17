// app/dashboard/cliente/casos/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CasoDetalleCliente from './CasoDetalleCliente'
import { PostulacionesPanel } from '@/components/casos/PostulacionesPanel'
import type { PostulacionConAbogado } from '@/components/casos/PostulacionesPanel'

interface Props { params: Promise<{ id: string }> }

export default async function DetalleCasoClientePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caso } = await supabase
    .from('casos')
    .select('*')
    .eq('id', id)
    .eq('cliente_id', user.id)
    .single()

  if (!caso) notFound()

  // Abogado asignado
  let abogado = null
  let lawyerProfile = null
  if (caso.abogado_id) {
    const { data: a } = await supabase.from('profiles').select('id, nombre, apellido, email, telefono, avatar_url').eq('id', caso.abogado_id).single()
    abogado = a
    const { data: lp } = await supabase.from('lawyer_profiles').select('especialidades, bio, tarifa_hora, years_experiencia, verified').eq('id', caso.abogado_id).single()
    lawyerProfile = lp
  }

  // Review + Eventos + Documentos
  let reviewExistente = null
  if (caso.estado === 'cerrado' && caso.abogado_id) {
    const { data } = await supabase.from('reviews').select('puntuacion, comentario').eq('caso_id', id).eq('cliente_id', user.id).single()
    reviewExistente = data
  }
  const { data: eventos }    = await supabase.from('caso_eventos').select('*').eq('caso_id', id).order('fecha', { ascending: true })
  const { data: documentos } = await supabase.from('caso_documentos').select('*').eq('caso_id', id).order('created_at', { ascending: false })

  // ── Postulaciones ─────────────────────────────────────────────────────────
  // Dos queries separadas para evitar el error de FK inexistente con lawyer_profiles
  const postulaciones: PostulacionConAbogado[] = []

  if (!caso.abogado_id) {
    const admin = createAdminClient()

    // 1. Postulaciones + perfil básico
    const { data: posts } = await admin
      .from('postulaciones')
      .select(`
        id, abogado_id, mensaje, estado, created_at,
        profiles!postulaciones_abogado_id_fkey(nombre, apellido, avatar_url)
      `)
      .eq('caso_id', id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })

    if (posts && posts.length > 0) {
      // 2. Lawyer profiles para esos abogados
      const abogadoIds = posts.map(p => p.abogado_id)
      const { data: lps } = await admin
        .from('lawyer_profiles')
        .select('id, especialidades, years_experiencia, tarifa_hora')
        .in('id', abogadoIds)

      const lpMap: Record<string, typeof lps extends (infer T)[] | null ? T : never> = {}
      for (const lp of lps ?? []) lpMap[(lp as { id: string }).id] = lp

      for (const p of posts) {
        const perfil = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        const lp = lpMap[p.abogado_id] as { especialidades?: string[]; years_experiencia?: number | null; tarifa_hora?: number | null } | undefined
        postulaciones.push({
          id:           p.id,
          abogado_id:   p.abogado_id,
          mensaje:      p.mensaje,
          created_at:   p.created_at,
          perfil: {
            nombre:     (perfil as { nombre?: string })?.nombre     ?? '',
            apellido:   (perfil as { apellido?: string })?.apellido   ?? '',
            avatar_url: (perfil as { avatar_url?: string })?.avatar_url ?? null,
          },
          lawyerProfile: {
            especialidades:    lp?.especialidades    ?? [],
            years_experiencia: lp?.years_experiencia ?? null,
            tarifa_hora:       lp?.tarifa_hora       ?? null,
          },
        })
      }
    }
  }

  return (
    <>
      <CasoDetalleCliente
        caso={caso}
        abogado={abogado}
        lawyerProfile={lawyerProfile}
        eventos={eventos ?? []}
        documentos={documentos ?? []}
        userId={user.id}
        reviewExistente={reviewExistente ?? undefined}
      />
      {!caso.abogado_id && caso.estado !== 'cerrado' && (
        <PostulacionesPanel
          postulaciones={postulaciones}
          casoId={id}
          puedeSeleccionar={true}
        />
      )}
    </>
  )
}