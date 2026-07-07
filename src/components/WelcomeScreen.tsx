/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, RotateCcw, Award, CheckSquare, Sparkles } from "lucide-react";
import { FormResponse } from "../types";
import Logo from "./Logo";

interface WelcomeScreenProps {
  onStart: (resume: boolean) => void;
  hasDraft: boolean;
  draftData: FormResponse | null;
}

export default function WelcomeScreen({
  onStart,
  hasDraft,
  draftData,
}: WelcomeScreenProps) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300" id="welcome-screen">
      {/* Decorative Brand Header */}
      <div className="relative bg-brand-dark text-white p-8 sm:p-10 text-center overflow-hidden border-b-4 border-brand-red flex flex-col items-center">
        {/* Subtle geometric overlay mimicking the rising sun / Brazilian paths */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        
        {/* Brand Logo Card */}
        <div className="bg-white px-8 py-6 rounded-2xl shadow-xl mb-6 border border-neutral-100 transform hover:scale-102 transition-all duration-300 inline-block">
          <Logo variant="stacked" className="h-28 sm:h-32" />
        </div>
        
        <div className="relative inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase mb-4 border border-white/20 text-brand-gold">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          Fórum Empresarial 2026
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-tight">
          Coleta de Aprendizados
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 font-mono tracking-wider mt-1 uppercase">
          Fórum Empresarial Nikkei Brasil–Japão
        </p>
        <p className="mt-4 text-neutral-300 font-sans text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
          Consolidando aprendizados, percepções estratégicas e recomendações para o Relatório Executivo Final do Fórum.
        </p>
      </div>

      <div className="p-6 sm:p-10 space-y-8">
        {/* Intro text */}
        <div className="prose prose-neutral text-neutral-600 space-y-4">
          <p className="text-base leading-relaxed text-neutral-700 font-normal">
            Seja muito bem-vindo(a) ao sistema de registro de percepções do <strong>Fórum Empresarial Nikkei Brasil–Japão</strong>.
            Sua contribuição é indispensável para sistematizar os aprendizados e formatar as bases de cooperação futura.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-neutral-500">
            As respostas servirão como insumo estruturado para a redação do <strong>Relatório Executivo Final</strong> do Fórum, coordenado pela Rede Nikkei (REN Brasil) para documentar o legado de inovação, parcerias bilaterais e visão de futuro.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-200/60 transition-all hover:bg-neutral-100/50">
            <CheckSquare className="w-6 h-6 text-brand-red shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-neutral-800 font-display">Coleta Estruturada</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Registro ágil em 8 etapas fáceis, com salvamento automático de rascunhos em tempo real.</p>
            </div>
          </div>
          <div className="flex gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-200/60 transition-all hover:bg-neutral-100/50">
            <Award className="w-6 h-6 text-brand-gold shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-neutral-800 font-display">Impacto e Legado</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Sua voz fará parte das recomendações estratégicas enviadas para líderes e diplomatas de ambos os países.</p>
            </div>
          </div>
        </div>

        {/* Prompt Option logic (Draft recovery) */}
        {hasDraft && draftData ? (
          <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-4" id="draft-alert">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Você possui um rascunho salvo</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Identificamos respostas de <strong>{draftData.nome || "Participante"}</strong> ({draftData.email || "Sem e-mail"}). Deseja retomar de onde parou ou iniciar um novo formulário?
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                id="btn-resume-draft"
                onClick={() => onStart(true)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retomar do Rascunho
              </button>
              <button
                type="button"
                id="btn-new-form"
                onClick={() => onStart(false)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
              >
                <Play className="w-4 h-4 text-brand-red" />
                Iniciar Novo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              id="btn-start-fresh"
              onClick={() => onStart(false)}
              className="group flex items-center gap-3 px-8 py-4 bg-brand-red hover:bg-brand-red-hover text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-brand-red/20 cursor-pointer"
            >
              Iniciar Preenchimento
              <Play className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      {/* Decorative footer ribbon */}
      <div className="bg-neutral-50 border-t border-neutral-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
        <span>© 2026 Fórum Empresarial Nikkei Brasil–Japão</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ambiente Seguro
          </span>
          <span>Sistematização Oficial</span>
        </div>
      </div>
    </div>
  );
}
