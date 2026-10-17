const fs = require("fs");
const path = require("path");

// 1. Load existing 191 programs from apps/hunter/src/data/programs.js
const progFile = fs.readFileSync("apps/hunter/src/data/programs.js", "utf8");
const existingPrograms = eval(progFile.replace("export const PROGRAMS =", ""));

// 2. Audited updates for existing programs (verified Oct 2026 — never remove any)
const existingUpdates = {
  "render-startups": {
    urls: { apply: "https://render.com/startups", marketing: "https://render.com/startups" },
    description: "Credits for compute, databases, static sites ($500–$100k depending on stage/partner).",
    lastVerified: "2026-10"
  },
  "algolia-startups": {
    urls: { apply: "https://www.algolia.com/industries/startups", marketing: "https://www.algolia.com/industries/startups" },
    description: "$10,000 in Algolia Search and Recommend credits valid for 12 months.",
    eligibility: "<3 years old, <$5M raised, via approved VC/accelerator or direct application",
    lastVerified: "2026-10"
  },
  "cloudinary-startups": {
    urls: { apply: "https://cloudinary.com/solutions/cloudinary-for-startups", marketing: "https://cloudinary.com/solutions/cloudinary-for-startups" },
    lastVerified: "2026-10"
  },
  "cohere-startup": {
    urls: { apply: "https://cohere.com/pricing", marketing: "https://cohere.com/pricing" },
    lastVerified: "2026-10"
  },
  "qdrant-startup": {
    urls: { apply: "https://qdrant.tech/pricing/", marketing: "https://qdrant.tech/pricing/" },
    lastVerified: "2026-10"
  },
  "atlassian-free": {
    urls: { apply: "https://www.atlassian.com/software/free", marketing: "https://www.atlassian.com/software/free" },
    lastVerified: "2026-10"
  },
  "freshworks-startup": {
    urls: { apply: "https://www.freshworks.com/company/partners/startup-program/", marketing: "https://www.freshworks.com/company/partners/startup-program/" },
    lastVerified: "2026-10"
  },
  "salesforce-startup": {
    urls: { apply: "https://www.salesforce.com/launchpad/", marketing: "https://www.salesforce.com/launchpad/" },
    lastVerified: "2026-10"
  },
  "airtable-nonprofit": {
    urls: { apply: "https://support.airtable.com/articles/4920135568-applying-for-non-profit-education-and-student-airtable-plans", marketing: "https://support.airtable.com/articles/4920135568-applying-for-non-profit-education-and-student-airtable-plans" },
    lastVerified: "2026-10"
  },
  "bubble-startup": {
    urls: { apply: "https://bubble.io/pricing", marketing: "https://bubble.io/pricing" },
    lastVerified: "2026-10"
  },
  "coda-startups": {
    urls: { apply: "https://coda.io/solutions/team-size/startups/apply-startup-credit", marketing: "https://coda.io/solutions/team-size/startups/apply-startup-credit" },
    value: { label: "$1,000 credit", estimate: 1000, cashLike: true, counted: true },
    description: "Six months of free Coda Team plan for qualified startups (under 5 years old, under $10M raised, business-domain email). Partner-referred applicants may also get Coda AI. Re-confirm terms before applying.",
    lastVerified: "2026-10"
  },
  "anthropic-ai-science": {
    urls: { apply: "https://www.anthropic.com/news/ai-for-science-program", marketing: "https://www.anthropic.com/news/ai-for-science-program" },
    value: { label: "Up to $20k API credits", estimate: 20000, cashLike: true, counted: true },
    description: "Up to $20,000 in Claude API credits over a 6-month period for high-impact scientific research (biology, life sciences, medicine, agriculture).",
    lastVerified: "2026-10"
  },
  "assemblyai-startups": {
    urls: { apply: "https://www.assemblyai.com/contact/startup-program", marketing: "https://www.assemblyai.com/contact/startup-program" },
    value: { label: "$1,000 credits", estimate: 1000, cashLike: true, counted: true },
    description: "12 months of recurring free speech-to-text and audio intelligence API credits plus startup pricing. Credit amount unconfirmed on the program page; prior catalog value was $1,000. Re-confirm before applying.",
    lastVerified: "2026-10"
  },
  "brave-search-api": {
    value: { label: "$5/mo credits (1k req)", estimate: 60, cashLike: false, counted: true },
    tags: ["easy_apply", "requires_card"],
    description: "$5 in free monthly credits (~1,000 queries/month at $5/1k) on Brave Search and Answers APIs. Card required for verification.",
    lastVerified: "2026-10"
  },
  "codeium-free": {
    name: "Windsurf / Codeium (Free)",
    urls: { apply: "https://windsurf.com/pricing", marketing: "https://windsurf.com/pricing" },
    description: "Free AI coding IDE (Windsurf) and autocomplete extension (Codeium) across 70+ languages and 40+ IDEs.",
    lastVerified: "2026-10"
  },
  "anthropic-startups": {
    urls: { apply: "https://claude.com/programs/startups", marketing: "https://www.anthropic.com/startups" },
    value: { label: "Up to $25k credits + perks", estimate: 10000, cashLike: true, counted: true },
    description: "Claude API credits, priority rate limits, and Startup Stack partner discounts (worth up to $45k). Requires approved VC partner referral.",
    lastVerified: "2026-10"
  },
  "elevenlabs-startup": {
    urls: { apply: "https://elevenlabs.io/startup-grants", marketing: "https://elevenlabs.io/startup-grants" },
    value: { label: "33M chars (~$4k+)", estimate: 5000, cashLike: true, counted: true },
    description: "12 months free Scale tier access with 33,000,000 characters (~680+ hours of TTS audio) and enterprise concurrency.",
    lastVerified: "2026-10"
  },
  "runway-builders": {
    urls: { apply: "https://runway.com/product/builders", marketing: "https://runway.com/product/builders" },
    description: "Up to 500,000 free API credits, Tier 5 usage limits, Runway Characters API access, and a private builders community for Seed to Series C startups.",
    lastVerified: "2026-10"
  },
  "modal-startups": {
    urls: { apply: "https://modal.com/startups", marketing: "https://modal.com/startups" },
    value: { label: "Up to $25k compute", estimate: 10000, cashLike: true, counted: true },
    description: "Up to $25,000 in serverless GPU and CPU compute credits for early-stage AI startups.",
    lastVerified: "2026-10"
  },
  "fireworks-startups": {
    urls: { apply: "https://fireworks.ai/startups", marketing: "https://fireworks.ai/startups" },
    lastVerified: "2026-10"
  },
  "notion-startups": {
    value: { label: "Up to 6 mo Business + AI ($12k)", estimate: 1500, cashLike: false, counted: true },
    description: "3 months free Notion Business + unlimited AI self-serve, or 6 months free (up to 100 seats, ~$12k value) via Notion startup partners.",
    lastVerified: "2026-10"
  },
  "cloudflare-startups": {
    value: { label: "$5k–$250k", estimate: 25000, cashLike: true, counted: true },
    description: "$5k–$10k self-serve tier for bootstrapped/early-stage startups; up to $250,000 across Workers, R2, D1, AI, and CDN via accelerator/VC partners.",
    lastVerified: "2026-10"
  }
};

const auditedExisting = existingPrograms.map(p => {
  const up = existingUpdates[p.id];
  if (!up) return p;
  return {
    ...p,
    ...up,
    value: up.value ? { ...p.value, ...up.value } : p.value,
    urls: up.urls ? { ...p.urls, ...up.urls } : p.urls
  };
});

module.exports = { auditedExisting };
