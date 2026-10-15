import { describe, expect, it } from "vitest";
import { PROGRAMS } from "../data/programs";
import {
  CATEGORY_COUNTS,
  CATEGORY_TOTALS,
  OPPORTUNITY_CATEGORIES,
  classifyOpportunity,
  getCategoryTotals,
  programsInCategory,
} from "../data/opportunityCategories";

describe("opportunity categories", () => {
  it("classifies event opportunities before other audience types", () => {
    expect(classifyOpportunity({
      id: "student-hackathon", name: "Student AI Hackathon", type: "Credits",
      access: ["edu", "accelerator"], tier: 1,
    })).toBe("events");
  });

  it("classifies educational access separately from general startup programs", () => {
    expect(classifyOpportunity({
      id: "education-offer", name: "Student plan", type: "License", access: ["edu"], tier: 1,
    })).toBe("education");
    expect(classifyOpportunity({
      id: "startup-offer", name: "Startup program", type: "Credits", access: ["accelerator"], tier: 1,
    })).toBe("startup");
  });

  it("keeps general free tiers and one-time purchases distinct", () => {
    expect(classifyOpportunity({ id: "free-offer", name: "Cloud plan", type: "Infrastructure", access: ["anyone"], tier: 1 })).toBe("free");
    expect(classifyOpportunity({ id: "one-time", name: "One-time software purchase", type: "Discount", access: ["anyone"], tier: 2 })).toBe("other");
  });

  it("assigns every catalog opportunity to exactly one category and covers all in All", () => {
    const categories = OPPORTUNITY_CATEGORIES.filter(({ id }) => id !== "all");
    const grouped = categories.flatMap(({ id }) => programsInCategory(PROGRAMS, id));
    expect(grouped).toHaveLength(PROGRAMS.length);
    expect(new Set(grouped.map((program) => program.id)).size).toBe(PROGRAMS.length);
    expect(programsInCategory(PROGRAMS, "all").map((p) => p.id)).toEqual(PROGRAMS.map((p) => p.id));
    for (const { id } of categories) expect(CATEGORY_COUNTS[id]).toBe(programsInCategory(PROGRAMS, id).length);
    expect(CATEGORY_COUNTS.all).toBe(PROGRAMS.length);
    for (const field of ["countedValue", "cashLikeValue", "tier1CountedValue", "tier1CashLikeValue"]) {
      const categorySum = categories.reduce((sum, { id }) => sum + CATEGORY_TOTALS[id][field], 0);
      expect(categorySum).toBe(CATEGORY_TOTALS.all[field]);
    }
  });

  it("computes totals using counted catalog values and cash-like subtotals", () => {
    const sample = [
      { tier: 1, value: { counted: true, estimate: 100, cashLike: true } },
      { tier: 2, value: { counted: true, estimate: 50, cashLike: false } },
      { tier: 1, value: { counted: false, estimate: 999, cashLike: true } },
    ];
    expect(getCategoryTotals(sample)).toEqual({ opportunities: 3, countedValue: 150, cashLikeValue: 100, tier1CountedValue: 100, tier1CashLikeValue: 100 });
    for (const { id } of OPPORTUNITY_CATEGORIES) {
      expect(CATEGORY_TOTALS[id]).toEqual(getCategoryTotals(programsInCategory(PROGRAMS, id)));
    }
  });
});
