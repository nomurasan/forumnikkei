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
  deleteDoc as fsDeleteDoc 
} from "firebase/firestore";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "respostas.json");

// Firebase setup on server
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

// Function to sync local responses to Firestore on startup
async function syncLocalToFirestore() {
  if (!dbFirestore) return;
  try {
    const submissions = readSubmissions();
    console.log(`[Sync] Sincronizando ${submissions.length} respostas locais com o Firestore...`);
    for (const sub of submissions) {
      const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", sub.id);
      await fsSetDoc(docRef, {
        ...sub,
        adminTags: sub.adminTags || [],
        destaqueRelatorio: sub.destaqueRelatorio || false,
        observacaoAdmin: sub.observacaoAdmin || "",
        statusAnalise: sub.statusAnalise || "pendente"
      }, { merge: true });
    }
    console.log("[Sync] Sincronização concluída com sucesso.");
  } catch (err) {
    console.error("[Sync] Erro ao sincronizar respostas com Firestore:", err);
  }
}

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

// PUT: Update admin fields for a response
app.put("/api/respostas/:id", (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Resposta não encontrada" });
  }

  const updatedSubmission = {
    ...submissions[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  submissions[index] = updatedSubmission;
  const saved = writeSubmissions(submissions);

  if (saved) {
    if (dbFirestore) {
      try {
        const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
        fsSetDoc(docRef, updatedSubmission, { merge: true }).catch(err => {
          console.error("Erro assíncrono ao atualizar Admin no Firestore:", err);
        });
      } catch (err) {
        console.error("Erro síncrono ao atualizar Admin no Firestore:", err);
      }
    }

    res.json({ success: true, message: "Campos de análise atualizados com sucesso!", data: updatedSubmission });
  } else {
    res.status(500).json({ success: false, message: "Erro ao salvar alterações localmente" });
  }
});

// DELETE: Delete a response
app.delete("/api/respostas/:id", (req, res) => {
  const id = req.params.id;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Resposta não encontrada" });
  }

  submissions.splice(index, 1);
  const saved = writeSubmissions(submissions);

  if (saved) {
    if (dbFirestore) {
      try {
        const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", id);
        fsDeleteDoc(docRef).catch(err => {
          console.error("Erro assíncrono ao excluir no Firestore:", err);
        });
      } catch (err) {
        console.error("Erro ao excluir no Firestore:", err);
      }
    }
    res.json({ success: true, message: "Resposta excluída com sucesso!" });
  } else {
    res.status(500).json({ success: false, message: "Erro ao excluir resposta localmente" });
  }
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
    // Sincroniza com Firestore em segundo plano
    if (dbFirestore) {
      try {
        const docRef = fsDoc(dbFirestore, "forum_nikkei_respostas", newSubmission.id);
        fsSetDoc(docRef, {
          ...newSubmission,
          adminTags: newSubmission.adminTags || [],
          destaqueRelatorio: newSubmission.destaqueRelatorio || false,
          observacaoAdmin: newSubmission.observacaoAdmin || "",
          statusAnalise: newSubmission.statusAnalise || "pendente"
        }, { merge: true }).catch(err => {
          console.error("Erro assíncrono ao salvar no Firestore:", err);
        });
      } catch (err) {
        console.error("Erro síncrono ao salvar no Firestore:", err);
      }
    }

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
    syncLocalToFirestore();
  });
}

startServer().catch((err) => {
  console.error("Falha ao iniciar servidor:", err);
});
