import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const BodySchema = z.object({
  lawyerId: z.string().uuid("lawyerId debe ser un UUID válido"),
  verified: z.boolean(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "No autorizado — sesión requerida" },
      { status: 401 }
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "No se pudo obtener el perfil del usuario" },
      { status: 500 }
    )
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { error: "Acceso denegado — se requiere rol admin" },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { lawyerId, verified } = parsed.data

  const { error: updateError } = await supabase
    .from("lawyer_profiles")
    .update({ verified })
    .eq("id", lawyerId)

  if (updateError) {
    return NextResponse.json(
      { error: "Error al actualizar el perfil", detalles: updateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    mensaje: `Abogado ${verified ? "verificado" : "desverificado"} correctamente`,
  })
}