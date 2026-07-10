/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { initializeApp as initFirebaseApp } from "firebase/app";
import {
  getFirestore as initFirestore,
  doc as fsDoc,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { getAiProviderStatus, improveAnswer } from "./services/aiProvider";

// O Vite carrega .env.local apenas para o frontend; o servidor Node precisa
// carregá-lo explicitamente. Variáveis injetadas pelo Easypanel têm prioridade.
dotenv.config({ path: ".env.local", quiet: true, override: false });
dotenv.config({ quiet: true, override: false });

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "respostas.json");
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_RATE_LIMIT_MAX_REQUESTS = 10;
const aiRequestsByIp = new Map<string, number[]>();

let dbFirestore: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initFirebaseApp(config);
    dbFirestore = initFirestore(fbApp, config.firestoreDatabaseId || "(default)");
    console.log("Firebase inicializado no servidor com sucesso.");
  }
} catch (err) {
  console.error("Erro ao inicializar Firebase no servidor:", err);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));

app.post("/api/ai/improve", async (req, res) => {
  const now = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const recentRequests = (aiRequestsByIp.get(clientIp) || []).filter((timestamp) => now - timestamp < AI_RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ message: "Limite de aprimoramentos atingido. Tente novamente em alguns instantes." });
  }
  recentRequests.push(now);
  aiRequestsByIp.set(clientIp, recentRequests);

  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const answer = typeof req.body?.answer === "string" ? req.body.answer.trim() : "";

  if (!question || !answer) {
    return res.status(400).json({ message: "Pergunta e resposta são obrigatórias." });
  }
  if (answer.length < 10 || answer.length > 2_000) {
    return res.status(400).json({ message: "A resposta deve ter entre 10 e 2.000 caracteres." });
  }
  if (question.length > 1_000) {
    return res.status(400).json({ message: "Pergunta inválida." });
  }

  const providerStatus = getAiProviderStatus();
  if (!providerStatus.configured) {
    console.error(`[AI] provider=${providerStatus.provider} code=not_configured`);
    return res.status(503).json({
      code: "AI_NOT_CONFIGURED",
      message: "O assistente de IA ainda não foi configurado no servidor."
    });
  }

  try {
    const improvedAnswer = await improveAnswer(question, answer);
    return res.json({ improvedAnswer });
  } catch (error) {
    // Não registrar prompt, resposta, chave ou detalhes internos do provedor.
    const errorMessage = error instanceof Error ? error.message : "";
    const code = /404|model|not found/i.test(errorMessage)
      ? "model_unavailable"
      : /timeout|abort/i.test(errorMessage)
        ? "timeout"
        : "provider_request_failed";
    console.error(`[AI] provider=${providerStatus.provider} model=${providerStatus.model} code=${code}`);
    return res.status(503).json({
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "Não foi possível aprimorar sua resposta. Tente novamente em alguns instantes."
    });
  }
});

function readSubmissions(): any[] {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Erro ao ler respostas:", error);
    return [];
  }
}

function writeSubmissions(submissions: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Erro ao salvar respostas:", error);
    return false;
  }
}

function normalizeSubmission(data: any, createdAt?: string, updatedAt?: string) {
  const timestamp = createdAt || new Date().toISOString();
  const updatedTimestamp = updatedAt || new Date().toISOString();

  return {
    ...data,
    participanteId: data.participanteId || "",
    eventoId: data.eventoId || "forum_empresarial_nikkei_2026",
    atividadeMaiorValor: data.atividadeMaiorValor || "",
    principalAprendizado: data.principalAprendizado || "",
    probabilidadeAplicacao: Number(data.probabilidadeAplicacao) || 0,
    praticaPretendeAplicar: data.praticaPretendeAplicar || "",
    iniciativaPrioritariaREN: Array.isArray(data.iniciativaPrioritariaREN) ? data.iniciativaPrioritariaREN : data.iniciativaPrioritariaREN ? [data.iniciativaPrioritariaREN] : [],
    recomendacaoEstrategicaREN: data.recomendacaoEstrategicaREN || "",
    createdAt: timestamp,
    updatedAt: updatedTimestamp,
    origem: data.origem || "app_google_studio",
    evento: data.evento || "forum_empresarial_nikkei_2026"
  };
}

function convertToCSV(data: any[]): string {
  if (!data.length) return "";

  const headers = [
    "id",
    "participanteId",
    "eventoId",
    "atividadeMaiorValor",
    "principalAprendizado",
    "principal_aprendizado_original",
    "principal_aprendizado_final",
    "principal_aprendizado_ia",
    "probabilidadeAplicacao",
    "praticaPretendeAplicar",
    "pratica_pretende_aplicar_original",
    "pratica_pretende_aplicar_final",
    "pratica_pretende_aplicar_ia",
    "iniciativaPrioritariaREN",
    "recomendacaoEstrategicaREN",
    "recomendacao_original",
    "recomendacao_final",
    "recomendacao_ia",
    "createdAt",
    "updatedAt",
    "origem",
    "evento"
  ];

  const escapeCSVValue = (val: any) => {
    if (val === null || val === undefined) return "";
    const strVal = String(Array.isArray(val) ? val.join("; ") : val).replace(/"/g, '""');
    return /[;,\n\r"]/.test(strVal) ? `"${strVal}"` : strVal;
  };

  return ["\uFEFF" + headers.join(";"), ...data.map((row) => headers.map((header) => escapeCSVValue(row[header])).join(";"))].join("\r\n");
}

app.get("/api/respostas", (_req, res) => {
  const submissions = readSubmissions();
  res.json({ success: true, count: submissions.length, data: submissions });
});

app.put("/api/respostas/:id", async (req, res) => {
  const id = req.params.id;
  const submissions = readSubmissions();
  const index = submissions.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Resposta não encontrada" });

  const updated = normalizeSubmission({ ...submissions[index], ...req.body }, new Date().toISOString(), new Date().toISOString());
  submissions[index] = updated;
  writeSubmissions(submissions);

  if (dbFirestore) {
    const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
    await fsSetDoc(docRef, { ...updated, updatedAt: serverTimestamp() }, { merge: true });
  }

  res.json({ success: true, message: "Resposta atualizada com sucesso!", data: updated });
});

app.delete("/api/respostas/:id", async (req, res) => {
  const id = req.params.id;
  const submissions = readSubmissions();
  const index = submissions.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Resposta não encontrada" });

  submissions.splice(index, 1);
  writeSubmissions(submissions);

  if (dbFirestore) {
    const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
    await fsDeleteDoc(docRef);
  }

  res.json({ success: true, message: "Resposta excluída com sucesso!" });
});

app.get("/api/export-csv", (_req, res) => {
  const submissions = readSubmissions();
  const csv = convertToCSV(submissions);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=forum_nikkei_respostas_${Date.now()}.csv`);
  res.status(200).send(csv);
});

app.post("/api/respostas", async (req, res) => {
  const data = req.body || {};

  const selectedInitiatives = Array.isArray(data.iniciativaPrioritariaREN) ? data.iniciativaPrioritariaREN : data.iniciativaPrioritariaREN ? [data.iniciativaPrioritariaREN] : [];

  if (!data.atividadeMaiorValor || !data.principalAprendizado || !data.probabilidadeAplicacao || !data.praticaPretendeAplicar || selectedInitiatives.length === 0 || !data.recomendacaoEstrategicaREN) {
    return res.status(400).json({ success: false, message: "Por favor, responda todas as seis perguntas antes de enviar." });
  }

  const submissions = readSubmissions();
  const timestamp = new Date().toISOString();
  const newSubmission = normalizeSubmission({ ...data, id: `res_${crypto.randomUUID()}` }, timestamp, timestamp);
  try {
    if (dbFirestore) {
      const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", newSubmission.id);
      await fsSetDoc(docRef, { ...newSubmission, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } else {
      console.warn("Firebase não inicializado; salvando apenas no arquivo local.");
    }

    submissions.push(newSubmission);
    const savedLocally = writeSubmissions(submissions);
    if (!savedLocally) {
      console.warn("Resposta gravada no Firebase, mas não foi possível atualizar o arquivo local.");
    }

    res.json({ success: true, message: "Resposta enviada com sucesso!", id: newSubmission.id });
  } catch (error) {
    console.error("Erro ao gravar resposta no Firebase:", error);
    res.status(500).json({ success: false, message: "Não foi possível gravar a resposta no Firebase. Tente novamente." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => console.error("Falha ao iniciar servidor:", err));
