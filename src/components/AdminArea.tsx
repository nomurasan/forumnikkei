/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, LogOut, Search, Shield, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { auth, db, collection, doc, getDoc, getDocs, setDoc, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "../lib/firebase";

interface AdminUser {
  uid: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
}

export default function AdminArea() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await ensureAdminAccess(user);
      } else {
        setCurrentUser(null);
        setAdminProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const ensureAdminAccess = async (user: any) => {
    try {
      const emailLower = user.email?.toLowerCase() || "";
      const autoAdmin = ["nomura.eduardo@gmail.com", "nomura.yudas@gmail.com"].includes(emailLower);
      const docRef = doc(db, "admin_users", user.uid);
      let snap = await getDoc(docRef);

      if (!snap.exists() && autoAdmin) {
        await setDoc(docRef, { uid: user.uid, nome: user.displayName || emailLower, email: emailLower, perfil: "admin_master", ativo: true, createdAt: new Date().toISOString() });
        snap = await getDoc(docRef);
      }

      if (snap.exists() && snap.data().ativo) {
        setAdminProfile(snap.data() as AdminUser);
        await fetchSubmissions();
      } else {
        setAuthError("Sua conta não tem autorização para acessar o painel.");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Erro ao validar acesso administrativo:", err);
      setAuthError("Não foi possível validar o acesso administrativo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const snap = await getDocs(collection(db, "forum_nikkei_respostas"));
      const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message || "Erro ao entrar no painel.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleExportCSV = () => {
    const headers = ["id", "atividadeMaiorValor", "principalAprendizado", "probabilidadeAplicacao", "praticaPretendeAplicar", "iniciativaPrioritariaREN", "recomendacaoEstrategicaREN", "createdAt", "updatedAt"];
    const csvRows = [headers.join(";"), ...filteredSubmissions.map((row) => headers.map((header) => String(row[header] ?? "").replace(/;/g, ",")).join(";"))];
    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `forum_nikkei_respostas_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredSubmissions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `forum_nikkei_respostas_${Date.now()}.json`;
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
      const key = item.iniciativaPrioritariaREN || "Não informado";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [submissions]);

  const probabilityCounts = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map((value) => ({
      name: `${value}`,
      value: submissions.filter((item) => item.probabilidadeAplicacao === value).length
    }));
    return counts;
  }, [submissions]);

  const averageProbability = useMemo(() => {
    if (!submissions.length) return 0;
    const sum = submissions.reduce((acc, item) => acc + (Number(item.probabilidadeAplicacao) || 0), 0);
    return (sum / submissions.length).toFixed(1);
  }, [submissions]);

  const topActivity = useMemo(() => {
    if (!activityCounts.length) return "Sem dados";
    return activityCounts.sort((a, b) => b.value - a.value)[0].name;
  }, [activityCounts]);

  const topInitiative = useMemo(() => {
    if (!initiativeCounts.length) return "Sem dados";
    return initiativeCounts.sort((a, b) => b.value - a.value)[0].name;
  }, [initiativeCounts]);

  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return submissions.filter((item) => {
      const haystack = `${item.atividadeMaiorValor || ""} ${item.principalAprendizado || ""} ${item.praticaPretendeAplicar || ""} ${item.iniciativaPrioritariaREN || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [submissions, searchTerm]);

  if (!currentUser) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-brand-red/10 p-2 text-brand-red"><Shield className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-black text-neutral-800">Acesso administrativo</h2>
            <p className="text-sm text-neutral-500">Entre com a conta autorizada para visualizar as respostas.</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" required />
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white">{loading ? "Entrando..." : "Entrar"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">Painel administrativo</p>
          <h2 className="text-xl font-black text-neutral-800">Resumo das respostas do questionário</h2>
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
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Participantes respondentes</p>
          <p className="mt-2 text-2xl font-black text-neutral-800">{submissions.length > 0 ? "100%" : "0%"}</p>
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
          <div className="flex gap-2">
            <button type="button" onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700"> <Download className="h-4 w-4" /> CSV</button>
            <button type="button" onClick={handleExportJSON} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700"> <Download className="h-4 w-4" /> JSON</button>
          </div>
        </div>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por aprendizado ou iniciativa" className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 pr-4">Atividade</th>
                <th className="py-2 pr-4">Aprendizado</th>
                <th className="py-2 pr-4">Probabilidade</th>
                <th className="py-2 pr-4">Iniciativa</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((item) => (
                <tr key={item.id} className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50" onClick={() => setSelectedSubmission(item)}>
                  <td className="py-3 pr-4">{item.atividadeMaiorValor || "—"}</td>
                  <td className="py-3 pr-4">{item.principalAprendizado ? item.principalAprendizado.slice(0, 80) + (item.principalAprendizado.length > 80 ? "..." : "") : "—"}</td>
                  <td className="py-3 pr-4">{item.probabilidadeAplicacao ? `${item.probabilidadeAplicacao}/5` : "—"}</td>
                  <td className="py-3 pr-4">{item.iniciativaPrioritariaREN || "—"}</td>
                </tr>
              ))}
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
              <p className="mt-2 text-sm text-neutral-700">Probabilidade: {selectedSubmission.probabilidadeAplicacao ? `${selectedSubmission.probabilidadeAplicacao}/5` : "—"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">Prática: {selectedSubmission.praticaPretendeAplicar || "Sem resposta"}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 md:col-span-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Recomendações</p>
              <p className="mt-2 text-sm text-neutral-700">Iniciativa prioritária: {selectedSubmission.iniciativaPrioritariaREN || "—"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">Proposta estratégica: {selectedSubmission.recomendacaoEstrategicaREN || "Sem resposta"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}