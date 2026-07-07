/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Download, RefreshCw, FileSpreadsheet, Check, Gift, Heart, Calendar } from "lucide-react";
import { FormResponse } from "../types";
import Logo from "./Logo";

interface SuccessScreenProps {
  data: FormResponse;
  onReset: () => void;
}

export default function SuccessScreen({ data, onReset }: SuccessScreenProps) {
  // Download single submission JSON
  const downloadJSON = () => {
    const filename = `forum_nikkei_resposta_${data.nome.toLowerCase().replace(/\s+/g, "_")}.json`;
    const jsonStr = JSON.stringify(
      {
        ...data,
        exportadoEm: new Date().toISOString(),
        origem: "app_google_studio",
        evento: "forum_empresarial_nikkei_brasil_japao_2026",
      },
      null,
      2
    );
    const element = document.createElement("a");
    const file = new Blob([jsonStr], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-12 space-y-8 text-center" id="success-screen">
      {/* Brand logo at the top */}
      <div className="flex justify-center mb-2">
        <Logo variant="stacked" className="h-20" />
      </div>

      {/* Aesthetic Circle Design with Rising Sun Reference */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-brand-red/10 border border-brand-red/20">
        {/* Decorative inner circular sun */}
        <div className="absolute inset-2 rounded-full bg-brand-red/10 animate-ping opacity-25" />
        <div className="absolute inset-4 rounded-full bg-brand-red flex items-center justify-center shadow-lg">
          <Check className="w-10 h-10 text-white stroke-[3px]" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-red bg-brand-red/10 px-4 py-1.5 rounded-full">
          Envio Realizado com Sucesso
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-800">
          Muito obrigado, {data.nome}!
        </h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Suas contribuições e percepções sobre o <strong>Fórum Empresarial Nikkei Brasil–Japão 2026</strong> foram registradas com sucesso e estão integradas de forma segura.
        </p>
      </div>

      {/* Decorative Legacy Card */}
      <div className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl border border-neutral-200/60 text-left space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-brand-red" />
          Seu Legado no Fórum
        </h4>
        <p className="text-xs text-neutral-600 italic leading-relaxed">
          "{data.mensagemLegado}"
        </p>
        <div className="flex items-center gap-4 pt-2 text-[10px] text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-brand-red fill-brand-red/20" />
            Nikkei Brasil-Japão
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-red" />
            Julho 2026
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest text-center">
          Downloads & Ações de Relatório
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-download-receipt"
            onClick={downloadJSON}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-dark hover:bg-brand-charcoal text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Baixar Cópia (JSON)
          </button>
          
          <a
            href="/api/export-csv"
            id="btn-export-consolidated"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Base Consolidada (CSV)
          </a>
        </div>

        <button
          type="button"
          id="btn-restart-survey"
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-brand-red" />
          Registrar Outra Resposta
        </button>
      </div>

      <div className="pt-2 text-[11px] text-neutral-400 leading-relaxed max-w-sm mx-auto font-mono">
        As respostas consolidadas em formato CSV servirão como matéria-prima direta para a redação automatizada e as visualizações do Relatório Executivo Final.
      </div>
    </div>
  );
}
