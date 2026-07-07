/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface LogoProps {
  className?: string;
  variant?: "stacked" | "horizontal" | "icon";
  height?: number | string;
}

export default function Logo({ className = "", variant = "stacked", height }: LogoProps) {
  const hStyle = height ? { height } : undefined;

  if (variant === "icon") {
    return (
      <img
        src="/logo-icon.svg"
        alt="Rede Nikkei Brasil Icon"
        className={className}
        style={{ height: height || "100%", width: "auto", ...hStyle }}
        referrerPolicy="no-referrer"
        id="logo-icon-img"
      />
    );
  }

  if (variant === "horizontal") {
    return (
      <img
        src="/logo-horizontal.svg"
        alt="Rede Nikkei Brasil"
        className={className}
        style={hStyle}
        referrerPolicy="no-referrer"
        id="logo-horizontal-img"
      />
    );
  }

  // Stacked Logo (Default)
  return (
    <img
      src="/logo.svg"
      alt="Rede Nikkei Brasil"
      className={className}
      style={hStyle}
      referrerPolicy="no-referrer"
      id="logo-stacked-img"
    />
  );
}
