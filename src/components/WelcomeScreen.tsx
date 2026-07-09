/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, RotateCcw, CheckSquare, Sparkles } from "lucide-react";
import { FormResponse } from "../types";

interface WelcomeScreenProps {
  onStart: (resume: boolean) => void;
  hasDraft: boolean;
  draftData: FormResponse | null;
}

export default function WelcomeScreen({ onStart, hasDraft, draftData }: WelcomeScreenProps) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden" id="welcome-screen">
      <div className="relative bg-brand-dark text-white p-8 sm:p-10 text-center overflow-hidden border-b-4 border-brand-red">
        <img
          src="/forum-nikkei.png"
          alt="Convite especial Conexao REN Global - Aprendizados da Experiencia Toyota"
          className="mx-auto mb-6 w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        />
        <div className="relative inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase mb-4 border border-white/20 text-brand-gold">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          Questionário do Fórum 2026
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-tight">
          Obrigado por participar do Fórum Empresarial Nikkei Brasil–Japão
        </h1>
        <p className="mt-4 text-neutral-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Sua contribuição ajudará a REN Brasil a consolidar os principais aprendizados do evento e orientar futuras iniciativas de cooperação empresarial entre Brasil, Japão e América Latina.
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
          O questionário possui apenas seis perguntas e leva aproximadamente três minutos para ser respondido.
        </div>

        <div className="flex gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-200/60">
          <CheckSquare className="w-6 h-6 text-brand-red shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-neutral-800">Resposta objetiva e rápida</h4>
            <p className="text-xs text-neutral-500 mt-1">As perguntas foram organizadas para captar aprendizados, intenção de aplicação prática e recomendações estratégicas em um fluxo simples.</p>
          </div>
        </div>

        {hasDraft && draftData ? (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Você possui um rascunho salvo</h4>
                <p className="text-xs text-amber-700 mt-1">Deseja retomar sua resposta anterior ou iniciar um novo questionário?</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => onStart(true)} className="flex-1 rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white">Retomar rascunho</button>
              <button type="button" onClick={() => onStart(false)} className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700">Iniciar novo</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button type="button" onClick={() => onStart(false)} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-red-hover">
              <Play className="h-4 w-4" />
              Iniciar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
