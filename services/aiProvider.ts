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

const REPORT_INSTRUCTIONS = `
Você é um analista responsável por transformar respostas abertas do questionário do Fórum Empresarial Nikkei Brasil-Japão em uma síntese executiva.

Analise exclusivamente as respostas fornecidas para uma única pergunta.

A análise pode conter somente uma resposta ou várias respostas. Adapte a linguagem à quantidade de respostas recebidas.

Objetivos:
- sintetizar os principais aprendizados, intenções, necessidades, sugestões ou oportunidades presentes nas respostas;
- organizar as informações de forma objetiva e útil para um relatório executivo;
- identificar temas semelhantes quando houver mais de uma resposta;
- apresentar uma contribuição individual de forma neutra quando houver apenas uma resposta.

Regras obrigatórias:

1. Não identifique participantes.
2. Não mencione nomes, e-mails, empresas ou outros dados pessoais eventualmente presentes nas respostas.
3. Não reproduza integralmente uma resposta individual.
4. Não invente informações, exemplos, conclusões, resultados ou recomendações.
5. Utilize somente informações sustentadas pelas respostas fornecidas.
6. Quando houver apenas uma resposta, não use expressões como:
  - "os participantes";
  - "as respostas indicam";
  - "houve consenso";
  - "os temas mais recorrentes";
  - "a maioria";
  - "de forma recorrente".
7. Quando houver apenas uma resposta, utilize construções neutras, como:
  - "A resposta destaca...";
  - "O relato aponta...";
  - "A contribuição apresentada sugere...";
8. Quando houver várias respostas, diferencie:
  - temas recorrentes;
  - contribuições menos frequentes;
  - contribuições pontuais relevantes.
9. Não trate uma contribuição isolada como opinião coletiva.
10. Não apresente percentuais ou quantidades que não tenham sido fornecidos pelo sistema.
11. Agrupe ideias semanticamente semelhantes, mesmo quando utilizarem palavras diferentes.
12. Não acrescente elogios promocionais à REN Brasil, à Toyota, ao evento ou às organizações participantes.
13. Use linguagem objetiva, profissional, institucional e acessível.
14. Escreva exclusivamente em português do Brasil.
15. Utilize apenas caracteres do alfabeto latino, números, acentos e pontuação usuais da língua portuguesa.
16. Preserve acentuação do português do Brasil (por exemplo: á, à, â, ã, é, ê, í, ó, ô, õ, ú, ç).
17. Não use caracteres de outros sistemas de escrita, incluindo devanágari, cirílico, árabe, hebraico, chinês, japonês, coreano, tailandês ou outros alfabetos não latinos.
18. Não misture alfabetos diferentes dentro de uma palavra. Exemplo proibido: "परिणामados".
19. Antes de responder, revise internamente se todo o texto está corretamente escrito em português do Brasil e sem caracteres estranhos.
20. Não remova acentos e não converta o texto para ASCII.
21. Não invente fatos, contextos, causas, resultados, benefícios, recomendações, intenções, exemplos, relações causais ou conclusões não sustentadas pelas respostas.
22. Pode sintetizar e reorganizar, mas sem ampliar o significado original das respostas.
23. Evite transformar parágrafos longos em itens de lista; cada item deve representar preferencialmente uma única ideia principal.
24. Não preencha campos apenas para completar a estrutura; quando não houver base nas respostas, retorne lista vazia.
25. Para uma única resposta, use síntese direta e concisa, sem ampliação artificial do conteúdo.
26. Para múltiplas respostas, consolide padrões, convergências, diferenças e contribuições pontuais.
27. Não use Markdown.
28. Não escreva explicações antes ou depois da estrutura solicitada.
29. Retorne exclusivamente JSON válido.
30. O resumo deve ser proporcional à quantidade e à riqueza das respostas.
31. Para uma única resposta, produza um resumo entre 50 e 110 palavras.
32. Para várias respostas, produza um resumo entre 90 e 180 palavras.
33. Cada item de lista deve ser curto, específico e sustentado pelas respostas.
34. Quando não houver conteúdo suficiente para determinado campo, retorne uma lista vazia.
`;

function buildPrompt(question: string, answer: string) {
  return `${WRITING_INSTRUCTIONS}\n\nPergunta:\n${question}\n\nResposta:\n${answer}`;
}

async function requestOpenAI(
  input: string,
  instructions: string,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions,
      input,
      max_output_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`OpenAI retornou HTTP ${response.status}`);
  const data: any = await response.json();
  const text =
    data.output_text ||
    data.output
      ?.flatMap((item: any) => item.content || [])
      .find((item: any) => item.type === "output_text")?.text;
  if (!text?.trim()) throw new Error("OpenAI não retornou texto");
  return text.trim();
}

async function requestGemini(
  input: string,
  instructions: string,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    contents: `${instructions}\n\n${input}`,
    config: { maxOutputTokens: maxTokens, temperature: 0.2 },
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Gemini não retornou texto");
  return text.trim();
}

function buildProviderStatus(
  provider: string,
  model: string,
  configured: boolean,
) {
  return { provider, model, configured };
}

export function getAiProviderStatus() {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "gemini_openai" || provider === "auto") {
    return buildProviderStatus(
      "gemini_openai",
      `${process.env.GEMINI_MODEL || "gemini-3.5-flash"} -> ${process.env.OPENAI_MODEL || "gpt-5.4-mini"}`,
      Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY),
    );
  }
  if (provider === "openai") {
    return buildProviderStatus(
      provider,
      process.env.OPENAI_MODEL || "gpt-5.4-mini",
      Boolean(process.env.OPENAI_API_KEY),
    );
  }
  if (provider === "gemini") {
    return buildProviderStatus(
      provider,
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      Boolean(process.env.GEMINI_API_KEY),
    );
  }
  return buildProviderStatus(provider, "", false);
}

async function generateWithProvider(
  input: string,
  instructions: string,
  maxTokens: number,
): Promise<string> {
  const { provider } = getAiProviderStatus();
  if (provider === "gemini_openai") {
    if (process.env.GEMINI_API_KEY) {
      try {
        return await requestGemini(input, instructions, maxTokens);
      } catch {
        // Keep trying the fallback.
      }
    }
    if (process.env.OPENAI_API_KEY) {
      return requestOpenAI(input, instructions, maxTokens);
    }
    throw new Error("Nenhum provedor de IA configurado");
  }
  if (provider === "openai")
    return requestOpenAI(input, instructions, maxTokens);
  if (provider === "gemini")
    return requestGemini(input, instructions, maxTokens);
  throw new Error("AI_PROVIDER inválido");
}

export async function improveAnswer(
  question: string,
  answer: string,
): Promise<string> {
  return generateWithProvider(
    `Pergunta:\n${question}\n\nResposta:\n${answer}`,
    WRITING_INSTRUCTIONS,
    600,
  );
}

export async function generateStructuredResponse(
  input: string,
): Promise<string> {
  return generateWithProvider(input, REPORT_INSTRUCTIONS, 1200);
}
