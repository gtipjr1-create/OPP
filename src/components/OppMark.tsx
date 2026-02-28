export function OppMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        .opp-glow {
          animation: oppGlow 3s ease-in-out infinite;
        }
        .opp-outer {
          animation: oppOuter 3s ease-in-out infinite;
        }
        .opp-inner {
          animation: oppInner 3s ease-in-out infinite;
          animation-delay: -1.5s;
        }
        .opp-dot {
          animation: oppDot 3s ease-in-out infinite;
          animation-delay: -0.75s;
        }
        @keyframes oppGlow {
          0%,100% { opacity: 0.08; }
          50%      { opacity: 0.18; }
        }
        @keyframes oppOuter {
          0%,100% { opacity: 0.95; }
          50%      { opacity: 0.45; }
        }
        @keyframes oppInner {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes oppDot {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      <circle className="opp-glow" cx="32" cy="32" r="30" fill="#4A9EFF" />
      <circle className="opp-outer" cx="32" cy="32" r="26"
        stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
      <circle className="opp-inner" cx="32" cy="32" r="19"
        stroke="#4A9EFF" strokeWidth="1.5" strokeOpacity="0.8" />
      <circle className="opp-dot" cx="32" cy="32" r="3" fill="#4A9EFF" />
    </svg>
  )
}
