"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoCaso } from "@/lib/types/caso";

// Transiciones permitidas para el abogado asignado
const TRANSICIONES_ABOGADO: Record<EstadoCaso, EstadoCaso[]> = {
  pendiente: [],
  asignado: ["en_progreso"],
  en_progreso: ["cerrado"],
  cerrado: [],
};

export async function cambiarEstadoCaso(
  casoId: string,
  nuevoEstado: EstadoCaso,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  // Verificar que el caso existe y el usuario es el abogado asignado
  const { data: caso, error: fetchError } = await supabase
    .from("casos")
    .select("id, abogado_id, estado")
    .eq("id", casoId)
    .single();

  if (fetchError || !caso) {
    return { success: false, error: "Caso no encontrado" };
  }

  if (caso.abogado_id !== user.id) {
    return {
      success: false,
      error: "Solo el abogado asignado puede cambiar el estado",
    };
  }

  const estadoActual = caso.estado as EstadoCaso;
  const permitidas = TRANSICIONES_ABOGADO[estadoActual];

  if (!permitidas.includes(nuevoEstado)) {
    return {
      success: false,
      error: `No se puede pasar de "${estadoActual}" a "${nuevoEstado}"`,
    };
  }

  const { error: updateError } = await supabase
    .from("casos")
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq("id", casoId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/dashboard/abogado/casos/${casoId}`);
  revalidatePath("/dashboard/abogado");
  revalidatePath("/dashboard/cliente");
  revalidatePath(`/dashboard/cliente/casos/${casoId}`);
  return { success: true };
}