/** Shared orbital mark for every role. */
export default function OrbitMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="20" rx="18" ry="6.5" transform="rotate(-30 20 20)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="20" r="9" fill="currentColor" />
      <path d="M4.4 29c5.4 1 16.3-3.5 25.2-9.9" stroke="var(--brand-sky, #182331)" strokeWidth="2.5" />
      <path d="M4.4 29c5.4 1 16.3-3.5 25.2-9.9" stroke="currentColor" strokeWidth="1" transform="translate(0 2)" />
    </svg>
  );
}
