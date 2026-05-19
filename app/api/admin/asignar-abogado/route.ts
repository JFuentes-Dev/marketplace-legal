// app/api/admin/asignar-abogado/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmailAsignacion } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { caso_id: casoId, abogado_id: abogadoId } = await req.json()
    if (!casoId || !abogadoId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Actualizar caso
    const { data: caso, error: errorCaso } = await supabase
      .from('casos')
      .update({ abogado_id: abogadoId, estado: 'asignado', updated_at: new Date().toISOString() })
      .eq('id', casoId)
      .select('titulo')
      .single()

    if (errorCaso) throw errorCaso

    // Obtener datos del abogado para el email
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre, apellido, email')
      .eq('id', abogadoId)
      .single()

    if (perfil && caso && perfil.email) {
      await enviarEmailAsignacion({
        emailAbogado: perfil.email,
        nombreAbogado: `${perfil.nombre} ${perfil.apellido}`,
        tituloCaso: caso.titulo,
        casoId,
      }).catch((e) => console.error('Email asignación fallido:', e))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}