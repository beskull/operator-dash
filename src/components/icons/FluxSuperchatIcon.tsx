/**
 * FluxPrompt Superchat mark — two stacked bars, the lower one tailed into a
 * speech bubble. Traced approximation of the brand asset; drop the real SVG
 * path in here when it's exported and every usage updates.
 */
export default function FluxSuperchatIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="3" y="4.4" width="18" height="6.4" rx="3.2" />
      <path d="M3 13.2h11.4a3.2 3.2 0 0 1 0 6.4H7.8l-3.9 2.9a.55.55 0 0 1-.9-.45V13.2z" />
    </svg>
  );
}
