// app/api/casos/seleccionar-abogado/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmailAsignacion } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { caso_id, postulacion_id, codigo_seguimiento } = await req.json()

    if (!caso_id || !postulacion_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Verificar propiedad del caso ──────────────────────────────────────────
    const { data: caso } = await admin
      .from('casos')
      .select('id, cliente_id, abogado_id, estado, titulo, email_contacto, codigo_seguimiento')
      .eq('id', caso_id)
      .single()

    if (!caso) return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })
    if (caso.abogado_id) return NextResponse.json({ error: 'Este caso ya tiene un abogado asignado' }, { status: 409 })
    if (caso.estado === 'cerrado') return NextResponse.json({ error: 'El caso está cerrado' }, { status: 409 })

    // Verificar identidad: usuario logueado O código de seguimiento anónimo
    let autorizado = false

    if (codigo_seguimiento) {
      // Modo anónimo: verificar que el código coincide con el caso
      autorizado = caso.codigo_seguimiento === codigo_seguimiento.trim().toUpperCase()
    } else {
      // Modo usuario logueado: verificar que es el cliente del caso
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && caso.cliente_id === user.id) autorizado = true
    }

    if (!autorizado) {
      return NextResponse.json({ error: 'No tienes permiso para asignar este caso' }, { status: 403 })
    }

    // ── Verificar que la postulación existe y está pendiente ──────────────────
    const { data: post } = await admin
      .from('postulaciones')
      .select('id, abogado_id, estado')
      .eq('id', postulacion_id)
      .eq('caso_id', caso_id)
      .single()

    if (!post) return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })
    if (post.estado !== 'pendiente') return NextResponse.json({ error: 'Esta postulación ya fue procesada' }, { status: 409 })

    // ── Aceptar postulación y rechazar el resto ───────────────────────────────
    await admin.from('postulaciones').update({ estado: 'aceptada' }).eq('id', postulacion_id)
    await admin.from('postulaciones').update({ estado: 'rechazada' }).eq('caso_id', caso_id).neq('id', postulacion_id)

    // ── Asignar abogado al caso ───────────────────────────────────────────────
    const { error: updateError } = await admin
      .from('casos')
      .update({ abogado_id: post.abogado_id, estado: 'asignado', updated_at: new Date().toISOString() })
      .eq('id', caso_id)

    if (updateError) throw updateError

    // ── Email de notificación al abogado ──────────────────────────────────────
    const { data: perfil } = await admin
      .from('profiles')
      .select('nombre, apellido, email')
      .eq('id', post.abogado_id)
      .single()

    if (perfil?.email) {
      await enviarEmailAsignacion({
        emailAbogado:  perfil.email,
        nombreAbogado: `${perfil.nombre} ${perfil.apellido}`,
        tituloCaso:    caso.titulo,
        casoId:        caso_id,
      }).catch(e => console.error('Email notificación abogado fallido:', e))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error en /api/casos/seleccionar-abogado:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}