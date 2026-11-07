// Access pills use the warm muted --acc-* family (see tokens.css) — a quiet
// complement to the category tones. Size and shape match the category pill.
export const ACCESS_CONFIG = {
  anyone:      { label:"Anyone",     short:"ANY",   tone:"acc-any",   desc:"Open signup — no special status" },
  biz_email:   { label:"Biz Email",  short:"BIZ",   tone:"acc-biz",   desc:"Business domain email or company identity required" },
  edu:         { label:".edu",       short:"EDU",   tone:"acc-edu",   desc:"Educational institution verification required" },
  nonprofit:   { label:"Nonprofit",  short:"NP",    tone:"acc-np",    desc:"501(c)(3) or equivalent nonprofit status required" },
  oss:         { label:"OSS",        short:"OSS",   tone:"acc-oss",   desc:"Active open-source project maintainer required" },
  accelerator: { label:"Accel / VC", short:"ACCEL", tone:"acc-accel", desc:"Accelerator, VC backing, or partner referral required" },
};

export const ACCESS_ORDER = ["anyone","biz_email","edu","nonprofit","oss","accelerator"];
