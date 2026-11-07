import { ACCESS_CONFIG } from "../data/access";
import { toneStyle } from "../lib/tone";

// Access pill — warm muted tone family, metrics identical to the category
// Badge (font 8, padding 2px 6px) so the two pill types read as one row unit.
export function AccessBadge({ accessKey }) {
  const access = ACCESS_CONFIG[accessKey];
  if (!access) return null;
  const t = toneStyle(access.tone);

  return (
    <span
      title={access.desc}
      style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        background: t.bg,
        color: t.color,
        border: "1px solid " + t.border,
        padding: "2px 6px",
        borderRadius: 2,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {access.short}
    </span>
  );
}
