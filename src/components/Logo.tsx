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
  const redColor = "#D2232A";
  const darkColor = "#2D2D2D";

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 420 300"
        className={className}
        style={{ height: height || "100%", width: "auto" }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="logo-icon-svg"
      >
        {/* Letter R */}
        <text
          x="40"
          y="200"
          fill={redColor}
          fontSize="170"
          fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
          fontWeight="900"
          letterSpacing="-5"
        >
          R
        </text>

        {/* Japanese Kanji "連" */}
        <text
          x="195"
          y="185"
          fill={darkColor}
          fontSize="115"
          fontFamily="'Noto Serif JP', 'MS Mincho', 'Hiragino Mincho Pro', serif"
          fontWeight="900"
        >
          連
        </text>

        {/* E-bar red brush stroke overlapping the Kanji */}
        <path
          d="M 185 142 L 315 142"
          stroke={redColor}
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Letter N */}
        <text
          x="305"
          y="200"
          fill={redColor}
          fontSize="170"
          fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
          fontWeight="900"
          letterSpacing="-5"
        >
          N
        </text>
      </svg>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={`flex items-center gap-3 ${className}`} id="logo-horizontal-container">
        {/* Logo Icon Graphic */}
        <svg
          viewBox="0 0 420 300"
          className="h-10 w-auto shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Letter R */}
          <text
            x="40"
            y="200"
            fill={redColor}
            fontSize="170"
            fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
            fontWeight="900"
            letterSpacing="-5"
          >
            R
          </text>

          {/* Japanese Kanji "連" */}
          <text
            x="195"
            y="185"
            fill={darkColor}
            fontSize="115"
            fontFamily="'Noto Serif JP', 'MS Mincho', 'Hiragino Mincho Pro', serif"
            fontWeight="900"
          >
            連
          </text>

          {/* E-bar red brush stroke overlapping the Kanji */}
          <path
            d="M 185 142 L 315 142"
            stroke={redColor}
            strokeWidth="15"
            strokeLinecap="round"
          />

          {/* Letter N */}
          <text
            x="305"
            y="200"
            fill={redColor}
            fontSize="170"
            fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
            fontWeight="900"
            letterSpacing="-5"
          >
            N
          </text>
        </svg>

        {/* Horizontal Text Divider and Brand Names */}
        <div className="h-8 w-[1px] bg-neutral-200" />
        <div className="flex flex-col">
          <div
            className="text-[14px] font-bold tracking-tight leading-tight uppercase font-display"
            style={{ color: darkColor }}
          >
            Rede Nikkei
          </div>
          <div
            className="text-[12px] font-black tracking-[0.25em] leading-none uppercase font-sans"
            style={{ color: redColor }}
          >
            Brasil
          </div>
        </div>
      </div>
    );
  }

  // Stacked Logo (Default)
  return (
    <div
      className={`flex flex-col items-center text-center justify-center ${className}`}
      style={{ height: height || "auto" }}
      id="logo-stacked-container"
    >
      {/* Icon Graphic */}
      <svg
        viewBox="0 0 420 280"
        className="w-full max-w-[200px] h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Letter R */}
        <text
          x="40"
          y="200"
          fill={redColor}
          fontSize="170"
          fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
          fontWeight="900"
          letterSpacing="-5"
        >
          R
        </text>

        {/* Japanese Kanji "連" */}
        <text
          x="195"
          y="185"
          fill={darkColor}
          fontSize="115"
          fontFamily="'Noto Serif JP', 'MS Mincho', 'Hiragino Mincho Pro', serif"
          fontWeight="900"
        >
          連
        </text>

        {/* E-bar red brush stroke overlapping the Kanji */}
        <path
          d="M 185 142 L 315 142"
          stroke={redColor}
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Letter N */}
        <text
          x="305"
          y="200"
          fill={redColor}
          fontSize="170"
          fontFamily="'Cinzel', 'Playfair Display', 'Georgia', serif"
          fontWeight="900"
          letterSpacing="-5"
        >
          N
        </text>
      </svg>

      {/* Brand Text below */}
      <div className="flex flex-col items-center mt-1">
        <span
          className="text-[22px] font-extrabold tracking-tight font-display text-neutral-800 uppercase leading-none"
          style={{ color: darkColor }}
        >
          Rede Nikkei
        </span>
        <span
          className="text-[18px] font-black tracking-[0.3em] font-sans uppercase leading-none mt-1 ml-[0.3em]"
          style={{ color: redColor }}
        >
          Brasil
        </span>
      </div>
    </div>
  );
}
