# Benefit Hunter

A free tool and setup kit that helps founders find, qualify for, and apply to startup
benefit programs — credits, community licenses, and worthy discounts — and apply to
them in the order that maximizes referral leverage.

Live at **[benefits.navinhill.com](https://benefits.navinhill.com)**.

## What it does

- **Finds** programs and matches them against a lightweight profile so you see the
  specific benefits — and total dollar value — you qualify for.
- **Guides** an umbrella-first application order via the Guided view (strategy tiers:
  multi-vendor packs and referral hubs first) so one acceptance unlocks the next.
- **Quick Draft (AI)**: per-program AI-generated application packets (serverless proxy to
  the Agency gateway's free models) — drafts follow the example-copy skeleton, copy to
  clipboard in one click. Unfilled profile fields stay as visible `{{placeholders}}`.
- **Provides** de-identified example application copy you can adapt — or hand to your
  own coding agent to redraft for your project.
- **Shows** the real dollar value secured, organized by stack.

Runs entirely in your browser with local storage. No account required. Optional
Supabase auth syncs your profile + statuses across devices.

## Repository layout

```
apps/hunter/   # the Benefit Hunter web app (Vite/React static site)
docs/          # durable docs, architecture, and dated roadmaps
```

Start with [docs/README.md](./docs/README.md) for the product vision and architecture.
The optional automation kit (`/automation-kit/`) ships a sanitized starter repo —
personal artifacts are redacted to `{{placeholders}}` before the zip is built.

## Development

```bash
cd apps/hunter
npm install
npm run dev
```

Production build outputs to `apps/hunter/dist` and deploys to Vercel as a static site.
See [docs/operations/deployment-and-domains.md](./docs/operations/deployment-and-domains.md).

## Contributing and accuracy

Benefit values, eligibility, and freshness are sourced and dated. Programs change —
always confirm terms on the vendor's official page (linked from each program) before
applying. Any referral or affiliate relationship is disclosed.

## License

TBD.
