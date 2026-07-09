/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp as initFirebaseApp } from "firebase/app";
import {
  getFirestore as initFirestore,
  doc as fsDoc,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
  serverTimestamp
} from "firebase/firestore";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "respostas.json");

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

app.use(express.json());

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
    "probabilidadeAplicacao",
    "praticaPretendeAplicar",
    "iniciativaPrioritariaREN",
    "recomendacaoEstrategicaREN",
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

app.put("/api/respostas/:id", (req, res) => {
  const id = req.params.id;
  const submissions = readSubmissions();
  const index = submissions.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Resposta não encontrada" });

  const updated = normalizeSubmission({ ...submissions[index], ...req.body }, new Date().toISOString(), new Date().toISOString());
  submissions[index] = updated;
  writeSubmissions(submissions);

  if (dbFirestore) {
    const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
    fsSetDoc(docRef, { ...updated, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
  }

  res.json({ success: true, message: "Resposta atualizada com sucesso!", data: updated });
});

app.delete("/api/respostas/:id", (req, res) => {
  const id = req.params.id;
  const submissions = readSubmissions();
  const index = submissions.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Resposta não encontrada" });

  submissions.splice(index, 1);
  writeSubmissions(submissions);

  if (dbFirestore) {
    const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
    fsDeleteDoc(docRef).catch(console.error);
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

app.post("/api/respostas", (req, res) => {
  const data = req.body || {};

  const selectedInitiatives = Array.isArray(data.iniciativaPrioritariaREN) ? data.iniciativaPrioritariaREN : data.iniciativaPrioritariaREN ? [data.iniciativaPrioritariaREN] : [];

  if (!data.atividadeMaiorValor || !data.principalAprendizado || !data.probabilidadeAplicacao || !data.praticaPretendeAplicar || selectedInitiatives.length === 0 || !data.recomendacaoEstrategicaREN) {
    return res.status(400).json({ success: false, message: "Por favor, responda todas as seis perguntas antes de enviar." });
  }

  const submissions = readSubmissions();
  const timestamp = new Date().toISOString();
  const newSubmission = normalizeSubmission({ ...data, id: `res_${Date.now()}` }, timestamp, timestamp);
  submissions.push(newSubmission);
  writeSubmissions(submissions);

  if (dbFirestore) {
    const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", newSubmission.id);
    fsSetDoc(docRef, { ...newSubmission, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
  }

  res.json({ success: true, message: "Resposta enviada com sucesso!", id: newSubmission.id });
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
