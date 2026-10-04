/** Full-viewport SVG film-grain (feTurbulence) at a fixed 0.035 opacity. Rendered only when enabled. */
export function GrainOverlay({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] [transform:translateZ(0)]"
      style={{ opacity: 0.035 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="silo-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#silo-grain)" />
      </svg>
    </div>
  );
}
