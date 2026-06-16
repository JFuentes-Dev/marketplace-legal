// app/api/casos/vincular/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para vincular un caso' }, { status: 401 })
    }

    // Verificar que es cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'cliente') {
      return NextResponse.json({ error: 'Solo clientes pueden vincular casos' }, { status: 403 })
    }

    const { codigo } = await req.json()
    if (!codigo?.trim()) {
      return NextResponse.json({ error: 'Código de seguimiento requerido' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Buscar el caso por código
    const { data: caso, error: buscarError } = await admin
      .from('casos')
      .select('id, titulo, area_legal, estado, cliente_id, email_contacto')
      .eq('codigo_seguimiento', codigo.trim().toUpperCase())
      .single()

    if (buscarError || !caso) {
      return NextResponse.json({ error: 'Código no encontrado. Verifica que esté escrito correctamente.' }, { status: 404 })
    }

    if (caso.cliente_id !== null) {
      // Ya está vinculado — verificar si es del mismo usuario
      if (caso.cliente_id === user.id) {
        return NextResponse.json({ error: 'Este caso ya está vinculado a tu cuenta' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Este código ya fue utilizado' }, { status: 409 })
    }

    // Vincular
    const { error: updateError } = await admin
      .from('casos')
      .update({ cliente_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', caso.id)

    if (updateError) throw updateError

    return NextResponse.json({
      ok: true,
      caso: {
        id: caso.id,
        titulo: caso.titulo,
        area_legal: caso.area_legal,
        estado: caso.estado,
      },
    })
  } catch (e) {
    console.error('Error en /api/casos/vincular:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}