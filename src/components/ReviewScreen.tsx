/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Edit3, FileText } from "lucide-react";
import { FormResponse } from "../types";

interface ReviewScreenProps {
  data: FormResponse;
  onJumpToQuestion: (questionNumber: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function formatListValue(value: string | string[]) {
  if (Array.isArray(value)) return value.length ? value.join("\n") : "Não respondido";
  return value || "Não respondido";
}

export default function ReviewScreen({ data, onJumpToQuestion }: ReviewScreenProps) {
  const sections = [
    {
      title: "Atividade de maior valor",
      questionNumber: 1,
      value: data.atividadeMaiorValor || "Não respondido"
    },
    {
      title: "Principal aprendizado",
      questionNumber: 2,
      value: data.principalAprendizado || "Não respondido"
    },
    {
      title: "Probabilidade de aplicação",
      questionNumber: 3,
      value: data.probabilidadeAplicacao ? `${data.probabilidadeAplicacao} / 5` : "Não respondido"
    },
    {
      title: "Prática que pretende aplicar",
      questionNumber: 4,
      value: data.praticaPretendeAplicar || "Não respondido"
    },
    {
      title: "Iniciativas prioritárias da REN",
      questionNumber: 5,
      value: formatListValue(data.iniciativaPrioritariaREN)
    },
    {
      title: "Recomendação estratégica",
      questionNumber: 6,
      value: data.recomendacaoEstrategicaREN || "Não respondido"
    }
  ];

  return (
    <div className="space-y-6" id="review-screen">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-800">Resumo das respostas</h3>
        <p className="text-sm text-neutral-500 mt-2">Revise as respostas antes de enviar. Você pode editar qualquer item clicando em editar.</p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-neutral-800">{section.title}</h4>
              <button type="button" onClick={() => onJumpToQuestion(section.questionNumber)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red">
                <Edit3 className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{section.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-brand-dark shrink-0" />
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-dark">Confirmação</h5>
            <p className="text-sm text-neutral-600">Ao confirmar o envio, suas respostas serão registradas para a análise estratégica do Fórum.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
