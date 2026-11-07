import { useEffect, useState } from "react";
import { LANE_COLORS } from "../data/lanes";
import { STATUS_CONFIG } from "../data/statuses";
import { agentState, getAgentTask } from "../lib/agent";
import { getFieldMeta } from "../data/profile";
import { toneStyle } from "../lib/tone";
import { Badge } from "./Badge";
import { AccessBadge } from "./AccessBadge";

export function ProgramCard({ program, status, onStatusChange, profileDoc }) {
  const [infoOpen, setInfoOpen] = useState(false);

  // Quick Draft: AI-generated application packet (gateway-backed serverless fn)
  const [draftText, setDraftText] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState(null);

  const handleQuickDraft = async () => {
    if (drafting) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program, profile: profileDoc || {} }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.draft) throw new Error(data.error || `Draft failed (${res.status}).`);
      setDraftText(data.draft);
      if (navigator.clipboard) navigator.clipboard.writeText(data.draft).catch(() => {});
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Draft failed.");
    } finally {
      setDrafting(false);
    }
  };

  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setInfoOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoOpen]);

  const lc = LANE_COLORS[program.lane];
  const sc = STATUS_CONFIG[status];
  const ag = agentState(program);
  const laneTone = lc?.tone;

  // Pills: category + up to two access paths. "ANY" carries no info, hide it.
  // One row only, never wraps — overflow is clipped rather than shifting layout.
  const accessVisible = program.access.filter(a => a !== "ANY").slice(0, 2);
  const hasDeps = program.dependencies && program.dependencies.length > 0;

  // Vendor favicon — derive from apply URL.
  const vendorDomain = (() => {
    try { return new URL(program.urls.apply).hostname.replace(/^www\./, ""); }
    catch { return null; }
  })();

  return (
    <div className="program-card" style={{
      position: "relative",
      background: "var(--surface)",
      border: "1px solid " + (
        program.tags.includes("billing_risk") ? "color-mix(in oklch, var(--stop) 32%, transparent)" :
        program.tags.includes("stale")        ? "var(--line)" :
        `color-mix(in oklch, var(--${laneTone}) 24%, transparent)`
      ),
      borderRadius:4, padding:"16px 16px 14px",
      display:"flex", flexDirection:"column", gap:10,
      minHeight: 0,
    }}>

      {/* Vendor favicon — top-right, clean, low-key */}
      {vendorDomain && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${vendorDomain}&sz=64`}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{
            position:"absolute", top:12, right:12,
            width:28, height:28, borderRadius:4,
            opacity:0.45, filter:"saturate(0.7)",
            pointerEvents:"none",
          }}
        />
      )}

      {/* ROW 1 — Pills: category + access. Fixed height, single row, clipped. */}
      <div className="pill-row" style={{ paddingRight: vendorDomain ? 36 : 0 }}>
        <Badge label={program.lane} tone={laneTone} />
        {accessVisible.map(a => <AccessBadge key={a} accessKey={a} />)}
      </div>

      {/* ROW 2 — Name. Two-line fixed zone so subtext starts at the same
          vertical position on every card, in every row. */}
      <div className="card-title">
        {program.name.replace(/\s*\([^)]*\)\s*$/, "")}
      </div>

      {/* ROW 3 — Summary. Three-line fixed zone; longer copy ellipsizes (full
          text lives in the info dialogue). */}
      <div className="card-desc">
        {program.description}
      </div>

      {/* BOTTOM ZONE — divider, value, actions. Bottom-locked via margin-top:
          auto so nothing above can ever shift it; identical height on every
          card keeps the divider uniform across each grid row. */}
      <div style={{ marginTop:"auto" }}>
        <div className="program-value-line" aria-label="Estimated offer value">
          <span className="program-value-label">{program.value?.label || "Value not stated"}</span>
          {program.value?.counted && Number(program.value.estimate) > 0 && (
            <strong>{new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(program.value.estimate)}</strong>
          )}
          {program.value?.counted && !program.value.cashLike && <small>in-kind</small>}
          {!program.value?.counted && <small>not in totals</small>}
        </div>

        <div style={{ display:"flex", gap:7, alignItems:"center", paddingTop:9 }}>
          <a href={program.urls.apply} target="_blank" rel="noopener noreferrer" style={{
            fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
            color:"var(--action-text)", background:"var(--neutral-action)",
            padding:"5px 11px", borderRadius:3, textDecoration:"none", flexShrink:0,
          }}>Apply →</a>
          {(() => {
            const ss = toneStyle(sc.tone);
            return (
              <select value={status} onChange={e => onStatusChange(program.id, e.target.value)} style={{
                flex:1, fontSize:10, fontWeight:600, minWidth:0,
                background: status === "not_applied" ? "var(--surface-2)" : ss.bg,
                color: ss.color,
                border: "1px solid " + (status === "not_applied" ? "var(--line)" : "transparent"),
                borderRadius:3, padding:"4px 7px",
                appearance:"none", cursor:"pointer", fontFamily:"monospace", outline:"none",
              }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k} style={{ background:"var(--line-soft)" }}>{v.label}</option>
                ))}
              </select>
            );
          })()}
          <button onClick={() => setInfoOpen(true)} title="More information" aria-haspopup="dialog" style={{
            background:"transparent", border:"1px solid var(--line)", color:"var(--text-dim3)",
            borderRadius:3, padding:"4px 8px", cursor:"pointer", fontSize:9,
            fontFamily:"monospace", letterSpacing:"0.06em", flexShrink:0,
          }}>info</button>
        </div>
      </div>

      {/* INFO DIALOGUE — centered, overlay + blur. All demoted detail lives
          here instead of a layout-shifting expansion. */}
      {infoOpen && (
        <div className="info-overlay" onClick={() => setInfoOpen(false)} role="presentation">
          <div className="info-dialogue" role="dialog" aria-modal="true" aria-label={`${program.name} details`} onClick={e => e.stopPropagation()}>
            <div className="info-dialogue-head">
              <div style={{ minWidth:0 }}>
                <div className="info-dialogue-title">{program.name.replace(/\s*\([^)]*\)\s*$/, "")}</div>
                <div className="info-dialogue-sub">{program.vendor} · {program.type}</div>
              </div>
              <button className="info-dialogue-close" onClick={() => setInfoOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="info-dialogue-body">
              <div className="info-sec">
                <div className="info-sec-label">// PLAN</div>
                <div className="info-kv"><span>state</span><em style={{ color:`var(--${ag.tone})` }}>{ag.label.toLowerCase()}</em></div>
                <div className="info-kv"><span>task</span><em>{getAgentTask(program).label.toLowerCase()}</em></div>
                <div className="info-kv"><span>platform</span><em>{program.formConfig.platform}</em></div>
                <div className="info-kv"><span>fields</span><em>{program.formConfig.fields.length > 0 ? program.formConfig.fields.join(", ") : "standard email signup"}</em></div>
                {hasDeps && <div className="info-kv"><span>depends on</span><em style={{ color:"var(--info)" }}>{program.dependencies.join(", ")}</em></div>}
              </div>

              <div className="info-sec">
                <div className="info-sec-label">// OFFER</div>
                <div className="info-kv"><span>value</span><em style={{ color:"var(--gold)" }}>{program.value?.label || "not stated"}</em></div>
                <div className="info-kv"><span>kind</span><em>{program.value?.cashLike ? "cash-like" : "in-kind"} · {program.value?.counted ? "counted in totals" : "not counted"}</em></div>
              </div>

              <div className="info-sec">
                <div className="info-sec-label">// ELIGIBILITY</div>
                <div style={{ fontSize:10, lineHeight:1.6, color:"var(--text-dim)" }}>{program.eligibility}</div>
                <div className="info-kv" style={{ marginTop:6 }}><span>access</span><em>{program.access.join(" OR ")}</em></div>
                <div className="info-kv"><span>tags</span><em>{program.tags.join(" | ") || "—"}</em></div>
              </div>

              {program.formConfig.fields && program.formConfig.fields.length > 0 && (
                <div className="info-sec">
                  <div className="info-sec-label">// APPLICATION DATA</div>
                  {program.formConfig.fields.map(k => {
                    const v = (profileDoc || {})[k];
                    const ok = v && String(v).trim();
                    const meta = getFieldMeta(k);
                    return (
                      <div key={k} className="info-field">
                        <span style={{ color: ok ? "var(--ok)" : "var(--stop)" }}>{ok ? "✓" : "○"}</span>
                        <span className="info-field-label">{meta.label}</span>
                        <span style={{
                          color: ok ? "var(--text)" : "var(--text-dim3)",
                          fontStyle: ok ? "normal" : "italic",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>{ok ? String(v).slice(0, 80) : "not filled"}</span>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex", gap:6, marginTop:9, flexWrap:"wrap" }}>
                    <button onClick={() => {
                      const data = {};
                      for (const k of program.formConfig.fields) data[k] = (profileDoc || {})[k] || "";
                      const text = JSON.stringify(data, null, 2);
                      if (navigator.clipboard) navigator.clipboard.writeText(text);
                    }} style={{
                      background:"transparent", border:"1px solid var(--line)", color:"var(--text-dim)",
                      padding:"3px 10px", borderRadius:2, cursor:"pointer", fontSize:9,
                      fontFamily:"monospace", letterSpacing:"0.05em",
                    }}>
                      Copy as JSON
                    </button>
                    <button onClick={handleQuickDraft} disabled={drafting} style={{
                      background:"transparent", border:"1px solid var(--line)", color:"var(--text-dim)",
                      padding:"3px 10px", borderRadius:2, cursor: drafting ? "wait" : "pointer", fontSize:9,
                      fontFamily:"monospace", letterSpacing:"0.05em", opacity: drafting ? 0.5 : 1,
                    }}>
                      {drafting ? "Drafting…" : "✎ Quick Draft (AI)"}
                    </button>
                  </div>
                  {draftError && <div style={{ marginTop:6, color:"var(--stop)", fontSize:9 }}>{draftError}</div>}
                  {draftText && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--line-soft)" }}>
                      <div className="info-sec-label">// AI DRAFT (copied to clipboard)</div>
                      <pre style={{ whiteSpace:"pre-wrap", color:"var(--text-dim2)", fontSize:8.5, margin:0, maxHeight:220, overflowY:"auto" }}>{draftText}</pre>
                    </div>
                  )}
                </div>
              )}

              <div className="info-sec" style={{ marginBottom:0 }}>
                <div className="info-sec-label">// SOURCE</div>
                <div className="info-kv"><span>url</span><em style={{ wordBreak:"break-all" }}>
                  <a href={program.urls.apply} target="_blank" rel="noopener noreferrer" style={{ color:"var(--info)", textDecoration:"none" }}>{program.urls.apply}</a>
                </em></div>
                <div className="info-kv"><span>verified</span><em>{program.lastVerified}</em></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
