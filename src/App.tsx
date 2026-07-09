/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, Lightbulb, Send, Sparkles, Star } from "lucide-react";
import {
  DEFAULT_FORM_VALUES,
  FormResponse,
  ATIVIDADES_OPTIONS,
  INICIATIVAS_OPTIONS,
  PROBABILIDADE_APLICACAO_OPTIONS
} from "./types";
import ProgressIndicator from "./components/ProgressIndicator";
import WelcomeScreen from "./components/WelcomeScreen";
import ReviewScreen from "./components/ReviewScreen";
import SuccessScreen from "./components/SuccessScreen";
import Logo from "./components/Logo";
import AdminArea from "./components/AdminArea";

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormResponse>({ ...DEFAULT_FORM_VALUES });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<FormResponse | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const stepNames = ["Apresentação", "Parte 1", "Parte 2", "Resumo", "Sucesso"];

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminMode(window.location.hash.startsWith("#/admin"));
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("forum_nikkei_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.atividadeMaiorValor) {
          setHasDraft(true);
          setDraftData(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar rascunho:", e);
    }
  }, []);

  useEffect(() => {
    if (step > 1 && step < 5) {
      try {
        localStorage.setItem("forum_nikkei_draft", JSON.stringify(formData));
      } catch (e) {
        console.warn("Não foi possível salvar o rascunho:", e);
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
        console.warn("Não foi possível limpar o rascunho:", e);
      }
    }
    setStep(2);
    setErrors({});
  };

  const handleFieldChange = (field: keyof FormResponse, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const currentErrors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!formData.atividadeMaiorValor.trim()) {
        currentErrors.atividadeMaiorValor = "Selecione a atividade de maior valor.";
      }
      if (!formData.principalAprendizado.trim()) {
        currentErrors.principalAprendizado = "Este campo é obrigatório.";
      }
      if (!formData.probabilidadeAplicacao) {
        currentErrors.probabilidadeAplicacao = "Selecione uma probabilidade.";
      }
    }

    if (currentStep === 3) {
      if (!formData.praticaPretendeAplicar.trim()) {
        currentErrors.praticaPretendeAplicar = "Este campo é obrigatório.";
      }
      if (!formData.iniciativaPrioritariaREN.trim()) {
        currentErrors.iniciativaPrioritariaREN = "Selecione uma iniciativa prioritária.";
      }
      if (!formData.recomendacaoEstrategicaREN.trim()) {
        currentErrors.recomendacaoEstrategicaREN = "Este campo é obrigatório.";
      }
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleJumpToStep = (targetStep: number) => {
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/respostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        try {
          localStorage.removeItem("forum_nikkei_draft");
        } catch (e) {
          console.warn("Não foi possível limpar o rascunho:", e);
        }
        setStep(5);
      } else {
        alert(result.message || "Ocorreu um erro ao enviar.");
      }
    } catch (e) {
      console.error("Erro ao enviar:", e);
      alert("Falha de conexão com o servidor. Tente novamente.");
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

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans">
        <header className="bg-white border-b border-neutral-200/80 py-3 px-6 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo variant="horizontal" className="h-10" />
              <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />
              <div className="hidden md:flex flex-col">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-brand-red leading-tight">
                  Fórum Empresarial Nikkei Brasil–Japão
                </span>
                <h1 className="text-xs font-display font-bold text-neutral-500 tracking-tight">
                  Painel Administrativo 2026
                </h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <AdminArea />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans" id="app-root">
      <header className="bg-white border-b border-neutral-200/80 py-3 px-6 sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="horizontal" className="h-10" />
            <div className="h-8 w-[1px] bg-neutral-200 hidden md:block" />
            <div className="hidden md:flex flex-col">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-brand-red leading-tight">
                Fórum Empresarial Nikkei Brasil–Japão
              </span>
              <h1 className="text-xs font-display font-bold text-neutral-500 tracking-tight">
                Captura de aprendizados e recomendações
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200/60 rounded-full px-3 py-1.5 text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            Questionário 2026
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {step === 1 && <WelcomeScreen onStart={handleStart} hasDraft={hasDraft} draftData={draftData} />}

        {step > 1 && step < 5 && (
          <div className="w-full max-w-5xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="border-b border-neutral-100 bg-neutral-50/70 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">Fórum Empresarial Nikkei Brasil–Japão</p>
                  <h2 className="text-lg font-display font-black text-neutral-800">{step === 2 ? "Parte 1 — Aprendizados e aplicação" : "Parte 2 — Recomendações estratégicas"}</h2>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <div className="font-mono font-bold uppercase tracking-wider">Etapa {step - 1} de 3</div>
                  <div>{step === 2 ? "Perguntas 1 a 3" : step === 3 ? "Perguntas 4 a 6" : "Resumo"}</div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <ProgressIndicator currentStep={step} totalSteps={5} stepNames={stepNames} />

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Sparkles className="h-3.5 w-3.5" />
                      Pergunta 1
                    </div>
                    <h3 className="text-lg font-display font-black text-neutral-800">Qual atividade do Fórum gerou maior valor para você?</h3>
                    <p className="text-sm text-neutral-500">Escolha a opção que melhor representa sua percepção.</p>
                  </div>

                  <div className="grid gap-3">
                    {ATIVIDADES_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleFieldChange("atividadeMaiorValor", option)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${formData.atividadeMaiorValor === option ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.atividadeMaiorValor && <p className="text-sm text-red-600">{errors.atividadeMaiorValor}</p>}

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Pergunta 2
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">Qual foi o principal aprendizado que você leva deste Fórum e por que ele foi significativo para você?</label>
                    <textarea
                      rows={5}
                      value={formData.principalAprendizado}
                      onChange={(e) => handleFieldChange("principalAprendizado", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                      placeholder="Descreva o principal aprendizado e por que ele foi importante para você."
                    />
                    {errors.principalAprendizado && <p className="text-sm text-red-600">{errors.principalAprendizado}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Star className="h-3.5 w-3.5" />
                      Pergunta 3
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">Após participar do Fórum, qual é a probabilidade de aplicar algum aprendizado em sua empresa ou organização?</label>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {PROBABILIDADE_APLICACAO_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFieldChange("probabilidadeAplicacao", option.value)}
                          className={`rounded-xl border px-3 py-3 text-sm transition ${formData.probabilidadeAplicacao === option.value ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {errors.probabilidadeAplicacao && <p className="text-sm text-red-600">{errors.probabilidadeAplicacao}</p>}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Compass className="h-3.5 w-3.5" />
                      Pergunta 4
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">Qual prática apresentada pela Toyota ou discutida durante o Fórum você pretende aplicar em sua empresa ou organização?</label>
                    <textarea
                      rows={5}
                      value={formData.praticaPretendeAplicar}
                      onChange={(e) => handleFieldChange("praticaPretendeAplicar", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                      placeholder="Descreva a prática ou conceito que você pretende levar para a sua organização."
                    />
                    {errors.praticaPretendeAplicar && <p className="text-sm text-red-600">{errors.praticaPretendeAplicar}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Sparkles className="h-3.5 w-3.5" />
                      Pergunta 5
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">Qual iniciativa da REN Brasil teria maior potencial para gerar valor para você ou sua organização nos próximos dois anos?</label>
                    <div className="grid gap-3">
                      {INICIATIVAS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleFieldChange("iniciativaPrioritariaREN", option)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition ${formData.iniciativaPrioritariaREN === option ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {errors.iniciativaPrioritariaREN && <p className="text-sm text-red-600">{errors.iniciativaPrioritariaREN}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Pergunta 6
                    </div>
                    <label className="block text-sm font-semibold text-neutral-700">Considerando os aprendizados do Fórum, qual iniciativa a REN Brasil deveria liderar para fortalecer as relações empresariais entre Brasil, Japão e América Latina? Explique sua proposta.</label>
                    <textarea
                      rows={5}
                      value={formData.recomendacaoEstrategicaREN}
                      onChange={(e) => handleFieldChange("recomendacaoEstrategicaREN", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                      placeholder="Descreva sua proposta de iniciativa estratégica para a REN Brasil."
                    />
                    {errors.recomendacaoEstrategicaREN && <p className="text-sm text-red-600">{errors.recomendacaoEstrategicaREN}</p>}
                  </div>
                </div>
              )}

              {step === 4 && (
                <ReviewScreen data={formData} onJumpToStep={handleJumpToStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={step === 2}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Enviando..." : "Enviar resposta"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && <SuccessScreen data={formData} onReset={handleReset} />}
      </main>
    </div>
  );
}