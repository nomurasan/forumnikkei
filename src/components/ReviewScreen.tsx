/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Edit3, CheckCircle, FileText, User, Star, Lightbulb, Compass, Share2, Award, Zap } from "lucide-react";
import { FormResponse } from "../types";

interface ReviewScreenProps {
  data: FormResponse;
  onJumpToStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewScreen({
  data,
  onJumpToStep,
  onSubmit,
  isSubmitting,
}: ReviewScreenProps) {
  
  const sections = [
    {
      title: "1. Perfil do Participante",
      icon: <User className="w-4 h-4 text-brand-dark" />,
      stepIndex: 2, // Maps to Screen 2
      fields: [
        { label: "Nome completo", value: data.nome },
        { label: "E-mail corporativo", value: data.email },
        { label: "Empresa / Instituição", value: data.empresaInstituicao },
        { label: "Cargo", value: data.cargo },
        { label: "Cidade", value: data.cidade },
        { label: "País", value: data.pais },
      ],
    },
    {
      title: "2. Experiência no Fórum",
      icon: <Star className="w-4 h-4 text-brand-gold" />,
      stepIndex: 3, // Maps to Screen 3
      fields: [
        { label: "Avaliação Geral", value: `${data.avaliacaoGeral}/10` },
        { label: "Atividade de Maior Valor", value: data.atividadeMaiorValor },
        { label: "Destaque do Fórum", value: data.destaqueForum },
      ],
    },
    {
      title: "3. Principais Aprendizados",
      icon: <Lightbulb className="w-4 h-4 text-brand-red" />,
      stepIndex: 4, // Maps to Screen 4
      fields: [
        { label: "Três principais aprendizados", value: data.tresAprendizados },
        { label: "Ideia mais impactante", value: data.ideiaMaisImpactante },
        { label: "Aspecto da cultura japonesa que chamou atenção", value: data.aspectoCulturaJaponesa },
        { label: "Prática que pretende aplicar", value: data.praticaPretendeAplicar },
      ],
    },
    {
      title: "4. Aplicação Prática",
      icon: <Zap className="w-4 h-4 text-brand-red" />,
      stepIndex: 5, // Maps to Screen 5
      fields: [
        { label: "Pretende aplicar os conhecimentos?", value: data.pretendeAplicarConhecimento },
        { label: "Qual conhecimento específico?", value: data.qualConhecimentoAplicar || "Não preenchido" },
        { label: "Principais desafios de implementação", value: data.desafiosImplementacao || "Não preenchido" },
      ],
    },
    {
      title: "5. Cooperação Internacional (Brasil–Japão e Latino-Americana)",
      icon: <Compass className="w-4 h-4 text-brand-dark" />,
      stepIndex: 6, // Maps to Screen 6
      fields: [
        { label: "Oportunidades de cooperação Brasil–Japão", value: data.oportunidadesBrasilJapao },
        { label: "Como o REN Brasil pode contribuir", value: data.comoRenPodeContribuir },
        { label: "Oportunidades de integração latino-americana", value: data.oportunidadesAmericaLatina },
        { label: "Projetos colaborativos vislumbrados", value: data.projetoColaborativo || "Não preenchido" },
      ],
    },
    {
      title: "6. Networking e Temas Prioritários",
      icon: <Share2 className="w-4 h-4 text-brand-dark" />,
      stepIndex: 7, // Maps to Screen 7
      fields: [
        { label: "Estabeleceu novos contatos?", value: data.estabeleceuNovosContatos || "Não preenchido" },
        { label: "Contatos podem gerar parcerias futuras?", value: data.contatosPodemGerarParcerias || "Não preenchido" },
        { 
          label: "Temas de alta prioridade selecionados", 
          value: data.temasPrioritarios && data.temasPrioritarios.length > 0 
            ? data.temasPrioritarios.join(", ") 
            : "Nenhum selecionado" 
        },
      ],
    },
    {
      title: "7. Recomendações, Visão de Futuro e Legado",
      icon: <Award className="w-4 h-4 text-brand-gold" />,
      stepIndex: 8, // Maps to Screen 8
      fields: [
        { label: "O que não pode faltar em próximas edições", value: data.naoPodeFaltar },
        { label: "Pontos a aprimorar para futuros eventos", value: data.pontosAprimorar },
        { label: "Reflexão final sobre a participação", value: data.reflexaoFinal },
        { label: "Recomendações estratégicas para o REN Brasil", value: data.recomendacaoRenBrasil },
        { label: "Visão 2035 (onde o ecossistema deve estar em 10 anos)", value: data.visao2035 },
        { label: "Inovação tecnológica para a próxima edição", value: data.inovacaoProximaEdicao },
        { label: "Mensagem de legado para futuras gerações", value: data.mensagemLegado },
      ],
    },
  ];

  return (
    <div className="space-y-6" id="review-screen">
      <div className="text-center max-w-xl mx-auto mb-8">
        <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-800">
          Revisão Final das Respostas
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          Por favor, verifique suas respostas antes de realizar o envio oficial. Você pode alterar qualquer dado clicando em "Editar" ao lado das respectivas seções.
        </p>
      </div>

      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 border-y border-neutral-100 py-4">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header of review item */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200/40">
              <div className="flex items-center gap-2">
                {sec.icon}
                <h4 className="text-xs sm:text-sm font-bold text-neutral-800">
                  {sec.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onJumpToStep(sec.stepIndex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-red hover:text-brand-red-hover hover:bg-brand-red/5 rounded-md border border-brand-red/20 transition-all cursor-pointer"
                title="Editar esta seção"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </button>
            </div>

            {/* Content of review item */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
              {sec.fields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                    {field.label}
                  </span>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {field.value || <span className="text-neutral-300 italic font-light text-xs">Não preenchido</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 p-6 bg-neutral-50 border border-neutral-200/80 rounded-xl">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-brand-dark shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-dark">Termo de Consentimento</h5>
            <p className="text-xs text-neutral-500 max-w-lg leading-relaxed">
              Ao confirmar o envio, você declara que as respostas fornecidas são legítimas e concorda com a inclusão dos dados na análise estratégica para elaboração do Relatório Executivo Final do Fórum.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-confirm-submit"
          disabled={isSubmitting}
          onClick={onSubmit}
          className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-red/20 cursor-pointer ${
            isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:-translate-y-0.5"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  document-id="path-loading"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4.5 h-4.5" />
              Confirmar e Enviar Resposta
            </>
          )}
        </button>
      </div>
    </div>
  );
}
