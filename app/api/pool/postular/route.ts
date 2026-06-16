// app/api/pool/postular/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_POSTULACIONES_DIA = 10  // 100 puntos / 10 por caso
const MAX_POSTULACIONES_CASO = 3

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que es abogado verificado
    const { data: lawyerProfile } = await supabase
      .from('lawyer_profiles')
      .select('id, verified')
      .eq('id', user.id)
      .single()

    if (!lawyerProfile?.verified) {
      return NextResponse.json({ error: 'Solo abogados verificados pueden postular' }, { status: 403 })
    }

    const { caso_id: casoId, mensaje } = await req.json()
    if (!casoId) {
      return NextResponse.json({ error: 'Falta caso_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Verificar que el caso existe, está pendiente y en pool
    const { data: caso } = await admin
      .from('casos')
      .select('id, estado, abogado_id, postulaciones_count')
      .eq('id', casoId)
      .single()

    if (!caso) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })
    }
    if (caso.estado !== 'pendiente' || caso.abogado_id !== null) {
      return NextResponse.json({ error: 'Este caso ya no está en el pool' }, { status: 409 })
    }
    if ((caso.postulaciones_count ?? 0) >= MAX_POSTULACIONES_CASO) {
      return NextResponse.json({ error: 'Este caso ya tiene el máximo de postulaciones' }, { status: 409 })
    }

    // 2. Verificar puntos del día (cuántos casos aplicó hoy)
    const hoy = new Date().toISOString().split('T')[0]
    const { count: postulacionesHoy } = await admin
      .from('postulaciones')
      .select('id', { count: 'exact', head: true })
      .eq('abogado_id', user.id)
      .gte('created_at', `${hoy}T00:00:00.000Z`)
      .lt('created_at', `${hoy}T23:59:59.999Z`)

    if ((postulacionesHoy ?? 0) >= MAX_POSTULACIONES_DIA) {
      return NextResponse.json({
        error: 'Alcanzaste el límite de postulaciones del día (10 casos)',
        puntosUsados: 100,
        puntosRestantes: 0,
      }, { status: 429 })
    }

    // 3. Insertar postulación (la constraint UNIQUE previene duplicados)
    const { error: insertError } = await admin
      .from('postulaciones')
      .insert({
        caso_id: casoId,
        abogado_id: user.id,
        mensaje: mensaje?.trim() || null,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ya postulaste a este caso' }, { status: 409 })
      }
      throw insertError
    }

    const puntosRestantes = ((MAX_POSTULACIONES_DIA - (postulacionesHoy ?? 0) - 1) * 10)

    return NextResponse.json({
      ok: true,
      puntosRestantes,
      puntosUsados: ((postulacionesHoy ?? 0) + 1) * 10,
    })
  } catch (e) {
    console.error('Error en /api/pool/postular:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}