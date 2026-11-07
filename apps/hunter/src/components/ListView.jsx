import { LANE_COLORS } from "../data/lanes";
import { ACCESS_CONFIG } from "../data/access";
import { STATUS_CONFIG } from "../data/statuses";
import { toneStyle } from "../lib/tone";
import { Badge } from "./Badge";
import { AccessBadge } from "./AccessBadge";

// Compact list view — one row per offer, for scanning the whole catalog
// without card chrome. Same pills, status control, and apply link as the grid.
export function ListView({ programs, statuses, onStatusChange }) {
  return (
    <div className="list-view">
      <div className="list-row list-head" aria-hidden="true">
        <span className="list-pills">Pills</span>
        <span className="list-name">Opportunity</span>
        <span className="list-vendor">Vendor</span>
        <span className="list-value">Value</span>
        <span className="list-status">Status</span>
        <span className="list-apply" />
      </div>
      {programs.map(p => {
        const status = statuses[p.id] || "not_applied";
        const accessVisible = p.access.filter(a => a !== "ANY").slice(0, 2);
        return (
          <div className="list-row" key={p.id}>
            <span className="list-pills">
              <Badge label={p.lane} tone={LANE_COLORS[p.lane]?.tone} />
              {accessVisible.map(a => <AccessBadge key={a} accessKey={a} />)}
            </span>
            <a className="list-name" href={p.urls.apply} target="_blank" rel="noopener noreferrer" title={p.description}>
              {p.name.replace(/\s*\([^)]*\)\s*$/, "")}
            </a>
            <span className="list-vendor">{p.vendor}</span>
            <span className="list-value">
              {p.value?.counted && Number(p.value.estimate) > 0
                ? new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(p.value.estimate)
                : "—"}
            </span>
            {(() => {
              const ss = toneStyle(STATUS_CONFIG[status].tone);
              return (
                <select className="list-status" value={status} onChange={e => onStatusChange(p.id, e.target.value)} style={{
                  fontSize:10, fontWeight:600,
                  background: status === "not_applied" ? "var(--surface-2)" : ss.bg,
                  color: ss.color,
                  border: "1px solid " + (status === "not_applied" ? "var(--line)" : "transparent"),
                  borderRadius:3, padding:"3px 6px",
                  appearance:"none", cursor:"pointer", fontFamily:"monospace", outline:"none",
                  maxWidth:"100%",
                }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k} style={{ background:"var(--line-soft)" }}>{v.label}</option>
                  ))}
                </select>
              );
            })()}
            <a className="list-apply" href={p.urls.apply} target="_blank" rel="noopener noreferrer">Apply →</a>
          </div>
        );
      })}
    </div>
  );
}
