import { describe, expect, it } from "vitest";
import { PROGRAMS } from "../data/programs";
import { getCategoryTotals } from "../data/opportunityCategories";
import { groupProgramsByVendor } from "../lib/vendorSummary";

const programs = [
  { id: "a1", vendor: "Acme", name: "Credit", value: { counted: true, estimate: 1000, cashLike: true } },
  { id: "a2", vendor: "Acme", name: "License", value: { counted: true, estimate: 500, cashLike: false } },
  { id: "a3", vendor: "Acme", name: "Uncounted", value: { counted: false, estimate: 9999, cashLike: true } },
  { id: "b1", vendor: "Beta", name: "Plan", value: { counted: true, estimate: 3000, cashLike: true } },
];

describe("groupProgramsByVendor", () => {
  it("groups visible offers, sums counted values and separates cash-like from in-kind", () => {
    const [beta, acme] = groupProgramsByVendor(programs);
    expect(beta).toMatchObject({ name: "Beta", counted: 3000, cashLike: 3000, inKind: 0, valuedOffers: 1 });
    expect(beta.programs.map(p => p.id)).toEqual(["b1"]);
    expect(acme).toMatchObject({ name: "Acme", counted: 1500, cashLike: 1000, inKind: 500, valuedOffers: 2 });
    expect(acme.programs.map(p => p.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("vendor totals reconcile exactly to catalog counted and cash-like totals", () => {
    const vendors = groupProgramsByVendor(PROGRAMS);
    const catalog = getCategoryTotals(PROGRAMS);
    const sum = (key) => vendors.reduce((total, vendor) => total + vendor[key], 0);
    expect(sum("counted")).toBe(catalog.countedValue);
    expect(sum("cashLike")).toBe(catalog.cashLikeValue);
    expect(sum("cashLike") + sum("inKind")).toBe(catalog.countedValue);
    expect(vendors.reduce((total, vendor) => total + vendor.programs.length, 0)).toBe(PROGRAMS.length);
  });

  it("sorts vendors by counted value, then opportunity count, then name", () => {
    const sorted = groupProgramsByVendor([
      { id: "z", vendor: "Zed", value: { counted: true, estimate: 100, cashLike: false } },
      { id: "b", vendor: "Beta", value: { counted: true, estimate: 100, cashLike: false } },
      { id: "a1", vendor: "Acme", value: { counted: true, estimate: 100, cashLike: false } },
      { id: "a2", vendor: "Acme", value: { counted: false, estimate: 0, cashLike: false } },
    ]);
    expect(sorted.map(group => group.name)).toEqual(["Acme", "Beta", "Zed"]);
  });
});
