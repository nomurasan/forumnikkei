/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FormResponse {
  // Seção 1 – Perfil do Participante
  nome: string;
  email: string;
  empresaInstituicao: string;
  cargo: string;
  cidade: string;
  pais: string;

  // Seção 2 – Experiência no Fórum
  avaliacaoGeral: number; // 1 a 10
  atividadeMaiorValor: string;
  destaqueForum: string;

  // Seção 3 – Principais Aprendizados
  tresAprendizados: string;
  ideiaMaisImpactante: string;
  aspectoCulturaJaponesa: string;
  praticaPretendeAplicar: string;

  // Seção 4 – Aplicação Prática
  pretendeAplicarConhecimento: string; // "Sim", "Talvez", "Ainda não", "Não"
  qualConhecimentoAplicar: string;
  desafiosImplementacao: string;

  // Seção 5 – Cooperação Brasil–Japão
  oportunidadesBrasilJapao: string;
  comoRenPodeContribuir: string;

  // Seção 6 – Cooperação Latino-Americana
  oportunidadesAmericaLatina: string;
  projetoColaborativo: string;

  // Seção 7 – Networking
  estabeleceuNovosContatos: string;
  contatosPodemGerarParcerias: string;

  // Seção 8 – Temas Prioritários
  temasPrioritarios: string[];

  // Seção 9 – Recomendações
  naoPodeFaltar: string;
  pontosAprimorar: string;

  // Seção 10 – Reflexão Final
  reflexaoFinal: string;
  recomendacaoRenBrasil: string;

  // Seção 11 – Visão de Futuro
  visao2035: string;
  inovacaoProximaEdicao: string;

  // Seção 12 – Legado
  mensagemLegado: string;
}

export const PAISES_OPTIONS = [
  "Brasil",
  "Japão",
  "Argentina",
  "Paraguai",
  "Colômbia",
  "Peru",
  "Bolívia",
  "Chile",
  "Outro"
];

export const ATIVIDADES_OPTIONS = [
  "Abertura Institucional",
  "Palestra Magna",
  "Museu Toyota",
  "Visita Técnica",
  "Networking",
  "Almoço",
  "Jantar",
  "Outro"
];

export const APLICAR_CONHECIMENTO_OPTIONS = [
  "Sim",
  "Talvez",
  "Ainda não",
  "Não"
];

export const TEMAS_PRIORITARIOS_OPTIONS = [
  "Gestão Japonesa",
  "Kaizen",
  "Lean Manufacturing",
  "Inovação",
  "Inteligência Artificial",
  "Transformação Digital",
  "ESG",
  "Internacionalização",
  "Empreendedorismo",
  "Liderança",
  "Empresas Familiares",
  "Sucessão",
  "Cultura Japonesa",
  "Cooperação Internacional",
  "Outro"
];

export const DEFAULT_FORM_VALUES: FormResponse = {
  nome: "",
  email: "",
  empresaInstituicao: "",
  cargo: "",
  cidade: "",
  pais: "Brasil",
  avaliacaoGeral: 10,
  atividadeMaiorValor: "",
  destaqueForum: "",
  tresAprendizados: "",
  ideiaMaisImpactante: "",
  aspectoCulturaJaponesa: "",
  praticaPretendeAplicar: "",
  pretendeAplicarConhecimento: "",
  qualConhecimentoAplicar: "",
  desafiosImplementacao: "",
  oportunidadesBrasilJapao: "",
  comoRenPodeContribuir: "",
  oportunidadesAmericaLatina: "",
  projetoColaborativo: "",
  estabeleceuNovosContatos: "",
  contatosPodemGerarParcerias: "",
  temasPrioritarios: [],
  naoPodeFaltar: "",
  pontosAprimorar: "",
  reflexaoFinal: "",
  recomendacaoRenBrasil: "",
  visao2035: "",
  inovacaoProximaEdicao: "",
  mensagemLegado: ""
};

export const OBRIGATORIOS: Array<keyof FormResponse> = [
  "nome",
  "email",
  "empresaInstituicao",
  "cargo",
  "cidade",
  "pais",
  "avaliacaoGeral",
  "atividadeMaiorValor",
  "destaqueForum",
  "tresAprendizados",
  "ideiaMaisImpactante",
  "aspectoCulturaJaponesa",
  "pretendeAplicarConhecimento",
  "oportunidadesBrasilJapao",
  "comoRenPodeContribuir",
  "oportunidadesAmericaLatina",
  "temasPrioritarios",
  "naoPodeFaltar",
  "pontosAprimorar",
  "reflexaoFinal",
  "recomendacaoRenBrasil",
  "visao2035",
  "inovacaoProximaEdicao",
  "mensagemLegado"
];
