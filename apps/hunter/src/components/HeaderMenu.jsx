import { useState } from "react";

export function HeaderMenu({
  onlyForMe,
  onToggleForMe,
  viewMode,
  onViewModeChange,
  onOpenSettings,
  signedInUser,
  syncStatus,
  syncError,
  syncLabel,
  isSupabaseConfigured,
  onSignIn,
  onSignOut,
}) {
  const [open, setOpen] = useState(false);
  const action = (label, active, onClick, title = label) => (
    <button
      type="button"
      role="menuitem"
      className={"header-menu-action" + (active ? " active" : "")}
      onClick={onClick}
      title={title}
    >{label}</button>
  );
  const openSettings = (tab) => {
    setOpen(false);
    onOpenSettings(tab);
  };
  const setView = (next) => {
    setOpen(false);
    onViewModeChange(next);
  };

  return (
    <div className="header-menu-wrap">
      <button
        type="button"
        className="header-menu-trigger"
        aria-label="Open settings and tools"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="header-menu-dismiss"
            aria-label="Close settings menu"
            onClick={() => setOpen(false)}
          />
          <div className="header-menu" role="menu" aria-label="Settings and tools">
            <div className="header-menu-stack">
              {action(onlyForMe ? "★ For Me · On" : "★ For Me", onlyForMe, () => { setOpen(false); onToggleForMe(); }, "Filter to offers matching your profile")}
              {action("☰ Guided", viewMode === "guided", () => setView(viewMode === "guided" ? "grid" : "guided"), "Switch between guided and grid views")}
              {action("$ Proof", viewMode === "proof", () => setView(viewMode === "proof" ? "grid" : "proof"), "Switch between proof and grid views")}
              {action(viewMode === "by_vendor" ? "▦ By vendor" : "▤ Grid", viewMode === "by_vendor", () => setView(viewMode === "by_vendor" ? "grid" : "by_vendor"), "Switch between vendor and grid views")}
              <a className="header-menu-action" role="menuitem" href="/automation-kit/" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>⚙ Automation kit</a>
              <a className="header-menu-action" role="menuitem" href="https://github.com/jamesnavinhill/benefit-hunter" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>↗ GitHub repository</a>
              <button type="button" role="menuitem" className="header-menu-action" onClick={() => openSettings("matching")}>⚙ Benefit matching & profile</button>
              <button type="button" role="menuitem" className="header-menu-action" onClick={() => openSettings("appearance")}>◐ Appearance</button>
              {signedInUser ? (
                <div className="header-menu-account">
                  <div className="header-menu-account-status">
                    <span>Signed in</span>
                    <span className={"sync-dot sync-" + syncStatus} title={syncLabel + (syncError ? " · " + syncError : "")} />
                  </div>
                  <div className="header-menu-email">{signedInUser.email || signedInUser.user_metadata?.user_name || signedInUser.id}</div>
                  {syncStatus === "error" && <div className="header-menu-error">{syncError || "Sync error"}</div>}
                  <button type="button" role="menuitem" className="header-menu-action danger" onClick={() => { setOpen(false); onSignOut(); }}>← Sign out</button>
                </div>
              ) : isSupabaseConfigured ? (
                <div className="header-menu-account">
                  <button type="button" role="menuitem" className="header-menu-action" onClick={() => { setOpen(false); onSignIn("github"); }}>Sign in with GitHub</button>
                  <button type="button" role="menuitem" className="header-menu-action" onClick={() => { setOpen(false); onSignIn("google"); }}>Sign in with Google</button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
