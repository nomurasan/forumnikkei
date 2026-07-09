/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FormResponse {
  participanteId: string;
  eventoId: string;
  atividadeMaiorValor: string;
  principalAprendizado: string;
  probabilidadeAplicacao: number;
  praticaPretendeAplicar: string;
  iniciativaPrioritariaREN: string[];
  recomendacaoEstrategicaREN: string;
}

export const ATIVIDADES_OPTIONS = [
  "Palestra Magna",
  "Visita à fábrica Toyota",
  "Museu Toyota",
  "Networking entre participantes",
  "Almoço/Jantar institucional",
  "Outro"
];

export const PROBABILIDADE_APLICACAO_OPTIONS = [
  { value: 1, label: "1 - Muito baixa" },
  { value: 2, label: "2 - Baixa" },
  { value: 3, label: "3 - Média" },
  { value: 4, label: "4 - Alta" },
  { value: 5, label: "5 - Muito alta" }
];

export const INICIATIVAS_OPTIONS = [
  "Missões empresariais Brasil-Japão",
  "Missões empresariais para outros países da América Latina",
  "Rodadas de negócios entre empresários nikkeis",
  "Programa de mentoria entre empresários experientes e novos empreendedores",
  "Compartilhamento de boas práticas de gestão japonesa",
  "Rede de cooperação e inovação empresarial",
  "Outro"
];

export const DEFAULT_FORM_VALUES: FormResponse = {
  participanteId: "",
  eventoId: "forum_empresarial_nikkei_2026",
  atividadeMaiorValor: "",
  principalAprendizado: "",
  probabilidadeAplicacao: 0,
  praticaPretendeAplicar: "",
  iniciativaPrioritariaREN: [],
  recomendacaoEstrategicaREN: ""
};
