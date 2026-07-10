import { GoogleGenAI } from "@google/genai";

const WRITING_INSTRUCTIONS = `Você é um assistente de redação.

Sua função é melhorar a clareza e a organização da resposta do participante.

Regras obrigatórias:
- Preserve completamente o significado.
- Não invente informações.
- Não acrescente opiniões.
- Não altere o posicionamento do participante.
- Corrija ortografia e gramática.
- Melhore a organização e mantenha o texto objetivo.
- Não transforme uma resposta curta em um texto longo.
- Retorne apenas o texto final.`;

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
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: buildPrompt(question, answer),
    config: { maxOutputTokens: 600, temperature: 0.2 }
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Gemini não retornou texto");
  return text.trim();
}

export async function improveAnswer(question: string, answer: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "openai") return improveWithOpenAI(question, answer);
  if (provider === "gemini") return improveWithGemini(question, answer);
  throw new Error("AI_PROVIDER inválido");
}
