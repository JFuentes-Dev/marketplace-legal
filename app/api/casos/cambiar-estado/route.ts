// app/api/casos/cambiar-estado/route.ts
import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { casoId, estado } = await req.json()

  if (!casoId || !estado) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('casos')
    .update({
      estado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', casoId)
    .eq('abogado_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Invalida caché del detalle del caso y del dashboard
  revalidatePath(`/dashboard/abogado/casos/${casoId}`)
  revalidatePath('/dashboard/abogado')

  return Response.json({ ok: true })
}