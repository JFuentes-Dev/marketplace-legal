// app/api/admin/aceptar-postulacion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmailAsignacion } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { postulacion_id: postulacionId } = await req.json()
    if (!postulacionId) return NextResponse.json({ error: 'Falta postulacion_id' }, { status: 400 })

    const admin = createAdminClient()

    // Obtener la postulación
    const { data: post } = await admin
      .from('postulaciones')
      .select('id, caso_id, abogado_id, estado')
      .eq('id', postulacionId)
      .single()

    if (!post) return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })
    if (post.estado !== 'pendiente') return NextResponse.json({ error: 'Esta postulación ya fue procesada' }, { status: 409 })

    // Aceptar esta postulación y rechazar el resto del caso
    await admin
      .from('postulaciones')
      .update({ estado: 'aceptada' })
      .eq('id', postulacionId)

    await admin
      .from('postulaciones')
      .update({ estado: 'rechazada' })
      .eq('caso_id', post.caso_id)
      .neq('id', postulacionId)

    // Asignar el abogado al caso
    const { data: caso, error: casoError } = await admin
      .from('casos')
      .update({ abogado_id: post.abogado_id, estado: 'asignado', updated_at: new Date().toISOString() })
      .eq('id', post.caso_id)
      .select('titulo')
      .single()

    if (casoError) throw casoError

    // Email de notificación
    const { data: perfil } = await admin
      .from('profiles')
      .select('nombre, apellido, email')
      .eq('id', post.abogado_id)
      .single()

    if (perfil?.email && caso) {
      await enviarEmailAsignacion({
        emailAbogado: perfil.email,
        nombreAbogado: `${perfil.nombre} ${perfil.apellido}`,
        tituloCaso: caso.titulo,
        casoId: post.caso_id,
      }).catch((e) => console.error('Email fallido:', e))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error en /api/admin/aceptar-postulacion:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}