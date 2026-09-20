import { useCallback, useEffect, useRef } from "react";

// Maps the app's layered screens onto real browser history entries so the
// phone's back button steps back through them instead of leaving the app.
//
// The rule that makes this work: in-app back/close affordances must NOT change
// state themselves — they call goBack(), and the popstate handler applies the
// previous snapshot. If a close button also cleared state we would push a new
// entry for "closed" and back would re-open what was just dismissed.

function navKey(s) {
  const modal = s.modal ? (s.modal.card ? `c:${s.modal.card.id}` : `e:${s.modal.entity?.dex}`) : "";
  return [s.tab, s.activeListId ?? "", s.creating ? 1 : 0, s.settings ? 1 : 0, modal, s.confirm ? 1 : 0].join("|");
}

// The create panel counts as two so that saving a list (creating -> list
// detail) reads as going shallower. That unwinds the draft entry instead of
// leaving an empty form behind for the back button to land on.
function depth(s) {
  return (s.tab !== "home" ? 1 : 0) + (s.activeListId ? 1 : 0) + (s.creating ? 2 : 0)
    + (s.settings ? 1 : 0) + (s.modal ? 1 : 0) + (s.confirm ? 1 : 0);
}

// pushState structure-clones its argument, and a live confirm carries an
// onConfirm callback — a function would throw DataCloneError.
function sanitize(s) {
  return {
    tab: s.tab,
    activeListId: s.activeListId ?? null,
    creating: !!s.creating,
    settings: !!s.settings,
    modal: s.modal ?? null,
    confirm: !!s.confirm,
  };
}

export function useAppHistory(snapshot, applySnapshot) {
  const prevKeyRef = useRef(null);
  const prevDepthRef = useRef(0);
  const unwindRef = useRef(false);
  const snapshotRef = useRef(snapshot);
  const applyRef = useRef(applySnapshot);

  // Keep the listeners reading the latest values without re-subscribing.
  // Declared first so every effect below sees current refs.
  useEffect(() => {
    snapshotRef.current = snapshot;
    applyRef.current = applySnapshot;
  });

  // Seed the root entry once. Idempotent, so StrictMode's double mount is fine.
  useEffect(() => {
    if (prevKeyRef.current !== null) return;
    const current = snapshotRef.current;
    try {
      window.history.replaceState({ pcNav: sanitize(current) }, "");
    } catch {
      // history unavailable (rare, e.g. sandboxed frame) — app still works
    }
    prevKeyRef.current = navKey(current);
    prevDepthRef.current = depth(current);
  }, []);

  useEffect(() => {
    const onPop = (e) => {
      // An unwind we triggered ourselves: keep the state we already have and
      // re-stamp the entry we landed on rather than applying it.
      if (unwindRef.current) {
        unwindRef.current = false;
        const current = snapshotRef.current;
        try {
          window.history.replaceState({ pcNav: sanitize(current) }, "");
        } catch { /* ignore */ }
        prevKeyRef.current = navKey(current);
        prevDepthRef.current = depth(current);
        return;
      }
      const nav = e.state?.pcNav;
      // No snapshot means an entry we never created — let the browser leave.
      if (!nav) return;
      applyRef.current(nav);
      // Stamp synchronously so the sync effect below sees no change and
      // doesn't push the screen we just navigated back to.
      prevKeyRef.current = navKey(nav);
      prevDepthRef.current = depth(nav);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current === null) return;
    const key = navKey(snapshot);
    if (key === prevKeyRef.current) return;
    const d = depth(snapshot);
    const prevDepth = prevDepthRef.current;
    prevKeyRef.current = key;
    prevDepthRef.current = d;
    try {
      if (d < prevDepth) {
        // Safety net: state went shallower without going through goBack().
        // Rewind history to match instead of pushing a duplicate entry.
        unwindRef.current = true;
        window.history.go(d - prevDepth);
      } else {
        window.history.pushState({ pcNav: sanitize(snapshot) }, "");
      }
    } catch {
      // iOS Safari throttles pushState (~100 per 30s); losing an entry is
      // better than breaking navigation entirely.
      unwindRef.current = false;
    }
  }, [snapshot]);

  return useCallback(() => {
    try {
      window.history.back();
    } catch { /* ignore */ }
  }, []);
}

export function adoptedSnapshot() {
  try {
    const nav = window.history.state?.pcNav;
    if (!nav) return null;
    // Overlays don't survive a reload: the modal payload would be stale and a
    // confirm's callback is long gone.
    return { ...nav, modal: null, confirm: false };
  } catch {
    return null;
  }
}
