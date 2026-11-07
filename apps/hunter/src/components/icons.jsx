// Inline brand + UI icons. Stroke icons follow the lucide style (24 viewBox,
// strokeWidth 2, round caps) so the whole header reads as one family. All
// inherit `currentColor` and adapt to the active theme.

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function GitHubIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

// Sun on dark (click for light), moon on light (click for dark).
export function SunIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

/* === View switcher ====================================================== */

export function GridViewIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function VendorViewIcon({ size = 15 }) {
  // Price tag — the vendor/offer directory.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function ListViewIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function GuidedViewIcon({ size = 15 }) {
  // Compass — step-by-step guided flow.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
    </svg>
  );
}

export function ForMeIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

/* === Header actions ===================================================== */

export function ProofIcon({ size = 15 }) {
  // Circle dollar — catalog values / proof view.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

export function AutomationIcon({ size = 15 }) {
  // Zap — the automation kit.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function AvatarIcon({ size = 15 }) {
  // Person in circle — profile / settings.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...strokeProps}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.66V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.66" />
    </svg>
  );
}
