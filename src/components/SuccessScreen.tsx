/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Check, RefreshCw } from "lucide-react";
import { FormResponse } from "../types";
import Logo from "./Logo";

interface SuccessScreenProps {
  data: FormResponse;
  onReset: () => void;
}

export default function SuccessScreen({ onReset }: SuccessScreenProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-10 text-center">
      <div className="flex justify-center mb-4">
        <Logo variant="stacked" className="h-20" />
      </div>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10">
        <Check className="h-8 w-8 text-brand-red" />
      </div>
      <h2 className="text-2xl font-display font-black text-neutral-800">Obrigado pela sua contribuição!</h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        Sua resposta foi registrada com sucesso. Ela será utilizada pela REN Brasil para consolidar aprendizados e orientar futuras iniciativas de cooperação empresarial.
      </p>
      <button type="button" onClick={onReset} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
        <RefreshCw className="h-4 w-4 text-brand-red" />
        Responder novamente
      </button>
    </div>
  );
}