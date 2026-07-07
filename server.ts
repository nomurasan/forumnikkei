/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "respostas.json");

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

// Middleware
app.use(express.json());

// Helpers to read/write submissions safely
function readSubmissions(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
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

// Custom CSV generator to avoid third-party dependencies
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";
  
  // Extract all unique keys from all submissions to define headers
  const headers = [
    "id",
    "nome",
    "email",
    "empresaInstituicao",
    "cargo",
    "cidade",
    "pais",
    "avaliacaoGeral",
    "atividadeMaiorValor",
    "destaqueForum",
    "tresAprendizados",
    "ideiaMaisImpactante",
    "aspectoCulturaJaponesa",
    "praticaPretendeAplicar",
    "pretendeAplicarConhecimento",
    "qualConhecimentoAplicar",
    "desafiosImplementacao",
    "oportunidadesBrasilJapao",
    "comoRenPodeContribuir",
    "oportunidadesAmericaLatina",
    "projetoColaborativo",
    "estabeleceuNovosContatos",
    "contatosPodemGerarParcerias",
    "temasPrioritarios",
    "naoPodeFaltar",
    "pontosAprimorar",
    "reflexaoFinal",
    "recomendacaoRenBrasil",
    "visao2035",
    "inovacaoProximaEdicao",
    "mensagemLegado",
    "createdAt",
    "updatedAt",
    "origem",
    "evento"
  ];

  const escapeCSVValue = (val: any) => {
    if (val === null || val === undefined) return "";
    let strVal = "";
    if (Array.isArray(val)) {
      strVal = val.join("; ");
    } else {
      strVal = String(val);
    }
    // Escape quotes
    strVal = strVal.replace(/"/g, '""');
    // If contains comma, semi-colon, newline or quote, wrap in quotes
    if (strVal.includes(",") || strVal.includes(";") || strVal.includes("\n") || strVal.includes("\r") || strVal.includes('"')) {
      return `"${strVal}"`;
    }
    return strVal;
  };

  const csvRows = [
    // Add BOM for proper Excel UTF-8 encoding
    "\uFEFF" + headers.join(";"),
    ...data.map((row) =>
      headers
        .map((header) => escapeCSVValue(row[header]))
        .join(";")
    )
  ];

  return csvRows.join("\r\n");
}

// API Routes

// GET: All responses (as JSON)
app.get("/api/respostas", (req, res) => {
  const submissions = readSubmissions();
  res.json({ success: true, count: submissions.length, data: submissions });
});

// GET: Export as CSV
app.get("/api/export-csv", (req, res) => {
  const submissions = readSubmissions();
  const csv = convertToCSV(submissions);
  
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=forum_nikkei_respostas_${Date.now()}.csv`
  );
  res.status(200).send(csv);
});

// POST: Register a response
app.post("/api/respostas", (req, res) => {
  const data = req.body;
  
  // Validation
  if (!data.nome || !data.email || !data.empresaInstituicao) {
    return res.status(400).json({
      success: false,
      message: "Por favor, preencha todos os campos obrigatórios básicos (Nome, E-mail, Empresa/Instituição)."
    });
  }

  const submissions = readSubmissions();

  // Rule 8: Prevent duplicate submission with same email
  const existingIndex = submissions.findIndex(
    (s) => s.email.toLowerCase() === data.email.toLowerCase()
  );

  const timestamp = new Date().toISOString();

  const newSubmission = {
    ...data,
    id: existingIndex >= 0 ? submissions[existingIndex].id : `res_${Date.now()}`,
    createdAt: existingIndex >= 0 ? submissions[existingIndex].createdAt : timestamp,
    updatedAt: timestamp,
    origem: "app_google_studio",
    evento: "forum_empresarial_nikkei_brasil_japao_2026"
  };

  if (existingIndex >= 0) {
    submissions[existingIndex] = newSubmission;
  } else {
    submissions.push(newSubmission);
  }

  const saved = writeSubmissions(submissions);

  if (saved) {
    res.json({
      success: true,
      message: existingIndex >= 0 ? "Sua resposta foi atualizada com sucesso!" : "Sua resposta foi enviada com sucesso!",
      id: newSubmission.id,
      isUpdate: existingIndex >= 0
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Falha interna ao salvar a resposta. Tente novamente."
    });
  }
});

// Boot server and set up Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Falha ao iniciar servidor:", err);
});
