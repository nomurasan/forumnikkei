/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, LogIn, LogOut, Search, Shield, Sparkles, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { auth, db, collection, doc, getDoc, getDocs, setDoc, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "../lib/firebase";

const BOOTSTRAP_ADMIN_EMAILS = ["nomura.eduardo@gmail.com", "nomura.yudas@gmail.com"];

interface AdminUser {
  uid: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof (value as any)?.toDate === "function") return (value as any).toDate().toISOString();
  if (typeof (value as any)?.seconds === "number") return new Date((value as any).seconds * 1000).toISOString();
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}
function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

function toValueList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

export default function AdminArea() {
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureAdminAccess(user);
      } else {
        setCurrentUser(null);
        setAdminProfile(null);
        setAdminUsers([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const ensureAdminAccess = async (user: any) => {
    setCheckingAccess(true);
    try {
      const emailLower = user.email?.toLowerCase() || "";
      const docRef = doc(db, "admin_users", user.uid);
      let snap = await getDoc(docRef);

      if (!snap.exists() && BOOTSTRAP_ADMIN_EMAILS.includes(emailLower)) {
        await setDoc(docRef, {
          uid: user.uid,
          nome: user.displayName || emailLower,
          email: emailLower,
          perfil: "admin_master",
          ativo: true,
          createdAt: new Date().toISOString()
        });
        snap = await getDoc(docRef);
      }

      const profile = snap.exists() ? (snap.data() as AdminUser) : null;
      const profileEmail = profile?.email?.toLowerCase() || "";
      const hasAdminAccess = !!profile && profile.ativo && profileEmail === emailLower;

      if (hasAdminAccess) {
        setCurrentUser(user);
        setAdminProfile(profile);
        await Promise.all([fetchSubmissions(), fetchAdminUsers()]);
      } else {
        setAuthError("Este e-mail não está cadastrado como administrador ativo do painel.");
        await signOut(auth);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Erro ao validar acesso administrativo:", err);
      setAuthError("Não foi possível validar o acesso administrativo.");
    } finally {
      setCheckingAccess(false);
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const snap = await getDocs(collection(db, "forum_nikkei_respostas"));
      const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      data.sort((a, b) => {
        const dateA = toMillis(a.createdAt);
        const dateB = toMillis(b.createdAt);
        return dateB - dateA;
      });
      setSubmissions(data);
      if (!selectedSubmission && data[0]) {
        setSelectedSubmission(data[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar respostas:", err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "admin_users"));
      const users = snap.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }) as AdminUser);
      users.sort((a, b) => a.email.localeCompare(b.email));
      setAdminUsers(users);
    } catch (err) {
      console.error("Erro ao buscar usuarios administrativos:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, provider);
        return;
      }
      setAuthError(err.message || "Erro ao abrir o seletor de contas do Google.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleExportCSV = () => {
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
    const escapeCSVValue = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const text = formatCSVValue(value).replace(/"/g, '""');
      return /[;,\n\r"]/.test(text) ? `"${text}"` : text;
    };
    const csvRows = [headers.join(";"), ...filteredSubmissions.map((row) => headers.map((header) => escapeCSVValue(row[header])).join(";"))];
    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `forum_nikkei_respostas_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach((item) => {
      const key = item.atividadeMaiorValor || "Não informado";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [submissions]);

  const initiativeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach((item) => {
      const values = toValueList(item.iniciativaPrioritariaREN);
      const keys = values.length ? values : ["Não informado"];
      keys.forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [submissions]);

  const probabilityCounts = useMemo(() => {
    return [1, 2, 3, 4, 5].map((value) => ({
      name: `${value}`,
      value: submissions.filter((item) => Number(item.probabilidadeAplicacao) === value).length
    }));
  }, [submissions]);

  const averageProbability = useMemo(() => {
    if (!submissions.length) return 0;
    const sum = submissions.reduce((acc, item) => acc + (Number(item.probabilidadeAplicacao) || 0), 0);
    return (sum / submissions.length).toFixed(1);
  }, [submissions]);

  const topActivity = useMemo(() => {
    if (!activityCounts.length) return "Sem dados";
    return [...activityCounts].sort((a, b) => b.value - a.value)[0].name;
  }, [activityCounts]);

  const topInitiative = useMemo(() => {
    if (!initiativeCounts.length) return "Sem dados";
    return [...initiativeCounts].sort((a, b) => b.value - a.value)[0].name;
  }, [initiativeCounts]);

  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return submissions.filter((item) => {
      const haystack = `${item.participanteId || ""} ${item.atividadeMaiorValor || ""} ${item.principalAprendizado || ""} ${item.praticaPretendeAplicar || ""} ${formatDisplayValue(item.iniciativaPrioritariaREN)}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [submissions, searchTerm]);

  if (checkingAccess) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto rounded-full bg-brand-red/10 p-3 text-brand-red">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-neutral-800">Validando acesso</h2>
          <p className="mt-1 text-sm text-neutral-500">Estamos verificando se o e-mail selecionado é administrador ativo.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-brand-red/10 p-2 text-brand-red">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-800">Acesso administrativo</h2>
            <p className="text-sm text-neutral-500">Selecione uma conta Google. Somente e-mails cadastrados como administradores ativos acessam o painel.</p>
          </div>
        </div>
        {authError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>}
        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70">
          <LogIn className="h-4 w-4" />
          {loading ? "Abrindo Google..." : "Selecionar conta Google"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">Painel administrativo</p>
          <h2 className="text-xl font-black text-neutral-800">Resumo das respostas do questionário</h2>
          <p className="mt-1 text-xs text-neutral-500">Acesso liberado para {adminProfile?.email || currentUser.email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Total de respostas</p>
          <p className="mt-2 text-2xl font-black text-neutral-800">{submissions.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Usuários admin</p>
          <p className="mt-2 text-2xl font-black text-neutral-800">{adminUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Atividade mais valorizada</p>
          <p className="mt-2 text-lg font-black text-neutral-800">{topActivity}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Média de probabilidade</p>
          <p className="mt-2 text-2xl font-black text-neutral-800">{averageProbability}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Iniciativa mais votada</p>
          <p className="mt-2 text-lg font-black text-neutral-800">{topInitiative}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-red" />
          <h3 className="text-sm font-black text-neutral-800">Usuários com acesso administrativo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Perfil</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.uid} className="border-b border-neutral-100">
                  <td className="py-3 pr-4">{user.nome || "-"}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{user.perfil || "-"}</td>
                  <td className="py-3 pr-4">{user.ativo ? "Ativo" : "Inativo"}</td>
                </tr>
              ))}
              {!adminUsers.length && (
                <tr>
                  <td className="py-3 pr-4 text-neutral-500" colSpan={4}>Nenhum usuário administrativo encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-red" />
            <h3 className="text-sm font-black text-neutral-800">Atividade do Fórum</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#b91c1c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-red" />
            <h3 className="text-sm font-black text-neutral-800">Probabilidade de aplicação</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={probabilityCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                  <Cell fill="#b91c1c" />
                  <Cell fill="#dc2626" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f87171" />
                  <Cell fill="#fecaca" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-red" />
            <h3 className="text-sm font-black text-neutral-800">Iniciativa da REN</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={initiativeCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#061f67" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-brand-red" />
            <h3 className="text-sm font-black text-neutral-800">Respostas registradas</h3>
          </div>
          <button type="button" onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700">
            <Download className="h-4 w-4" />
            Gerar CSV
          </button>
        </div>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por participante, aprendizado ou iniciativa" className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 pr-4">Participante</th>
                <th className="py-2 pr-4">Atividade</th>
                <th className="py-2 pr-4">Aprendizado</th>
                <th className="py-2 pr-4">Probabilidade</th>
                <th className="py-2 pr-4">Iniciativa</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((item) => (
                <tr key={item.id} className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50" onClick={() => setSelectedSubmission(item)}>
                  <td className="py-3 pr-4">{item.participanteId || "-"}</td>
                  <td className="py-3 pr-4">{item.atividadeMaiorValor || "-"}</td>
                  <td className="py-3 pr-4">{item.principalAprendizado ? item.principalAprendizado.slice(0, 80) + (item.principalAprendizado.length > 80 ? "..." : "") : "-"}</td>
                  <td className="py-3 pr-4">{item.probabilidadeAplicacao ? `${item.probabilidadeAplicacao}/5` : "-"}</td>
                  <td className="py-3 pr-4">{formatDisplayValue(item.iniciativaPrioritariaREN) || "-"}</td>
                </tr>
              ))}
              {!filteredSubmissions.length && (
                <tr>
                  <td className="py-3 pr-4 text-neutral-500" colSpan={5}>Nenhuma resposta encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-neutral-800">Detalhamento da resposta</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Aprendizado</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{selectedSubmission.principalAprendizado || "Sem resposta"}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Aplicação</p>
              <p className="mt-2 text-sm text-neutral-700">Probabilidade: {selectedSubmission.probabilidadeAplicacao ? `${selectedSubmission.probabilidadeAplicacao}/5` : "-"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">Prática: {selectedSubmission.praticaPretendeAplicar || "Sem resposta"}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 md:col-span-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Recomendações</p>
              <p className="mt-2 text-sm text-neutral-700">Iniciativas prioritárias: {formatDisplayValue(selectedSubmission.iniciativaPrioritariaREN) || "-"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">Proposta estratégica: {selectedSubmission.recomendacaoEstrategicaREN || "Sem resposta"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



