import { PROGRAMS } from "./programs";

export const OPPORTUNITY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "education", label: "Education" },
  { id: "startup", label: "Startup" },
  { id: "free", label: "Free" },
  { id: "events", label: "Events" },
  { id: "other", label: "Other" },
];

const EDUCATION_TERMS = /\b(student|students|educator|education|educational|academic|university|universities|college|classroom|school|teacher|faculty)\b/i;
const STARTUP_TERMS = /\b(start[ -]?ups?|founders?|venture-backed|accelerator|incubator)\b/i;
const EVENT_TERMS = /\b(hackathon|conference|summit|competition|bootcamp|event)\b/i;
const FREE_TERMS = /\b(free|no-cost|complimentary)\b/i;

export function classifyOpportunity(program) {
  const headline = `${program.name || ""} ${program.type || ""} ${program.id || ""}`;
  const context = `${headline} ${program.description || ""} ${program.eligibility || ""}`;
  if (EVENT_TERMS.test(headline)) return "events";
  if ((program.access || []).includes("edu") || EDUCATION_TERMS.test(context)) return "education";
  if ((program.access || []).includes("accelerator") || STARTUP_TERMS.test(context)) return "startup";
  if (program.tier === 1 || program.type === "Trial" || FREE_TERMS.test(context)) return "free";
  return "other";
}

export const PROGRAM_CATEGORIES = Object.fromEntries(
  PROGRAMS.map((program) => [program.id, classifyOpportunity(program)])
);

export function programsInCategory(programs, categoryId = "all") {
  if (categoryId === "all") return [...programs];
  return programs.filter((program) => classifyOpportunity(program) === categoryId);
}

export function formatCategoryValue(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function getCategoryTotals(programs) {
  return programs.reduce((totals, program) => {
    totals.opportunities += 1;
    if (program.value?.counted) {
      const estimate = Number(program.value.estimate) || 0;
      totals.countedValue += estimate;
      if (program.value.cashLike) totals.cashLikeValue += estimate;
      if (program.tier === 1) {
        totals.tier1CountedValue += estimate;
        if (program.value.cashLike) totals.tier1CashLikeValue += estimate;
      }
    }
    return totals;
  }, { opportunities: 0, countedValue: 0, cashLikeValue: 0, tier1CountedValue: 0, tier1CashLikeValue: 0 });
}

export const CATEGORY_COUNTS = Object.fromEntries(OPPORTUNITY_CATEGORIES.map(({ id }) => [
  id, programsInCategory(PROGRAMS, id).length,
]));

export const CATEGORY_TOTALS = Object.fromEntries(OPPORTUNITY_CATEGORIES.map(({ id }) => [
  id, getCategoryTotals(programsInCategory(PROGRAMS, id)),
]));
