import { PublicReport, QuestionInsights } from "../types";

export async function fetchPublicReport(signal?: AbortSignal): Promise<PublicReport> {
  const response = await fetch("/api/report", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os resultados.");
  }

  return data as PublicReport;
}

export async function refreshPublicReport(): Promise<PublicReport> {
  const response = await fetch("/api/report/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar os aprendizados.");
  }

  return data as PublicReport;
}

export async function regenerateQuestionInsights(questionId: string): Promise<QuestionInsights> {
  const response = await fetch("/api/report/insights/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível regenerar os insights.");
  }

  return data as QuestionInsights;
}
