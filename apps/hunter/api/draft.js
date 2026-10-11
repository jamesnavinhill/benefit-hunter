/**
 * AI application-draft generator ("Quick Draft").
 *
 * POST { program, profile } -> { draft }
 * `program` is the catalog entry's application-relevant subset; `profile` is
 * the user's canonical profile doc. The gateway key stays server-side; the
 * deployed demo returns 503 until credentials are pushed to Vercel env vars.
 * Drafts follow the exact skeleton of src/data/examples/*.md.
 */
const GATEWAY_BASE_URL = process.env.YRKA_GATEWAY_BASE_URL || 'https://gateway.yrka.io/v1';
const DRAFT_MODEL = process.env.YRKA_DRAFT_MODEL || 'in-mercury-2';

export const maxDuration = 60;

const PROFILE_KEYS = [
  'first_name', 'last_name', 'role_title', 'company_name', 'website', 'email',
  'one_liner', 'description', 'use_case_cloud',
];

const SYSTEM_PROMPT = `You draft startup-benefit program applications. Reply with the draft ONLY (no preamble): a markdown doc titled "# {Vendor} {Program} — Application Draft" with sections "## What this program wants" (3 short bold bullets), "## Templated answer" (fenced block, {{placeholder}} tokens for anything unknown), "## Pre-submit checklist" (checkbox items), and "## Redraft instructions". Match the vendor's tone; be concrete; never invent facts not present in the profile; leave {{placeholders}} visibly unfilled rather than fabricating.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.YRKA_GATEWAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI drafting is not configured yet.' });
  }

  const { program, profile } = req.body || {};
  if (!program || typeof program !== 'object' || !program.vendor) {
    return res.status(400).json({ error: 'A program object with at least a vendor is required.' });
  }

  const profileSubset = {};
  for (const key of PROFILE_KEYS) {
    if (profile && typeof profile[key] === 'string' && profile[key].trim()) {
      profileSubset[key] = profile[key].trim();
    }
  }

  try {
    const upstream = await fetch(`${GATEWAY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-agency-surface': 'benefit-hunter',
      },
      body: JSON.stringify({
        model: DRAFT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Program: ${JSON.stringify({
              id: program.id, vendor: program.vendor, name: program.name,
              type: program.type, gates: program.gates, formConfig: program.formConfig,
            })}\nApplicant profile: ${JSON.stringify(profileSubset)}\nUnfilled profile fields must stay as {{placeholder}} tokens.`,
          },
        ],
        max_tokens: 900,
        temperature: 0.6,
      }),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Draft generation failed (${upstream.status}).` });
    }

    const data = await upstream.json();
    const draft = data?.choices?.[0]?.message?.content;
    if (typeof draft !== 'string' || !draft.trim()) {
      return res.status(502).json({ error: 'Draft generation returned no content.' });
    }

    return res.status(200).json({ draft });
  } catch (error) {
    console.error('draft error:', error);
    return res.status(502).json({ error: 'Draft generation request failed.' });
  }
}
