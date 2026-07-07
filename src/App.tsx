/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Sparkles,
  User,
  Star,
  Lightbulb,
  Compass,
  Share2,
  Award,
  AlertTriangle,
  Heart,
  Info,
  Building,
  Mail,
  MapPin,
  Flame,
  Check
} from "lucide-react";

import {
  FormResponse,
  PAISES_OPTIONS,
  ATIVIDADES_OPTIONS,
  APLICAR_CONHECIMENTO_OPTIONS,
  TEMAS_PRIORITARIOS_OPTIONS,
  DEFAULT_FORM_VALUES,
  OBRIGATORIOS
} from "./types";

import ProgressIndicator from "./components/ProgressIndicator";
import WelcomeScreen from "./components/WelcomeScreen";
import ReviewScreen from "./components/ReviewScreen";
import SuccessScreen from "./components/SuccessScreen";
import Logo from "./components/Logo";

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormResponse>({ ...DEFAULT_FORM_VALUES });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftData, setDraftData] = useState<FormResponse | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // Step names corresponding to stages 1 to 10
  const stepNames = [
    "Apresentação",
    "Perfil do Participante",
    "Experiência no Fórum",
    "Principais Aprendizados",
    "Aplicação Prática",
    "Cooperação Internacional",
    "Networking e Temas",
    "Recomendações e Legado",
    "Revisão das Respostas",
    "Sucesso"
  ];

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("forum_nikkei_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.nome) {
          setHasDraft(true);
          setDraftData(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao ler rascunho:", e);
    }
  }, []);

  // Save draft when data changes (only when form has started)
  useEffect(() => {
    if (step > 1 && step < 10) {
      try {
        localStorage.setItem("forum_nikkei_draft", JSON.stringify(formData));
      } catch (e) {
        console.warn("Não foi possível salvar o rascunho localmente (localStorage bloqueado):", e);
      }
    }
  }, [formData, step]);

  const handleStart = (resume: boolean) => {
    if (resume && draftData) {
      setFormData({ ...draftData });
    } else {
      setFormData({ ...DEFAULT_FORM_VALUES });
      try {
        localStorage.removeItem("forum_nikkei_draft");
      } catch (e) {
        console.warn("Não foi possível remover o rascunho localmente (localStorage bloqueado):", e);
      }
    }
    setStep(2); // Move to Perfil
    setErrors({});
  };

  const handleFieldChange = (field: keyof FormResponse, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear field-specific error
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateStep = (currentStep: number, shouldSetState = true): boolean => {
    const currentErrors: Record<string, string> = {};

    if (currentStep === 2) {
      // Perfil
      if (!formData.nome.trim()) currentErrors.nome = "Nome é obrigatório.";
      if (!formData.email.trim()) {
        currentErrors.email = "E-mail é obrigatório.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          currentErrors.email = "Formato de e-mail inválido.";
        }
      }
      if (!formData.empresaInstituicao.trim()) currentErrors.empresaInstituicao = "Empresa/Instituição é obrigatória.";
      if (!formData.cargo.trim()) currentErrors.cargo = "Cargo é obrigatório.";
      if (!formData.cidade.trim()) currentErrors.cidade = "Cidade é obrigatória.";
      if (!formData.pais) currentErrors.pais = "País é obrigatório.";
    }

    if (currentStep === 3) {
      // Experiência
      if (!formData.avaliacaoGeral) currentErrors.avaliacaoGeral = "Avaliação é obrigatória.";
      if (!formData.atividadeMaiorValor) currentErrors.atividadeMaiorValor = "Selecione a atividade de maior valor.";
      if (!formData.destaqueForum.trim()) currentErrors.destaqueForum = "Destaque do fórum é obrigatório.";
    }

    if (currentStep === 4) {
      // Aprendizados
      if (!formData.tresAprendizados.trim()) currentErrors.tresAprendizados = "Principais aprendizados são obrigatórios.";
      if (!formData.ideiaMaisImpactante.trim()) currentErrors.ideiaMaisImpactante = "A ideia mais impactante é obrigatória.";
      if (!formData.aspectoCulturaJaponesa.trim()) currentErrors.aspectoCulturaJaponesa = "O aspecto de cultura japonesa é obrigatório.";
    }

    if (currentStep === 5) {
      // Aplicação Prática
      if (!formData.pretendeAplicarConhecimento) currentErrors.pretendeAplicarConhecimento = "Selecione se pretende aplicar o conhecimento.";
    }

    if (currentStep === 6) {
      // Cooperação
      if (!formData.oportunidadesBrasilJapao.trim()) currentErrors.oportunidadesBrasilJapao = "Oportunidades Brasil–Japão são obrigatórias.";
      if (!formData.comoRenPodeContribuir.trim()) currentErrors.comoRenPodeContribuir = "Indique como o REN Brasil pode contribuir.";
      if (!formData.oportunidadesAmericaLatina.trim()) currentErrors.oportunidadesAmericaLatina = "Oportunidades latino-americanas são obrigatórias.";
    }

    if (currentStep === 7) {
      // Networking & Temas Prioritários
      if (!formData.temasPrioritarios || formData.temasPrioritarios.length === 0) {
        currentErrors.temasPrioritarios = "Selecione ao menos um tema prioritário.";
      }
    }

    if (currentStep === 8) {
      // Recomendações & Legado
      if (!formData.naoPodeFaltar.trim()) currentErrors.naoPodeFaltar = "Este campo é obrigatório.";
      if (!formData.pontosAprimorar.trim()) currentErrors.pontosAprimorar = "Pontos a aprimorar são obrigatórios.";
      if (!formData.reflexaoFinal.trim()) currentErrors.reflexaoFinal = "Sua reflexão final é obrigatória.";
      if (!formData.recomendacaoRenBrasil.trim()) currentErrors.recomendacaoRenBrasil = "Recomendações para o REN Brasil são obrigatórias.";
      if (!formData.visao2035.trim()) currentErrors.visao2035 = "Sua visão 2035 é obrigatória.";
      if (!formData.inovacaoProximaEdicao.trim()) currentErrors.inovacaoProximaEdicao = "Sugestão de inovação é obrigatória.";
      if (!formData.mensagemLegado.trim()) currentErrors.mensagemLegado = "Sua mensagem de legado é obrigatória.";
    }

    if (shouldSetState) {
      setErrors(currentErrors);
    }
    return Object.keys(currentErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        console.warn("window.scrollTo não disponível:", e);
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        console.warn("window.scrollTo não disponível:", e);
      }
    }
  };

  const handleJumpToStep = (targetStep: number) => {
    setStep(targetStep);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.warn("window.scrollTo não disponível:", e);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/respostas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        setSubmitMessage(result.message);
        try {
          localStorage.removeItem("forum_nikkei_draft");
        } catch (e) {
          console.warn("Não foi possível remover o rascunho (localStorage bloqueado):", e);
        }
        setStep(10); // Success screen
      } else {
        alert(result.message || "Ocorreu um erro ao enviar.");
      }
    } catch (e) {
      console.error("Erro ao enviar:", e);
      alert("Falha de conexão com o servidor. Verifique sua rede e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_FORM_VALUES });
    setStep(1);
    setErrors({});
    setHasDraft(false);
    setDraftData(null);
  };

  const toggleTemaPrioritario = (tema: string) => {
    const current = formData.temasPrioritarios || [];
    let updated;
    if (current.includes(tema)) {
      updated = current.filter((t) => t !== tema);
    } else {
      updated = [...current, tema];
    }
    handleFieldChange("temasPrioritarios", updated);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans" id="app-root">
      {/* Top bar with flags & high-contrast institucional header */}
      <header className="bg-white border-b border-neutral-200/80 py-3 px-6 sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Main brand logo */}
            <Logo variant="horizontal" className="h-10" />
            
            {/* Title / Description details (only visible on medium screens and up to keep it clean) */}
            <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />
            <div className="hidden md:flex flex-col">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-brand-red leading-tight">
                Fórum Empresarial Nikkei Brasil–Japão
              </span>
              <h1 className="text-xs font-display font-bold text-neutral-500 tracking-tight">
                Coleta de Aprendizados & Percepções 2026
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200/60 rounded-full px-3 py-1.5 text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            Levantamento 2026 — Ativo
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {step === 1 && (
          <WelcomeScreen
            onStart={handleStart}
            hasDraft={hasDraft}
            draftData={draftData}
          />
        )}

        {step > 1 && step < 10 && (
          <div className="w-full max-w-6xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] transition-all">
            
            {/* LEFT SIDEBAR: Interactive Step list */}
            <aside className="hidden md:flex md:w-80 lg:w-90 bg-brand-dark text-white p-8 flex-col justify-between shrink-0 border-r border-neutral-800">
              <div className="space-y-8">
                {/* Brand / Logo */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase text-brand-gold">
                    <Sparkles className="w-3 h-3" />
                    PESQUISA OFICIAL
                  </div>
                  <h2 className="text-lg font-display font-black text-white leading-tight">
                    Sistematização de Aprendizados
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Insira suas percepções para o Relatório Executivo Final.
                  </p>
                  <div className="h-1 w-12 bg-brand-red mt-2 rounded-full" />
                </div>

                {/* Vertical Stepper Steps */}
                <nav className="space-y-3">
                  {stepNames.slice(1, 9).map((name, idx) => {
                    const stepNum = idx + 2;
                    const isActive = stepNum === step;
                    const isCompleted = stepNum < step;
                    
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (stepNum < step || stepNum <= 9) {
                            handleJumpToStep(stepNum);
                          }
                        }}
                        disabled={stepNum > step}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all text-xs font-bold border border-transparent cursor-pointer ${
                          isActive
                            ? "bg-white/10 border-brand-red/30 text-white shadow-sm font-bold"
                            : isCompleted
                            ? "text-neutral-300 hover:bg-white/5"
                            : "text-neutral-500 cursor-not-allowed"
                        }`}
                      >
                        {/* Step circle */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 transition-colors ${
                          isActive
                            ? "bg-brand-red text-white"
                            : isCompleted
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-neutral-800 text-neutral-500 border border-neutral-700/50"
                        }`}>
                          {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                        </div>
                        <span className="truncate">{name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-neutral-800 space-y-1 text-[10px] text-neutral-500 font-mono">
                <p>REDE NIKKEI — REN BRASIL</p>
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Fórum Empresarial 2026</span>
                  <span>v1.2.0</span>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN PANEL: Active Form View */}
            <div className="flex-1 bg-white p-6 sm:p-10 flex flex-col justify-between">
              
              {/* Mobile Stepper Header */}
              <ProgressIndicator
                currentStep={step}
                totalSteps={stepNames.length}
                stepNames={stepNames}
              />

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6 flex-1 flex flex-col justify-between" id="forum-survey-form">
                {/* TELA 2: Perfil do Participante */}
              {step === 2 && (
                <div className="space-y-6" id="step-perfil">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-700" />
                      Seção 1 — Perfil do Participante
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Por favor, preencha seus dados de identificação corporativa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <label htmlFor="nome" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleFieldChange("nome", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.nome
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Carlos Sato"
                      />
                      {errors.nome && <p className="text-xs text-red-500 font-medium">{errors.nome}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        E-mail Corporativo <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                            errors.email
                              ? "border-red-400 focus:ring-red-200"
                              : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                          }`}
                          placeholder="Ex: carlos.sato@empresa.com"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                    </div>

                    {/* Empresa / Instituição */}
                    <div className="space-y-2">
                      <label htmlFor="empresa" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Empresa / Instituição <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="empresa"
                        value={formData.empresaInstituicao}
                        onChange={(e) => handleFieldChange("empresaInstituicao", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.empresaInstituicao
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Mitsubishi Brasil / REN Brasil"
                      />
                      {errors.empresaInstituicao && (
                        <p className="text-xs text-red-500 font-medium">{errors.empresaInstituicao}</p>
                      )}
                    </div>

                    {/* Cargo */}
                    <div className="space-y-2">
                      <label htmlFor="cargo" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Cargo / Função <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => handleFieldChange("cargo", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.cargo
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Diretor de Relações Internacionais"
                      />
                      {errors.cargo && <p className="text-xs text-red-500 font-medium">{errors.cargo}</p>}
                    </div>

                    {/* Cidade */}
                    <div className="space-y-2">
                      <label htmlFor="cidade" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Cidade <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleFieldChange("cidade", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.cidade
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: São Paulo"
                      />
                      {errors.cidade && <p className="text-xs text-red-500 font-medium">{errors.cidade}</p>}
                    </div>

                    {/* Pais */}
                    <div className="space-y-2">
                      <label htmlFor="pais" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        País <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="pais"
                        value={formData.pais}
                        onChange={(e) => handleFieldChange("pais", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                          errors.pais
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                      >
                        {PAISES_OPTIONS.map((pais) => (
                          <option key={pais} value={pais}>
                            {pais}
                          </option>
                        ))}
                      </select>
                      {errors.pais && <p className="text-xs text-red-500 font-medium">{errors.pais}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* TELA 3: Experiência no Fórum */}
              {step === 3 && (
                <div className="space-y-6" id="step-experiencia">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Seção 2 — Experiência no Fórum
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Queremos saber sua percepção geral sobre o evento e quais atividades foram mais marcantes.
                    </p>
                  </div>

                  {/* Avaliação Geral (1 to 10 Scale) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Avaliação Geral do Evento (Nota de 1 a 10) <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-4 rounded-xl border border-gray-100">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = formData.avaliacaoGeral === num;
                        return (
                          <button
                            type="button"
                            key={num}
                            onClick={() => handleFieldChange("avaliacaoGeral", num)}
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-all ${
                              isSelected
                                ? "bg-red-600 text-white scale-110 shadow-md shadow-red-200"
                                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between px-1 text-[10px] text-gray-400 uppercase font-mono">
                      <span>Pouco Satisfeito</span>
                      <span>Extremamente Satisfeito</span>
                    </div>
                    {errors.avaliacaoGeral && <p className="text-xs text-red-500 font-medium">{errors.avaliacaoGeral}</p>}
                  </div>

                  {/* Atividade de Maior Valor */}
                  <div className="space-y-2">
                    <label htmlFor="atividade" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Atividade de Maior Valor <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="atividade"
                      value={formData.atividadeMaiorValor}
                      onChange={(e) => handleFieldChange("atividadeMaiorValor", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                        errors.atividadeMaiorValor
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                    >
                      <option value="">Selecione uma opção...</option>
                      {ATIVIDADES_OPTIONS.map((atv) => (
                        <option key={atv} value={atv}>
                          {atv}
                        </option>
                      ))}
                    </select>
                    {errors.atividadeMaiorValor && (
                      <p className="text-xs text-red-500 font-medium">{errors.atividadeMaiorValor}</p>
                    )}
                  </div>

                  {/* Destaque do Fórum */}
                  <div className="space-y-2">
                    <label htmlFor="destaqueForum" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Qual foi o principal destaque ou momento mais marcante para você? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="destaqueForum"
                      value={formData.destaqueForum}
                      onChange={(e) => handleFieldChange("destaqueForum", e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.destaqueForum
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="Ex: A palestra sobre inovação no Museu Toyota e as ricas conexões de liderança feitas no jantar de networking."
                    />
                    {errors.destaqueForum && <p className="text-xs text-red-500 font-medium">{errors.destaqueForum}</p>}
                  </div>
                </div>
              )}

              {/* TELA 4: Principais Aprendizados */}
              {step === 4 && (
                <div className="space-y-6" id="step-aprendizados">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-emerald-600" />
                      Seção 3 — Principais Aprendizados
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Sistematize as lições e ideias de maior impacto geradas ao longo do Fórum.
                    </p>
                  </div>

                  {/* Três principais aprendizados */}
                  <div className="space-y-2">
                    <label htmlFor="tresAprendizados" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Quais foram os seus três principais aprendizados durante o Fórum? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="tresAprendizados"
                      value={formData.tresAprendizados}
                      onChange={(e) => handleFieldChange("tresAprendizados", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.tresAprendizados
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="1. Importância do Lean para sucessão; 2. Métodos Kaizen aplicados à gestão ágil; 3. O papel da diplomacia Nikkei corporativa."
                    />
                    {errors.tresAprendizados && (
                      <p className="text-xs text-red-500 font-medium">{errors.tresAprendizados}</p>
                    )}
                  </div>

                  {/* Ideia mais impactante */}
                  <div className="space-y-2">
                    <label htmlFor="ideiaMaisImpactante" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Qual foi a ideia mais impactante ou inspiradora compartilhada? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="ideiaMaisImpactante"
                      value={formData.ideiaMaisImpactante}
                      onChange={(e) => handleFieldChange("ideiaMaisImpactante", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.ideiaMaisImpactante
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-ring-100"
                      }`}
                      placeholder="Ex: A palestra magna demonstrando a fusão de IA e governança ESG de forma prática."
                    />
                    {errors.ideiaMaisImpactante && (
                      <p className="text-xs text-red-500 font-medium">{errors.ideiaMaisImpactante}</p>
                    )}
                  </div>

                  {/* Aspecto Cultura Japonesa */}
                  <div className="space-y-2">
                    <label htmlFor="aspectoCulturaJaponesa" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Qual aspecto da cultura japonesa mais chamou sua atenção ou inspirou você? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="aspectoCulturaJaponesa"
                      value={formData.aspectoCulturaJaponesa}
                      onChange={(e) => handleFieldChange("aspectoCulturaJaponesa", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.aspectoCulturaJaponesa
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="Ex: O conceito de Omotenashi (hospitalidade altruísta) e a disciplina de longo prazo aplicada nas empresas de tradição centenária."
                    />
                    {errors.aspectoCulturaJaponesa && (
                      <p className="text-xs text-red-500 font-medium">{errors.aspectoCulturaJaponesa}</p>
                    )}
                  </div>

                  {/* Pratica Pretende Aplicar */}
                  <div className="space-y-2">
                    <label htmlFor="praticaPretendeAplicar" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Existe alguma prática ou filosofia específica que você pretende levar para sua organização? (Opcional)
                    </label>
                    <textarea
                      id="praticaPretendeAplicar"
                      value={formData.praticaPretendeAplicar}
                      onChange={(e) => handleFieldChange("praticaPretendeAplicar", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Pretendo aplicar o ciclo PDCA acoplado aos princípios de transparência Kaizen nas reuniões de diretoria semanais."
                    />
                  </div>
                </div>
              )}

              {/* TELA 5: Aplicação Prática */}
              {step === 5 && (
                <div className="space-y-6" id="step-aplicacao-pratica">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-700" />
                      Seção 4 — Aplicação Prática
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Queremos mapear a transição entre o conhecimento gerado e a aplicação de negócios no dia a dia.
                    </p>
                  </div>

                  {/* Pretende Aplicar Conhecimento */}
                  <div className="space-y-2">
                    <label htmlFor="pretendeAplicar" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Você pretende aplicar os conhecimentos adquiridos no Fórum no seu dia a dia profissional? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="pretendeAplicar"
                      value={formData.pretendeAplicarConhecimento}
                      onChange={(e) => handleFieldChange("pretendeAplicarConhecimento", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                        errors.pretendeAplicarConhecimento
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                    >
                      <option value="">Selecione uma opção...</option>
                      {APLICAR_CONHECIMENTO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.pretendeAplicarConhecimento && (
                      <p className="text-xs text-red-500 font-medium">{errors.pretendeAplicarConhecimento}</p>
                    )}
                  </div>

                  {/* Qual Conhecimento Aplicar */}
                  <div className="space-y-2">
                    <label htmlFor="qualConhecimento" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Se sim ou talvez, qual conhecimento específico você pretende aplicar? (Opcional)
                    </label>
                    <textarea
                      id="qualConhecimento"
                      value={formData.qualConhecimentoAplicar}
                      onChange={(e) => handleFieldChange("qualConhecimentoAplicar", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Metodologias ágeis inspiradas no Lean Manufacturing e parcerias tecnológicas apresentadas no evento."
                    />
                  </div>

                  {/* Desafios de Implementação */}
                  <div className="space-y-2">
                    <label htmlFor="desafios" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Quais são os principais desafios que você vislumbra para essa implementação? (Opcional)
                    </label>
                    <textarea
                      id="desafios"
                      value={formData.desafiosImplementacao}
                      onChange={(e) => handleFieldChange("desafiosImplementacao", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Falta de cultura organizacional adaptável e recursos financeiros limitados para novas soluções de IA."
                    />
                  </div>
                </div>
              )}

              {/* TELA 6: Cooperação Brasil–Japão e Latino-Americana */}
              {step === 6 && (
                <div className="space-y-6" id="step-cooperacao">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-600" />
                      Seções 5 e 6 — Cooperação Internacional e Integração Latino-Americana
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Identificar e potencializar os laços bilaterais Brasil-Japão e a integração sul-americana.
                    </p>
                  </div>

                  {/* Oportunidades Brasil–Japão */}
                  <div className="space-y-2">
                    <label htmlFor="oportunidadesBrasilJapao" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Quais são as principais oportunidades de cooperação entre Brasil e Japão identificadas? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="oportunidadesBrasilJapao"
                      value={formData.oportunidadesBrasilJapao}
                      onChange={(e) => handleFieldChange("oportunidadesBrasilJapao", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.oportunidadesBrasilJapao
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="Ex: Intercâmbio de tecnologia verde, investimentos mútuos em semicondutores e projetos de descarbonização energética."
                    />
                    {errors.oportunidadesBrasilJapao && (
                      <p className="text-xs text-red-500 font-medium">{errors.oportunidadesBrasilJapao}</p>
                    )}
                  </div>

                  {/* Como REN Brasil pode contribuir */}
                  <div className="space-y-2">
                    <label htmlFor="comoRenBrasil" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Como a Rede Nikkei (REN Brasil) pode contribuir para viabilizar essas oportunidades? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comoRenBrasil"
                      value={formData.comoRenPodeContribuir}
                      onChange={(e) => handleFieldChange("comoRenPodeContribuir", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.comoRenPodeContribuir
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="Ex: Criando pontes ativas de networking entre startups brasileiras e investidores tradicionais japoneses, organizando delegações de tecnologia."
                    />
                    {errors.comoRenPodeContribuir && (
                      <p className="text-xs text-red-500 font-medium">{errors.comoRenPodeContribuir}</p>
                    )}
                  </div>

                  {/* Oportunidades América Latina */}
                  <div className="space-y-2">
                    <label htmlFor="oportunidadesLatAm" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Quais são as principais oportunidades para maior integração latino-americana? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="oportunidadesLatAm"
                      value={formData.oportunidadesAmericaLatina}
                      onChange={(e) => handleFieldChange("oportunidadesAmericaLatina", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                        errors.oportunidadesAmericaLatina
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                      }`}
                      placeholder="Ex: Criar uma rota de intercâmbio de talentos e soluções entre as comunidades Nikkei da Argentina, Paraguai, Peru e Brasil."
                    />
                    {errors.oportunidadesAmericaLatina && (
                      <p className="text-xs text-red-500 font-medium">{errors.oportunidadesAmericaLatina}</p>
                    )}
                  </div>

                  {/* Projeto Colaborativo */}
                  <div className="space-y-2">
                    <label htmlFor="projetoColaborativo" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Você vislumbra algum projeto colaborativo específico? (Opcional)
                    </label>
                    <textarea
                      id="projetoColaborativo"
                      value={formData.projetoColaborativo}
                      onChange={(e) => handleFieldChange("projetoColaborativo", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Um marketplace ou hub unificado de inovação das comunidades Nikkei da América do Sul."
                    />
                  </div>
                </div>
              )}

              {/* TELA 7: Networking e Temas Prioritários */}
              {step === 7 && (
                <div className="space-y-6" id="step-networking">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-purple-600" />
                      Seções 7 e 8 — Networking e Temas Prioritários
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Registre as parcerias concebidas no evento e eleja as prioridades do ecossistema.
                    </p>
                  </div>

                  {/* Estabeleceu Novos Contatos */}
                  <div className="space-y-2">
                    <label htmlFor="novosContatos" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Você estabeleceu novos contatos de valor durante o Fórum? (Opcional)
                    </label>
                    <textarea
                      id="novosContatos"
                      value={formData.estabeleceuNovosContatos}
                      onChange={(e) => handleFieldChange("estabeleceuNovosContatos", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Sim, executivos seniores do setor automotivo e fundadores de startups Nikkei promissoras."
                    />
                  </div>

                  {/* Contatos Podem Gerar Parcerias */}
                  <div className="space-y-2">
                    <label htmlFor="parceriasFuturas" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Acredita que esses contatos podem gerar parcerias futuras ou novos negócios? (Opcional)
                    </label>
                    <textarea
                      id="parceriasFuturas"
                      value={formData.contatosPodemGerarParcerias}
                      onChange={(e) => handleFieldChange("contatosPodemGerarParcerias", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                      placeholder="Ex: Sim, já temos reuniões agendadas para discutir projetos bilaterais de P&D conjuntos."
                    />
                  </div>

                  {/* Temas Prioritários Checkbox Grid */}
                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                      Quais são os temas prioritários que o Fórum deve focar em próximas edições? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-400">Selecione todas as opções relevantes.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-gray-100 rounded-xl">
                      {TEMAS_PRIORITARIOS_OPTIONS.map((tema) => {
                        const isChecked = (formData.temasPrioritarios || []).includes(tema);
                        return (
                          <button
                            type="button"
                            key={tema}
                            onClick={() => toggleTemaPrioritario(tema)}
                            className={`flex items-center gap-3 p-3 text-left rounded-lg text-xs font-medium transition-all border ${
                              isChecked
                                ? "bg-white border-red-600 text-red-700 shadow-xs ring-1 ring-red-100"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                              isChecked ? "bg-red-600 border-red-600" : "bg-white border-gray-300"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="truncate">{tema}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.temasPrioritarios && (
                      <p className="text-xs text-red-500 font-medium">{errors.temasPrioritarios}</p>
                    )}
                  </div>
                </div>
              )}

              {/* TELA 8: Recomendações, Visão de Futuro e Legado */}
              {step === 8 && (
                <div className="space-y-6" id="step-recomendacoes-legado">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-700" />
                      Seções 9 a 12 — Recomendações, Visão de Futuro e Legado
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Registre sua visão estratégica de longo prazo para as relações Nikkei Brasil–Japão.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Não pode faltar */}
                    <div className="space-y-2">
                      <label htmlFor="naoPodeFaltar" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        O que NÃO pode faltar nas próximas edições? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="naoPodeFaltar"
                        value={formData.naoPodeFaltar}
                        onChange={(e) => handleFieldChange("naoPodeFaltar", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.naoPodeFaltar
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Rodadas de negócios pré-agendadas (pitching) e visitas técnicas mais aprofundadas em plantas industriais."
                      />
                      {errors.naoPodeFaltar && <p className="text-xs text-red-500 font-medium">{errors.naoPodeFaltar}</p>}
                    </div>

                    {/* Pontos a aprimorar */}
                    <div className="space-y-2">
                      <label htmlFor="pontosAprimorar" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Quais os principais pontos de aprimoramento? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="pontosAprimorar"
                        value={formData.pontosAprimorar}
                        onChange={(e) => handleFieldChange("pontosAprimorar", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.pontosAprimorar
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Gestão de tempo nos painéis da manhã e tradução simultânea mais precisa para termos técnicos."
                      />
                      {errors.pontosAprimorar && (
                        <p className="text-xs text-red-500 font-medium">{errors.pontosAprimorar}</p>
                      )}
                    </div>

                    {/* Reflexão final */}
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="reflexao" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Faça uma reflexão final sobre a sua participação <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reflexao"
                        value={formData.reflexaoFinal}
                        onChange={(e) => handleFieldChange("reflexaoFinal", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.reflexaoFinal
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Minha participação consolidou a urgência de as lideranças herdeiras adotarem ferramentas modernas de governança sem perder os valores nikkei."
                      />
                      {errors.reflexaoFinal && <p className="text-xs text-red-500 font-medium">{errors.reflexaoFinal}</p>}
                    </div>

                    {/* Recomendação REN Brasil */}
                    <div className="space-y-2">
                      <label htmlFor="recomendacaoRen" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Sua recomendação para o REN Brasil <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="recomendacaoRen"
                        value={formData.recomendacaoRenBrasil}
                        onChange={(e) => handleFieldChange("recomendacaoRenBrasil", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.recomendacaoRenBrasil
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Estabelecer um comitê fixo pós-fórum para acompanhar os memorandos de entendimento firmados."
                      />
                      {errors.recomendacaoRenBrasil && (
                        <p className="text-xs text-red-500 font-medium">{errors.recomendacaoRenBrasil}</p>
                      )}
                    </div>

                    {/* Visão 2035 */}
                    <div className="space-y-2">
                      <label htmlFor="visao" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Sua Visão 2035 para o ecossistema <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="visao"
                        value={formData.visao2035}
                        onChange={(e) => handleFieldChange("visao2035", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.visao2035
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Uma rede 100% digitalizada, integrada ao comércio asiático de alta tecnologia, gerando US$ 1B em novos negócios."
                      />
                      {errors.visao2035 && <p className="text-xs text-red-500 font-medium">{errors.visao2035}</p>}
                    </div>

                    {/* Inovação próxima edição */}
                    <div className="space-y-2">
                      <label htmlFor="inovacao" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Inovação tecnológica para a próxima edição <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="inovacao"
                        value={formData.inovacaoProximaEdicao}
                        onChange={(e) => handleFieldChange("inovacaoProximaEdicao", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.inovacaoProximaEdicao
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Tradução neural em tempo real por fones de ouvido inteligentes e crachás NFC interativos."
                      />
                      {errors.inovacaoProximaEdicao && (
                        <p className="text-xs text-red-500 font-medium">{errors.inovacaoProximaEdicao}</p>
                      )}
                    </div>

                    {/* Mensagem de Legado */}
                    <div className="space-y-2">
                      <label htmlFor="legado" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                        Mensagem de Legado para futuras gerações <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="legado"
                        value={formData.mensagemLegado}
                        onChange={(e) => handleFieldChange("mensagemLegado", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors.mensagemLegado
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-200 focus:border-red-600 focus:ring-red-100"
                        }`}
                        placeholder="Ex: Honrar os sacrifícios de nossos ancestrais nikkeis inovando corajosamente com ética e cooperação integrativa."
                      />
                      {errors.mensagemLegado && <p className="text-xs text-red-500 font-medium">{errors.mensagemLegado}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* TELA 9: Revisão das respostas */}
              {step === 9 && (
                <ReviewScreen
                  data={formData}
                  onJumpToStep={handleJumpToStep}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* Back & Next Navigation Controls */}
              {step > 1 && step < 9 && (
                <div className="flex items-center justify-between pt-6 border-t border-neutral-200/60 gap-4" id="navigation-controls">
                  <button
                    type="button"
                    onClick={handlePrev}
                    id="btn-nav-prev"
                    className="inline-flex items-center gap-2 px-5 py-3.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-neutral-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    id="btn-nav-next"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-brand-red/20 cursor-pointer"
                  >
                    Próximo Passo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Special return button if we jumped directly from Review screen */}
              {step > 1 && step < 9 && (
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(9)}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold uppercase tracking-widest hover:text-brand-red-hover cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Pular para Revisão Final
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {step === 10 && (
        <SuccessScreen data={formData} onReset={handleReset} />
      )}
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-neutral-200/80 py-6 px-6 text-center text-xs text-neutral-500 font-sans" id="app-footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center justify-center gap-1.5">
          Desenvolvido com
          <Heart className="w-4 h-4 text-brand-red fill-brand-red/20" />
          para o Fórum Empresarial Nikkei Brasil–Japão.
        </p>
        <div className="flex items-center gap-4 text-neutral-400 font-mono font-bold uppercase tracking-wider text-[10px]">
          <span>Rede Nikkei (REN Brasil)</span>
          <span>•</span>
          <span>Versão 1.2.0</span>
        </div>
      </div>
    </footer>
    </div>
  );
}
