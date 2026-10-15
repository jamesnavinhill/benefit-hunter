import { useEffect, useMemo, useState } from "react";
import { ACCESS_CONFIG, ACCESS_ORDER } from "./data/access";
import { LANE_COLORS } from "./data/lanes";
import { PROGRAMS } from "./data/programs";
import { DEFAULT_PROFILE, DEFAULT_PROFILE_DOC, PROFILE_DOC_KEYS, PROFILE_FIELDS, PROFILE_SCHEMA, profileMatches } from "./data/profile";
import { STATUS_CONFIG } from "./data/statuses";
import { TAG_CONFIG, TAG_ORDER } from "./data/tags";
import { agentState } from "./lib/agent";
import { loadRemoteState, saveRemoteState } from "./lib/remoteState";
import { storage, STORAGE_VERSION } from "./lib/storage";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { CATEGORY_COUNTS, CATEGORY_TOTALS, formatCategoryValue, getCategoryTotals, OPPORTUNITY_CATEGORIES, programsInCategory } from "./data/opportunityCategories";
import { groupProgramsByVendor } from "./lib/vendorSummary";
import { MultiSelectDropdown } from "./components/MultiSelectDropdown";
import { SingleSelectDropdown } from "./components/SingleSelectDropdown";
import { ProgramCard } from "./components/ProgramCard";
import { ProofView } from "./components/ProofView";
import { GuidedView } from "./components/GuidedView";
import { Stat } from "./components/Stat";
import { HeaderMenu } from "./components/HeaderMenu";
import { AccentsModal } from "./components/AccentsModal";
import { applyAccents, clearLocalAccents, loadLocalAccents, mergeAccents, saveLocalAccents } from "./lib/accents";
import { DEFAULT_ACCENTS } from "./data/accentDefaults";

export default function App() {
  const [statuses, setStatuses]           = useState({});
  const [profile, setProfile]             = useState(DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [settingsTab, setSettingsTab]     = useState("matching");
  const [profileDoc, setProfileDoc]       = useState(DEFAULT_PROFILE_DOC);
  const [onlyForMe, setOnlyForMe]         = useState(false);
  const [browseCategory, setBrowseCategory] = useState("all");
  const [search, setSearch]               = useState("");
  const [laneFilters, setLaneFilters]     = useState(() => new Set());
  const [accessFilters, setAccessFilters] = useState(() => new Set());
  const [tagFilters, setTagFilters]       = useState(() => new Set());
  const [tierFilters, setTierFilters]     = useState(() => new Set());
  const [statusFilters, setStatusFilters] = useState(() => new Set());
  const [stateFilters, setStateFilters]   = useState(() => new Set());
  const [savedFlash, setSavedFlash]       = useState(false);
  const [sortBy, setSortBy]               = useState("valueNum");
  const [viewMode, setViewMode]           = useState("grid"); // "grid" | "by_vendor"
  const [loaded, setLoaded]               = useState(false);
  const [collapsedVendors, setCollapsedVendors] = useState(() => new Set(PROGRAMS.map(p => p.vendor)));
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [remoteReady, setRemoteReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? "local" : "local-only");
  const [syncError, setSyncError] = useState("");

  const [accents, setAccents]             = useState(() => mergeAccents(null));
  const [accentsSavedFlash, setAccentsSavedFlash] = useState(false);

  // Toggle a key in a Set-typed filter state
  const toggleInSet = (setter) => (key) => setter(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const clearSet = (setter) => () => setter(new Set());

  // Load local state first so unsigned-in use keeps working.
  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get(STORAGE_VERSION + "-statuses");
        if (s) setStatuses(JSON.parse(s));
        const p = await storage.get(STORAGE_VERSION + "-profile");
        if (p) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(p) });

        const pd = await storage.get(STORAGE_VERSION + "-profileDoc");
        if (pd) setProfileDoc({ ...DEFAULT_PROFILE_DOC, ...JSON.parse(pd) });

        const localAccents = loadLocalAccents();
        if (localAccents) {
          const merged = mergeAccents(localAccents);
          setAccents(merged);
          applyAccents(merged);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Apply accents to :root whenever they change (live preview).
  useEffect(() => { applyAccents(accents); }, [accents]);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loaded || !authReady) return;
    if (!session?.user?.id) {
      setRemoteReady(false);
      setSyncStatus(isSupabaseConfigured ? "local" : "local-only");
      return;
    }
    let cancelled = false;
    const userId = session.user.id;
    setSyncStatus("loading");
    setSyncError("");

    (async () => {
      try {
        const remote = await loadRemoteState(userId);
        if (cancelled) return;

        if (remote) {
          setStatuses(remote.statuses || {});
          setProfile({ ...DEFAULT_PROFILE, ...(remote.profile || {}) });
          setProfileDoc({ ...DEFAULT_PROFILE_DOC, ...(remote.profile_doc || {}) });
          if (remote.accents && Object.keys(remote.accents).length) {
            const merged = mergeAccents(remote.accents);
            setAccents(merged);
            applyAccents(merged);
          }
        } else {
          await saveRemoteState(userId, { profile, profileDoc, statuses, accents });
        }

        if (!cancelled) {
          setRemoteReady(true);
          setSyncStatus("synced");
        }
      } catch (error) {
        if (!cancelled) {
          setRemoteReady(false);
          setSyncStatus("error");
          setSyncError(error.message || "Sync failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loaded, authReady, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id || !remoteReady) return;

    const timeout = window.setTimeout(async () => {
      try {
        setSyncStatus("saving");
        setSyncError("");
        await saveRemoteState(session.user.id, { profile, profileDoc, statuses, accents });
        setSyncStatus("synced");
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error.message || "Sync failed");
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [profile, profileDoc, statuses, accents, remoteReady, session?.user?.id]);

  const signInWithProvider = async (provider) => {
    if (!supabase) return;
    setSyncError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setSyncStatus("error");
      setSyncError(error.message);
    }
  };

  const handleAccentsSave = async () => {
    saveLocalAccents(accents);
    if (session?.user?.id) {
      try {
        setSyncStatus("saving");
        setSyncError("");
        await saveRemoteState(session.user.id, { profile, profileDoc, statuses, accents });
        setSyncStatus("synced");
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error.message || "Sync failed");
      }
    }
    setAccentsSavedFlash(true);
    window.setTimeout(() => setAccentsSavedFlash(false), 1800);
  };

  const handleAccentsResetAll = () => {
    const fresh = mergeAccents(null);
    setAccents(fresh);
    applyAccents(fresh);
    clearLocalAccents();
  };

  const handleManualSave = async () => {
    if (session?.user?.id) {
      try {
        setSyncStatus("saving");
        setSyncError("");
        await saveRemoteState(session.user.id, { profile, profileDoc, statuses });
        setSyncStatus("synced");
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error.message || "Sync failed");
        return;
      }
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const signOut = async () => {
    if (!supabase) return;
    setSyncError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSyncStatus("error");
      setSyncError(error.message);
    } else {
      setRemoteReady(false);
      setSyncStatus("local");
    }
  };

  const updateStatus = async (id, st) => {
    const next = { ...statuses, [id]: st };
    setStatuses(next);
    await storage.set(STORAGE_VERSION + "-statuses", JSON.stringify(next));
  };

  const updateProfile = async (key, val) => {
    const next = { ...profile, [key]: val };
    setProfile(next);
    await storage.set(STORAGE_VERSION + "-profile", JSON.stringify(next));
  };

  const updateProfileDoc = async (key, val) => {
    const next = { ...profileDoc, [key]: val };
    setProfileDoc(next);
    await storage.set(STORAGE_VERSION + "-profileDoc", JSON.stringify(next));
  };

  // Profile match lookup
  const profileMatchSet = useMemo(() =>
    new Set(PROGRAMS.filter(p => profileMatches(p, profile)).map(p => p.id))
  , [profile]);

  const categoryPrograms = useMemo(
    () => programsInCategory(PROGRAMS, browseCategory),
    [browseCategory]
  );

  // Filtered list
  const filtered = useMemo(() => {
    let list = categoryPrograms.filter(p => {
      if (onlyForMe && !profileMatchSet.has(p.id))                                       return false;
      if (laneFilters.size > 0    && !laneFilters.has(p.lane))                           return false;
      if (accessFilters.size > 0  && !p.access.some(a => accessFilters.has(a)))          return false;
      if (tagFilters.size > 0     && !p.tags.some(t => tagFilters.has(t)))               return false;
      if (tierFilters.size > 0   && !tierFilters.has(String(p.tier)))                   return false;
      const st = statuses[p.id] || "not_applied";
      if (statusFilters.size > 0 && !statusFilters.has(st))                              return false;
      if (stateFilters.size > 0  && !stateFilters.has(agentState(p).key))                return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) &&
            !p.vendor.toLowerCase().includes(q) &&
            !p.description.toLowerCase().includes(q) &&
            !p.lane.toLowerCase().includes(q) &&
            !p.type.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortBy === "valueNum") list.sort((a,b) => b.value.estimate - a.value.estimate);
    if (sortBy === "name")     list.sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === "lane")     list.sort((a,b) => a.lane.localeCompare(b.lane) || b.value.estimate - a.value.estimate);
    if (sortBy === "tier")     list.sort((a,b) => a.tier - b.tier || b.value.estimate - a.value.estimate);
    if (sortBy === "agent")    list.sort((a,b) => {
      const order = { submit:0, direct:1, draft:2, stale:3 };
      return order[agentState(a).key] - order[agentState(b).key] || b.value.estimate - a.value.estimate;
    });
    if (sortBy === "match")    list.sort((a,b) => {
      const am = profileMatchSet.has(a.id) ? 0 : 1;
      const bm = profileMatchSet.has(b.id) ? 0 : 1;
      return am - bm || b.value.estimate - a.value.estimate;
    });
    return list;
  }, [categoryPrograms, search, laneFilters, accessFilters, tagFilters, tierFilters, statusFilters, stateFilters, sortBy, statuses, onlyForMe, profileMatchSet]);

  // Stats
  const stats = useMemo(() => {
    const counts = { submit:0, draft:0, direct:0, stale:0 };
    filtered.forEach(p => counts[agentState(p).key]++);
    const visibleIds = new Set(filtered.map(p => p.id));
    const visibleStatuses = Object.entries(statuses).filter(([id]) => visibleIds.has(id)).map(([, status]) => status);
    return {
      submit: counts.submit, draft: counts.draft, direct: counts.direct,
      applied: visibleStatuses.filter(s => s === "applied").length,
      approved: visibleStatuses.filter(s => s === "approved").length,
      interested: visibleStatuses.filter(s => s === "agent_queued").length,
      forMe: filtered.filter(p => profileMatchSet.has(p.id)).length,
    };
  }, [filtered, statuses, profileMatchSet]);

  const categoryTotals = useMemo(() => getCategoryTotals(filtered), [filtered]);
  const categoryVendorCount = useMemo(() => new Set(filtered.map(p => p.vendor)).size, [filtered]);
  const tagCounts    = useMemo(() => Object.fromEntries(TAG_ORDER.map(t => [t, categoryPrograms.filter(p => p.tags.includes(t)).length])), [categoryPrograms]);
  const accessCounts = useMemo(() => Object.fromEntries(ACCESS_ORDER.map(a => [a, categoryPrograms.filter(p => p.access.includes(a)).length])), [categoryPrograms]);

  const inp = {
    background:"var(--surface-2)", border:"1px solid var(--line)", color:"var(--text-dim)",
    borderRadius:3, padding:"5px 8px", fontSize:10,
    fontFamily:"monospace", outline:"none", appearance:"none", cursor:"pointer",
  };
  const signedInUser = session?.user;
  const syncLabel = signedInUser
    ? syncStatus === "saving" ? "saving"
      : syncStatus === "loading" ? "loading"
      : syncStatus === "error" ? "sync error"
      : "synced"
    : "local only";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"monospace" }}>
     <div className="shell">

      {/* HEADER */}
      <div className="app-header" style={{ padding:"12px 22px 0", borderBottom:"1px solid var(--line-soft)" }}>
        <div className="header-row">
          <div className="header-title-block">
            <div className="header-title-line">
              <div className="header-wordmark" style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.05em", color:"var(--text)" }}>
                BENEFIT HUNTER
              </div>
            </div>
          </div>

          <HeaderMenu
            onlyForMe={onlyForMe}
            onToggleForMe={() => setOnlyForMe(value => !value)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenSettings={(tab) => { setSettingsTab(tab); setProfileOpen(true); }}
            signedInUser={signedInUser}
            syncStatus={syncStatus}
            syncError={syncError}
            syncLabel={syncLabel}
            isSupabaseConfigured={isSupabaseConfigured}
            onSignIn={signInWithProvider}
            onSignOut={signOut}
          />
        </div>
        <nav className="opportunity-tabs" role="tablist" aria-label="Opportunity type">
          {OPPORTUNITY_CATEGORIES.map(({ id, label }) => {
            const count = CATEGORY_COUNTS[id];
            const totals = CATEGORY_TOTALS[id];
            const active = browseCategory === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setBrowseCategory(id)}
                className={"opportunity-tab" + (active ? " active" : "")}
              >
                <span>{label}</span>
                <span className="opportunity-tab-count">{count}</span>
              <span className="opportunity-tab-value">{formatCategoryValue(totals.tier1CountedValue)}</span>
              </button>
            );
          })}
        </nav>

        {/* STATS */}
        <div className={"stats-strip" + (statsExpanded ? " expanded" : "")}>
          <Stat label="Tier 1 est. value" value={formatCategoryValue(categoryTotals.tier1CountedValue)} tone="gold" />
          <Stat label="All tiers est. value*" value={formatCategoryValue(categoryTotals.countedValue)} tone="neutral" />
          <Stat label="Opportunities" value={filtered.length} tone="neutral" />
          <Stat label="Quick Apply" value={stats.submit} tone="ok" />
          <Stat label="Vendors" value={categoryVendorCount} tone="neutral" />
          <Stat label="For You"       value={stats.forMe}    tone="match" />
          <div className="stats-divider" />
          <button
            className="stats-toggle"
            onClick={() => setStatsExpanded(e => !e)}
            title={statsExpanded ? "Hide details" : "Show details"}
            style={{
              background:"transparent", border:"1px solid var(--line)", color:"var(--text-dim)",
              borderRadius:3, padding:"3px 8px", cursor:"pointer",
              fontFamily:"monospace", fontSize:14, lineHeight:1,
              alignItems:"center", justifyContent:"center",
              minWidth:28, minHeight:28,
              marginLeft:"auto",
            }}
          >{statsExpanded ? "−" : "+"}</button>
          <span className="stats-secondary-group">
            <Stat label="Tier 1 cash-like est." value={formatCategoryValue(categoryTotals.tier1CashLikeValue)} tone="gold" />
            <Stat label="All-tier cash-like est.*" value={formatCategoryValue(categoryTotals.cashLikeValue)} tone="gold" />
            <Stat label="Quick Draft"     value={stats.draft}      tone="wait"  />
            <Stat label="Use Direct"      value={stats.direct}     tone="ok"    />
            <Stat label="Interested"      value={stats.interested} tone="ok"    />
            <Stat label="Applied"         value={stats.applied}    tone="info"  />
            <Stat label="Approved"        value={stats.approved}   tone="match" />
          </span>
        </div>

      </div>

      {/* CONSOLIDATED STICKY FILTER ROW */}
      <div className="filter-row" style={{
        padding:"9px 22px", borderBottom:"1px solid var(--line-soft)",
        position:"sticky", top:0, background:"color-mix(in oklch, var(--bg) 94%, transparent)", zIndex:10,
        backdropFilter:"blur(8px)",
      }}>
        <MultiSelectDropdown
          label="Category"
          total={categoryPrograms.length}
          items={Object.keys(LANE_COLORS)}
          activeSet={laneFilters}
          onToggle={toggleInSet(setLaneFilters)}
          onClear={clearSet(setLaneFilters)}
          getLabel={k => k}
          getCount={k => categoryPrograms.filter(p => p.lane === k).length}
          getTone={k => LANE_COLORS[k].tone}
        />
        <MultiSelectDropdown
          label="Access"
          total={categoryPrograms.length}
          items={ACCESS_ORDER}
          activeSet={accessFilters}
          onToggle={toggleInSet(setAccessFilters)}
          onClear={clearSet(setAccessFilters)}
          getLabel={k => ACCESS_CONFIG[k].short}
          getCount={k => accessCounts[k]}
          getTone={() => null}
        />
        <MultiSelectDropdown
          label="Criteria"
          total={categoryPrograms.length}
          items={TAG_ORDER}
          activeSet={tagFilters}
          onToggle={toggleInSet(setTagFilters)}
          onClear={clearSet(setTagFilters)}
          getLabel={k => TAG_CONFIG[k].label}
          getCount={k => tagCounts[k]}
          getTone={k => TAG_CONFIG[k].tone}
        />
        <MultiSelectDropdown
          label="Tiers"
          total={categoryPrograms.length}
          items={["1","2"]}
          activeSet={tierFilters}
          onToggle={toggleInSet(setTierFilters)}
          onClear={clearSet(setTierFilters)}
          getLabel={k => k === "1" ? "T1 — Free" : "T2 — Discount"}
          getCount={k => categoryPrograms.filter(p => String(p.tier) === k).length}
          getTone={k => k === "1" ? "accent" : null}
        />
        <MultiSelectDropdown
          label="States"
          total={categoryPrograms.length}
          items={["submit","draft","direct","stale"]}
          activeSet={stateFilters}
          onToggle={toggleInSet(setStateFilters)}
          onClear={clearSet(setStateFilters)}
          getLabel={k => ({ submit:"Quick Apply", draft:"Quick Draft", direct:"Use Direct", stale:"Verify First" }[k])}
          getCount={k => categoryPrograms.filter(p => agentState(p).key === k).length}
          getTone={k => ({ submit:"ok", draft:"wait", direct:"ok", stale:"wait" }[k])}
        />
        <MultiSelectDropdown
          label="Statuses"
          total={categoryPrograms.length}
          items={Object.keys(STATUS_CONFIG)}
          activeSet={statusFilters}
          onToggle={toggleInSet(setStatusFilters)}
          onClear={clearSet(setStatusFilters)}
          getLabel={k => STATUS_CONFIG[k].label}
          getCount={k => categoryPrograms.filter(p => (statuses[p.id] || "not_applied") === k).length}
          getTone={k => STATUS_CONFIG[k].tone === "neutral" ? null : STATUS_CONFIG[k].tone}
        />
        <input type="text" placeholder="Search benefits..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, cursor:"text", minHeight:28 }} />
        <SingleSelectDropdown
          label={({ valueNum:"Value", match:"For Me First", agent:"Fill-Ready First", lane:"Lane", tier:"Tier", name:"A–Z" }[sortBy])}
          value={sortBy}
          items={["valueNum","match","agent","lane","tier","name"]}
          onChange={setSortBy}
          getLabel={k => ({ valueNum:"Value", match:"For Me First", agent:"Fill-Ready First", lane:"Lane", tier:"Tier", name:"A–Z" }[k])}
        />
      </div>

      {/* GRID / VENDOR VIEW */}
      <div style={{ padding:"14px 22px 48px" }}>
        {!loaded ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--line)", fontSize:10 }}>Loading...</div>
        ) : viewMode === "guided" ? (
          <GuidedView
            programs={filtered}
            statuses={statuses}
            onStatusChange={updateStatus}
            profileMatchSet={profileMatchSet}
            profileDoc={profileDoc}
            onVendorClick={(v) => setSearch(v)}
          />
        ) : viewMode === "proof" ? (
          <ProofView />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ color:"var(--text-dim2)", fontSize:11, marginBottom:14, fontFamily:"monospace", letterSpacing:"0.05em" }}>
              No benefits match the current filters.
            </div>
            <button onClick={() => {
              setTagFilters(new Set()); setAccessFilters(new Set()); setLaneFilters(new Set());
              setTierFilters(new Set()); setStatusFilters(new Set()); setStateFilters(new Set());
              setOnlyForMe(false); setSearch("");
            }} style={{
              background:"transparent", border:"1px solid var(--line)", color:"var(--text-dim)",
              padding:"6px 16px", borderRadius:3, cursor:"pointer", fontSize:10,
              fontFamily:"monospace", letterSpacing:"0.08em", textTransform:"uppercase",
            }}>× Clear All Filters</button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="card-grid">
            {filtered.map(p => (
              <ProgramCard
                key={p.id} program={p}
                status={statuses[p.id] || "not_applied"}
                onStatusChange={updateStatus}
                profileMatch={profileMatchSet.has(p.id)}
                onVendorClick={(v) => setSearch(v)}
                profileDoc={profileDoc}
              />
            ))}
          </div>
        ) : (
          (() => {
            const sortedVendors = groupProgramsByVendor(filtered);

            const toggleVendor = (name) => {
              setCollapsedVendors(prev => {
                const next = new Set(prev);
                if (next.has(name)) next.delete(name); else next.add(name);
                return next;
              });
            };

            return (
              <div className="vendor-directory">
                <div className="vendor-directory-intro">
                  <div>
                    <div className="vendor-directory-title">Opportunity value by vendor</div>
                    <div className="vendor-directory-caption">Catalog value estimates, not confirmed awards; some partner offers may overlap.</div>
                  </div>
                  <div className="vendor-directory-summary">
                    <span>{sortedVendors.length} vendors</span>
                    <span>{filtered.length} offers</span>
                    <strong>{formatCategoryValue(categoryTotals.tier1CountedValue)} Tier 1</strong>
                  </div>
                </div>
                {sortedVendors.map(v => {
                  const collapsed = collapsedVendors.has(v.name);
                  return (
                    <section className="vendor-group" key={v.name}>
                      <button
                        type="button"
                        className="vendor-group-header"
                        onClick={() => toggleVendor(v.name)}
                        aria-expanded={!collapsed}
                      >
                        <span className="vendor-group-chevron">{collapsed ? "＋" : "−"}</span>
                        <span className="vendor-group-name">{v.name}</span>
                        <span className="vendor-offer-count">{v.programs.length} {v.programs.length === 1 ? "offer" : "offers"}</span>
                        <span className="vendor-total-chip vendor-total-counted">
                          <small>EST. VALUE</small>{formatCategoryValue(v.counted)}
                        </span>
                        <span className="vendor-total-chip vendor-total-cash">
                          <small>ALL-TIER CASH-LIKE</small>{formatCategoryValue(v.cashLike)}
                        </span>
                        <span className="vendor-total-chip vendor-total-inkind">
                          <small>IN-KIND</small>{formatCategoryValue(v.inKind)}
                        </span>
                      </button>

                      {/* Vendor programs */}
                      {!collapsed && (
                        <div className="card-grid vendor-offer-grid">
                          {v.programs.map(p => (
                            <ProgramCard
                              key={p.id} program={p}
                              status={statuses[p.id] || "not_applied"}
                              onStatusChange={updateStatus}
                              profileMatch={profileMatchSet.has(p.id)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop:"1px solid var(--line-soft)", padding:"11px 22px",
        display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8,
        fontSize:8, color:"var(--text-dim2)", letterSpacing:"0.08em",
      }}>
        <span>BENEFIT HUNTER v5 // {filtered.length} OPPORTUNITIES // {categoryVendorCount} VENDORS</span>
        <span style={{ display:"flex", gap:14, alignItems:"center" }}>
          <span title="Totals are catalog estimates, not awards; partner and bundle values may overlap">Tier 1 est. {formatCategoryValue(categoryTotals.tier1CountedValue)} · all tiers est.* {formatCategoryValue(categoryTotals.countedValue)} · *may overlap</span>
          <a href="https://github.com/jamesnavinhill/benefit-hunter" target="_blank" rel="noopener noreferrer"
            style={{ color:"var(--text-dim)", textDecoration:"none", borderBottom:"1px dotted var(--line)" }}>
            github.com/jamesnavinhill/benefit-hunter ↗
          </a>
        </span>
      </div>

     </div>{/* /.shell */}

      {/* SETTINGS MODAL */}
      {profileOpen && (
        <div onClick={() => setProfileOpen(false)} style={{
          position:"fixed", inset:0, zIndex:100,
          background:"rgba(0,0,0,0.65)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"flex-start", justifyContent:"center",
          padding:"40px 20px", overflowY:"auto",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6,
            width:"100%", maxWidth:1040, overflow:"hidden",
            boxShadow:"0 16px 48px rgba(0,0,0,0.7)",
          }}>
            {/* Modal header */}
            <div style={{ display:"flex", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid var(--line-soft)" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", letterSpacing:"0.04em" }}>Settings</div>
                <div style={{ fontSize:9, color:"var(--text-dim2)", marginTop:2, letterSpacing:"0.04em" }}>
                  Profile, application data, and appearance
                </div>
              </div>
              <button onClick={() => setProfileOpen(false)} style={{
                marginLeft:"auto", background:"transparent", border:"1px solid var(--line)",
                color:"var(--text-dim)", borderRadius:3, padding:"4px 10px", cursor:"pointer",
                fontSize:11, fontFamily:"monospace", lineHeight:1,
              }}>✕</button>
            </div>

            <div className="settings-layout">
              <nav className="settings-nav" aria-label="Settings sections">
                <div className="settings-section-label">Profile</div>
                <button type="button" aria-selected={settingsTab === "matching"} onClick={() => setSettingsTab("matching")}>
                  <span>★</span> Benefit Matching
                </button>
                {Object.entries(PROFILE_SCHEMA).map(([sectionKey, section]) => {
                  const filled = section.fields.filter(f => profileDoc[f.key] && String(profileDoc[f.key]).trim()).length;
                  return (
                    <button key={sectionKey} type="button" aria-selected={settingsTab === sectionKey} onClick={() => setSettingsTab(sectionKey)}>
                      <span style={{ color:section.color }}>●</span>
                      <span>{section.title}</span>
                      <span style={{ marginLeft:"auto", color:"var(--text-dim3)", fontSize:8 }}>{filled}/{section.fields.length}</span>
                    </button>
                  );
                })}
                <div className="settings-section-label">Interface</div>
                <button type="button" aria-selected={settingsTab === "appearance"} onClick={() => setSettingsTab("appearance")}>
                  <span>◐</span> Appearance
                </button>
              </nav>

              <main className="settings-main">
              {settingsTab === "matching" ? (
                <>

            {/* Profile match checkboxes */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:15, color:"var(--text)", fontWeight:700, marginBottom:4 }}>
                Benefit Matching
              </div>
              <div style={{ fontSize:10, color:"var(--text-dim)", lineHeight:1.5, marginBottom:14 }}>
                Tell Benefit Hunter which access paths and requirements are available to you. This only powers “For Me” filtering—it does not hide opportunities by default.
              </div>
              <div style={{
                padding:"16px 18px",
                background:"var(--surface)", border:"1px solid var(--line)", borderRadius:4,
                display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:8,
              }}>
                {PROFILE_FIELDS.map(f => (
                  <label key={f.key} style={{
                    display:"flex", alignItems:"center", gap:6, cursor:"pointer",
                    fontSize:10, color: profile[f.key] ? "var(--text)" : "var(--text-dim2)",
                  }}>
                    <input
                      type="checkbox"
                      checked={profile[f.key]}
                      onChange={e => updateProfile(f.key, e.target.checked)}
                      style={{ accentColor:"var(--ok)" }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
                </>
              ) : PROFILE_SCHEMA[settingsTab] ? (
                <>
                  <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:5 }}>
                    <div style={{ fontSize:15, color:"var(--text)", fontWeight:700 }}>{PROFILE_SCHEMA[settingsTab].title}</div>
                    <span style={{ color:"var(--text-dim2)", fontSize:9 }}>
                      {PROFILE_SCHEMA[settingsTab].fields.filter(f => profileDoc[f.key] && String(profileDoc[f.key]).trim()).length} / {PROFILE_SCHEMA[settingsTab].fields.length} filled
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-dim)", lineHeight:1.5, marginBottom:18 }}>
                    Canonical application data used when drafting benefit applications.
                  </div>
                  <div className="settings-form-grid">
                        {PROFILE_SCHEMA[settingsTab].fields.map(field => {
                          const val = profileDoc[field.key] || "";
                          const sty = {
                            background:"var(--surface)", border:"1px solid var(--line)", color:"var(--text)",
                            padding:"8px 10px", borderRadius:3, fontSize:11,
                            fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box",
                          };
                          return (
                            <label key={field.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              <span style={{ fontSize:10, color: val ? "var(--text)" : "var(--text-dim)", letterSpacing:"0.02em" }}>
                                {field.label}
                              </span>
                              {field.type === "textarea" ? (
                                <textarea
                                  value={val}
                                  onChange={e => updateProfileDoc(field.key, e.target.value)}
                                  placeholder={field.placeholder || ""}
                                  rows={3}
                                  style={{ ...sty, resize:"vertical", minHeight:76, fontFamily:"inherit" }}
                                />
                              ) : field.type === "select" ? (
                                <select
                                  value={val}
                                  onChange={e => updateProfileDoc(field.key, e.target.value)}
                                  style={sty}
                                >
                                  {field.options.map(o => <option key={o} value={o}>{o || "—"}</option>)}
                                </select>
                              ) : (
                                <input
                                  type={field.type}
                                  value={val}
                                  onChange={e => updateProfileDoc(field.key, e.target.value)}
                                  placeholder={field.placeholder || ""}
                                  style={sty}
                                />
                              )}
                            </label>
                          );
                        })}
                  </div>

            {/* Modal footer — manual save */}
            <div style={{
              marginTop:18, paddingTop:14, borderTop:"1px solid var(--line-soft)",
              display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            }}>
              <button onClick={handleManualSave} style={{
                background:"var(--ok)", color:"var(--action-text)", border:"none",
                borderRadius:3, padding:"7px 18px", cursor:"pointer",
                fontSize:11, fontWeight:700, fontFamily:"monospace",
                letterSpacing:"0.1em", textTransform:"uppercase",
              }}>Save</button>
              {savedFlash && (
                <span style={{
                  fontSize:10, color:"var(--ok)", fontFamily:"monospace",
                  letterSpacing:"0.08em", textTransform:"uppercase",
                }}>✓ Saved</span>
              )}
              <span style={{
                marginLeft:"auto", fontSize:9, color:"var(--text-dim3)", fontFamily:"monospace",
                letterSpacing:"0.05em",
              }}>
                {signedInUser ? "Changes also save automatically" : "Saved locally on this device"}
              </span>
            </div>
                </>
              ) : (
                <AccentsModal
                  embedded
                  open
                  accents={accents}
                  onChange={setAccents}
                  onClose={() => setProfileOpen(false)}
                  onSave={handleAccentsSave}
                  onResetAll={handleAccentsResetAll}
                  savedFlash={accentsSavedFlash}
                />
              )}
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
