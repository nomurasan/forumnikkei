/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  where,
  query,
  orderBy,
  GoogleAuthProvider,
  signInWithPopup
} from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  MessageSquareText, 
  Download, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  Check, 
  Star, 
  MapPin, 
  Building2, 
  Calendar, 
  Sparkles, 
  Tag, 
  Trash2, 
  Edit3, 
  Copy, 
  ShieldAlert,
  Plus,
  AlertCircle,
  Shield
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid 
} from "recharts";

import { FormResponse, PAISES_OPTIONS, ATIVIDADES_OPTIONS, TEMAS_PRIORITARIOS_OPTIONS } from "../types";

interface AdminUser {
  uid: string;
  nome: string;
  email: string;
  perfil: "admin" | "admin_master";
  ativo: boolean;
  createdAt: any;
}

export default function AdminArea() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [authError, setAuthError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Data States
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "participantes" | "graficos" | "qualitativa" | "config" | "usuarios">("dashboard");
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [showCompanyCollaborators, setShowCompanyCollaborators] = useState(true);

  // Administrative users management state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "admin_master">("admin");

  // Selected Submission for detail modal
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isEditingAdminFields, setIsEditingAdminFields] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [adminTags, setAdminTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [statusAnalise, setStatusAnalise] = useState("pendente");
  const [destaqueRelatorio, setDestaqueRelatorio] = useState(false);

  // Table Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPais, setFilterPais] = useState("");
  const [filterCidade, setFilterCidade] = useState("");
  const [filterAtividade, setFilterAtividade] = useState("");
  const [filterAvaliacao, setFilterAvaliacao] = useState("");
  const [filterAplicar, setFilterAplicar] = useState("");
  const [filterContato, setFilterContato] = useState("");
  const [filterTema, setFilterTema] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Qualitative analysis tab states
  const [selectedQualQuestion, setSelectedQualQuestion] = useState<string>("destaqueForum");
  const [qualSearchText, setQualSearchText] = useState("");

  // Tag options for manual classification
  const PRESET_TAGS = [
    "Inovação", "Gestão Japonesa", "Kaizen", "Lean", "Networking", 
    "Cooperação Brasil-Japão", "Cooperação América Latina", "Empreendedorismo", 
    "Cultura Nikkei", "Sucessão", "Tecnologia", "Liderança", 
    "Recomendação estratégica", "Depoimento relevante", "Citação para relatório"
  ];

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchAdminProfile(user.uid, user.email);
      } else {
        setCurrentUser(null);
        setAdminProfile(null);
        setLoading(false);
      }
    });

    // Check if the collection admin_users is empty
    checkIfFirstSetup();

    return () => unsubscribe();
  }, []);

  // Fetch admin profile document
  const fetchAdminProfile = async (uid: string, userEmail?: string | null) => {
    try {
      const emailLower = userEmail?.toLowerCase() || "";
      const isAutoAdmin = emailLower === "nomura.eduardo@gmail.com" || emailLower === "nomura.yudas@gmail.com";
      
      const docRef = doc(db, "admin_users", uid);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists() && isAutoAdmin) {
        // Auto-create admin document in Firestore
        const adminData = {
          uid,
          nome: emailLower === "nomura.eduardo@gmail.com" ? "Eduardo Nomura" : "Yudas Nomura",
          email: emailLower,
          perfil: "admin_master",
          ativo: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, adminData);
        docSnap = await getDoc(docRef);
        
        // Also ensure first setup flag is cleared since we just bootstrapped an admin
        setIsFirstSetup(false);
      } else if (!docSnap.exists() && emailLower) {
        // Check for pre-authorized email document
        const preAuthRef = doc(db, "admin_users", `email_${emailLower}`);
        const preAuthSnap = await getDoc(preAuthRef);
        if (preAuthSnap.exists() && preAuthSnap.data().ativo) {
          const preData = preAuthSnap.data();
          const adminData = {
            uid,
            nome: preData.nome || "Novo Administrador",
            email: emailLower,
            perfil: preData.perfil || "admin",
            ativo: true,
            createdAt: preData.createdAt || new Date().toISOString()
          };
          await setDoc(docRef, adminData);
          docSnap = await getDoc(docRef);
        }
      }
      
      if (docSnap.exists() && docSnap.data().ativo) {
        setAdminProfile(docSnap.data() as AdminUser);
        fetchSubmissions();
      } else {
        // Auth is valid but admin record is missing or inactive
        setAuthError("Sua conta não tem autorização de administrador ativa.");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Erro ao obter perfil de admin:", err);
      setAuthError("Erro na autenticação de segurança.");
    } finally {
      setLoading(false);
    }
  };

  // Check if first administrator needs to be registered
  const checkIfFirstSetup = async () => {
    try {
      const q = collection(db, "admin_users");
      const snap = await getDocs(q);
      if (snap.empty) {
        setIsFirstSetup(true);
      } else {
        setIsFirstSetup(false);
      }
    } catch (err) {
      console.warn("Firestore inacessível ou vazio na primeira verificação:", err);
    }
  };

  // Fetch all form responses from server (local synced API)
  const fetchSubmissions = async () => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/respostas");
      const result = await res.json();
      if (result.success) {
        setSubmissions(result.data);
      }
    } catch (err) {
      console.error("Erro ao buscar respostas:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch all admin users from Firestore
  const fetchAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const q = collection(db, "admin_users");
      const snap = await getDocs(q);
      const list: AdminUser[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          uid: docSnap.id,
          nome: data.nome || "",
          email: data.email || "",
          perfil: data.perfil || "admin",
          ativo: data.ativo ?? true,
          createdAt: data.createdAt || ""
        } as AdminUser);
      });
      setAdminUsers(list);
    } catch (err) {
      console.error("Erro ao obter usuários administradores:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleUserActive = async (user: AdminUser) => {
    if (user.uid === currentUser?.uid) {
      alert("Você não pode desativar o seu próprio perfil!");
      return;
    }
    const updatedStatus = !user.ativo;
    try {
      const userRef = doc(db, "admin_users", user.uid);
      await setDoc(userRef, { ativo: updatedStatus }, { merge: true });
      setAdminUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, ativo: updatedStatus } : u));
    } catch (err) {
      console.error("Erro ao alterar status do usuário:", err);
      alert("Erro ao salvar alterações no banco.");
    }
  };

  // Toggle user role
  const handleUpdateUserRole = async (user: AdminUser, newRole: "admin" | "admin_master") => {
    if (user.uid === currentUser?.uid) {
      alert("Você não pode alterar o seu próprio perfil de hierarquia!");
      return;
    }
    try {
      const userRef = doc(db, "admin_users", user.uid);
      await setDoc(userRef, { perfil: newRole }, { merge: true });
      setAdminUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, perfil: newRole } : u));
    } catch (err) {
      console.error("Erro ao alterar hierarquia do usuário:", err);
      alert("Erro ao salvar alterações no banco.");
    }
  };

  // Pre-authorize new admin user
  const handleAddAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      alert("Preencha todos os campos do novo administrador.");
      return;
    }

    const emailLower = newAdminEmail.trim().toLowerCase();
    const docId = `email_${emailLower}`;

    try {
      const userRef = doc(db, "admin_users", docId);
      await setDoc(userRef, {
        uid: docId,
        nome: newAdminName.trim(),
        email: emailLower,
        perfil: newAdminRole,
        ativo: true,
        createdAt: new Date().toISOString()
      });
      
      alert("Administrador pré-autorizado com sucesso! Quando este e-mail fizer login, será reconhecido imediatamente.");
      setNewAdminEmail("");
      setNewAdminName("");
      fetchAdminUsers();
    } catch (err) {
      console.error("Erro ao pré-autorizar usuário:", err);
      alert("Erro ao salvar pré-autorização.");
    }
  };

  // Trigger admin users fetching when usuarios tab is active
  useEffect(() => {
    if (activeTab === "usuarios" && currentUser) {
      fetchAdminUsers();
    }
  }, [activeTab, currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Erro no login:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setAuthError("E-mail ou senha incorretos.");
      } else {
        setAuthError("Falha na autenticação: " + (err.message || err.code));
      }
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setAuthError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Erro no login com Google:", err);
      setAuthError("Erro na autenticação do Google: " + (err.message || err.code));
      setLoading(false);
    }
  };

  // Handle first time administrator setup
  const handleSetupFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (!adminName.trim() || !email.trim() || password.length < 6) {
      setAuthError("Preencha todos os campos. A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Write doc in Firestore
      const adminData = {
        uid,
        nome: adminName,
        email: email.toLowerCase(),
        perfil: "admin_master",
        ativo: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "admin_users", uid), adminData);
      
      setSetupSuccess(true);
      setIsFirstSetup(false);
      setAdminProfile(adminData as AdminUser);
      setCurrentUser(userCredential.user);
      fetchSubmissions();
    } catch (err: any) {
      console.error("Erro no cadastro de primeiro admin:", err);
      setAuthError("Erro na configuração inicial: " + (err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    setLoading(true);
    await signOut(auth);
    window.location.hash = "";
  };

  // Handle deletion of submission (admin_master only)
  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este participante? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const res = await fetch(`/api/respostas/${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
        }
        alert("Participante excluído com sucesso.");
      } else {
        alert("Erro ao excluir: " + result.message);
      }
    } catch (err) {
      console.error("Erro ao excluir resposta:", err);
      alert("Falha de conexão com o servidor.");
    }
  };

  // Edit / Save internal administrative fields on submission
  const handleSaveAdminFields = async () => {
    if (!selectedSubmission) return;
    
    const updates = {
      adminTags,
      statusAnalise,
      observacaoAdmin: adminNote,
      destaqueRelatorio
    };

    try {
      const res = await fetch(`/api/respostas/${selectedSubmission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const result = await res.json();
      if (result.success) {
        // Update local state list
        setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, ...updates } : s));
        setSelectedSubmission(prev => ({ ...prev, ...updates }));
        setIsEditingAdminFields(false);
        alert("Campos de análise atualizados com sucesso!");
      } else {
        alert("Erro ao atualizar: " + result.message);
      }
    } catch (err) {
      console.error("Erro ao salvar tags/observações:", err);
      alert("Erro na rede ao salvar dados.");
    }
  };

  // Quick helper to export formatted CSV
  const handleExportCSV = () => {
    window.open("/api/export-csv", "_blank");
  };

  // Quick helper to export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSubmissions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forum_nikkei_respostas_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter logic for participants table
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = !searchTerm || 
      sub.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.empresaInstituicao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.cidade?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPais = !filterPais || sub.pais === filterPais;
    const matchesCidade = !filterCidade || sub.cidade?.toLowerCase().includes(filterCidade.toLowerCase());
    const matchesAtividade = !filterAtividade || sub.atividadeMaiorValor === filterAtividade;
    const matchesAvaliacao = !filterAvaliacao || String(sub.avaliacaoGeral) === filterAvaliacao;
    const matchesAplicar = !filterAplicar || sub.pretendeAplicarConhecimento === filterAplicar;
    const matchesContato = !filterContato || sub.estabeleceuNovosContatos === filterContato;
    const matchesStatus = !filterStatus || sub.statusAnalise === filterStatus;
    
    const matchesTema = !filterTema || (sub.temasPrioritarios && sub.temasPrioritarios.includes(filterTema));

    return matchesSearch && matchesPais && matchesCidade && matchesAtividade && matchesAvaliacao && matchesAplicar && matchesContato && matchesTema && matchesStatus;
  });

  // Calculate stats for Dashboard
  const totalSubmissions = submissions.length;
  
  const uniqueCountries = new Set(submissions.map(s => s.pais).filter(Boolean)).size;
  const uniqueCities = new Set(submissions.map(s => s.cidade?.trim().toLowerCase()).filter(Boolean)).size;
  
  const avgEvaluation = totalSubmissions > 0 
    ? (submissions.reduce((acc, curr) => acc + (Number(curr.avaliacaoGeral) || 0), 0) / totalSubmissions).toFixed(1)
    : "0.0";

  const percentApply = totalSubmissions > 0
    ? ((submissions.filter(s => s.pretendeAplicarConhecimento === "Sim").length / totalSubmissions) * 100).toFixed(0)
    : "0";

  const percentContacts = totalSubmissions > 0
    ? ((submissions.filter(s => s.estabeleceuNovosContatos === "Sim").length / totalSubmissions) * 100).toFixed(0)
    : "0";

  const percentPartners = totalSubmissions > 0
    ? ((submissions.filter(s => s.contatosPodemGerarParcerias === "Sim").length / totalSubmissions) * 100).toFixed(0)
    : "0";

  // Find most cited activity
  const activityCounts: { [key: string]: number } = {};
  submissions.forEach(s => {
    if (s.atividadeMaiorValor) {
      activityCounts[s.atividadeMaiorValor] = (activityCounts[s.atividadeMaiorValor] || 0) + 1;
    }
  });
  let topActivity = "Nenhuma";
  let maxActivityVal = 0;
  Object.entries(activityCounts).forEach(([act, count]) => {
    if (count > maxActivityVal) {
      maxActivityVal = count;
      topActivity = act;
    }
  });

  // Find most cited theme
  const themeCounts: { [key: string]: number } = {};
  submissions.forEach(s => {
    if (s.temasPrioritarios && Array.isArray(s.temasPrioritarios)) {
      s.temasPrioritarios.forEach((theme: string) => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    }
  });
  let topTheme = "Nenhum";
  let maxThemeVal = 0;
  Object.entries(themeCounts).forEach(([th, count]) => {
    if (count > maxThemeVal) {
      maxThemeVal = count;
      topTheme = th;
    }
  });

  // Helper to open edit admin drawer
  const openEditAdminFields = (sub: any) => {
    setSelectedSubmission(sub);
    setAdminNote(sub.observacaoAdmin || "");
    setAdminTags(sub.adminTags || []);
    setStatusAnalise(sub.statusAnalise || "pendente");
    setDestaqueRelatorio(sub.destaqueRelatorio || false);
    setIsEditingAdminFields(true);
  };

  // Copy text to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  // Add tag internally helper
  const handleAddTag = () => {
    if (newTagInput.trim() && !adminTags.includes(newTagInput.trim())) {
      setAdminTags([...adminTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  // Remove tag helper
  const handleRemoveTag = (tagToRemove: string) => {
    setAdminTags(adminTags.filter(t => t !== tagToRemove));
  };

  // Toggle highlight status helper directly in lists
  const handleToggleHighlightDirect = async (sub: any) => {
    const updatedStatus = !sub.destaqueRelatorio;
    try {
      const res = await fetch(`/api/respostas/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destaqueRelatorio: updatedStatus })
      });
      const result = await res.json();
      if (result.success) {
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, destaqueRelatorio: updatedStatus } : s));
        if (selectedSubmission?.id === sub.id) {
          setSelectedSubmission(prev => ({ ...prev, destaqueRelatorio: updatedStatus }));
        }
      }
    } catch (err) {
      console.error("Erro ao alterar destaque:", err);
    }
  };

  // Render Charts Data Source
  // Chart 1: Pais
  const chartDataPais = Object.entries(
    submissions.reduce((acc: any, curr) => {
      acc[curr.pais || "Outro"] = (acc[curr.pais || "Outro"] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Chart 2: Cidade
  const chartDataCidade = Object.entries(
    submissions.reduce((acc: any, curr) => {
      const city = curr.cidade ? curr.cidade.trim() : "Não Informado";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 8); // Top 8 cities

  // Chart 3: Avaliacao
  const chartDataAvaliacao = Array.from({ length: 10 }, (_, i) => {
    const nota = i + 1;
    return {
      name: `Nota ${nota}`,
      quantidade: submissions.filter(s => Number(s.avaliacaoGeral) === nota).length
    };
  });

  // Chart 4: Atividade Maior Valor
  const chartDataAtividade = ATIVIDADES_OPTIONS.map(act => ({
    name: act,
    quantidade: submissions.filter(s => s.atividadeMaiorValor === act).length
  })).sort((a, b) => b.quantidade - a.quantidade);

  // Chart 5: Pretende Aplicar
  const chartDataAplicar = [
    { name: "Sim", value: submissions.filter(s => s.pretendeAplicarConhecimento === "Sim").length },
    { name: "Talvez", value: submissions.filter(s => s.pretendeAplicarConhecimento === "Talvez").length },
    { name: "Ainda não", value: submissions.filter(s => s.pretendeAplicarConhecimento === "Ainda não").length },
    { name: "Não", value: submissions.filter(s => s.pretendeAplicarConhecimento === "Não").length },
  ].filter(item => item.value > 0);

  // Chart 6: Networking
  const chartDataNetworking = [
    { name: "Sim", value: submissions.filter(s => s.estabeleceuNovosContatos === "Sim").length },
    { name: "Não", value: submissions.filter(s => s.estabeleceuNovosContatos === "Não").length },
  ].filter(item => item.value > 0);

  // Chart 7: Parcerias
  const chartDataParcerias = [
    { name: "Sim", value: submissions.filter(s => s.contatosPodemGerarParcerias === "Sim").length },
    { name: "Talvez", value: submissions.filter(s => s.contatosPodemGerarParcerias === "Talvez").length },
    { name: "Não", value: submissions.filter(s => s.contatosPodemGerarParcerias === "Não").length },
  ].filter(item => item.value > 0);

  // Chart 8: Temas mais citados
  const chartDataTemas = TEMAS_PRIORITARIOS_OPTIONS.map(theme => ({
    name: theme,
    quantidade: submissions.filter(s => s.temasPrioritarios && s.temasPrioritarios.includes(theme)).length
  })).sort((a, b) => b.quantidade - a.quantidade);

  const COLORS = ["#D2232A", "#1D4ED8", "#059669", "#D97706", "#7C3AED", "#DB2777", "#4B5563", "#06B6D4"];

  const getDominantProfile = (sub: any) => {
    const score = Number(sub.avaliacaoGeral) || 0;
    if (score >= 9) return `PARTICIPATIVO (${score}PTS)`;
    if (score >= 7) return `INTEGRADOR (${score}PTS)`;
    if (score > 0) return `EM DESENVOLVIMENTO (${score}PTS)`;
    return "PENDENTE";
  };

  const companyGroups = submissions.reduce((acc: Record<string, any[]>, sub) => {
    const companyName = sub.empresaInstituicao?.trim() || "Sem empresa";
    if (!acc[companyName]) acc[companyName] = [];
    acc[companyName].push(sub);
    return acc;
  }, {});

  const companies = Object.entries(companyGroups)
    .map(([name, collaborators]) => ({
      name,
      collaborators,
      mapped: collaborators.length,
      responded: collaborators.filter((sub) => sub.email || sub.createdAt).length,
      avgScore: collaborators.length
        ? collaborators.reduce((acc, sub) => acc + (Number(sub.avaliacaoGeral) || 0), 0) / collaborators.length
        : 0
    }))
    .sort((a, b) => b.mapped - a.mapped || a.name.localeCompare(b.name));

  const selectedCompany = companies.find((company) => company.name === selectedCompanyName) || companies[0];
  const selectedCollaborators = selectedCompany ? selectedCompany.collaborators : [];
  const visibleCollaborators = showCompanyCollaborators
    ? selectedCollaborators.filter((sub) => {
        const term = searchTerm.toLowerCase();
        return !term ||
          sub.nome?.toLowerCase().includes(term) ||
          sub.email?.toLowerCase().includes(term) ||
          sub.cargo?.toLowerCase().includes(term);
      })
    : [];

  const clearCompanySelection = () => {
    setSelectedCompanyName("");
    setShowCompanyCollaborators(false);
    setSearchTerm("");
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center py-12" id="admin-loading">
        <div className="w-12 h-12 rounded-full border-4 border-brand-red/20 border-t-brand-red animate-spin" />
        <p className="text-sm font-mono text-neutral-500 font-bold uppercase tracking-wider mt-4">
          Carregando ambiente administrativo...
        </p>
      </div>
    );
  }

  // First time setup - database seeder
  if (isFirstSetup) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-neutral-200/80 rounded-2xl shadow-2xl p-8" id="admin-first-setup">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-50 text-brand-red rounded-full mb-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-black text-neutral-800 leading-tight">
            Configuração de Admin
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Esta é a primeira vez que você acessa o painel. Crie a conta do Administrador Principal (Master).
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSetupFirstAdmin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Nome Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
              placeholder="Ex: Administrador REN Brasil"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              E-mail Administrativo
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
              placeholder="admin@renbrasil.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Senha (mínimo 6 dígitos)
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-red hover:bg-brand-red-hover text-white font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-colors cursor-pointer mt-2"
          >
            Criar Administrador & Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  // Login Screen
  if (!currentUser || !adminProfile) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-neutral-200/80 rounded-2xl shadow-2xl p-8" id="admin-login-screen">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-neutral-100 text-neutral-800 rounded-full mb-3 border border-neutral-200">
            <ShieldAlert className="w-8 h-8 text-neutral-700" />
          </div>
          <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight leading-tight">
            Área de Administração
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Identifique-se para acessar os dados do Fórum Empresarial Nikkei.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              E-mail
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
              placeholder="admin@renbrasil.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Senha
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-red hover:bg-brand-red-hover text-white font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-colors cursor-pointer mt-2"
          >
            Acessar Painel Admin
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-neutral-200" />
          <span className="px-3 text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">ou</span>
          <div className="flex-1 h-[1px] bg-neutral-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-400 text-neutral-700 font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Entrar com Conta Google
        </button>

        <div className="text-center mt-6 pt-4 border-t border-neutral-100">
          <a href="#" className="text-xs text-neutral-400 hover:text-brand-red">
            ← Voltar para o Formulário Público
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]" id="admin-main-panel">
      
      {/* ADMIN ASIDE NAVIGATION */}
      <aside className="w-full md:w-64 bg-neutral-900 text-white flex flex-col justify-between p-6 shrink-0 border-r border-neutral-800">
        <div className="space-y-6">
          <div className="space-y-2 border-b border-neutral-800 pb-4">
            <div className="inline-flex items-center gap-1.5 bg-brand-red/20 text-brand-red border border-brand-red/30 px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-bold">
              Painel Admin
            </div>
            <h3 className="text-sm font-display font-black tracking-tight text-white uppercase leading-tight">
              REN Brasil - Fórum
            </h3>
            <p className="text-[10px] text-neutral-400">
              Olá, <span className="text-neutral-200 font-bold">{adminProfile.nome}</span>
            </p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("participantes")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "participantes"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Participantes ({submissions.length})
            </button>

            <button
              onClick={() => setActiveTab("graficos")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "graficos"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gráficos de Dados
            </button>

            <button
              onClick={() => setActiveTab("qualitativa")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "qualitativa"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              Análise Qualitativa
            </button>

            <button
              onClick={() => setActiveTab("config")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "config"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              Exportação & Infos
            </button>

            <button
              onClick={() => setActiveTab("usuarios")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border border-transparent cursor-pointer ${
                activeTab === "usuarios"
                  ? "bg-brand-red text-white shadow-sm font-black"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              Usuários Admin
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-800 space-y-4">
          <div className="bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-800">
            <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Perfil</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {adminProfile.perfil === "admin_master" ? "Master Admin" : "Coordenador"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 border border-neutral-800 hover:border-red-500/30 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            <span>Sair do Painel</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CARD */}
      <div className="flex-1 bg-neutral-50 p-6 md:p-8 flex flex-col justify-between overflow-x-hidden min-h-[640px]">
        {dataLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-brand-red/20 border-t-brand-red animate-spin" />
            <p className="text-xs font-mono text-neutral-400 font-bold tracking-wider mt-2">Atualizando banco de dados...</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            
            {/* TAB 1: DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-fade-in" id="admin-view-dashboard">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-4">
                  <div>
                    <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                      Visão Geral do Fórum
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Sistematização em tempo real de contatos, avaliações e percepções corporativas.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white px-3.5 py-2 rounded-lg font-mono font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Planilha Completa (CSV)
                  </button>
                </div>

                {/* BENTO STATISTICS GRIDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
                  {/* Total de Respostas */}
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex flex-col justify-between group hover:border-brand-red/30 transition-all">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Respostas Recebidas</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-display font-black text-neutral-800 group-hover:text-brand-red transition-colors">{totalSubmissions}</span>
                      <span className="text-xs text-neutral-400 font-mono">fichas</span>
                    </div>
                  </div>

                  {/* Países */}
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex flex-col justify-between group hover:border-brand-red/30 transition-all">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Países Representados</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-display font-black text-neutral-800 group-hover:text-brand-red transition-colors">{uniqueCountries}</span>
                      <span className="text-xs text-neutral-400 font-mono">nações</span>
                    </div>
                  </div>

                  {/* Cidades */}
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex flex-col justify-between group hover:border-brand-red/30 transition-all">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Cidades Participantes</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-display font-black text-neutral-800 group-hover:text-brand-red transition-colors">{uniqueCities}</span>
                      <span className="text-xs text-neutral-400 font-mono">polos</span>
                    </div>
                  </div>

                  {/* Avaliação Média */}
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex flex-col justify-between group hover:border-brand-red/30 transition-all">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Avaliação Geral Média</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-3xl font-display font-black text-brand-red">{avgEvaluation}</span>
                      <span className="text-xs text-neutral-400 font-mono">/ 10</span>
                      <div className="flex text-amber-400 ml-1">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECONDARY ROW OF STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-secondary-grid">
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono font-bold tracking-wider text-neutral-400 uppercase leading-none">Intenção de Aplicação</span>
                      <span className="block text-2xl font-display font-black text-neutral-800 mt-1">{percentApply}%</span>
                      <span className="text-[10px] text-neutral-400">pretendem aplicar ideias</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-brand-red font-mono font-bold text-xs">
                      Sim
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono font-bold tracking-wider text-neutral-400 uppercase leading-none">Networking Qualificado</span>
                      <span className="block text-2xl font-display font-black text-neutral-800 mt-1">{percentContacts}%</span>
                      <span className="text-[10px] text-neutral-400">fizeram novos contatos</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-mono font-bold text-xs">
                      Pessoas
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono font-bold tracking-wider text-neutral-400 uppercase leading-none">Geração de Parcerias</span>
                      <span className="block text-2xl font-display font-black text-neutral-800 mt-1">{percentPartners}%</span>
                      <span className="text-[10px] text-neutral-400">preveem futuras alianças</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-mono font-bold text-xs">
                      Negócios
                    </div>
                  </div>
                </div>

                {/* MOST CITED HIGHLIGHTS SUMMARY BENTO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="highlights-bento-grid">
                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-3">
                    <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Tema Prioritário Mais Citado</span>
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center gap-3">
                      <div className="p-2 bg-brand-red/10 text-brand-red rounded-lg">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Categoria mais requisitada</span>
                        <span className="block text-sm font-bold text-neutral-800 uppercase tracking-tight">{topTheme}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-3">
                    <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">Atividade com Maior Valor Agregado</span>
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center gap-3">
                      <div className="p-2 bg-neutral-800/10 text-neutral-800 rounded-lg">
                        <Building2 className="w-5 h-5 text-neutral-700" />
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Destaque da programação oficial</span>
                        <span className="block text-sm font-bold text-neutral-800 uppercase tracking-tight">{topActivity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT SUBMISSIONS PREVIEW */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-display font-black text-neutral-800 uppercase tracking-tight">Últimos Envio Recebidos</h3>
                    <button 
                      onClick={() => setActiveTab("participantes")} 
                      className="text-xs text-brand-red font-bold hover:underline"
                    >
                      Ver Todos os Participantes →
                    </button>
                  </div>

                  {submissions.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Nenhum envio recebido ainda.</p>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {submissions.slice(0, 5).map((sub) => (
                        <div 
                          key={sub.id} 
                          onClick={() => openEditAdminFields(sub)}
                          className="py-3 flex items-center justify-between hover:bg-neutral-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200/50 flex items-center justify-center font-bold text-xs text-neutral-600">
                              {sub.nome?.[0] || "?"}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-neutral-800">{sub.nome}</span>
                              <span className="block text-[10px] text-neutral-500 font-mono">{sub.cargo} — {sub.empresaInstituicao}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-neutral-400">
                              {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("pt-BR") : "Recent"}
                            </span>
                            <div className="bg-red-50 text-brand-red font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-brand-red/15">
                              ★ {sub.avaliacaoGeral}
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS TABLE */}
            {activeTab === "participantes" && (
              <div className="space-y-4 animate-fade-in" id="admin-view-participants">
                <div className="border-b border-neutral-200/80 pb-4">
                  <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                    Lista Geral de Participantes
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Filtre, pesquise, faça anotações de curadoria e prepare destaques de depoimento para o relatório final.
                  </p>
                </div>

                {/* FILTERS AND SEARCH COMPONENT */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200/70 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-neutral-500">
                    <Filter className="w-3.5 h-3.5 text-brand-red" />
                    <span>Filtros Dinâmicos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Search Term Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Nome, e-mail, cargo, empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
                      />
                    </div>

                    {/* Filter Pais */}
                    <select
                      value={filterPais}
                      onChange={(e) => setFilterPais(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Todos os Países</option>
                      {PAISES_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    {/* Filter Cidade */}
                    <input
                      type="text"
                      placeholder="Pesquisar Cidade..."
                      value={filterCidade}
                      onChange={(e) => setFilterCidade(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                    />

                    {/* Filter Atividade */}
                    <select
                      value={filterAtividade}
                      onChange={(e) => setFilterAtividade(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Atividade Maior Valor</option>
                      {ATIVIDADES_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    {/* Filter Avaliação */}
                    <select
                      value={filterAvaliacao}
                      onChange={(e) => setFilterAvaliacao(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Avaliação Geral</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i+1} value={i+1}>Nota {i+1}</option>
                      ))}
                    </select>

                    {/* Filter Aplicar */}
                    <select
                      value={filterAplicar}
                      onChange={(e) => setFilterAplicar(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Pretende Aplicar?</option>
                      <option value="Sim">Sim</option>
                      <option value="Talvez">Talvez</option>
                      <option value="Ainda não">Ainda não</option>
                      <option value="Não">Não</option>
                    </select>

                    {/* Filter Contato */}
                    <select
                      value={filterContato}
                      onChange={(e) => setFilterContato(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Novos Contatos?</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>

                    {/* Filter Status Análise */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                    >
                      <option value="">Status da Análise</option>
                      <option value="pendente">Pendente</option>
                      <option value="em análise">Em Análise</option>
                      <option value="analisado">Analisado</option>
                      <option value="selecionado para relatório">Destaque Relatório</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] text-neutral-500">
                    <p>Filtrados <span className="font-bold text-neutral-800">{filteredSubmissions.length}</span> de <span className="font-bold text-neutral-800">{submissions.length}</span> registros totalizados.</p>
                    <button 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterPais("");
                        setFilterCidade("");
                        setFilterAtividade("");
                        setFilterAvaliacao("");
                        setFilterAplicar("");
                        setFilterContato("");
                        setFilterTema("");
                        setFilterStatus("");
                      }}
                      className="text-brand-red hover:underline font-mono uppercase text-[10px] font-bold"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>

                {/* TABLE OF REGISTERS */}
                <div className="bg-white border border-neutral-200/70 rounded-xl shadow-xs overflow-hidden" id="participants-table-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500 font-mono text-[9px] uppercase tracking-wider border-b border-neutral-200/80">
                          <th className="py-3.5 px-4 font-bold">Participante</th>
                          <th className="py-3.5 px-4 font-bold">Empresa / Cargo</th>
                          <th className="py-3.5 px-4 font-bold">Local</th>
                          <th className="py-3.5 px-4 font-bold text-center">Nota</th>
                          <th className="py-3.5 px-4 font-bold">Atividade</th>
                          <th className="py-3.5 px-4 font-bold">Status</th>
                          <th className="py-3.5 px-4 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {filteredSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-neutral-400 italic">
                              Nenhum participante atende aos filtros atuais.
                            </td>
                          </tr>
                        ) : (
                          filteredSubmissions.map((sub) => (
                            <tr 
                              key={sub.id} 
                              className={`hover:bg-neutral-50/50 transition-colors ${sub.destaqueRelatorio ? 'bg-amber-50/30' : ''}`}
                            >
                              <td className="py-3.5 px-4 font-sans">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleToggleHighlightDirect(sub)}
                                    className={`focus:outline-none cursor-pointer ${sub.destaqueRelatorio ? 'text-amber-500' : 'text-neutral-300 hover:text-neutral-400'}`}
                                    title="Marcar como Relevante para o Relatório"
                                  >
                                    <Star className={`w-4 h-4 ${sub.destaqueRelatorio ? 'fill-amber-400' : ''}`} />
                                  </button>
                                  <div>
                                    <span className="block font-bold text-neutral-800">{sub.nome}</span>
                                    <span className="block text-[10px] text-neutral-500 font-mono">{sub.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="block font-medium text-neutral-700">{sub.empresaInstituicao}</span>
                                <span className="block text-[10px] text-neutral-400 truncate max-w-[150px]">{sub.cargo}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">
                                {sub.cidade}, {sub.pais}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono">
                                <span className="bg-red-50 text-brand-red border border-brand-red/10 px-2 py-0.5 rounded-full font-bold">
                                  {sub.avaliacaoGeral}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-neutral-600 truncate max-w-[120px]" title={sub.atividadeMaiorValor}>
                                {sub.atividadeMaiorValor}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  sub.statusAnalise === "selecionado para relatório"
                                    ? "bg-amber-100 text-amber-800"
                                    : sub.statusAnalise === "analisado"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sub.statusAnalise === "em análise"
                                    ? "bg-blue-100 text-blue-800"
                                    : sub.statusAnalise === "descartado"
                                    ? "bg-neutral-200 text-neutral-600"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}>
                                  {sub.statusAnalise || "pendente"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View / Curate */}
                                  <button
                                    onClick={() => openEditAdminFields(sub)}
                                    className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 transition-colors cursor-pointer"
                                    title="Visualizar e Fazer Curadoria"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete (only if master) */}
                                  {adminProfile.perfil === "admin_master" && (
                                    <button
                                      onClick={() => handleDeleteSubmission(sub.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-brand-red rounded-md transition-colors cursor-pointer"
                                      title="Excluir Registro"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GRAPHICS VIEW */}
            {activeTab === "graficos" && (
              <div className="space-y-6 animate-fade-in" id="admin-view-graphics">
                <div className="border-b border-neutral-200/80 pb-4">
                  <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                    Análise Gráfica Consolidada
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Gere gráficos estatísticos das perguntas quantitativas de múltipla escolha e de escala numérica.
                  </p>
                </div>

                {submissions.length === 0 ? (
                  <div className="bg-white p-8 border border-neutral-200 rounded-xl text-center text-neutral-400 italic">
                    Aguardando o recebimento de respostas para plotar estatísticas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-grid-container">
                    
                    {/* CHART 1: RESPOSTAS POR PAÍS */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        1. Representatividade por País
                      </span>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartDataPais}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartDataPais.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART 2: RESPOSTAS POR CIDADE (TOP 8) */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        2. Distribuição por Cidade (Top 8 Polos)
                      </span>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataCidade} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
                            <XAxis type="number" stroke="#a3a3a3" fontSize={10} />
                            <YAxis dataKey="name" type="category" stroke="#a3a3a3" fontSize={9} width={90} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#D2232A" radius={[0, 4, 4, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART 3: AVALIAÇÃO GERAL DO FÓRUM */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        3. Distribuição de Avaliações Gerais (Escala 1 a 10)
                      </span>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataAvaliacao}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} />
                            <YAxis stroke="#a3a3a3" fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="quantidade" fill="#1E293B" radius={[4, 4, 0, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART 4: ATIVIDADE DE MAIOR VALOR */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        4. Destaques de Programação mais Citados
                      </span>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataAtividade} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis type="number" stroke="#a3a3a3" fontSize={10} />
                            <YAxis dataKey="name" type="category" stroke="#a3a3a3" fontSize={9} width={110} />
                            <Tooltip />
                            <Bar dataKey="quantidade" fill="#047857" radius={[0, 4, 4, 0]} barSize={14} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART 5: INTENÇÃO DE APLICAR CONHECIMENTO */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        5. Intenção Prática de Aplicação de Aprendizados
                      </span>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartDataAplicar}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartDataAplicar.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#059669", "#3B82F6", "#F59E0B", "#EF4444"][index % 4]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART 6: TEMAS PRIORITÁRIOS */}
                    <div className="bg-white p-5 rounded-xl border border-neutral-200/70 shadow-xs space-y-4 lg:col-span-2">
                      <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                        6. Ranking de Relevância de Temas Prioritários (Múltipla Escolha)
                      </span>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataTemas}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="name" stroke="#a3a3a3" fontSize={8} interval={0} angle={-30} textAnchor="end" height={60} />
                            <YAxis stroke="#a3a3a3" fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="quantidade" fill="#D2232A" radius={[4, 4, 0, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 4: QUALITATIVE ANALYSIS PANEL */}
            {activeTab === "qualitativa" && (
              <div className="space-y-6 animate-fade-in" id="admin-view-qualitative">
                <div className="border-b border-neutral-200/80 pb-4">
                  <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                    Painel de Análise Qualitativa
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Agrupe, consolide e filtre todas as perguntas abertas para identificar as percepções subjetivas e preparar relatórios.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* SELECT QUESTION COLUMN */}
                  <div className="md:col-span-1 bg-white p-4 border border-neutral-200 rounded-xl space-y-3">
                    <span className="block text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                      Selecione a Pergunta
                    </span>
                    <div className="space-y-1.5 flex flex-col">
                      {[
                        { key: "destaqueForum", label: "Destaque do Fórum" },
                        { key: "tresAprendizados", label: "Três Aprendizados" },
                        { key: "ideiaMaisImpactante", label: "Ideia Mais Impactante" },
                        { key: "aspectoCulturaJaponesa", label: "Aspecto Cultura Nikkei" },
                        { key: "praticaPretendeAplicar", label: "Prática a Aplicar" },
                        { key: "qualConhecimentoAplicar", label: "Qual Conhecimento" },
                        { key: "desafiosImplementacao", label: "Desafios de Implementação" },
                        { key: "oportunidadesBrasilJapao", label: "Oportunidades Br-Jp" },
                        { key: "comoRenPodeContribuir", label: "Como a REN Contribui" },
                        { key: "oportunidadesAmericaLatina", label: "América Latina" },
                        { key: "projetoColaborativo", label: "Projeto Sugerido" },
                        { key: "naoPodeFaltar", label: "Não Pode Faltar" },
                        { key: "pontosAprimorar", label: "Pontos a Aprimorar" },
                        { key: "reflexaoFinal", label: "Reflexão Final" },
                        { key: "recomendacaoRenBrasil", label: "Recomendação REN" },
                        { key: "visao2035", label: "Visão 2035" },
                        { key: "inovacaoProximaEdicao", label: "Inovação Próx Edição" },
                        { key: "mensagemLegado", label: "Mensagem de Legado" }
                      ].map((qObj) => (
                        <button
                          key={qObj.key}
                          onClick={() => setSelectedQualQuestion(qObj.key)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all truncate border cursor-pointer ${
                            selectedQualQuestion === qObj.key
                              ? "bg-brand-red border-brand-red text-white"
                              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200/70 text-neutral-700"
                          }`}
                        >
                          {qObj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* READ RESPONSES COLUMN */}
                  <div className="md:col-span-3 space-y-4">
                    {/* Search & Filter within responses */}
                    <div className="bg-white p-4 border border-neutral-200 rounded-xl flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Buscar palavras-chave nas respostas..."
                          value={qualSearchText}
                          onChange={(e) => setQualSearchText(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 border border-neutral-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="text-xs font-mono font-bold uppercase text-neutral-400">
                        {selectedQualQuestion}
                      </div>
                    </div>

                    {/* Submissions text blocks list */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {submissions
                        .filter(s => {
                          const value = s[selectedQualQuestion];
                          return value && (!qualSearchText || String(value).toLowerCase().includes(qualSearchText.toLowerCase()));
                        })
                        .map((s) => (
                          <div 
                            key={s.id} 
                            className={`bg-white p-5 border rounded-xl space-y-3 shadow-xs transition-all ${s.destaqueRelatorio ? 'border-amber-400/80 bg-amber-50/10' : 'border-neutral-200/80'}`}
                          >
                            <div className="flex items-start justify-between border-b border-neutral-100 pb-2">
                              <div>
                                <span className="text-xs font-bold text-neutral-800">{s.nome}</span>
                                <span className="block text-[10px] text-neutral-500 font-mono">{s.cargo} — {s.empresaInstituicao} ({s.cidade}, {s.pais})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleHighlightDirect(s)}
                                  className={`p-1.5 rounded-md border text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                                    s.destaqueRelatorio 
                                      ? "bg-amber-100 border-amber-300 text-amber-800" 
                                      : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${s.destaqueRelatorio ? 'fill-amber-400 text-amber-600' : ''}`} />
                                  <span>{s.destaqueRelatorio ? "Destacado" : "Destacar"}</span>
                                </button>

                                <button
                                  onClick={() => handleCopyToClipboard(s[selectedQualQuestion])}
                                  className="p-1.5 bg-neutral-50 border border-neutral-200 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
                                  title="Copiar texto completo"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => openEditAdminFields(s)}
                                  className="p-1.5 bg-neutral-50 border border-neutral-200 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors font-mono font-bold text-[10px]"
                                >
                                  Curar / Tags
                                </button>
                              </div>
                            </div>

                            <p className="text-xs leading-relaxed text-neutral-700 font-sans italic bg-neutral-50/50 p-3 rounded-lg border border-neutral-100">
                              "{s[selectedQualQuestion]}"
                            </p>

                            {/* Tags list if any */}
                            {s.adminTags && s.adminTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {s.adminTags.map((tag: string) => (
                                  <span key={tag} className="bg-brand-red/10 text-brand-red text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-brand-red/15">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                      {submissions.filter(s => {
                        const value = s[selectedQualQuestion];
                        return value && (!qualSearchText || String(value).toLowerCase().includes(qualSearchText.toLowerCase()));
                      }).length === 0 && (
                        <p className="text-xs text-neutral-400 italic text-center py-12">
                          Nenhuma resposta encontrada para esta busca ou pergunta.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: EXPORTATION & INFO */}
            {activeTab === "config" && (
              <div className="space-y-6 animate-fade-in" id="admin-view-config">
                <div className="border-b border-neutral-200/80 pb-4">
                  <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                    Exportações & Informações
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Extraia todas as respostas do formulário e dados curados em formatos estruturados prontos para análises externas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Options */}
                  <div className="bg-white p-6 border border-neutral-200 rounded-xl space-y-4">
                    <h3 className="text-sm font-display font-black text-neutral-800 uppercase tracking-tight">
                      Extração de Arquivos
                    </h3>
                    <p className="text-xs text-neutral-500">
                      O arquivo CSV gerado inclui caracteres especiais em UTF-8 compatíveis com Microsoft Excel e delimitados por ponto-e-vírgula (;).
                    </p>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        <span>Exportar planilha CSV completa</span>
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleExportJSON}
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-mono font-bold uppercase tracking-wider text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        <span>Exportar dados em formato JSON</span>
                        <CodeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* System metadata & rules */}
                  <div className="bg-white p-6 border border-neutral-200 rounded-xl space-y-4">
                    <h3 className="text-sm font-display font-black text-neutral-800 uppercase tracking-tight">
                      Estrutura do Banco de Dados
                    </h3>
                    <div className="space-y-2 text-xs text-neutral-600 font-mono">
                      <div className="flex justify-between border-b border-neutral-100 pb-1">
                        <span>Serviço Database</span>
                        <span className="font-bold text-neutral-800">Firebase Firestore</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-100 pb-1">
                        <span>Coleção Principal</span>
                        <span className="font-bold text-neutral-800">forum_nikkei_respostas</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-100 pb-1">
                        <span>Coleção Usuários</span>
                        <span className="font-bold text-neutral-800">admin_users</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-100 pb-1">
                        <span>Sincronização Local</span>
                        <span className="font-bold text-emerald-600">Ativa (respostas.json)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Segurança Regulada</span>
                        <span className="font-bold text-brand-red">firestore.rules</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: USUARIOS ADMIN */}
            {activeTab === "usuarios" && (
              <div className="space-y-6 animate-fade-in" id="admin-view-usuarios">
                <div className="border-b border-neutral-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-display font-black text-neutral-800 uppercase tracking-tight">
                      Usuários & Permissões Administradoras
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Gerencie quem tem autorização para acessar os dados e indicadores consolidados do Fórum.
                    </p>
                  </div>
                  <button
                    onClick={fetchAdminUsers}
                    disabled={usersLoading}
                    className="self-start md:self-auto px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-mono font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {usersLoading ? "Carregando..." : "Atualizar Lista"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Register/Pre-authorize admin */}
                  <div className="bg-white p-5 border border-neutral-200 rounded-xl space-y-4">
                    <div className="border-b border-neutral-100 pb-2">
                      <h3 className="text-sm font-display font-black text-neutral-800 uppercase tracking-tight flex items-center gap-2">
                        <Plus className="w-4 h-4 text-brand-red" />
                        Pré-Autorizar Administrador
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Adicione um e-mail para que ele tenha acesso imediato ao logar.
                      </p>
                    </div>

                    <form onSubmit={handleAddAdminUser} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
                          placeholder="Ex: Eduardo Nomura"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                          E-mail Administrativo
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 focus:outline-none"
                          placeholder="Ex: nomura.eduardo@gmail.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                          Nível de Hierarquia (Perfil)
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-brand-red focus:outline-none"
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value as "admin" | "admin_master")}
                        >
                          <option value="admin">Administrador (admin)</option>
                          <option value="admin_master">Master Admin (admin_master)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand-red hover:bg-brand-red-hover text-white font-mono font-bold uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Autorizar E-mail
                      </button>
                    </form>
                  </div>

                  {/* Right Column: List of admin users */}
                  <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                      <span className="text-xs font-mono font-bold text-neutral-600">
                        Administradores Cadastrados ({adminUsers.length})
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      {usersLoading ? (
                        <div className="p-8 text-center text-xs text-neutral-400 font-mono">
                          Carregando lista de administradores do Firestore...
                        </div>
                      ) : adminUsers.length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-400 font-mono">
                          Nenhum usuário administrador cadastrado no momento.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                              <th className="p-3 pl-4">Nome & Contato</th>
                              <th className="p-3">Hierarquia</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right pr-4">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 text-xs">
                            {adminUsers.map((user) => {
                              const isSelf = user.uid === currentUser?.uid;
                              const isPreAuth = user.uid.startsWith("email_");
                              return (
                                <tr key={user.uid} className="hover:bg-neutral-50/50 transition-colors">
                                  <td className="p-3 pl-4">
                                    <div className="font-bold text-neutral-800 flex items-center gap-1.5 font-sans">
                                      {user.nome}
                                      {isSelf && (
                                        <span className="bg-neutral-100 text-neutral-600 text-[8px] px-1 py-0.2 rounded uppercase font-mono font-bold">Você</span>
                                      )}
                                      {isPreAuth && (
                                        <span className="bg-amber-50 text-amber-600 border border-amber-200/55 text-[8px] px-1 py-0.2 rounded uppercase font-mono font-bold">Aguardando login</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 font-mono">{user.email}</div>
                                  </td>
                                  <td className="p-3">
                                    <select
                                      disabled={isSelf}
                                      className="px-1.5 py-0.5 border border-neutral-200 rounded text-[11px] bg-white focus:outline-none font-medium cursor-pointer"
                                      value={user.perfil}
                                      onChange={(e) => handleUpdateUserRole(user, e.target.value as "admin" | "admin_master")}
                                    >
                                      <option value="admin">Admin</option>
                                      <option value="admin_master">Admin Master</option>
                                    </select>
                                  </td>
                                  <td className="p-3">
                                    <button
                                      disabled={isSelf}
                                      onClick={() => handleToggleUserActive(user)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                                        user.ativo
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70"
                                      } ${isSelf ? "opacity-75 cursor-not-allowed" : ""}`}
                                    >
                                      {user.ativo ? "● Ativo" : "○ Inativo"}
                                    </button>
                                  </td>
                                  <td className="p-3 text-right pr-4">
                                    <button
                                      disabled={isSelf}
                                      onClick={async () => {
                                        if (confirm(`Tem certeza de que deseja remover a autorização de ${user.nome}?`)) {
                                          try {
                                            const docRef = doc(db, "admin_users", user.uid);
                                            await deleteDoc(docRef);
                                            alert("Autorização de administrador removida!");
                                            fetchAdminUsers();
                                          } catch (err) {
                                            console.error("Erro ao remover usuário:", err);
                                            alert("Erro ao remover.");
                                          }
                                        }
                                      }}
                                      className={`p-1.5 rounded text-neutral-400 transition-colors ${
                                        isSelf ? "opacity-30 cursor-not-allowed" : "hover:bg-red-50 hover:text-brand-red cursor-pointer"
                                      }`}
                                      title="Excluir permissão"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* MODAL / DRAWER FOR CURATOR DETAILS AND INTERNAL FIELDS */}
      {selectedSubmission && isEditingAdminFields && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="inline-block bg-brand-red/10 text-brand-red font-mono font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded border border-brand-red/15">
                  ID: {selectedSubmission.id}
                </span>
                <h3 className="text-base font-display font-black text-neutral-800 uppercase mt-1 leading-tight">
                  Curadoria & Respostas de: {selectedSubmission.nome}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditingAdminFields(false)}
                className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 flex-1">
              
              {/* CURATOR INTERNAL CLASSIFICATION SECTION */}
              <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
                  <Sparkles className="w-4 h-4 text-brand-red" />
                  <span>Análise e Classificação Interna REN Brasil</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status de Análise */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Status da Análise
                    </label>
                    <select
                      value={statusAnalise}
                      onChange={(e) => setStatusAnalise(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700 focus:outline-none focus:border-brand-red"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em análise">Em Análise</option>
                      <option value="analisado">Analisado</option>
                      <option value="selecionado para relatório">Destaque Relatório</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  {/* Marcar como Destaque */}
                  <div className="space-y-1 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setDestaqueRelatorio(!destaqueRelatorio)}
                      className={`w-full py-2.5 px-3 rounded-lg border text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        destaqueRelatorio 
                          ? 'bg-amber-100 border-amber-300 text-amber-800' 
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${destaqueRelatorio ? 'fill-amber-400 text-amber-600' : ''}`} />
                      <span>{destaqueRelatorio ? "Destacado para Relatório" : "Não Destacado"}</span>
                    </button>
                  </div>

                  {/* Date of Submission */}
                  <div className="space-y-1 font-mono text-[11px] text-neutral-500 flex flex-col justify-center">
                    <span>Enviado em: {selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleString("pt-BR") : "Recent"}</span>
                    <span>Atualizado em: {selectedSubmission.updatedAt ? new Date(selectedSubmission.updatedAt).toLocaleString("pt-BR") : "Recent"}</span>
                  </div>
                </div>

                {/* Tags Manager */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Tags de Classificação Qualitativa
                  </label>
                  
                  {/* Existing Tags List */}
                  <div className="flex flex-wrap gap-1.5">
                    {adminTags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center gap-1 bg-brand-red/10 text-brand-red border border-brand-red/15 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      >
                        <span>{tag}</span>
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-800 focus:outline-none">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {adminTags.length === 0 && <span className="text-xs text-neutral-400 italic">Nenhuma tag adicionada.</span>}
                  </div>

                  {/* Preset Quick Select */}
                  <div className="space-y-1 pt-1">
                    <span className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Presets Rápidos</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!adminTags.includes(tag)) {
                              setAdminTags([...adminTags, tag]);
                            }
                          }}
                          className="bg-neutral-200/60 hover:bg-neutral-200 text-neutral-600 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Tag Input */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="text"
                      placeholder="Adicionar tag manual..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="px-3 py-1.5 border border-neutral-200 rounded-md text-xs focus:outline-none focus:border-brand-red max-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Observações da equipe REN */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Anotações e Observações Internas da Equipe REN Brasil
                  </label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ex: Direcionar este depoimento para a introdução do capítulo de Kaizen. Contato estratégico..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* SAVED USER FORM ANSWERS ACCORDING TO USER REQUIREMENTS */}
              <div className="space-y-6">
                
                {/* Section 1: Profile */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 1 — Perfil e Corporativo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Nome</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.nome}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">E-mail</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.email}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Empresa / Instituição</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.empresaInstituicao}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Cargo</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.cargo}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Cidade / País</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.cidade}, {selectedSubmission.pais}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Experiencia */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 2 — Experiência no Fórum
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Avaliação Geral do Fórum</span>
                      <span className="font-bold text-neutral-800 bg-red-50 text-brand-red border border-brand-red/10 px-2 py-0.5 rounded-full">
                        ★ {selectedSubmission.avaliacaoGeral} / 10
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Atividade com maior valor agregado</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.atividadeMaiorValor}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">O que mais chamou atenção</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.destaqueForum}"</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Aprendizados */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 3 — Aprendizados e Cultura
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Três principais aprendizados</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.tresAprendizados}"</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Ideia mais impactante</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.ideiaMaisImpactante}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Aspecto da cultura japonesa / nikkei</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.aspectoCulturaJaponesa}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Prática que pretende aplicar</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.praticaPretendeAplicar}"</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Aplicacao Pratica */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 4 — Aplicação Prática
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Pretende aplicar os conhecimentos?</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.pretendeAplicarConhecimento}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Qual conhecimento pretende aplicar</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.qualConhecimentoAplicar}"</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Desafios de implementação</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.desafiosImplementacao}"</p>
                    </div>
                  </div>
                </div>

                {/* Section 5 & 6: Cooperacao */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 5 & 6 — Cooperação Bilateral e América Latina
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Oportunidades de cooperação Brasil-Japão</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.oportunidadesBrasilJapao}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Como a REN Brasil pode contribuir</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.comoRenPodeContribuir}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Oportunidades com a América Latina</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.oportunidadesAmericaLatina}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Projeto colaborativo sugerido</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.projetoColaborativo}"</p>
                    </div>
                  </div>
                </div>

                {/* Section 7 & 8: Networking & Temas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 7 & 8 — Networking e Temas Prioritários
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Estabeleceu novos contatos de negócios?</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.estabeleceuNovosContatos}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Contatos podem gerar futuras parcerias?</span>
                      <span className="font-bold text-neutral-800">{selectedSubmission.contatosPodemGerarParcerias}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Temas prioritários assinalados</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedSubmission.temasPrioritarios && selectedSubmission.temasPrioritarios.map((theme: string) => (
                          <span key={theme} className="bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full text-[10px] text-neutral-600">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 9 & 10: Recomendacoes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 9 & 10 — Recomendações e Reflexões
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">O que não pode faltar na próxima edição</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.naoPodeFaltar}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">O que poderia ser aprimorado</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.pontosAprimorar}"</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Reflexão final sobre a experiência</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.reflexaoFinal}"</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Recomendação direta para a REN Brasil</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.recomendacaoRenBrasil}"</p>
                    </div>
                  </div>
                </div>

                {/* Section 11 & 12: Futuro & Legado */}
                <div className="space-y-3 text-xs">
                  <h4 className="text-xs font-mono font-bold text-brand-red uppercase border-b border-neutral-100 pb-1">
                    Seção 11 & 12 — Visão de Futuro & Legado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Sua Visão do Cenário em 2035</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.visao2035}"</p>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Sugestão de inovação tecnológica para próxima edição</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.inovacaoProximaEdicao}"</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-neutral-400 font-mono text-[9px] uppercase">Mensagem de Legado para futuras gerações</span>
                      <p className="text-neutral-700 italic mt-0.5">"{selectedSubmission.mensagemLegado}"</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer / Actions */}
            <div className="p-6 border-t border-neutral-100 flex items-center justify-between sticky bottom-0 bg-white z-10">
              <button
                type="button"
                onClick={() => handleCopyToClipboard(JSON.stringify(selectedSubmission, null, 2))}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-mono font-bold uppercase transition-colors"
              >
                Copiar Ficha JSON
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAdminFields(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-mono font-bold uppercase transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminFields}
                  className="px-5 py-2 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Salvar Curadoria
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple internal icon for code
function CodeIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}
