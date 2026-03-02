// src/components/OppMark.tsx
import * as React from "react";

type Props = {
  size?: number;        // px
  className?: string;   // optional container styles
  pulse?: boolean;      // turn animation on/off
};

export function OppMark({ size = 28, className, pulse = true }: Props) {
  const glowClass = pulse ? "opp-glow" : "";
  const outerClass = pulse ? "opp-outer" : "";
  const innerClass = pulse ? "opp-inner" : "";
  const dotClass = pulse ? "opp-dot" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="OPP mark"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Scoped styles live inside the SVG (safe + portable) */}
      {pulse ? (
        <style>{`
          .opp-glow { animation: oppGlow 3s ease-in-out infinite; transform-origin: 32px 32px; }
          .opp-outer { animation: oppOuter 3s ease-in-out infinite; transform-origin: 32px 32px; }
          .opp-inner { animation: oppInner 3s ease-in-out infinite; animation-delay: -1.5s; transform-origin: 32px 32px; }
          .opp-dot { animation: oppDot 3s ease-in-out infinite; animation-delay: -0.75s; transform-origin: 32px 32px; }

          @keyframes oppGlow {
            0%,100% { opacity: 0.08; }
            50%     { opacity: 0.18; }
          }
          @keyframes oppOuter {
            0%,100% { opacity: 0.95; }
            50%     { opacity: 0.45; }
          }
          @keyframes oppInner {
            0%,100% { opacity: 0.60; }
            50%     { opacity: 1.00; }
          }
          @keyframes oppDot {
            0%,100% { opacity: 1.00; }
            50%     { opacity: 0.30; }
          }
        `}</style>
      ) : null}

      {/* glow halo */}
      <circle className={glowClass} cx="32" cy="32" r="30" fill="#4A9EFF" />
      {/* outer ring */}
      <circle
        className={outerClass}
        cx="32"
        cy="32"
        r="26"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />
      {/* inner ring */}
      <circle
        className={innerClass}
        cx="32"
        cy="32"
        r="19"
        stroke="#4A9EFF"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* center dot */}
      <circle className={dotClass} cx="32" cy="32" r="3" fill="#4A9EFF" />
    </svg>
  );
}