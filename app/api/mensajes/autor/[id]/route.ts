import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mensajes/autor/[id]?casoId=...
 *
 * Devuelve nombre/apellido/role del autor de un mensaje.
 * Solo accesible por participantes del caso (cliente o abogado asignado) o admin.
 * Necesario porque la RLS de profiles bloquea reads cross-user desde el browser.
 */
export async function GET(req: Request, context: RouteContext) {
  const { id: autorId } = await context.params;
  const url = new URL(req.url);
  const casoId = url.searchParams.get("casoId");

  if (!casoId) {
    return NextResponse.json({ error: "Falta casoId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar que el caller es participante del caso o admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const esAdmin = profile?.role === "admin";

  if (!esAdmin) {
    // RLS sobre casos: si el usuario es cliente o abogado del caso, lo verá
    const { data: caso } = await supabase
      .from("casos")
      .select("id")
      .eq("id", casoId)
      .single();

    if (!caso) {
      return NextResponse.json({ error: "Sin acceso al caso" }, { status: 403 });
    }
  }

  // Resolver autor con admin client (bypass RLS de profiles)
  const admin = createAdminClient();
  const { data: autor, error } = await admin
    .from("profiles")
    .select("nombre, apellido, role")
    .eq("id", autorId)
    .single();

  if (error || !autor) {
    return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    nombre: autor.nombre ?? "",
    apellido: autor.apellido ?? "",
    role: autor.role,
  });
}