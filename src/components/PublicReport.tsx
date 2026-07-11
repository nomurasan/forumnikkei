import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  Lightbulb,
  Layers3
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchPublicReport } from "../services/reportApi";
import type { PublicReport as PublicReportData, QuestionInsights } from "../types";

interface PublicReportProps {
  onBackToQuestionnaire: () => void;
}

const QUESTION_DETAILS: Record<string, { title: string; subtitle: string; highlightLabel: string }> = {
  principal_aprendizado: {
    title: "Qual foi o principal aprendizado que você leva deste Fórum e como ele pode contribuir para o desenvolvimento da sua empresa ou organização?",
    subtitle: "Resumo consolidado dos aprendizados mais recorrentes e dos temas que apareceram com mais força.",
    highlightLabel: "Principais temas"
  },
  pratica_pretende_aplicar: {
    title: "Caso pretenda aplicar algum aprendizado, qual prática ou iniciativa você pretende implementar em sua empresa ou organização?",
    subtitle: "Síntese das práticas mais citadas e das aplicações concretas mencionadas pelos participantes.",
    highlightLabel: "Aplicações práticas"
  },
  recomendacao_estrategica_ren: {
    title: "Que tema ou iniciativa você gostaria de ver na programação da REN Brasil para apoiar o fortalecimento das empresas nikkeis?",
    subtitle: "Leitura consolidada das oportunidades e sugestões recorrentes para a programação futura.",
    highlightLabel: "Oportunidades"
  }
};

function formatUpdatedAt(value: string | null) {
  if (!value) return "Atualizado recentemente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function SummaryCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-5 shadow-[0_16px_40px_rgba(40,16,16,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-brand-red/70">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-neutral-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-brand-red/10 p-3 text-brand-red">{icon}</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-red via-amber-400 to-brand-red/50" />
    </article>
  );
}

function SectionCard({ title, children, kicker }: { title: string; children: React.ReactNode; kicker?: string }) {
  return (
    <section className="rounded-[1.5rem] border border-neutral-200/70 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      {kicker && <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-brand-red/70">{kicker}</p>}
      <h3 className="mt-1 text-lg font-black tracking-tight text-neutral-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InsightCard({ insight }: { insight: QuestionInsights }) {
  const detail = QUESTION_DETAILS[insight.questionId] || {
    title: insight.pergunta,
    subtitle: "Resumo consolidado dos resultados",
    highlightLabel: "Destaques"
  };

  const highlights = insight.questionId === "pratica_pretende_aplicar"
    ? insight.aplicacoesPraticas
    : insight.questionId === "recomendacao_estrategica_ren"
      ? insight.oportunidades
      : insight.principaisTemas;

  return (
    <article className="rounded-[1.5rem] border border-neutral-200/80 bg-gradient-to-br from-white via-white to-neutral-50 p-5 shadow-[0_18px_44px_rgba(2,6,23,0.06)]">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-red">
          <Sparkles className="h-3.5 w-3.5" />
          {detail.highlightLabel}
        </div>
        <h4 className="text-base font-black leading-snug text-neutral-900">{detail.title}</h4>
        <p className="text-sm leading-relaxed text-neutral-500">{detail.subtitle}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-neutral-500">Resumo dos principais insights</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{insight.resumo || "Ainda não há um resumo disponível para esta pergunta."}</p>
        </div>

        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-neutral-500">{detail.highlightLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {highlights.length ? highlights.map((item) => (
              <span key={item} className="rounded-full border border-brand-red/20 bg-brand-red/5 px-3 py-1 text-xs font-semibold text-brand-red">
                {item}
              </span>
            )) : (
              <span className="text-sm text-neutral-500">Sem destaques suficientes para consolidar.</span>
            )}
          </div>
        </div>

        <div className="text-xs text-neutral-500">
          {insight.quantidadeRespostasAnalisadas} respostas analisadas {insight.updatedAt ? `• ${formatUpdatedAt(insight.updatedAt)}` : ""}
        </div>
      </div>
    </article>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(2,6,23,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-neutral-900">{label}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">Estamos consolidando os dados públicos do questionário. Isso pode levar alguns instantes na primeira abertura.</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(2,6,23,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <RefreshCcw className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-neutral-900">Não foi possível carregar os resultados neste momento.</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
        >
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function PublicReport({ onBackToQuestionnaire }: PublicReportProps) {
  const [report, setReport] = useState<PublicReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
      const data = await fetchPublicReport(controller.signal);
      window.clearTimeout(timeoutId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os resultados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const atividadeChartData = report?.graficos.atividades || [];
  const probabilityLabels: Record<number, string> = {
    1: "1 - Muito baixa",
    2: "2 - Baixa",
    3: "3 - Média",
    4: "4 - Alta",
    5: "5 - Muito alta"
  };
  const probabilidadeChartData = (report?.graficos.probabilidadeAplicacao || []).map((entry) => ({
    ...entry,
    label: probabilityLabels[entry.nota] || String(entry.nota)
  }));
  const iniciativaChartData = report?.graficos.iniciativas || [];
  const updatedAtLabel = formatUpdatedAt(report?.updatedAt || null);
  const totalRespostas = report?.indicadores.totalRespostas || 0;
  const hasInsights = (report?.insights || []).length > 0;

  const reportStatusMessage = useMemo(() => {
    if (!report) return "";
    if (!hasInsights || totalRespostas < 3) {
      return "Ainda não há respostas suficientes para gerar uma análise consolidada.";
    }
    return "";
  }, [hasInsights, report, totalRespostas]);

  if (loading && !report) {
    return <LoadingState label="Carregando resultados..." />;
  }

  if (error && !report) {
    return <ErrorState message={error} onRetry={() => loadReport(true)} />;
  }

  if (!report) {
    return <LoadingState label="Carregando resultados..." />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(188,0,45,0.16),_transparent_32%),linear-gradient(180deg,_#fffdfd_0%,_#fff7f7_48%,_#f8fafc_100%)] text-neutral-800">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.32em] text-brand-red/70">Fórum Empresarial Nikkei Brasil-Japão</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">Relatório de Resultados 2026</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Resultados consolidados do questionário dos participantes, com indicadores, gráficos e aprendizados agregados por IA.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBackToQuestionnaire}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-white px-4 py-3 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao questionário
            </button>
            <button
              type="button"
              onClick={() => loadReport(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar relatório
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-red">
              <Clock3 className="h-3.5 w-3.5" />
              {updatedAtLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">
              {totalRespostas} respostas consolidadas
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total de respostas" value={totalRespostas} icon={<BarChart3 className="h-5 w-5" />} />
            <SummaryCard label="Atividade mais valorizada" value={report.indicadores.atividadeMaisValorizada || "Sem dados"} icon={<TrendingUp className="h-5 w-5" />} />
            <SummaryCard label="Média de chance de aplicar" value={report.indicadores.mediaProbabilidadeAplicacao ? report.indicadores.mediaProbabilidadeAplicacao.toFixed(1) : "0.0"} icon={<Target className="h-5 w-5" />} />
            <SummaryCard label="Iniciativa mais votada" value={report.indicadores.iniciativaMaisVotada || "Sem dados"} icon={<Layers3 className="h-5 w-5" />} />
          </div>

          {reportStatusMessage && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {reportStatusMessage}
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <SectionCard title="Atividade do Fórum" kicker="Gráfico 01">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atividadeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#bc002d" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Chance de aplicação" kicker="Gráfico 02">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={probabilidadeChartData} dataKey="total" nameKey="label" innerRadius={58} outerRadius={100} paddingAngle={4}>
                    {probabilidadeChartData.map((entry, index) => (
                      <Cell
                        key={`prob-${entry.nota}`}
                        fill={[
                          "#bc002d",
                          "#dc2626",
                          "#ef4444",
                          "#f87171",
                          "#fecaca"
                        ][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Iniciativas prioritárias" kicker="Gráfico 03">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={iniciativaChartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nome" width={190} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1d4ed8" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </section>

        <section className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(2,6,23,0.06)]">
          <div className="flex flex-col gap-3 border-b border-neutral-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-brand-red/70">Principais aprendizados e insights</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Cada pergunta aberta consolidada em um card</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">
                As respostas individuais permanecem ocultas. A leitura abaixo destaca os padrões recorrentes, os temas mais frequentes e as oportunidades identificadas pela análise.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-600">
              <Brain className="h-3.5 w-3.5" />
              Síntese por IA
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {report.insights.map((insight) => (
              <React.Fragment key={insight.questionId}>
                <InsightCard insight={insight} />
              </React.Fragment>
            ))}
          </div>
        </section>

        <footer className="pb-4 pt-2 text-center text-sm text-neutral-500">
          <p className="font-semibold text-neutral-700">Fórum Empresarial Nikkei Brasil-Japão</p>
          <p className="mt-1">Resultados consolidados do questionário dos participantes.</p>
        </footer>
      </main>
    </div>
  );
}


