// lib/supabase/storage.ts
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'adjuntos-mensajes'

export async function subirAdjunto(file: File, casoId: string): Promise<{
  url: string
  nombre: string
  tipo: string
} | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${casoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })

  if (error) {
    console.error('Error subiendo adjunto:', error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  // Como el bucket es privado, usamos signed URL
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 días

  return {
    url: signed?.signedUrl ?? data.publicUrl,
    nombre: file.name,
    tipo: file.type,
  }
}