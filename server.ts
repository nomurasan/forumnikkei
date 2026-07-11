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
import { initializeApp, applicationDefault, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore, serverTimestamp, doc as fsDoc, setDoc as fsSetDoc, getDocs, collection } from "firebase-admin/firestore";
import { getAiProviderStatus, improveAnswer, generateStructuredResponse } from "./services/aiProvider";

dotenv.config({ path: ".env.local", quiet: true, override: false });
dotenv.config({ quiet: true, override: false });

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "respostas.json");
const ANALYSES_FILE = path.join(DATA_DIR, "report-cache.json");
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_RATE_LIMIT_MAX_REQUESTS = 10;
const aiRequestsByIp = new Map<string, number[]>();

type QuestionId = "principal_aprendizado" | "pratica_pretende_aplicar" | "recomendacao_estrategica_ren";

type CachedInsight = {
  questionId: QuestionId;
  pergunta: string;
  resumo: string;
  principaisTemas: string[];
  aplicacoesPraticas: string[];
  oportunidades: string[];
  quantidadeRespostasAnalisadas: number;
  status: "atualizado" | "desatualizado" | "processando" | "erro";
  updatedAt: string | null;
  modelo: string;
};

type ReportPayload = {
  indicadores: {
    totalRespostas: number;
    atividadeMaisValorizada: string;
    mediaProbabilidadeAplicacao: number;
    iniciativaMaisVotada: string;
  };
  graficos: {
    atividades: Array<{ nome: string; total: number }>;
    probabilidadeAplicacao: Array<{ nota: number; total: number }>;
    iniciativas: Array<{ nome: string; total: number }>;
  };
  insights: CachedInsight[];
  updatedAt: string | null;
};

type Submission = Record<string, any> & { id: string };

const QUESTION_CONFIGS: Record<QuestionId, {
  pergunta: string;
  fieldCandidates: string[];
  promptLabel: string;
  responseKey: "principaisTemas" | "aplicacoesPraticas" | "oportunidades";
}> = {
  principal_aprendizado: {
    pergunta: "Qual foi o principal aprendizado que você leva deste Fórum e como ele pode contribuir para o desenvolvimento da sua empresa ou organização?",
    fieldCandidates: ["principal_aprendizado_final", "principalAprendizado", "principal_aprendizado_original"],
    promptLabel: "principal aprendizado",
    responseKey: "principaisTemas"
  },
  pratica_pretende_aplicar: {
    pergunta: "Caso pretenda aplicar algum aprendizado, qual prática ou iniciativa você pretende implementar em sua empresa ou organização?",
    fieldCandidates: ["pratica_pretende_aplicar_final", "praticaPretendeAplicar", "pratica_pretende_aplicar_original"],
    promptLabel: "prática a aplicar",
    responseKey: "aplicacoesPraticas"
  },
  recomendacao_estrategica_ren: {
    pergunta: "Que tema ou iniciativa você gostaria de ver na programação da REN Brasil para apoiar o fortalecimento das empresas nikkeis?",
    fieldCandidates: ["recomendacao_estrategica_ren_final", "recomendacaoEstrategicaREN", "recomendacao_final", "recomendacao_estrategica_ren_original"],
    promptLabel: "recomendações para a REN Brasil",
    responseKey: "oportunidades"
  }
};

let adminDb: any = null;

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), "utf8");
  }
  if (!fs.existsSync(ANALYSES_FILE)) {
    fs.writeFileSync(ANALYSES_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function tryInitAdminDb() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  try {
    if (rawServiceAccount.trim()) {
      const serviceAccount = JSON.parse(rawServiceAccount);
      const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
      const appInstance = getApps().length
        ? getApp()
        : initializeApp({
            credential: cert(serviceAccount),
            projectId
          });
      adminDb = getFirestore(appInstance);
      console.log("Firebase Admin SDK inicializado com service account.");
      return;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const appInstance = getApps().length
        ? getApp()
        : initializeApp({ credential: applicationDefault() });
      adminDb = getFirestore(appInstance);
      console.log("Firebase Admin SDK inicializado com credenciais padrão.");
      return;
    }

    console.log("Firebase Admin SDK não configurado; usando cache local como fallback.");
  } catch (error) {
    adminDb = null;
    console.error("Erro ao inicializar Firebase Admin SDK:", error);
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function normalizeString(value: unknown): string {
  return String(value || "").trim();
}

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(normalizeString).filter(Boolean);
  const single = normalizeString(value);
  return single ? [single] : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function getStringCandidate(data: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeString(data[key]);
    if (value) return value;
  }
  return "";
}

function getArrayCandidate(data: Record<string, any>, keys: string[]): string[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return uniqueStrings(value.map(normalizeString));
    const normalized = normalizeArray(value);
    if (normalized.length) return uniqueStrings(normalized);
  }
  return [];
}

function normalizeSubmission(data: Record<string, any>, timestamps?: { createdAt?: string; updatedAt?: string }): Submission {
  const createdAt = timestamps?.createdAt || new Date().toISOString();
  const updatedAt = timestamps?.updatedAt || createdAt;
  const principalAprendizado = getStringCandidate(data, ["principal_aprendizado_final", "principalAprendizado", "principal_aprendizado_original"]);
  const praticaPretendeAplicar = getStringCandidate(data, ["pratica_pretende_aplicar_final", "praticaPretendeAplicar", "pratica_pretende_aplicar_original"]);
  const recomendacao = getStringCandidate(data, ["recomendacao_estrategica_ren_final", "recomendacaoEstrategicaREN", "recomendacao_final", "recomendacao_estrategica_ren_original"]);
  const initiatives = getArrayCandidate(data, ["iniciativaPrioritariaREN"]);

  return {
    ...data,
    id: normalizeString(data.id) || `res_${crypto.randomUUID()}`,
    participanteId: normalizeString(data.participanteId),
    eventoId: normalizeString(data.eventoId) || "forum_empresarial_nikkei_2026",
    atividadeMaiorValor: normalizeString(data.atividadeMaiorValor),
    principalAprendizado,
    principal_aprendizado_original: normalizeString(data.principal_aprendizado_original) || principalAprendizado,
    principal_aprendizado_final: normalizeString(data.principal_aprendizado_final) || principalAprendizado,
    principal_aprendizado_ia: Boolean(data.principal_aprendizado_ia),
    probabilidadeAplicacao: Number(data.probabilidadeAplicacao) || 0,
    praticaPretendeAplicar,
    pratica_pretende_aplicar_original: normalizeString(data.pratica_pretende_aplicar_original) || praticaPretendeAplicar,
    pratica_pretende_aplicar_final: normalizeString(data.pratica_pretende_aplicar_final) || praticaPretendeAplicar,
    pratica_pretende_aplicar_ia: Boolean(data.pratica_pretende_aplicar_ia),
    iniciativaPrioritariaREN: initiatives,
    recomendacaoEstrategicaREN: recomendacao,
    recomendacao_estrategica_ren_original: normalizeString(data.recomendacao_estrategica_ren_original) || recomendacao,
    recomendacao_estrategica_ren_final: normalizeString(data.recomendacao_estrategica_ren_final) || recomendacao,
    recomendacao_estrategica_ren_ia: Boolean(data.recomendacao_estrategica_ren_ia),
    recomendacao_original: normalizeString(data.recomendacao_original) || recomendacao,
    recomendacao_final: normalizeString(data.recomendacao_final) || recomendacao,
    recomendacao_ia: Boolean(data.recomendacao_ia),
    createdAtLocal: createdAt,
    updatedAtLocal: updatedAt,
    createdAt: data.createdAt || createdAt,
    updatedAt: data.updatedAt || updatedAt,
    origem: normalizeString(data.origem) || "app_web_direto_api",
    evento: normalizeString(data.evento) || "forum_empresarial_nikkei_2026"
  };
}

async function readSubmissions(): Promise<Submission[]> {
  if (adminDb) {
    try {
      const snapshot = await getDocs(collection(adminDb, "forum_nikkei_respostas"));
      return snapshot.docs.map((docSnap) => normalizeSubmission({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.error("Erro ao ler respostas do Firestore:", error);
    }
  }

  return readJsonFile<Submission[]>(SUBMISSIONS_FILE, []).map((item) => normalizeSubmission(item));
}

async function saveSubmission(submission: Submission) {
  const normalized = normalizeSubmission(submission, { createdAt: submission.createdAtLocal, updatedAt: submission.updatedAtLocal });
  const submissions = await readSubmissions();
  const next = [...submissions.filter((item) => item.id !== normalized.id), normalized];
  writeJsonFile(SUBMISSIONS_FILE, next);

  if (adminDb) {
    await fsSetDoc(fsDoc(adminDb, "forum_nikkei_respostas", normalized.id), {
      ...normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  return normalized;
}

function readLocalAnalyses(): Record<string, CachedInsight> {
  return readJsonFile<Record<string, CachedInsight>>(ANALYSES_FILE, {});
}

function writeLocalAnalyses(cache: Record<string, CachedInsight>) {
  writeJsonFile(ANALYSES_FILE, cache);
}

async function readAnalysesCache(): Promise<Record<string, CachedInsight>> {
  if (adminDb) {
    try {
      const snapshot = await getDocs(collection(adminDb, "forum_nikkei_analises"));
      const cache: Record<string, CachedInsight> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Partial<CachedInsight>;
        const questionId = String(data.questionId || docSnap.id) as QuestionId;
        cache[questionId] = {
          questionId,
          pergunta: normalizeString(data.pergunta),
          resumo: normalizeString(data.resumo),
          principaisTemas: uniqueStrings(Array.isArray(data.principaisTemas) ? data.principaisTemas.map(normalizeString) : []),
          aplicacoesPraticas: uniqueStrings(Array.isArray(data.aplicacoesPraticas) ? data.aplicacoesPraticas.map(normalizeString) : []),
          oportunidades: uniqueStrings(Array.isArray(data.oportunidades) ? data.oportunidades.map(normalizeString) : []),
          quantidadeRespostasAnalisadas: Number(data.quantidadeRespostasAnalisadas) || 0,
          status: (data.status as CachedInsight["status"]) || "desatualizado",
          updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
          modelo: normalizeString(data.modelo)
        };
      });
      return cache;
    } catch (error) {
      console.error("Erro ao ler análises do Firestore:", error);
    }
  }

  return readLocalAnalyses();
}

async function saveInsightCache(insight: CachedInsight) {
  const cache = await readAnalysesCache();
  cache[insight.questionId] = insight;
  writeLocalAnalyses(cache);

  if (adminDb) {
    await fsSetDoc(fsDoc(adminDb, "forum_nikkei_analises", insight.questionId), insight, { merge: true });
  }
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatListValue(value: unknown): string[] {
  return uniqueStrings(normalizeArray(value));
}

function truncate(text: string, limit = 260): string {
  const compact = normalizeString(text).replace(/\s+/g, " ");
  return compact.length > limit ? `${compact.slice(0, limit - 1).trimEnd()}…` : compact;
}

function buildPromptForQuestion(questionId: QuestionId, responses: string[]) {
  const config = QUESTION_CONFIGS[questionId];
  return `${REPORT_INSTRUCTIONS}

Pergunta analisada:
${config.pergunta}

Quantidade de respostas:
${responses.length}

Respostas:
${responses.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Formato obrigatório:
{
  "resumo": "Síntese dos principais insights.",
  "principaisTemas": ["Tema 1", "Tema 2"],
  "aplicacoesPraticas": ["Aplicação 1"],
  "oportunidades": ["Oportunidade 1"]
}`;
}

function parseJsonResponse(raw: string) {
  const text = normalizeString(raw);
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : text;
  return JSON.parse(jsonText);
}

function buildInsightFromParsed(questionId: QuestionId, parsed: any, quantidade: number): CachedInsight {
  const config = QUESTION_CONFIGS[questionId];
  const extract = (values: unknown): string[] => uniqueStrings(Array.isArray(values) ? values.map(normalizeString) : []);
  return {
    questionId,
    pergunta: config.pergunta,
    resumo: normalizeString(parsed?.resumo),
    principaisTemas: extract(parsed?.principaisTemas),
    aplicacoesPraticas: extract(parsed?.aplicacoesPraticas),
    oportunidades: extract(parsed?.oportunidades),
    quantidadeRespostasAnalisadas: quantidade,
    status: "atualizado",
    updatedAt: new Date().toISOString(),
    modelo: getAiProviderStatus().model || ""
  };
}

function buildPlaceholderInsight(questionId: QuestionId, quantidade: number): CachedInsight {
  return {
    questionId,
    pergunta: QUESTION_CONFIGS[questionId].pergunta,
    resumo: "Ainda não há respostas suficientes para gerar uma análise consolidada.",
    principaisTemas: [],
    aplicacoesPraticas: [],
    oportunidades: [],
    quantidadeRespostasAnalisadas: quantidade,
    status: "desatualizado",
    updatedAt: null,
    modelo: getAiProviderStatus().model || ""
  };
}
function getRelevantResponses(questionId: QuestionId, submissions: Submission[]): string[] {
  const config = QUESTION_CONFIGS[questionId];
  const responses = submissions
    .map((item) => getStringCandidate(item, config.fieldCandidates))
    .map((value) => truncate(value, 320))
    .filter(Boolean);
  return uniqueStrings(responses).slice(0, 60);
}

async function generateInsight(questionId: QuestionId, submissions: Submission[]): Promise<CachedInsight> {
  const relevantResponses = getRelevantResponses(questionId, submissions);
  const prompt = buildPromptForQuestion(questionId, relevantResponses);
  const raw = await generateStructuredResponse(prompt);
  const parsed = parseJsonResponse(raw);
  return buildInsightFromParsed(questionId, parsed, submissions.length);
}

async function ensureInsight(questionId: QuestionId, submissions: Submission[], cache: Record<string, CachedInsight>): Promise<CachedInsight> {
  const existing = cache[questionId];
  if (existing && existing.quantidadeRespostasAnalisadas === submissions.length && existing.status === "atualizado") {
    return existing;
  }

  if (submissions.length < 3) {
    return existing || buildPlaceholderInsight(questionId, submissions.length);
  }

  const insight = await generateInsight(questionId, submissions);
  await saveInsightCache(insight);
  return insight;
}

function aggregateReport(submissions: Submission[], insights: CachedInsight[]): ReportPayload {
  const totalRespostas = submissions.length;
  const activityCounts = new Map<string, number>();
  const initiativeCounts = new Map<string, number>();
  const probabilityCounts = new Map<number, number>([[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]);

  submissions.forEach((item) => {
    const activity = normalizeString(item.atividadeMaiorValor) || "Não informado";
    activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);

    const probability = Number(item.probabilidadeAplicacao) || 0;
    if (probabilityCounts.has(probability)) {
      probabilityCounts.set(probability, (probabilityCounts.get(probability) || 0) + 1);
    }

    const initiatives = formatListValue(item.iniciativaPrioritariaREN);
    if (initiatives.length) {
      initiatives.forEach((initiative) => {
        initiativeCounts.set(initiative, (initiativeCounts.get(initiative) || 0) + 1);
      });
    } else {
      initiativeCounts.set("Não informado", (initiativeCounts.get("Não informado") || 0) + 1);
    }
  });

  const activityEntries = Array.from(activityCounts.entries()).map(([nome, total]) => ({ nome, total }));
  const initiativeEntries = Array.from(initiativeCounts.entries()).map(([nome, total]) => ({ nome, total }));
  const probabilityEntries = Array.from(probabilityCounts.entries()).map(([nota, total]) => ({ nota, total }));
  const averageProbability = totalRespostas
    ? Number((submissions.reduce((acc, item) => acc + (Number(item.probabilidadeAplicacao) || 0), 0) / totalRespostas).toFixed(1))
    : 0;

  const topByCount = (entries: Array<{ nome: string; total: number }>) => {
    if (!entries.length) return "Sem dados";
    return entries.slice().sort((a, b) => b.total - a.total)[0]?.nome || "Sem dados";
  };

  const latestSubmission = submissions.slice().sort((a, b) => toMillis(b.updatedAt || b.createdAt || b.updatedAtLocal || b.createdAtLocal) - toMillis(a.updatedAt || a.createdAt || a.updatedAtLocal || a.createdAtLocal))[0];
  const latestTimestamp = latestSubmission
    ? new Date(toMillis(latestSubmission.updatedAt || latestSubmission.createdAt || latestSubmission.updatedAtLocal || latestSubmission.createdAtLocal)).toISOString()
    : new Date().toISOString();

  return {
    indicadores: {
      totalRespostas,
      atividadeMaisValorizada: topByCount(activityEntries),
      mediaProbabilidadeAplicacao: averageProbability,
      iniciativaMaisVotada: topByCount(initiativeEntries)
    },
    graficos: {
      atividades: activityEntries.sort((a, b) => b.total - a.total),
      probabilidadeAplicacao: probabilityEntries,
      iniciativas: initiativeEntries.sort((a, b) => b.total - a.total)
    },
    insights,
    updatedAt: latestTimestamp
  };
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));
ensureDataFiles();
tryInitAdminDb();

app.post("/api/ai/improve", async (req, res) => {
  const now = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const recentRequests = (aiRequestsByIp.get(clientIp) || []).filter((timestamp) => now - timestamp < AI_RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ message: "Limite de aprimoramentos atingido. Tente novamente em alguns instantes." });
  }
  recentRequests.push(now);
  aiRequestsByIp.set(clientIp, recentRequests);

  const question = normalizeString(req.body?.question);
  const answer = normalizeString(req.body?.answer);

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
    return res.status(503).json({ code: "AI_NOT_CONFIGURED", message: "O assistente de IA ainda não foi configurado no servidor." });
  }

  try {
    const improvedAnswer = await improveAnswer(question, answer);
    return res.json({ improvedAnswer });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    const code = /404|model|not found/i.test(errorMessage)
      ? "model_unavailable"
      : /timeout|abort/i.test(errorMessage)
        ? "timeout"
        : "provider_request_failed";
    console.error(`[AI] provider=${providerStatus.provider} model=${providerStatus.model} code=${code}`);
    return res.status(503).json({ code: "AI_PROVIDER_UNAVAILABLE", message: "Não foi possível aprimorar sua resposta. Tente novamente em alguns instantes." });
  }
});

app.post("/api/respostas", async (req, res) => {
  const data = req.body || {};
  const selectedInitiatives = normalizeArray(data.iniciativaPrioritariaREN);

  if (!normalizeString(data.atividadeMaiorValor) || !normalizeString(data.principalAprendizado) || !Number(data.probabilidadeAplicacao) || !normalizeString(data.praticaPretendeAplicar) || selectedInitiatives.length === 0 || !normalizeString(data.recomendacaoEstrategicaREN)) {
    return res.status(400).json({ success: false, message: "Por favor, responda todas as seis perguntas antes de enviar." });
  }

  try {
    const timestamp = new Date().toISOString();
    const submission = normalizeSubmission({ ...data, id: data.id || `res_${crypto.randomUUID()}` }, { createdAt: timestamp, updatedAt: timestamp });
    await saveSubmission(submission);
    return res.json({ success: true, message: "Resposta enviada com sucesso!", id: submission.id });
  } catch (error) {
    console.error("Erro ao gravar resposta:", error);
    return res.status(500).json({ success: false, message: "Não foi possível gravar a resposta no servidor. Tente novamente." });
  }
});

app.get("/api/report", async (_req, res) => {
  try {
    const submissions = await readSubmissions();
    const cache = await readAnalysesCache();
    const insights: CachedInsight[] = [];

    for (const questionId of Object.keys(QUESTION_CONFIGS) as QuestionId[]) {
      const insight = await ensureInsight(questionId, submissions, cache);
      insights.push({
        ...insight,
        principaisTemas: questionId === "principal_aprendizado" ? insight.principaisTemas : [],
        aplicacoesPraticas: questionId === "pratica_pretende_aplicar" ? insight.aplicacoesPraticas : [],
        oportunidades: questionId === "recomendacao_estrategica_ren" ? insight.oportunidades : []
      });
    }

    return res.json(aggregateReport(submissions, insights));
  } catch (error) {
    console.error("Erro ao montar relatório público:", error);
    return res.status(500).json({ message: "Não foi possível carregar os resultados neste momento." });
  }
});

app.post("/api/report/insights/generate", async (req, res) => {
  const questionId = normalizeString(req.body?.questionId) as QuestionId;
  if (!QUESTION_CONFIGS[questionId]) {
    return res.status(400).json({ message: "questionId inválido." });
  }

  try {
    const submissions = await readSubmissions();
    const insight = await ensureInsight(questionId, submissions, await readAnalysesCache());
    return res.json(insight);
  } catch (error) {
    console.error("Erro ao gerar insight:", error);
    return res.status(500).json({ message: "Não foi possível gerar o insight solicitado." });
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






