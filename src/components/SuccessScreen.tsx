/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BarChart3, Check, RefreshCw } from "lucide-react";
import { FormResponse } from "../types";
import Logo from "./Logo";

interface SuccessScreenProps {
  data: FormResponse;
  onReset: () => void;
  onViewResults: () => void;
}

export default function SuccessScreen({ onReset, onViewResults }: SuccessScreenProps) {
  return (
    <div id="success-screen" className="flex min-h-[calc(100svh-11rem)] w-full items-start justify-center py-4 sm:items-center sm:py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200/80 bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className="mb-4 flex justify-center">
          <Logo variant="stacked" className="h-20" />
        </div>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10">
          <Check className="h-8 w-8 text-brand-red" />
        </div>
        <h2 className="text-2xl font-black text-neutral-800">Obrigado pela sua contribuição!</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Sua resposta foi registrada com sucesso. Ela será utilizada pela REN Brasil para consolidar aprendizados e orientar futuras iniciativas de cooperação empresarial.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4 text-brand-red" />
            Responder novamente
          </button>
          <button
            type="button"
            onClick={onViewResults}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
          >
            <BarChart3 className="h-4 w-4" />
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
}
