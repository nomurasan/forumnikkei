/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BarChart3, CheckSquare, Play, RotateCcw, Sparkles } from "lucide-react";
import { FormResponse } from "../types";

interface WelcomeScreenProps {
  onStart: (resume: boolean) => void;
  onViewResults: () => void;
  hasDraft: boolean;
  draftData: FormResponse | null;
}

export default function WelcomeScreen({ onStart, onViewResults, hasDraft, draftData }: WelcomeScreenProps) {
  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl" id="welcome-screen">
      <div className="relative overflow-hidden border-b-4 border-brand-red bg-brand-dark p-8 text-center text-white sm:p-10">
        <img
          src="/forum-nikkei.png"
          alt="Convite especial Conexao REN Global - Aprendizados da Experiencia Toyota"
          className="mx-auto mb-6 w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        />
        <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.28em] text-brand-gold">
          <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
          Questionário do Fórum 2026
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          Obrigado por participar do Fórum Empresarial Nikkei Brasil-Japão
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
          Sua contribuição ajuda a REN Brasil a consolidar os principais aprendizados do evento e orientar futuras iniciativas de cooperação empresarial entre Brasil, Japão e América Latina.
        </p>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
          O questionário possui apenas seis perguntas e leva aproximadamente três minutos para ser respondido.
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => onStart(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-red-hover"
          >
            <Play className="h-4 w-4" />
            Iniciar questionário
          </button>

          <button
            type="button"
            onClick={onViewResults}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-white px-6 py-4 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5"
          >
            <BarChart3 className="h-4 w-4" />
            Ver resultados
          </button>
        </div>

        <div className="flex gap-4 rounded-xl border border-neutral-200/60 bg-neutral-50 p-5">
          <CheckSquare className="mt-0.5 h-6 w-6 shrink-0 text-brand-red" />
          <div>
            <h4 className="text-sm font-bold text-neutral-800">Resposta objetiva e rápida</h4>
            <p className="mt-1 text-xs text-neutral-500">
              As perguntas foram organizadas para captar aprendizados, intenção de aplicação prática e recomendações estratégicas em um fluxo simples.
            </p>
          </div>
        </div>

        {hasDraft && draftData ? (
          <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Você possui um rascunho salvo</h4>
                <p className="mt-1 text-xs text-amber-700">Deseja retomar sua resposta anterior ou iniciar um novo questionário?</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onStart(true)}
                className="flex-1 rounded-lg bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
              >
                Retomar rascunho
              </button>
              <button
                type="button"
                onClick={() => onStart(false)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Iniciar novo
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
