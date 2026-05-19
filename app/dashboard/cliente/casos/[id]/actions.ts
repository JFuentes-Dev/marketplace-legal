// app/dashboard/cliente/casos/[id]/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Constantes upload ────────────────────────────────────────

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const TIPOS_PERMITIDOS: Record<string, string> = {
  'application/pdf':                                                           'PDF',
  'application/msword':                                                        'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':  'Word',
  'application/vnd.ms-excel':                                                  'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':        'Excel',
  'image/jpeg':                                                                'Imagen',
  'image/png':                                                                 'Imagen',
  'image/webp':                                                                'Imagen',
}

// ─── Upload documento ─────────────────────────────────────────

export async function uploadDocumento(casoId: string, formData: FormData) {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // 2. Verificar que el usuario pertenece al caso (cliente O abogado)
  const { data: caso } = await supabase
    .from('casos')
    .select('id, cliente_id, abogado_id, estado')
    .eq('id', casoId)
    .or(`cliente_id.eq.${user.id},abogado_id.eq.${user.id}`)
    .single()

  if (!caso) throw new Error('No tienes acceso a este caso')
  if (caso.estado === 'cerrado') throw new Error('El caso está cerrado')

  // 3. Validar archivo
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No se adjuntó ningún archivo')
  if (file.size > MAX_SIZE_BYTES) throw new Error('El archivo supera el límite de 10 MB')
  if (!TIPOS_PERMITIDOS[file.type]) throw new Error('Tipo de archivo no permitido')

  // 4. Subir a Storage con admin client
  const adminClient = createAdminClient()
  const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `casos/${casoId}/${Date.now()}_${nombreLimpio}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('documentos')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw new Error(`Error al subir el archivo: ${uploadError.message}`)

  // 5. Obtener URL pública
  const { data: { publicUrl } } = adminClient.storage
    .from('documentos')
    .getPublicUrl(storagePath)

  // 6. Registrar en caso_documentos usando adminClient
  // Usamos admin porque ya validamos el acceso manualmente arriba (paso 2).
  // La política RLS de INSERT solo cubre al abogado — esto evita
  // agregar una nueva migración para el caso del cliente.
  const { error: insertError } = await adminClient
    .from('caso_documentos')
    .insert({
      caso_id:     casoId,
      nombre:      file.name,
      tipo:        TIPOS_PERMITIDOS[file.type],
      url:         publicUrl,
      uploaded_by: user.id,
    })

  if (insertError) throw new Error(`Error al registrar el documento: ${insertError.message}`)

  revalidatePath(`/dashboard/cliente/casos/${casoId}`)
}

// ─── Crear / actualizar review ────────────────────────────────

export async function crearReview({
  casoId,
  abogadoId,
  puntuacion,
  comentario,
}: {
  casoId: string
  abogadoId: string
  puntuacion: number
  comentario: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('reviews').upsert(
    {
      caso_id:    casoId,
      cliente_id: user.id,
      abogado_id: abogadoId,
      puntuacion,
      comentario: comentario.trim() || null,
    },
    { onConflict: 'caso_id,cliente_id' }
  )

  if (error) return { error: 'No se pudo guardar la calificación' }

  revalidatePath(`/dashboard/cliente/casos/${casoId}`)
  revalidatePath(`/abogados/${abogadoId}`)
  return { ok: true }
}