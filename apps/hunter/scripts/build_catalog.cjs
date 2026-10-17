const fs = require("fs");
const path = require("path");

const { auditedExisting } = require("./_audit_existing.cjs");
const freetokensPart1 = require("./_freetokens_additions.cjs");
const freetokensPart2 = require("./_freetokens_part2.cjs");
const researchAdditions = require("./_research_additions.cjs");

// Sources overlap (the same program can appear in the audit, freetokens and
// research files). Merge by id; later sources win, so the research entries
// (newest verified URLs) override older audit copies. Any overridden id is logged.
const sources = [auditedExisting, freetokensPart1, freetokensPart2, researchAdditions];
const mergedById = new Map();
for (const src of sources) {
  const localIds = new Set();
  for (const p of src) {
    if (localIds.has(p.id)) throw new Error("Duplicate program ID within one source: " + p.id);
    localIds.add(p.id);
    if (mergedById.has(p.id) && JSON.stringify(mergedById.get(p.id)) !== JSON.stringify(p)) {
      console.log("Override (later source wins): " + p.id);
    }
    mergedById.set(p.id, p);
  }
}
const allPrograms = [...mergedById.values()];

// Validate schema and invariants
const VALID_LANES = new Set([
  "DevOps",
  "Multimedia",
  "Research & Writing",
  "Business",
  "Tech & AI",
  "Science & Education"
]);
const VALID_ACCESS = new Set([
  "anyone",
  "biz_email",
  "edu",
  "nonprofit",
  "oss",
  "accelerator"
]);
const VALID_TAGS = new Set([
  "easy_apply",
  "partner_required",
  "manual_submit_only",
  "proposal_required",
  "human_review",
  "no_application",
  "billing_risk",
  "usage_exclusions",
  "requires_card",
  "finance_kyc",
  "legal_entity_required",
  "requires_website",
  "requires_social",
  "requires_company_domain_email",
  "yc_only",
  "one_time_purchase",
  "renewal_required",
  "expiry_short",
  "expiry_12mo",
  "stale"
]);

for (const p of allPrograms) {
  if (!VALID_LANES.has(p.lane)) {
    throw new Error(`Invalid lane on ${p.id}: ${p.lane}`);
  }
  if (![1, 2].includes(p.tier)) {
    throw new Error(`Invalid tier on ${p.id}: ${p.tier}`);
  }
  for (const a of p.access) {
    if (!VALID_ACCESS.has(a)) throw new Error(`Invalid access on ${p.id}: ${a}`);
  }
  for (const t of p.tags) {
    if (!VALID_TAGS.has(t)) throw new Error(`Invalid tag on ${p.id}: ${t}`);
  }
  if (typeof p.value.estimate !== "number" || typeof p.value.cashLike !== "boolean" || typeof p.value.counted !== "boolean") {
    throw new Error(`Invalid value object on ${p.id}`);
  }
  if (!p.urls || !p.urls.apply || !p.urls.marketing) {
    throw new Error(`Missing URLs on ${p.id}`);
  }
  if (!p.formConfig || !Array.isArray(p.formConfig.fields)) {
    throw new Error(`Invalid formConfig on ${p.id}`);
  }
  if (!Array.isArray(p.dependencies)) {
    throw new Error(`Invalid dependencies on ${p.id}`);
  }
}

// Compute stats
const totalCashLikeT1 = allPrograms
  .filter(p => p.tier === 1 && p.value.counted && p.value.cashLike)
  .reduce((s, p) => s + p.value.estimate, 0);
const totalCountedT1 = allPrograms
  .filter(p => p.tier === 1 && p.value.counted)
  .reduce((s, p) => s + p.value.estimate, 0);
const vendors = new Set(allPrograms.map(p => p.vendor));

console.log(`Total programs: ${allPrograms.length} (was 191, +${allPrograms.length - 191} added)`);
console.log(`Unique vendors: ${vendors.size}`);
console.log(`Total T1 Cash-Like: $${totalCashLikeT1.toLocaleString()}`);
console.log(`Total T1 Counted: $${totalCountedT1.toLocaleString()}`);

// 1. Write apps/hunter/src/data/programs.js
const lines = allPrograms.map(p => "  " + JSON.stringify(p));
const programsJsContent = "export const PROGRAMS = [\n" + lines.join(",\n") + "\n];\n";
fs.writeFileSync("apps/hunter/src/data/programs.js", programsJsContent);
console.log("Wrote apps/hunter/src/data/programs.js");

// 2. Write docs/reference/benefit-catalog-master.json (including both Benefit Hunter catalog & full 251 freetokens cross-reference)
const ftIndex = JSON.parse(fs.readFileSync("docs/reference/freetokens-index.json", "utf8"));
const masterJson = {
  generatedAt: "2026-10-15",
  repository: "https://github.com/jamesnavinhill/benefit-hunter",
  summary: {
    totalCatalogPrograms: allPrograms.length,
    uniqueVendors: vendors.size,
    totalT1CashLikeUsd: totalCashLikeT1,
    totalT1CountedUsd: totalCountedT1,
    freetokensCustatsTrackedOffers: ftIndex.offers.length,
    freetokensActiveOffers: ftIndex.offers.filter(o => o.status === "active").length,
    freetokensHistoricalOffers: ftIndex.offers.filter(o => o.status !== "active").length
  },
  catalog: allPrograms,
  freetokensCustatsIndex: ftIndex.offers
};
fs.writeFileSync("docs/reference/benefit-catalog-master.json", JSON.stringify(masterJson, null, 2));
console.log("Wrote docs/reference/benefit-catalog-master.json");

// 3. Write docs/reference/benefit-catalog-master.md
let md = `# Benefit Hunter — Master Benefit & Credit Catalog (2026-10-15)

Status: active reference  
Repository: [github.com/jamesnavinhill/benefit-hunter](https://github.com/jamesnavinhill/benefit-hunter)  
Last audited: 2026-10-15  
Sources: Benefit Hunter catalog (\`apps/hunter/src/data/programs.js\`), [freetokens.custats.info](https://freetokens.custats.info/) (\`luongnv89/freetokens\`), and direct vendor verification.

## Executive Summary

| Metric | Value |
| --- | --- |
| **Total Active Catalog Programs** | **${allPrograms.length}** (expanded from 191; 0 removed) |
| **Unique Vendors** | **${vendors.size}** |
| **Tier 1 Counted Value** | **$${totalCountedT1.toLocaleString()}** |
| **Tier 1 Cash-Like Credits Value** | **$${totalCashLikeT1.toLocaleString()}** |
| **freetokens.custats.info Cross-Referenced Offers** | **${ftIndex.offers.length}** (${ftIndex.offers.filter(o => o.status === "active").length} active, ${ftIndex.offers.filter(o => o.status !== "active").length} expired/historical) |

---

## Part 1: Full Benefit Hunter Executable Catalog (${allPrograms.length} Programs by Stack Lane)

`;

const lanesOrder = ["DevOps", "Tech & AI", "Multimedia", "Business", "Research & Writing", "Science & Education"];
for (const lane of lanesOrder) {
  const laneProgs = allPrograms
    .filter(p => p.lane === lane)
    .sort((a, b) => b.value.estimate - a.value.estimate);
  const laneTotal = laneProgs.filter(p => p.value.counted).reduce((s, p) => s + p.value.estimate, 0);
  md += `### ${lane} (${laneProgs.length} programs · $${laneTotal.toLocaleString()} counted value)\n\n`;
  md += `| ID | Vendor | Program | Tier | Value | Type | Access | Eligibility & Details | Apply URL | Verified |\n`;
  md += `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const p of laneProgs) {
    const cleanDesc = `${p.description} — *Eligibility:* ${p.eligibility}`.replace(/\|/g, "\\|").replace(/\n/g, " ");
    md += `| \`${p.id}\` | **${p.vendor}** | ${p.name} | T${p.tier} | **${p.value.label}** ($${p.value.estimate.toLocaleString()}) | ${p.type} | ${p.access.join(", ")} | ${cleanDesc} | [Apply](${p.urls.apply}) | ${p.lastVerified} |\n`;
  }
  md += `\n`;
}

md += `---

## Part 2: Complete freetokens.custats.info Lead Index (${ftIndex.offers.length} Offers)

Every offer tracked by [https://freetokens.custats.info/](https://freetokens.custats.info/) as of October 2026 is documented below for complete provenance, including individual OpenRouter \`:free\` model endpoints, time-limited promotional drops, and historical/expired campaigns.

| # | Slug | Status | Category | Provider | Title | Offer Amount & Details | Official Source | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;

ftIndex.offers.forEach((o, idx) => {
  const amt = (o.amount || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const title = (o.title || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  md += `| ${idx + 1} | \`${o.slug}\` | **${o.status}** | \`${o.category}\` | ${o.provider} | ${title} | ${amt} | [Source](${o.source_url}) | ${o.verified_date || "—"} |\n`;
});

fs.writeFileSync("docs/reference/benefit-catalog-master.md", md);
console.log("Wrote docs/reference/benefit-catalog-master.md");
