// app/api/mensajes/notificar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmailMensajeNuevo } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { casoId, autorId } = await req.json()
    if (!casoId || !autorId) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = createAdminClient()

    // Obtener datos del caso
    const { data: caso } = await supabase
      .from('casos')
      .select('titulo, cliente_id, abogado_id')
      .eq('id', casoId)
      .single()

    if (!caso) return NextResponse.json({ ok: false }, { status: 404 })

    // Determinar destinatario (el otro participante)
    const destinatarioId = autorId === caso.cliente_id ? caso.abogado_id : caso.cliente_id
    if (!destinatarioId) return NextResponse.json({ ok: true }) // sin abogado asignado aún

    // Obtener datos de autor y destinatario
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email, role')
      .in('id', [autorId, destinatarioId])

    if (!perfiles || perfiles.length < 2) return NextResponse.json({ ok: true })

    const autor = perfiles.find((p) => p.id === autorId)
    const destinatario = perfiles.find((p) => p.id === destinatarioId)
    if (!autor || !destinatario) return NextResponse.json({ ok: true })

    if (!destinatario.email) return NextResponse.json({ ok: true })

    await enviarEmailMensajeNuevo({
      emailDestinatario: destinatario.email,
      nombreDestinatario: `${destinatario.nombre} ${destinatario.apellido}`,
      nombreRemitente: `${autor.nombre} ${autor.apellido}`,
      tituloCaso: caso.titulo,
      casoId,
      rol: destinatario.role === 'abogado' ? 'abogado' : 'cliente',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error enviando notificación:', e)
    return NextResponse.json({ ok: true }) // no bloquear el flujo por un email fallido
  }
}