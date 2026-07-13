import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const {
  ensureInsight,
  getRelevantResponseState,
  getCachedInsightForQuestion,
  buildPlaceholderInsight,
} = await import("../server");

type QuestionId = "principal_aprendizado" | "pratica_pretende_aplicar" | "recomendacao_estrategica_ren";
type CachedInsight = Awaited<ReturnType<typeof buildPlaceholderInsight>>;

type Submission = {
  id: string;
  updatedAtLocal?: string;
  principal_aprendizado_final?: string;
  pratica_pretende_aplicar_final?: string;
  recomendacao_estrategica_ren_final?: string;
};

function makeSubmission(id: string, text: string): Submission {
  return {
    id,
    updatedAtLocal: "2026-07-13T10:00:00.000Z",
    principal_aprendizado_final: text,
  };
}

function makeUpdatedInsight(
  questionId: QuestionId,
  state: ReturnType<typeof getRelevantResponseState>,
): CachedInsight {
  return {
    questionId,
    pergunta: "Pergunta",
    resumo: "Resumo atualizado",
    principaisTemas: ["Tema"],
    aplicacoesPraticas: [],
    oportunidades: [],
    quantidadeRespostasAnalisadas: state.count,
    status: "atualizado",
    updatedAt: "2026-07-13T10:10:00.000Z",
    modelo: "test-model",
    responsesFingerprint: state.fingerprint,
    latestResponseAt: state.latestResponseAt,
  };
}

function makeDeps() {
  const calls = {
    generate: 0,
    save: 0,
  };
  const saved: CachedInsight[] = [];

  const deps = {
    generationMap: new Map<QuestionId, Promise<CachedInsight>>(),
    generateInsightFn: async (
      questionId: QuestionId,
      state: ReturnType<typeof getRelevantResponseState>,
    ) => {
      calls.generate += 1;
      return {
        ...buildPlaceholderInsight(
          questionId,
          state.count,
          state.fingerprint,
          state.latestResponseAt,
        ),
        resumo: "Resumo gerado",
        principaisTemas: ["Tema gerado"],
        status: "atualizado" as const,
      };
    },
    saveInsightCacheFn: async (insight: CachedInsight) => {
      calls.save += 1;
      saved.push(insight);
    },
  };

  return { deps, calls, saved };
}

test("Cenário 1: 0 respostas não reutiliza análise antiga e não chama IA", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const { deps, calls, saved } = makeDeps();
  const existing: Record<string, CachedInsight> = {
    [questionId]: {
      ...buildPlaceholderInsight(questionId, 2, "old-fingerprint", "2026-07-12T12:00:00.000Z"),
      status: "atualizado" as const,
      resumo: "Análise antiga",
      principaisTemas: ["Tema antigo"],
    },
  };

  const result = await ensureInsight(questionId, [], existing, deps);

  assert.equal(calls.generate, 0);
  assert.equal(result.status, "desatualizado");
  assert.equal(result.quantidadeRespostasAnalisadas, 0);
  assert.equal(result.resumo, "Ainda não há respostas para gerar uma análise.");
  assert.equal(saved.length, 1);
});

test("Cenário 2: 1 resposta sem cache chama IA e salva análise", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const submissions = [makeSubmission("r1", "Aprendizado único")];
  const { deps, calls, saved } = makeDeps();

  const result = await ensureInsight(questionId, submissions, {}, deps);

  assert.equal(calls.generate, 1);
  assert.equal(calls.save, 1);
  assert.equal(saved.length, 1);
  assert.equal(result.status, "atualizado");
  assert.equal(result.quantidadeRespostasAnalisadas, 1);
});

test("Cenário 3: 1 resposta com fingerprint igual reutiliza cache", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const submissions = [makeSubmission("r1", "Aprendizado único")];
  const state = getRelevantResponseState(questionId, submissions);
  const existing: Record<string, CachedInsight> = {
    [questionId]: makeUpdatedInsight(questionId, state),
  };
  const { deps, calls } = makeDeps();

  const result = await ensureInsight(questionId, submissions, existing, deps);

  assert.equal(calls.generate, 0);
  assert.equal(calls.save, 0);
  assert.equal(result.responsesFingerprint, state.fingerprint);
  assert.equal(result.status, "atualizado");
});

test("Cenário 4: resposta alterada muda fingerprint e gera nova análise", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const original = [makeSubmission("r1", "Texto original")];
  const changed = [makeSubmission("r1", "Texto alterado")];
  const originalState = getRelevantResponseState(questionId, original);
  const existing: Record<string, CachedInsight> = {
    [questionId]: makeUpdatedInsight(questionId, originalState),
  };
  const { deps, calls } = makeDeps();

  const changedState = getRelevantResponseState(questionId, changed);
  const result = await ensureInsight(questionId, changed, existing, deps);

  assert.notEqual(changedState.fingerprint, originalState.fingerprint);
  assert.equal(calls.generate, 1);
  assert.equal(result.status, "atualizado");
  assert.equal(result.responsesFingerprint, changedState.fingerprint);
});

test("Cenário 5: segunda resposta adicionada força nova análise", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const one = [makeSubmission("r1", "Primeira resposta")];
  const two = [makeSubmission("r1", "Primeira resposta"), makeSubmission("r2", "Segunda resposta")];
  const oneState = getRelevantResponseState(questionId, one);
  const existing: Record<string, CachedInsight> = {
    [questionId]: makeUpdatedInsight(questionId, oneState),
  };
  const { deps, calls } = makeDeps();

  const result = await ensureInsight(questionId, two, existing, deps);

  assert.equal(calls.generate, 1);
  assert.equal(result.quantidadeRespostasAnalisadas, 2);
});

test("Cenário 6: múltiplos refresh sem mudança não chamam IA novamente", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const submissions = [makeSubmission("r1", "Resposta estável")];
  const state = getRelevantResponseState(questionId, submissions);
  const existing: Record<string, CachedInsight> = {
    [questionId]: makeUpdatedInsight(questionId, state),
  };
  const { deps, calls } = makeDeps();

  await ensureInsight(questionId, submissions, existing, deps);
  await ensureInsight(questionId, submissions, existing, deps);

  assert.equal(calls.generate, 0);
  assert.equal(calls.save, 0);
});

test("Cenário 7: exclusão parcial muda fingerprint e gera nova análise", async () => {
  const questionId: QuestionId = "principal_aprendizado";
  const two = [makeSubmission("r1", "Primeira"), makeSubmission("r2", "Segunda")];
  const one = [makeSubmission("r1", "Primeira")];
  const stateTwo = getRelevantResponseState(questionId, two);
  const existing: Record<string, CachedInsight> = {
    [questionId]: makeUpdatedInsight(questionId, stateTwo),
  };
  const { deps, calls } = makeDeps();

  const result = await ensureInsight(questionId, one, existing, deps);

  assert.equal(calls.generate, 1);
  assert.equal(result.quantidadeRespostasAnalisadas, 1);
});

test("Cenário 8: todas respostas excluídas substitui insight antigo por placeholder", () => {
  const questionId: QuestionId = "principal_aprendizado";
  const submissions: Submission[] = [];
  const existing: Record<string, CachedInsight> = {
    [questionId]: {
      ...buildPlaceholderInsight(questionId, 2, "fingerprint-antigo", "2026-07-12T12:00:00.000Z"),
      status: "atualizado" as const,
      resumo: "Resumo antigo",
      principaisTemas: ["Tema antigo"],
    },
  };

  const result = getCachedInsightForQuestion(questionId, submissions, existing);

  assert.equal(result.quantidadeRespostasAnalisadas, 0);
  assert.equal(result.status, "desatualizado");
  assert.equal(result.resumo, "Ainda não há respostas para gerar uma análise.");
  assert.deepEqual(result.principaisTemas, []);
});
