#!/usr/bin/env npx ts-node --project tsconfig.scripts.json
/**
 * test-chat.ts — Prueba el endpoint /api/chat con SSE streaming
 * Uso: npm run test:chat
 *   o: npx ts-node --project tsconfig.scripts.json scripts/test-chat.ts
 */

import * as https from "https";
import * as http from "http";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PREGUNTAS_DEFAULT = [
  "¿Cuáles son las causales de divorcio en Chile según la Ley 19.947?",
  "¿Qué es la separación de bienes y cómo se solicita?",
  "¿Cuántos artículos tiene el Código Civil chileno?",
];

// ── Colores ANSI ──────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg: string) { process.stdout.write(msg); }
function logln(msg = "") { console.log(msg); }

function parseSSELine(line: string): { type: string; [k: string]: unknown } | null {
  if (!line.startsWith("data: ")) return null;
  const raw = line.slice(6).trim();
  if (raw === "[DONE]") return { type: "done" };
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Core: llamada al endpoint ─────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }

async function chatStream(messages: Message[]): Promise<{
  respuesta: string;
  fuentes: string[];
  ms: number;
}> {
  const url = new URL("/api/chat", BASE_URL);
  const body = JSON.stringify({ messages });

  const lib = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errBody = "";
          res.on("data", (d: Buffer) => { errBody += d.toString(); });
          res.on("end", () =>
            reject(new Error(`HTTP ${res.statusCode}: ${errBody.trim()}`))
          );
          return;
        }

        let respuesta = "";
        const fuentes: string[] = [];
        let buffer = "";
        const start = Date.now();

        res.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const event = parseSSELine(line.trim());
            if (!event) continue;

            if (event.type === "sources") {
              fuentes.push(...(event.sources as string[]));
            } else if (event.type === "text") {
              const text = event.content as string;
              respuesta += text;
              log(`${c.reset}${text}`);
            } else if (event.type === "error") {
              reject(new Error(event.message as string));
            } else if (event.type === "done") {
              resolve({ respuesta, fuentes, ms: Date.now() - start });
            }
          }
        });

        res.on("end", () => {
          // Por si [DONE] no llegó (stream cortado)
          resolve({ respuesta, fuentes, ms: Date.now() - start });
        });

        res.on("error", reject);
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Runner ────────────────────────────────────────────────────────────────────
async function runPreguntas(preguntas: string[]) {
  const historial: Message[] = [];

  for (let i = 0; i < preguntas.length; i++) {
    const pregunta = preguntas[i];

    logln(`\n${c.bold}${c.cyan}━━━ Pregunta ${i + 1}/${preguntas.length} ━━━${c.reset}`);
    logln(`${c.bold}${c.yellow}▶ ${pregunta}${c.reset}\n`);

    historial.push({ role: "user", content: pregunta });

    try {
      const { respuesta, fuentes, ms } = await chatStream(historial);

      logln(`\n\n${c.dim}─────────────────────────────────${c.reset}`);

      if (fuentes.length > 0) {
        logln(`${c.green}${c.bold}📚 Fuentes RAG:${c.reset}`);
        fuentes.forEach((f) => logln(`  ${c.green}• ${f}${c.reset}`));
      } else {
        logln(`${c.yellow}⚠️  Sin fuentes RAG recuperadas${c.reset}`);
      }

      logln(`${c.gray}⏱  ${ms}ms${c.reset}`);

      historial.push({ role: "assistant", content: respuesta });

    } catch (err) {
      logln(`\n${c.red}✖ Error: ${(err as Error).message}${c.reset}`);
      process.exit(1);
    }
  }

  logln(`\n${c.bold}${c.magenta}✅ Test completado — ${preguntas.length} pregunta(s)${c.reset}\n`);
}

// ── Modo interactivo ──────────────────────────────────────────────────────────
async function modoInteractivo() {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const historial: Message[] = [];

  logln(`${c.bold}${c.cyan}🤖 Chat legal interactivo — escribe "salir" para terminar${c.reset}`);
  logln(`${c.dim}Conectado a: ${BASE_URL}${c.reset}\n`);

  const prompt = () => {
    rl.question(`${c.bold}${c.yellow}Tú: ${c.reset}`, async (input) => {
      const pregunta = input.trim();
      if (!pregunta) return prompt();
      if (pregunta.toLowerCase() === "salir") {
        logln(`\n${c.gray}Adiós.${c.reset}\n`);
        rl.close();
        return;
      }

      historial.push({ role: "user", content: pregunta });
      log(`\n${c.bold}${c.cyan}Agente: ${c.reset}`);

      try {
        const { fuentes, ms } = await chatStream(historial);
        logln(`\n`);
        if (fuentes.length > 0) {
          logln(`${c.green}${c.dim}📚 ${fuentes.slice(0, 3).join(" · ")}${c.reset}`);
        }
        logln(`${c.gray}⏱  ${ms}ms${c.reset}\n`);
        historial.push({
          role: "assistant",
          content: historial[historial.length - 1]?.content ?? "",
        });
      } catch (err) {
        logln(`\n${c.red}✖ Error: ${(err as Error).message}${c.reset}\n`);
      }

      prompt();
    });
  };

  prompt();
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  logln(`${c.bold}${c.magenta}🏛  Legal Agent Test${c.reset} ${c.dim}→ ${BASE_URL}${c.reset}\n`);

  if (args.includes("--interactive") || args.includes("-i")) {
    await modoInteractivo();
  } else {
    // Preguntas custom vía args o defaults
    const preguntas = args.filter((a) => !a.startsWith("-")).length > 0
      ? args.filter((a) => !a.startsWith("-"))
      : PREGUNTAS_DEFAULT;

    await runPreguntas(preguntas);
  }
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal: ${err.message}${c.reset}`);
  process.exit(1);
});