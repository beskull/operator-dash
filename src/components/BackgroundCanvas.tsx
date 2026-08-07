import { useIsLight } from "../hooks/useTheme";

/** Subtle system-map visualization that sits behind all panels. */
export default function BackgroundCanvas({ intensity }: { intensity: number }) {
  const light = useIsLight();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base gradient */}
      <div
        className={`absolute inset-0 ${
          light
            ? "bg-gradient-to-br from-[#eef1f6] via-[#e9edf4] to-[#edf0f6]"
            : "bg-gradient-to-br from-[#0d1017] via-[#0b0d12] to-[#0d1118]"
        }`}
      />

      {/* Ambient blobs */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: intensity }}
      >
        {light ? (
          <>
            <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl" />
            <div className="absolute right-[-8rem] bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/20 blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute right-[-8rem] bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-3xl" />
          </>
        )}
      </div>

      {/* System map */}
      <svg
        className="absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ opacity: intensity * (light ? 0.7 : 0.5) }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="bg-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke={light ? "#d8dee9" : "#151a26"}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#bg-grid)" />
        <g stroke={light ? "#c3ccd9" : "#1d2536"} strokeWidth="1" fill="none">
          <path d="M 180 700 C 420 620, 520 420, 760 380" />
          <path d="M 760 380 C 980 340, 1080 480, 1280 440" />
          <path d="M 760 380 C 700 560, 480 560, 320 240" />
          <path d="M 320 240 C 520 160, 900 140, 1120 220" />
        </g>
        <g fill={light ? "#aebacd" : "#232c40"}>
          <circle cx="180" cy="700" r="5" />
          <circle cx="760" cy="380" r="7" />
          <circle cx="1280" cy="440" r="5" />
          <circle cx="320" cy="240" r="5" />
          <circle cx="1120" cy="220" r="5" />
        </g>
        <g fill="#2dd4bf" opacity="0.55">
          <circle cx="760" cy="380" r="3" />
          <circle cx="1120" cy="220" r="2.5" />
        </g>
      </svg>
    </div>
  );
}
