/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface LogoProps {
  className?: string;
  variant?: "stacked" | "horizontal" | "icon";
  height?: number | string;
  id?: string;
}

export default function Logo({ className = "", variant = "stacked", height, id }: LogoProps) {
  const hStyle = height ? { height } : undefined;

  if (variant === "icon") {
    return (
      <div 
        className={`relative overflow-hidden inline-block ${className}`} 
        style={{ height: height || "100%", aspectRatio: "210 / 130", ...hStyle }}
        id={id || "logo-icon-container"}
      >
        <img
          src="/RenBR.png"
          alt="Rede Nikkei Brasil Icon"
          className="absolute top-0 left-0 w-full h-[80%] object-cover object-top"
          referrerPolicy="no-referrer"
          id="logo-icon-img"
        />
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={`flex items-center gap-3 ${className}`} id={id || "logo-horizontal-container"}>
        {/* Logo Icon Graphic */}
        <Logo variant="icon" className="shrink-0 h-full" id="logo-horizontal-icon" />

        {/* Horizontal Text Divider and Brand Names */}
        <div className="h-8 w-[1px] bg-neutral-200" id="logo-horizontal-divider" />
        <div className="flex flex-col" id="logo-horizontal-text">
          <div
            className="text-[14px] font-bold tracking-tight leading-tight uppercase font-display text-neutral-800"
          >
            Rede Nikkei
          </div>
          <div
            className="text-[11px] font-black tracking-[0.25em] leading-none uppercase font-sans text-brand-red"
          >
            Brasil
          </div>
        </div>
      </div>
    );
  }

  // Stacked Logo (Default)
  return (
    <img
      src="/RenBR.png"
      alt="Rede Nikkei Brasil"
      className={className}
      style={{ height: height || "auto", width: "auto", ...hStyle }}
      referrerPolicy="no-referrer"
      id={id || "logo-stacked-img"}
    />
  );
}
