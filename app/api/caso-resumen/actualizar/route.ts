export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const ESTADOS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de asignación',
  asignado: 'Asignado a abogado',
  en_progreso: 'En progreso',
  cerrado: 'Cerrado',
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { casoId } = await req.json()

    if (!casoId) {
      return Response.json(
        { error: 'casoId requerido' },
        { status: 400 }
      )
    }

    const { data: caso } = await supabase
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .or(`cliente_id.eq.${user.id},abogado_id.eq.${user.id}`)
      .single()

    if (!caso) {
      return Response.json(
        { error: 'Sin acceso al caso' },
        { status: 403 }
      )
    }

    const [
      { data: eventos },
      { data: mensajes },
      { data: documentos },
      { data: resumenPrevio },
    ] = await Promise.all([
      supabase
        .from('caso_eventos')
        .select('*')
        .eq('caso_id', casoId)
        .order('fecha', { ascending: true }),

      supabase
        .from('mensajes')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: true })
        .limit(50),

      supabase
        .from('caso_documentos')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: true }),

      supabase
        .from('case_ai_summaries')
        .select('*')
        .eq('caso_id', casoId)
        .maybeSingle(),
    ])

    const timeline = [
      `Caso creado el ${formatFecha(caso.created_at)}`,

      ...(eventos ?? []).map(evento =>
        `${formatFecha(evento.fecha)} | EVENTO | ${evento.titulo}${evento.descripcion ? ` — ${evento.descripcion}` : ''}`
      ),

      ...(mensajes ?? []).map(mensaje =>
        `${formatFecha(mensaje.created_at)} | MENSAJE | ${mensaje.contenido}`
      ),

      ...(documentos ?? []).map(doc =>
        `${formatFecha(doc.created_at)} | DOCUMENTO | ${doc.nombre}`
      ),
    ].join('\n')

    const prompt = `
Analiza toda la información cronológica del caso y genera una memoria persistente resumida.

CASO:
${caso.titulo}

ÁREA LEGAL:
${caso.area_legal}

ESTADO:
${ESTADOS_LABEL[caso.estado] ?? caso.estado}

DESCRIPCIÓN:
${caso.descripcion}

RESUMEN PREVIO:
${resumenPrevio?.resumen_actual ?? 'No existe resumen previo.'}

TIMELINE:
${timeline}

Debes responder EXCLUSIVAMENTE en JSON válido.

Formato obligatorio:

{
  "resumen_actual": "...",
  "timeline_resumido": "...",
  "estado_procesal": "...",
  "proximos_pasos": "...",
  "riesgos": "..."
}

Reglas:
- No uses markdown.
- No uses bloques de código.
- No expliques el JSON.
- Mantén coherencia con el resumen previo.
- Actualiza solo la información nueva.
- Usa lenguaje jurídico simplificado.
- No inventes datos.
`

    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return Response.json(
        { error: 'GEMINI_API_KEY faltante' },
        { status: 500 }
      )
    }

    const geminiRes = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()

      return Response.json(
        { error: errorText },
        { status: 500 }
      )
    }

    const json = await geminiRes.json()

    const text =
      json.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return Response.json(
        { error: 'Gemini no devolvió contenido' },
        { status: 500 }
      )
    }

    let parsed: {
      resumen_actual: string
      timeline_resumido: string
      estado_procesal: string
      proximos_pasos: string
      riesgos: string
    }

    try {
      parsed = JSON.parse(text)
    } catch {
      return Response.json(
        {
          error: 'Gemini devolvió JSON inválido',
          raw: text,
        },
        { status: 500 }
      )
    }

    const { error: upsertError } = await supabase
      .from('case_ai_summaries')
      .upsert({
        caso_id: casoId,
        resumen_actual: parsed.resumen_actual,
        timeline_resumido:
          parsed.timeline_resumido,
        estado_procesal:
          parsed.estado_procesal,
        proximos_pasos:
          parsed.proximos_pasos,
        riesgos: parsed.riesgos,
      })

    if (upsertError) {
      return Response.json(
        { error: upsertError.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      summary: parsed,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}