/**
 * Marka işareti — satır içi SVG, rengi `currentColor`.
 *
 * Daha önce `<img src="queryvale-mark.svg">` olarak yükleniyordu ve dosyanın
 * içinde `#0e0e0d` sabit rengi vardı. `<img>` etiketine renk geçirilemediği
 * için koyu tema `filter: invert(1)` ile işareti saf beyaza çeviriyordu —
 * paletin hiçbir yerinde bulunmayan bir değer. Satır içi SVG ile işaret
 * doğrudan tema tokenını izler; iki temada da özel bir hile gerekmez.
 */
export function QueryvaleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="240 145 760 542"
      width="42"
      height="30"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M300 205 L545 400 L300 595"
        fill="none"
        stroke="currentColor"
        strokeWidth="72"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="790" cy="250" rx="185" ry="72" />
      <path d="M605 285 C605 330 688 365 790 365 C892 365 975 330 975 285 L975 365 C975 410 892 445 790 445 C688 445 605 410 605 365 Z" />
      <path d="M605 415 C605 460 688 495 790 495 C892 495 975 460 975 415 L975 495 C975 540 892 575 790 575 C688 575 605 540 605 495 Z" />
      <rect x="605" y="610" width="370" height="52" rx="26" />
    </svg>
  );
}
