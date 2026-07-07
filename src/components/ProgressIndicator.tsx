/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepNames,
}: ProgressIndicatorProps) {
  // We only show progress bar from step 2 (index 1) to step 9 (index 8)
  // Step 1 is welcome, Step 10 is success
  const isFormStep = currentStep > 1 && currentStep < 10;
  
  if (!isFormStep) return null;

  const progressPercentage = Math.round(
    ((currentStep - 1) / (totalSteps - 2)) * 100
  );

  return (
    <div className="w-full mb-6 bg-neutral-50/50 border border-neutral-100 p-4 rounded-xl md:hidden" id="progress-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
        <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">
          Etapa {currentStep - 1} de {totalSteps - 2} — {progressPercentage}% Concluído
        </span>
        <h4 className="text-xs font-display font-bold text-brand-dark">
          {stepNames[currentStep - 1]}
        </h4>
      </div>
      
      {/* Visual Bar */}
      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-brand-red h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
