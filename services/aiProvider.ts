import { GoogleGenAI } from "@google/genai";

const WRITING_INSTRUCTIONS = `Você é um assistente de redação.

Sua função é reescrever e aprimorar a resposta do participante considerando diretamente a pergunta apresentada.

Regras obrigatórias:
- Torne a ideia principal mais clara.
- Explicite conexões que já estejam implícitas na resposta.
- Melhore a fluidez, a organização e a força da argumentação.
- Reorganize frases quando isso tornar a resposta mais compreensível.
- Corrija ortografia e gramática.
- Elimine ambiguidades, redundâncias e repetições.
- Preserve integralmente os fatos, as opiniões, o posicionamento e a intenção do participante.
- Não invente exemplos, resultados, justificativas ou informações que não estejam presentes ou claramente implícitas na resposta.
- Produza uma versão um pouco mais elaborada, mas ainda concisa e proporcional ao conteúdo original.
- Não repita nem reformule a pergunta dentro da resposta.
- Não faça comentários sobre o processo de revisão.
- Retorne somente o texto final aprimorado.`;

function buildPrompt(question: string, answer: string) {
  return `${WRITING_INSTRUCTIONS}\n\nPergunta:\n${question}\n\nResposta:\n${answer}`;
}

async function improveWithOpenAI(question: string, answer: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: WRITING_INSTRUCTIONS,
      input: `Pergunta:\n${question}\n\nResposta:\n${answer}`,
      max_output_tokens: 600
    }),
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) throw new Error(`OpenAI retornou HTTP ${response.status}`);
  const data: any = await response.json();
  const text = data.output_text || data.output
    ?.flatMap((item: any) => item.content || [])
    .find((item: any) => item.type === "output_text")?.text;
  if (!text?.trim()) throw new Error("OpenAI não retornou texto");
  return text.trim();
}

async function improveWithGemini(question: string, answer: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    contents: buildPrompt(question, answer),
    config: { maxOutputTokens: 600, temperature: 0.2 }
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Gemini não retornou texto");
  return text.trim();
}

export function getAiProviderStatus() {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "openai") {
    return {
      provider,
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      configured: Boolean(process.env.OPENAI_API_KEY)
    };
  }
  if (provider === "gemini") {
    return {
      provider,
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      configured: Boolean(process.env.GEMINI_API_KEY)
    };
  }
  return { provider, model: "", configured: false };
}

export async function improveAnswer(question: string, answer: string): Promise<string> {
  const { provider } = getAiProviderStatus();
  if (provider === "openai") return improveWithOpenAI(question, answer);
  if (provider === "gemini") return improveWithGemini(question, answer);
  throw new Error("AI_PROVIDER inválido");
}
