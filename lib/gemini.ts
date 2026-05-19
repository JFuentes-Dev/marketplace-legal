const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada en .env.local");
  return key;
}

function normalizeL2(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
}

async function embedContent(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const key = getApiKey();
  const res = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMS,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Error embedding (${taskType}): ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.embedding.values as number[];

  if (raw.length !== EMBEDDING_DIMS) {
    throw new Error(
      `Dimensión inesperada: esperaba ${EMBEDDING_DIMS}, recibí ${raw.length}`
    );
  }

  return normalizeL2(raw);
}

export async function getEmbedding(text: string): Promise<number[]> {
  return embedContent(text, "RETRIEVAL_QUERY");
}

export async function getDocumentEmbedding(text: string): Promise<number[]> {
  return embedContent(text, "RETRIEVAL_DOCUMENT");
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function* streamChat(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  const key = getApiKey();
  const res = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.5-flash:streamGenerateContent?key=${key}&alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Error Gemini chat: ${await res.text()}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // chunk parcial, ignorar
      }
    }
  }
}