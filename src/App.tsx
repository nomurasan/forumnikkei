/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Compass, Lightbulb, Send, Shield, Sparkles, Star, UserRound } from "lucide-react";
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
import { db, doc, serverTimestamp, setDoc } from "./lib/firebase";

interface ChatQuestionProps {
  number: number;
  icon: React.ReactNode;
  question: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

function ChatQuestion({ number, icon, question, helper, error, children }: ChatQuestionProps) {
  return (
    <section id={`question-${number}`} className="space-y-3 scroll-mt-28">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red text-white">
          <Bot className="h-4 w-4" />
        </div>
        <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-neutral-200 bg-neutral-50 px-4 py-3 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
            {icon}
            Pergunta {number}
          </div>
          <p className="text-sm font-semibold leading-relaxed text-neutral-800">{question}</p>
          {helper && <p className="mt-2 text-xs leading-relaxed text-neutral-500">{helper}</p>}
        </div>
      </div>

      <div className="flex items-start justify-end gap-3">
        <div className="w-full max-w-3xl rounded-2xl rounded-tr-sm border border-brand-red/20 bg-white px-4 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
            <UserRound className="h-3.5 w-3.5" />
            Sua resposta
          </div>
          {children}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}

function ChatAnswerSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="w-full max-w-3xl rounded-2xl rounded-tr-sm border border-brand-red/20 bg-brand-red/5 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">
          <UserRound className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{value || "Resposta registrada"}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormResponse>({ ...DEFAULT_FORM_VALUES });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<FormResponse | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(1);

  const stepNames = ["Apresentação", "Parte 1", "Parte 2", "Resumo", "Sucesso"];
  const currentQuestionUsesChoice = [1, 3].includes(activeQuestion);
  const mainAlignmentClass = step === 1 ? "justify-center" : "justify-start";

  const getInitiativeSelections = (value: FormResponse["iniciativaPrioritariaREN"] | string) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  };

  const formatResponseValue = (value: string | string[]) => {
    if (Array.isArray(value)) return value.join("\n");
    return value;
  };

  const getFirstUnansweredQuestion = (data: FormResponse) => {
    if (!data.atividadeMaiorValor.trim()) return 1;
    if (!data.principalAprendizado.trim()) return 2;
    if (!data.probabilidadeAplicacao) return 3;
    if (!data.praticaPretendeAplicar.trim()) return 4;
    if (getInitiativeSelections(data.iniciativaPrioritariaREN).length === 0) return 5;
    if (!data.recomendacaoEstrategicaREN.trim()) return 6;
    return 6;
  };

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
    let nextQuestion = 1;
    if (resume && draftData) {
      setFormData({ ...draftData });
      nextQuestion = getFirstUnansweredQuestion(draftData);
    } else {
      setFormData({ ...DEFAULT_FORM_VALUES });
      try {
        localStorage.removeItem("forum_nikkei_draft");
      } catch (e) {
        console.warn("Não foi possível limpar o rascunho:", e);
      }
    }
    setActiveQuestion(nextQuestion);
    setStep(nextQuestion <= 3 ? 2 : 3);
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

  const validateQuestion = (questionNumber: number): boolean => {
    const currentErrors: Record<string, string> = {};

    if (questionNumber === 1) {
      if (!formData.atividadeMaiorValor.trim()) {
        currentErrors.atividadeMaiorValor = "Selecione a atividade de maior valor.";
      }
    }

    if (questionNumber === 2) {
      if (!formData.principalAprendizado.trim()) {
        currentErrors.principalAprendizado = "Este campo é obrigatório.";
      }
    }

    if (questionNumber === 3) {
      if (!formData.probabilidadeAplicacao) {
        currentErrors.probabilidadeAplicacao = "Selecione uma probabilidade.";
      }
    }

    if (questionNumber === 4) {
      if (!formData.praticaPretendeAplicar.trim()) {
        currentErrors.praticaPretendeAplicar = "Este campo é obrigatório.";
      }
    }

    if (questionNumber === 5) {
      if (getInitiativeSelections(formData.iniciativaPrioritariaREN).length === 0) {
        currentErrors.iniciativaPrioritariaREN = "Selecione de 1 a 3 iniciativas prioritárias.";
      }
    }

    if (questionNumber === 6) {
      if (!formData.recomendacaoEstrategicaREN.trim()) {
        currentErrors.recomendacaoEstrategicaREN = "Este campo é obrigatório.";
      }
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const moveAfterQuestion = (questionNumber: number) => {
    if (questionNumber < 6) {
      const nextQuestion = questionNumber + 1;
      setActiveQuestion(nextQuestion);
      setStep(nextQuestion <= 3 ? 2 : 3);
    } else {
      setStep(4);
    }
  };

  const handleChoiceAnswer = (field: keyof FormResponse, value: string | number, questionNumber: number) => {
    handleFieldChange(field, value);
    window.setTimeout(() => moveAfterQuestion(questionNumber), 180);
  };

  const handleInitiativeToggle = (value: string) => {
    setFormData((prev) => {
      const selected = getInitiativeSelections(prev.iniciativaPrioritariaREN);
      const isSelected = selected.includes(value);
      const nextSelected = isSelected
        ? selected.filter((item) => item !== value)
        : selected.length < 3
          ? [...selected, value]
          : selected;

      return { ...prev, iniciativaPrioritariaREN: nextSelected };
    });

    if (errors.iniciativaPrioritariaREN) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.iniciativaPrioritariaREN;
        return copy;
      });
    }
  };

  const handleNext = () => {
    if (step === 4) return;
    if (!validateQuestion(activeQuestion)) return;
    moveAfterQuestion(activeQuestion);
  };

  useEffect(() => {
    if (step <= 1 || step >= 4) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`question-${activeQuestion}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeQuestion, step]);

  useEffect(() => {
    if (step !== 4 && step !== 5) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [step]);

  const handlePrev = () => {
    if (step === 4) {
      setActiveQuestion(6);
      setStep(3);
    } else if (step > 1 && activeQuestion > 1) {
      const previousQuestion = activeQuestion - 1;
      setActiveQuestion(previousQuestion);
      setStep(previousQuestion <= 3 ? 2 : 3);
    } else if (step > 1) {
      setStep(1);
    }
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpToStep = (targetStep: number) => {
    setStep(targetStep);
    if (targetStep === 2) setActiveQuestion(1);
    if (targetStep === 3) setActiveQuestion(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const responseId = `res_${crypto.randomUUID()}`;
      const timestamp = new Date().toISOString();
      const payload = {
        ...formData,
        id: responseId,
        participanteId: formData.participanteId || "",
        eventoId: formData.eventoId || "forum_empresarial_nikkei_2026",
        createdAtLocal: timestamp,
        updatedAtLocal: timestamp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        origem: "app_web_direto_firestore",
        evento: "forum_empresarial_nikkei_2026"
      };

      await setDoc(doc(db, "forum_nikkei_respostas", responseId), payload);

      try {
        localStorage.removeItem("forum_nikkei_draft");
      } catch (e) {
        console.warn("Não foi possível limpar o rascunho:", e);
      }
      setStep(5);
    } catch (e) {
      console.error("Erro ao gravar no Firebase:", e);
      alert("Não foi possível gravar sua resposta no Firebase. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_FORM_VALUES });
    setStep(1);
    setActiveQuestion(1);
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
                  Fórum Empresarial Nikkei Brasil-Japão
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
                Fórum Empresarial Nikkei Brasil-Japão
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

      <main className={`flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col ${mainAlignmentClass}`}>
        {step === 1 && <WelcomeScreen onStart={handleStart} hasDraft={hasDraft} draftData={draftData} />}

        {step > 1 && step < 5 && (
          <div className="w-full max-w-5xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="border-b border-neutral-100 bg-neutral-50/70 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-red">Fórum Empresarial Nikkei Brasil-Japão</p>
                  <h2 className="text-lg font-display font-black text-neutral-800">
                    {step === 2 ? "Parte 1 - Aprendizados e aplicação" : step === 3 ? "Parte 2 - Recomendações estratégicas" : "Resumo das respostas"}
                  </h2>
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
                <div className="space-y-8">
                  {activeQuestion > 1 && <ChatAnswerSummary label="Pergunta 1 respondida" value={formData.atividadeMaiorValor} />}
                  {activeQuestion === 1 && (
                    <ChatQuestion
                      number={1}
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      question="Qual atividade do Fórum gerou maior valor para você?"
                      helper="Escolha a opção que melhor representa sua percepção."
                      error={errors.atividadeMaiorValor}
                    >
                      <div className="grid gap-3">
                        {ATIVIDADES_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleChoiceAnswer("atividadeMaiorValor", option, 1)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${formData.atividadeMaiorValor === option ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </ChatQuestion>
                  )}

                  {activeQuestion > 2 && <ChatAnswerSummary label="Pergunta 2 respondida" value={formData.principalAprendizado} />}
                  {activeQuestion === 2 && (
                    <ChatQuestion
                      number={2}
                      icon={<Lightbulb className="h-3.5 w-3.5" />}
                      question="Qual foi o principal aprendizado que você leva deste Fórum e por que ele foi significativo para você?"
                      helper="Registre sua resposta em formato livre, como se estivesse conversando com a REN Brasil."
                      error={errors.principalAprendizado}
                    >
                      <textarea
                        rows={5}
                        value={formData.principalAprendizado}
                        onChange={(e) => handleFieldChange("principalAprendizado", e.target.value)}
                        className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        placeholder="Digite aqui seu principal aprendizado e por que ele foi importante."
                      />
                    </ChatQuestion>
                  )}

                  {activeQuestion === 3 && (
                    <ChatQuestion
                      number={3}
                      icon={<Star className="h-3.5 w-3.5" />}
                      question="Após participar do Fórum, qual é a probabilidade de aplicar algum aprendizado em sua empresa ou organização?"
                      helper="Selecione uma nota de 1 a 5."
                      error={errors.probabilidadeAplicacao}
                    >
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        {PROBABILIDADE_APLICACAO_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChoiceAnswer("probabilidadeAplicacao", option.value, 3)}
                            className={`rounded-xl border px-3 py-3 text-sm transition ${formData.probabilidadeAplicacao === option.value ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </ChatQuestion>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <ChatAnswerSummary label="Pergunta 1 respondida" value={formData.atividadeMaiorValor} />
                  <ChatAnswerSummary label="Pergunta 2 respondida" value={formData.principalAprendizado} />
                  <ChatAnswerSummary label="Pergunta 3 respondida" value={formData.probabilidadeAplicacao ? `${formData.probabilidadeAplicacao}/5` : ""} />

                  {activeQuestion > 4 && <ChatAnswerSummary label="Pergunta 4 respondida" value={formData.praticaPretendeAplicar} />}
                  {activeQuestion === 4 && (
                    <ChatQuestion
                      number={4}
                      icon={<Compass className="h-3.5 w-3.5" />}
                      question="Qual prática apresentada pela Toyota ou discutida durante o Fórum você pretende aplicar em sua empresa ou organização?"
                      helper="Escreva a prática, conceito ou comportamento que pretende levar para sua rotina."
                      error={errors.praticaPretendeAplicar}
                    >
                      <textarea
                        rows={5}
                        value={formData.praticaPretendeAplicar}
                        onChange={(e) => handleFieldChange("praticaPretendeAplicar", e.target.value)}
                        className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        placeholder="Digite aqui a prática ou conceito que você pretende aplicar."
                      />
                    </ChatQuestion>
                  )}

                  {activeQuestion > 5 && <ChatAnswerSummary label="Pergunta 5 respondida" value={formatResponseValue(formData.iniciativaPrioritariaREN)} />}
                  {activeQuestion === 5 && (
                    <ChatQuestion
                      number={5}
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      question="Quais iniciativas da REN Brasil teriam maior potencial para gerar valor para você ou sua organização nos próximos dois anos?"
                      helper="Selecione até 3 iniciativas com maior potencial na sua visão."
                      error={errors.iniciativaPrioritariaREN}
                    >
                      <div className="mb-3 text-xs font-semibold text-neutral-500">
                        {getInitiativeSelections(formData.iniciativaPrioritariaREN).length}/3 selecionadas
                      </div>
                      <div className="grid gap-3">
                        {INICIATIVAS_OPTIONS.map((option) => {
                          const selected = getInitiativeSelections(formData.iniciativaPrioritariaREN);
                          const isSelected = selected.includes(option);
                          const isDisabled = !isSelected && selected.length >= 3;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleInitiativeToggle(option)}
                              aria-pressed={isSelected}
                              disabled={isDisabled}
                              className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-neutral-200 hover:border-brand-red/40 hover:bg-neutral-50"}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </ChatQuestion>
                  )}

                  {activeQuestion === 6 && (
                    <ChatQuestion
                      number={6}
                      icon={<Lightbulb className="h-3.5 w-3.5" />}
                      question="Considerando os aprendizados do Fórum, qual iniciativa a REN Brasil deveria liderar para fortalecer as relações empresariais entre Brasil, Japão e América Latina?"
                      helper="Explique sua proposta com o nível de detalhe que achar necessário."
                      error={errors.recomendacaoEstrategicaREN}
                    >
                      <textarea
                        rows={5}
                        value={formData.recomendacaoEstrategicaREN}
                        onChange={(e) => handleFieldChange("recomendacaoEstrategicaREN", e.target.value)}
                        className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        placeholder="Digite aqui sua proposta de iniciativa estratégica para a REN Brasil."
                      />
                    </ChatQuestion>
                  )}
                </div>
              )}

              {step === 4 && (
                <ReviewScreen data={formData} onJumpToStep={handleJumpToStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={step === 2 && activeQuestion === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>

                {step < 4 ? (
                  currentQuestionUsesChoice ? (
                    <div className="inline-flex items-center justify-center rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-500">
                      Selecione uma opção para continuar
                    </div>
                  ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
                  >
                    {activeQuestion === 6 ? "Revisar respostas" : "Continuar"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  )
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

      <footer className="border-t border-neutral-200/80 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-neutral-500 sm:flex-row">
          <span>Fórum Empresarial Nikkei Brasil-Japão</span>
          <a href="#/admin" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 font-semibold text-neutral-600 hover:border-brand-red/40 hover:text-brand-red">
            <Shield className="h-3.5 w-3.5" />
            Acesso administrativo
          </a>
        </div>
      </footer>
    </div>
  );
}

