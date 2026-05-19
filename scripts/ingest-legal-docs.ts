// scripts/ingest-legal-docs.ts
// Ejecutar con: npx ts-node scripts/ingest-legal-docs.ts
// Requiere: npm install pdf-parse @supabase/supabase-js dotenv

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;
const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 100;
const BATCH_DELAY_MS = 700;
const MAX_RETRIES = 3;

// ---------- Utilidades ----------

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeL2(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
}

function magnitud(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

// ---------- Chunking ----------

function chunkText(
  text: string,
  titulo: string
): { titulo: string; contenido: string }[] {
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks: { titulo: string; contenido: string }[] = [];
  let start = 0;
  let partNumber = 1;

  while (start < cleanText.length) {
    let end = start + CHUNK_SIZE;

    if (end < cleanText.length) {
      const nextParagraph = cleanText.indexOf("\n\n", end - 200);
      if (nextParagraph !== -1 && nextParagraph < end + 400) {
        end = nextParagraph;
      }
    }

    const chunk = cleanText.slice(start, end).trim();

    if (chunk.length > 100) {
      chunks.push({
        titulo: `${titulo} — Parte ${partNumber}`,
        contenido: chunk,
      });
      partNumber++;
    }

    if (end >= cleanText.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

// ---------- Embeddings ----------

async function getDocumentEmbedding(
  text: string,
  retries = MAX_RETRIES
): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada");

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMS,
      }),
    }
  );

  if (res.status === 429) {
    if (retries > 0) {
      const attemptNumber = MAX_RETRIES - retries + 1;
      const waitMs = attemptNumber * 5000;
      console.log(
        `\n   ⏳ Rate limit (429), reintento ${attemptNumber}/${MAX_RETRIES} en ${waitMs}ms...`
      );
      await sleep(waitMs);
      return getDocumentEmbedding(text, retries - 1);
    }
    throw new Error(`Rate limit excedido después de ${MAX_RETRIES} reintentos`);
  }

  if (!res.ok) {
    throw new Error(`Error embedding (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const rawEmbedding: number[] = data.embedding.values;

  if (rawEmbedding.length !== EMBEDDING_DIMS) {
    throw new Error(
      `Dimensión inesperada: esperaba ${EMBEDDING_DIMS}, recibí ${rawEmbedding.length}`
    );
  }

  return normalizeL2(rawEmbedding);
}

// ---------- Test pre-ingesta ----------

async function testEmbeddingPipeline() {
  console.log("🧪 Validando pipeline de embeddings...\n");

  const texto = "Las causales de divorcio en Chile están reguladas por la Ley 19.947.";

  // 1. Document embedding + normalización
  const docEmbedding = await getDocumentEmbedding(texto);
  const magDoc = magnitud(docEmbedding);
  console.log(`   dims: ${docEmbedding.length}`);
  console.log(`   magnitud post-normalización: ${magDoc.toFixed(6)} (debe ser ~1.0)`);

  if (Math.abs(magDoc - 1.0) > 0.01) {
    console.error("❌ Magnitud incorrecta — revisar normalizeL2");
    process.exit(1);
  }

  // 2. Query embedding del mismo texto
  const key = process.env.GEMINI_API_KEY!;
  const res = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: texto }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBEDDING_DIMS,
      }),
    }
  );
  const data = await res.json();
  const queryEmbedding = normalizeL2(data.embedding.values as number[]);
  const magQuery = magnitud(queryEmbedding);
  console.log(`   magnitud query normalizada: ${magQuery.toFixed(6)} (debe ser ~1.0)`);

  // 3. Similaridad coseno doc↔query (mismo texto → debe ser ~1.0)
  const sim = docEmbedding.reduce((s, v, i) => s + v * queryEmbedding[i], 0);
  console.log(`   similaridad doc↔query (mismo texto): ${sim.toFixed(6)} (debe ser >0.70)`);

  if (sim < 0.70) {
    console.error("❌ Similaridad baja — algo falla en el pipeline");
    process.exit(1);
  }

  console.log("✅ Pipeline OK — procediendo con ingesta\n");
}

// ---------- Ingesta ----------

async function ingestPdf(filePath: string, titulo: string) {
  console.log(`\n📄 Procesando: ${titulo}`);

  const buffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: 0,
  });

  const result = await parser.getText();
  const text: string = result.text;
  await parser.destroy();

  console.log(`   ${text.length} caracteres extraídos`);

  const chunks = chunkText(text, titulo);
  console.log(`   ${chunks.length} chunks generados`);

  const archivoBase = path.basename(filePath);
  const { error: deleteError } = await supabase
    .from("documentos_legales")
    .delete()
    .eq("metadata->>archivo", archivoBase);

  if (deleteError) {
    console.log(`   ⚠️  No se pudo limpiar previos: ${deleteError.message}`);
  } else {
    console.log(`   🗑️  Chunks previos de ${archivoBase} eliminados`);
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      if (i > 0) await sleep(BATCH_DELAY_MS);

      const embeddingText = `
      ${chunk.titulo}

      ${chunk.contenido}
      `;

      const embedding = await getDocumentEmbedding(embeddingText);

      // Validar magnitud de cada chunk antes de insertar
      const mag = magnitud(embedding);
      if (Math.abs(mag - 1.0) > 0.01) {
        console.error(`\n   ❌ Chunk ${i} tiene magnitud ${mag.toFixed(4)} — saltando`);
        errors++;
        continue;
      }

      const { error } = await supabase.from("documentos_legales").insert({
        titulo: chunk.titulo,
        contenido: chunk.contenido,
        embedding,
        metadata: {
          archivo: archivoBase,
          chunk_index: i,
          total_chunks: chunks.length,
        },
      });

      if (error) {
        console.error(`\n   ❌ Error insertando chunk ${i}: ${error.message}`);
        errors++;
      } else {
        inserted++;
        process.stdout.write(
          `\r   Progreso: ${inserted}/${chunks.length} chunks`
        );
      }
    } catch (err) {
      console.error(`\n   ❌ Error en chunk ${i}:`, err);
      errors++;
      await sleep(2000);
    }
  }

  console.log(`\n   ✅ ${inserted} chunks insertados, ${errors} errores`);
}

// ---------- Documentos a procesar ----------

const DOCUMENTOS = [
  {
    archivo: "scripts/legal-docs/codigo-civil.pdf",
    titulo: "Código Civil de Chile",
  },
  {
    archivo: "scripts/legal-docs/ley-19947-matrimonio-civil.pdf",
    titulo: "Ley 19.947 — Matrimonio Civil (Nueva Ley de Matrimonio Civil)",
  },
  {
    archivo: "scripts/legal-docs/codigo-del-trabajo.pdf",
    titulo: "Código del Trabajo de Chile",
  },
  {
    archivo: "scripts/legal-docs/codigo-procesal-penal.pdf",
    titulo: "Código Procesal Penal de Chile",
  },
];

// ---------- Main ----------

async function main() {
  console.log("🚀 Iniciando ingestión de documentos legales chilenos\n");
  console.log("Verificando configuración...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY no configurada en .env.local");
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL no configurada");
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada");
    process.exit(1);
  }

  console.log("✅ Variables de entorno OK");
  console.log(`📐 Modelo: ${EMBEDDING_MODEL} @ ${EMBEDDING_DIMS} dims`);
  console.log(`⏱️  Delay entre requests: ${BATCH_DELAY_MS}ms\n`);

  await testEmbeddingPipeline();

  const startTime = Date.now();

  for (const doc of DOCUMENTOS) {
    if (!fs.existsSync(doc.archivo)) {
      console.log(`⚠️  Archivo no encontrado, omitiendo: ${doc.archivo}`);
      continue;
    }
    await ingestPdf(doc.archivo, doc.titulo);
  }

  const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉 Ingestión completada en ${elapsedMin} min`);

  const { count } = await supabase
    .from("documentos_legales")
    .select("*", { count: "exact", head: true });

  console.log(`📊 Total de chunks en Supabase: ${count}`);
}

main().catch(console.error);