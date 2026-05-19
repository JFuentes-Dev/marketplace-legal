export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

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

    const { data: caso } = await supabase
      .from('casos')
      .select('id')
      .eq('id', casoId)
      .or(`cliente_id.eq.${user.id},abogado_id.eq.${user.id}`)
      .single()

    if (!caso) {
      return Response.json(
        { error: 'Sin acceso' },
        { status: 403 }
      )
    }

    const { data: memoria } = await supabase
      .from('case_ai_summaries')
      .select('*')
      .eq('caso_id', casoId)
      .maybeSingle()

    if (!memoria) {
      return Response.json(
        {
          error:
            'No existe memoria IA. Genera el resumen primero.',
        },
        { status: 404 }
      )
    }

    const prompt = `
Usa la memoria estructurada del caso para explicar al cliente su situación actual.

RESUMEN:
${memoria.resumen_actual}

ESTADO PROCESAL:
${memoria.estado_procesal}

PRÓXIMOS PASOS:
${memoria.proximos_pasos}

RIESGOS:
${memoria.riesgos}

TIMELINE:
${memoria.timeline_resumido}

Reglas:
- Ve directo al contenido.
- NO escribas títulos.
- NO escribas saludos.
- NO escribas introducciones.
- NO uses markdown.
- SOLO texto plano.
- Explica de forma clara y humana.
- Puedes usar varios párrafos.
- No inventes información.
`

    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return Response.json(
        { error: 'GEMINI_API_KEY faltante' },
        { status: 500 }
      )
    }

    const geminiRes = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.5-flash:streamGenerateContent?key=${key}&alt=sse`,
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
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()

      return Response.json(
        { error: err },
        { status: 500 }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body?.getReader()

        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()

        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, {
            stream: true,
          })

          const lines = buffer.split('\n')

          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()

            if (!trimmed.startsWith('data: ')) {
              continue
            }

            const data = trimmed.replace(/^data:\s*/, '')

            if (!data || data === '[DONE]') {
              continue
            }

            try {
              const json = JSON.parse(data)

              const parts =
                json.candidates?.[0]?.content?.parts ?? []

              const text = parts
                .map(
                  (
                    part: {
                      text?: string
                    }
                  ) => part.text ?? ''
                )
                .join('')

              if (!text) continue

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'text',
                    content: text,
                  })}\n\n`
                )
              )
            } catch (error) {
              console.error(error)
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}