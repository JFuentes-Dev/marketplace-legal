import { createClient } from "@supabase/supabase-js";
import { getEmbedding, streamChat, ChatMessage } from "@/lib/gemini";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==================================================
// CONFIG
// ==================================================

const ENABLE_RAG =
  process.env.ENABLE_RAG === "true" ||
  process.env.enable_rag === "true";

console.log("🧠 ENABLE_RAG =", ENABLE_RAG);

// ==================================================
// SYSTEM PROMPTS
// ==================================================

const SYSTEM_PROMPT_RAG = `Eres un asistente legal especializado en derecho chileno.
Responde basándote en los documentos de contexto entregados y la legislación chilena vigente.

REGLAS:
- Cita siempre el artículo o ley que respalda tu respuesta.
- Si no tienes suficiente contexto, indícalo claramente.
- No reemplazas la asesoría de un abogado — indícalo cuando corresponda.
- Responde en español formal.
- Estructura: fundamento legal → explicación → recomendación.

Contexto legal disponible:
{CONTEXT}`;

const SYSTEM_PROMPT_GEMINI = `Eres un asistente legal especializado en derecho chileno.

REGLAS:
- Responde usando legislación chilena vigente y conocimiento jurídico general.
- Cita leyes y artículos cuando sea posible.
- Si no estás seguro de algo, indícalo claramente.
- No reemplazas la asesoría de un abogado.
- Responde en español formal.
- Estructura: fundamento legal → explicación → recomendación.`;

interface RequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: Request) {
  try {
    const { messages }: RequestBody = await request.json();

    if (!messages?.length) {
      return new Response("Se requieren mensajes", {
        status: 400,
      });
    }

    const lastUser = messages.findLast(
      (m) => m.role === "user"
    );

    if (!lastUser) {
      return new Response("Sin mensaje de usuario", {
        status: 400,
      });
    }

    console.log("\n==================================================");
    console.log("🔎 NUEVA CONSULTA");
    console.log("==================================================");
    console.log("Pregunta:", lastUser.content);
    console.log("RAG habilitado:", ENABLE_RAG);

    // ==================================================
    // VARIABLES BASE
    // ==================================================

    let docs: {
      id: string;
      titulo: string;
      contenido: string;
      similarity: number;
    }[] = [];

    let systemPrompt = SYSTEM_PROMPT_GEMINI;

    // ==================================================
    // MODO RAG
    // ==================================================

    if (ENABLE_RAG) {
      console.log("\n📚 MODO RAG ACTIVADO");

      try {
        // ==================================================
        // 1. GENERAR EMBEDDING
        // ==================================================

        const queryEmbedding = await getEmbedding(
          lastUser.content
        );

        console.log("\n🧠 EMBEDDING GENERADO");

        console.log({
          dims: queryEmbedding?.length,
          first5: queryEmbedding?.slice(0, 5),
        });

        // Validaciones
        if (!Array.isArray(queryEmbedding)) {
          throw new Error("Embedding NO es array");
        }

        if (queryEmbedding.length !== 768) {
          throw new Error(
            `Embedding inválido: ${queryEmbedding.length} dims`
          );
        }

        // ==================================================
        // 2. RETRIEVAL
        // ==================================================

        console.log("\n📚 EJECUTANDO buscar_documentos");

        const started = Date.now();

        const { data, error } = await supabase.rpc(
          "buscar_documentos",
          {
            query_embedding: queryEmbedding,
            match_count: 5,
          }
        );

        console.log(
          "RPC time:",
          Date.now() - started,
          "ms"
        );

        if (error) {
          console.error("\n❌ ERROR RPC");
          console.error(error);

          console.log(
            "\n⚠️ FALLBACK AUTOMÁTICO A GEMINI NORMAL"
          );
        } else {
          docs = data || [];

          console.log("✅ RPC EXITOSA");
          console.log("Cantidad docs:", docs.length);

          // ==================================================
          // 3. CONTEXTO
          // ==================================================

          const context =
            docs.length > 0
              ? docs
                  .map(
                    (d) =>
                      `[${d.titulo} — ${(d.similarity * 100).toFixed(
                        1
                      )}%]\n${d.contenido.slice(0, 800)}`
                  )
                  .join("\n\n---\n\n")
              : "No se encontraron documentos relevantes.";

          systemPrompt = SYSTEM_PROMPT_RAG.replace(
            "{CONTEXT}",
            context
          );

          console.log(
            "\n🧠 Contexto generado:",
            context.length,
            "chars"
          );
        }
      } catch (ragError) {
        console.error("\n❌ ERROR EN RAG");
        console.error(ragError);

        console.log(
          "\n⚠️ USANDO FALLBACK GEMINI SIN RAG"
        );
      }
    } else {
      console.log("\n🤖 MODO GEMINI SIMPLE (SIN RAG)");
    }

    // ==================================================
    // CONVERTIR MENSAJES
    // ==================================================

    const geminiMessages: ChatMessage[] = messages.map(
      (m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    // ==================================================
    // STREAM SSE
    // ==================================================

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Enviar fuentes SOLO si RAG devolvió docs
          if (docs.length > 0) {
            const sources = docs.map((d) => d.titulo);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "sources",
                  sources,
                })}\n\n`
              )
            );
          }

          // Stream Gemini
          for await (const chunk of streamChat(
            geminiMessages,
            systemPrompt
          )) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  content: chunk,
                })}\n\n`
              )
            );
          }

          controller.enqueue(
            encoder.encode("data: [DONE]\n\n")
          );
        } catch (err) {
          console.error("\n❌ ERROR STREAMING");
          console.error(err);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Error generando respuesta",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("\n❌ ERROR /api/chat");
    console.error(err);

    return new Response(
      JSON.stringify({
        error: "Error interno",
        details:
          err instanceof Error
            ? err.message
            : String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}