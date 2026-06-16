// app/api/casos/anonimo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarCodigoSeguimiento } from '@/lib/resend'
import { randomBytes } from 'crypto'

const AREAS_LEGALES = [
  'Derecho de Familia', 'Derecho Laboral', 'Derecho Civil', 'Derecho Penal',
  'Derecho Comercial', 'Derecho Inmobiliario', 'Derecho Tributario', 'Otro',
]

// ─── Mismo bucket y mapeo de tipos que usa actions.ts ────────────────────────
const BUCKET = 'documentos'

const TIPO_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'image/jpeg': 'Imagen',
  'image/jpg':  'Imagen',
  'image/png':  'Imagen',
  'image/webp': 'Imagen',
}

function tipoLabel(mimeType: string): string {
  return TIPO_LABEL[mimeType] ?? 'Archivo'
}

// ─── Clasificar con Gemini ────────────────────────────────────────────────────
async function clasificarCaso(descripcion: string): Promise<{ area: string; titulo: string }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { area: 'Otro', titulo: descripcion.trim().slice(0, 60) || 'Consulta legal' }
  try {
    const prompt = `Eres un asistente legal chileno. Analiza esta descripción y responde SOLO con JSON válido sin markdown.
Descripción: "${descripcion.slice(0, 800)}"
Formato: {"area":"<una de: ${AREAS_LEGALES.join(' | ')}>","titulo":"<título conciso, máx 60 caracteres>"}`
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 150 } }) }
    )
    if (!res.ok) throw new Error('Gemini error')
    const data = await res.json()
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    return {
      area:   AREAS_LEGALES.includes(parsed.area) ? parsed.area : 'Otro',
      titulo: (parsed.titulo as string)?.slice(0, 80) || 'Consulta legal',
    }
  } catch {
    return { area: 'Otro', titulo: descripcion.trim().split(/[.!?]/)[0]?.slice(0, 60) || 'Consulta legal' }
  }
}

// ─── Subir archivo al bucket correcto ────────────────────────────────────────
async function subirArchivo(
  admin: ReturnType<typeof createAdminClient>,
  file: File,
  casoId: string
): Promise<{ url: string; nombre: string; tipo: string } | null> {
  try {
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath  = `casos/${casoId}/${Date.now()}_${nombreLimpio}`

    const buffer = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error(`[anonimo] ✗ Upload "${file.name}":`, uploadError.message)
      return null
    }

    // Mismo método que actions.ts — bucket documentos es público
    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    console.log(`[anonimo] ✓ Subido: ${file.name}`)
    return { url: publicUrl, nombre: file.name, tipo: tipoLabel(file.type) }
  } catch (e) {
    console.error(`[anonimo] ✗ Excepción "${file.name}":`, e)
    return null
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData()
    const nombre      = (formData.get('nombre')      as string)?.trim()
    const email       = (formData.get('email')       as string)?.trim()
    const telefono    = (formData.get('telefono')    as string)?.trim() || null
    const descripcion = (formData.get('descripcion') as string)?.trim()
    const archivos    = formData.getAll('archivos') as File[]

    if (!nombre || !email || !descripcion)
      return NextResponse.json({ error: 'Nombre, email y descripción son obligatorios' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    if (descripcion.length < 30)
      return NextResponse.json({ error: 'Descripción demasiado corta' }, { status: 400 })

    const codigo = 'ML-' + randomBytes(3).toString('hex').toUpperCase()
    const { area, titulo } = await clasificarCaso(descripcion)

    const admin = createAdminClient()

    // Crear caso anónimo
    const { data: caso, error: casoError } = await admin
      .from('casos')
      .insert({
        cliente_id:         null,
        titulo,
        descripcion,
        area_legal:         area,
        estado:             'pendiente',
        nombre_contacto:    nombre,
        email_contacto:     email,
        telefono_contacto:  telefono,
        codigo_seguimiento: codigo,
      })
      .select('id')
      .single()

    if (casoError || !caso) {
      console.error('[anonimo] Error creando caso:', casoError)
      return NextResponse.json({ error: 'No se pudo crear el caso' }, { status: 500 })
    }

    console.log(`[anonimo] Caso creado: ${caso.id} — "${titulo}"`)

    // Subir documentos
    const archivosValidos = archivos.filter(f => f instanceof File && f.size > 0 && f.name !== 'undefined')
    console.log(`[anonimo] Archivos recibidos: ${archivosValidos.length}`)

    const docsSubidos: { url: string; nombre: string; tipo: string }[] = []
    for (const archivo of archivosValidos.slice(0, 5)) {
      const doc = await subirArchivo(admin, archivo, caso.id)
      if (doc) docsSubidos.push(doc)
    }

    // Insertar en caso_documentos
    // Columna: uploaded_by (no subido_por) — debe ser nullable para casos anónimos
    if (docsSubidos.length > 0) {
      const { error: docError } = await admin.from('caso_documentos').insert(
        docsSubidos.map(d => ({
          caso_id:     caso.id,
          nombre:      d.nombre,
          tipo:        d.tipo,
          url:         d.url,
          uploaded_by: null,   // ← null para casos anónimos (requiere columna nullable)
        }))
      )
      if (docError) {
        console.error('[anonimo] Error en caso_documentos:', docError.message)
      }
    }

    console.log(`[anonimo] Docs guardados: ${docsSubidos.length}/${archivosValidos.length}`)

    await enviarCodigoSeguimiento({
      email, nombre, tituloCaso: titulo, areaCaso: area,
      codigo, docsCount: docsSubidos.length,
    }).catch(e => console.error('[anonimo] Email fallido:', e))

    return NextResponse.json({ ok: true, codigo, titulo, area, docsSubidos: docsSubidos.length })
  } catch (e) {
    console.error('[anonimo] Error general:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}