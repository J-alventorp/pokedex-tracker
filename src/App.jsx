import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { makeEntity } from "./api/pokeApi";
import { fetchAllCardsByPokedexNumber } from "./api/pokemonTcg";
import { entityKey, toCardIdArray } from "./utils";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { adoptedSnapshot, useAppHistory } from "./hooks/useAppHistory";
import { autoListId, buildCardList } from "./autoList";
import InfoModal from "./components/InfoModal";
import ConfirmDialog from "./components/ConfirmDialog";
import SettingsPanel from "./components/SettingsPanel";
import BackToTop from "./components/BackToTop";
import StatModal from "./components/StatModal";
import HomeTab from "./components/tabs/HomeTab";
import PokemonTab from "./components/tabs/PokemonTab";
import SetTab from "./components/tabs/SetTab";
import DexTab from "./components/tabs/DexTab";
import ListsTab from "./components/tabs/ListsTab";

const TABS = [
  { key: "home", label: "Home", icon: "🏠", color: "#E3350D" },
  { key: "pokemon", label: "By Pokémon", icon: "⚡", color: "#F0721C" },
  { key: "set", label: "By Set", icon: "📦", color: "#3B4CCA" },
  { key: "dex", label: "Pokédex", icon: "📕", color: "#C48500" },
  { key: "lists", label: "My Lists", icon: "⭐", color: "#2E8B45" },
];

const SEED_LIST_DEX = [
  { dex: 1, name: "Bulbasaur" },
  { dex: 4, name: "Charmander" },
  { dex: 7, name: "Squirtle" },
  { dex: 25, name: "Pikachu" },
  { dex: 150, name: "Mewtwo" },
  { dex: 151, name: "Mew" },
];

function defaultLists() {
  return [
    {
      id: "l1",
      name: "Kanto Legends",
      entities: SEED_LIST_DEX.map((e) => makeEntity(e.dex, e.name)),
    },
  ];
}

// Older saves kept each list's collected state (checked/cardChoices) local to
// that list, separate from the Pokédex tab's global checkedEntities /
// entityCardChoices. Fold any leftover per-list state into the global stores
// once so a Pokémon ticked on a list still shows collected everywhere, then
// drop the now-unused fields — lists only track membership going forward.
function migrateListEntityState(lists, checkedEntities, entityCardChoices) {
  let nextChecked = checkedEntities;
  let nextChoices = entityCardChoices;

  for (const l of lists) {
    if ((l.kind ?? "entities") !== "entities") continue;
    for (const key of l.checked ?? []) {
      const entity = (l.entities ?? []).find((e) => entityKey(e) === key);
      if (!entity) continue;
      if (!nextChecked.has(key)) {
        if (nextChecked === checkedEntities) nextChecked = new Set(checkedEntities);
        nextChecked.add(key);
      }
    }
    for (const [key, val] of Object.entries(l.cardChoices ?? {})) {
      const entity = (l.entities ?? []).find((e) => entityKey(e) === key);
      if (!entity || key in nextChoices) continue;
      if (nextChoices === entityCardChoices) nextChoices = { ...entityCardChoices };
      nextChoices[key] = val;
    }
  }

  const lists2 = lists.map((l) => {
    if (!("checked" in l) && !("cardChoices" in l)) return l;
    const { checked: _checked, cardChoices: _cardChoices, ...rest } = l;
    return rest;
  });

  return { checkedEntities: nextChecked, entityCardChoices: nextChoices, lists: lists2 };
}

// A reload mid-app lands on a history entry that already describes a screen.
// Starting from it keeps React and the back stack in step.
const restored = adoptedSnapshot();

export default function App() {
  const [tab, setTab] = useState(restored?.tab ?? "home");
  const [checkedCards, setCheckedCards] = useLocalStorageState("pc_checkedCards", () => new Set());
  const [checkedEntities, setCheckedEntities] = useLocalStorageState("pc_checkedEntities", () => new Set());
  const [entityCardChoices, setEntityCardChoices] = useLocalStorageState("pc_entityCardChoices", () => ({}));
  const [lists, setLists] = useLocalStorageState("pc_lists", defaultLists);
  const [autoDismissed, setAutoDismissed] = useLocalStorageState("pc_autoListDismissed", () => new Set());
  const [modal, setModal] = useState(null);

  // Lifted out of ListsTab so the home page can jump straight into a list.
  const [activeListId, setActiveListId] = useState(restored?.activeListId ?? null);
  const [creating, setCreating] = useState(restored?.creating ?? false);
  const [settings, setSettings] = useState(restored?.settings ?? false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [statModal, setStatModal] = useState(null);
  // Set by openList/startNewList when they're jumping straight from Home into
  // a list-level screen, skipping the lists index — applied one tick later so
  // the index still gets its own history entry (see those functions below).
  const [pendingListNav, setPendingListNav] = useState(null);

  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;
    const hasLegacyState = lists.some((l) => (l.checked?.length ?? 0) > 0 || Object.keys(l.cardChoices ?? {}).length > 0);
    if (!hasLegacyState) return;
    const migrated = migrateListEntityState(lists, checkedEntities, entityCardChoices);
    setCheckedEntities(migrated.checkedEntities);
    setEntityCardChoices(migrated.entityCardChoices);
    setLists(migrated.lists);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // checkedEntities used to hold raw dex numbers. Now that Mega forms need
  // their own key (see entityKey), it holds entityKey strings instead — a
  // save from before this change would have numbers in it, which would never
  // match a string key again and read as "nothing collected". Coerce once.
  const entityKeysMigratedRef = useRef(false);
  useEffect(() => {
    if (entityKeysMigratedRef.current) return;
    entityKeysMigratedRef.current = true;
    if (![...checkedEntities].some((v) => typeof v === "number")) return;
    setCheckedEntities(new Set([...checkedEntities].map((v) => String(v))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCard = (id) => setCheckedCards((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  // Keyed by entityKey(entity), not raw dex — a base Pokémon and its Mega
  // forms share a dex number but must be collectible independently.
  const toggleEntity = (entity) => {
    const key = entityKey(entity);
    setCheckedEntities((prev) => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
        // Unticking a Pokémon means "not collected" — a stale card choice
        // would otherwise silently keep pointing at a printing you unset.
        setEntityCardChoices((choices) => {
          if (!(key in choices)) return choices;
          const { [key]: _drop, ...rest } = choices;
          return rest;
        });
      } else {
        n.add(key);
      }
      return n;
    });
  };

  const toggleEntityCard = (entity, cardId) => {
    const key = entityKey(entity);
    const current = toCardIdArray(entityCardChoices[key]);
    const adding = !current.includes(cardId);
    setEntityCardChoices((prev) => {
      const next = adding ? [...current, cardId] : current.filter((id) => id !== cardId);
      if (next.length === 0) {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
    if (adding) {
      setCheckedEntities((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    }
  };

  // --- Back-button history ---------------------------------------------------
  const snapshot = useMemo(
    () => ({ tab, activeListId, creating, settings, modal, confirm: !!confirm }),
    [tab, activeListId, creating, settings, modal, confirm],
  );

  const applySnapshot = useCallback((nav) => {
    setTab(nav.tab);
    setActiveListId(nav.activeListId ?? null);
    setCreating(!!nav.creating);
    setSettings(!!nav.settings);
    setModal(nav.modal ?? null);
    // A confirm's callback can't survive a history entry, so back only ever
    // closes one — it never reopens it.
    if (!nav.confirm) setConfirm(null);
  }, []);

  const goBack = useAppHistory(snapshot, applySnapshot);
  const closeModal = () => setModal(null);

  // Recomputed every render (not baked in at the moment the modal was opened)
  // so ticking cards while the modal is open updates its highlights live,
  // and closing it never needs to touch navigation/scroll state at all.
  // Collected state and card choices for entities are global (see
  // migrateListEntityState above), so the Pokédex tab and every list read
  // from — and write to — the exact same store; there's no per-context branch.
  let modalData = modal;
  if (modal?.entity) {
    const key = entityKey(modal.entity);
    modalData = {
      ...modal,
      checked: checkedEntities.has(key),
      selectedCardIds: toCardIdArray(entityCardChoices[key]),
      onToggleCardChoice: (cardId) => toggleEntityCard(modal.entity, cardId),
    };
  }

  // --- Toast -----------------------------------------------------------------
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // The overlay covers the screen but doesn't stop the page underneath from
  // scrolling, since the real scroll container is the document itself.
  useEffect(() => {
    if (!modal && !confirm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [modal, confirm]);

  // --- Navigation ------------------------------------------------------------
  const goToTab = (key) => {
    setSettings(false);
    setTab(key);
  };

  // Opening a list (or starting a new one) from Home jumps straight past the
  // lists index, so it never gets its own history entry — "All lists" inside
  // that list then has nowhere correct to go back to. Land on the index first
  // and apply the deeper step a tick later so both get pushed.
  const openList = (id) => {
    if (tab === "lists") {
      setActiveListId(id);
      setCreating(false);
      return;
    }
    setActiveListId(null);
    setCreating(false);
    setSettings(false);
    setTab("lists");
    setPendingListNav({ type: "open", id });
  };

  const startNewList = () => {
    if (tab === "lists") {
      setActiveListId(null);
      setCreating(true);
      return;
    }
    setActiveListId(null);
    setCreating(false);
    setSettings(false);
    setTab("lists");
    setPendingListNav({ type: "create" });
  };

  useEffect(() => {
    if (!pendingListNav || tab !== "lists") return;
    if (pendingListNav.type === "open") setActiveListId(pendingListNav.id);
    else if (pendingListNav.type === "create") setCreating(true);
    setPendingListNav(null);
  }, [tab, pendingListNav]);

  // --- Lists -----------------------------------------------------------------
  const performDeleteList = (id) => {
    const list = lists.find((l) => l.id === id);
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(null);
    // Deleting an auto list means "stop suggesting this one" — otherwise the
    // next tick would bring it straight back.
    if (list?.auto && typeof list.dex === "number") {
      setAutoDismissed((prev) => new Set(prev).add(list.dex));
    }
  };

  const requestDeleteList = (id) => {
    const list = lists.find((l) => l.id === id);
    if (!list) return;
    setConfirm({
      title: "Delete this list?",
      message: `"${list.name}" and its progress will be removed. This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: () => performDeleteList(id),
    });
  };

  const requestToggleEntity = (entity) => {
    if (!checkedEntities.has(entityKey(entity))) {
      toggleEntity(entity);
      return;
    }
    setConfirm({
      title: "Remove from collected?",
      message: `${entity.name} will no longer be marked as collected, and any cards you picked for it will be cleared.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => toggleEntity(entity),
    });
  };

  const confirmAndClose = () => {
    // onConfirm can itself change nav-relevant state (deleting the list you're
    // viewing clears activeListId; restoring a backup clears it too). Batch
    // that together with closing the dialog into one state update rather than
    // calling goBack() afterwards — two nav changes in the same tick would let
    // the history-sync effect and an explicit history.back() both try to
    // rewind, racing each other. One batched update means exactly one
    // coherent history.go() covers however many layers actually closed.
    confirm?.onConfirm?.();
    setConfirm(null);
  };

  // --- Auto lists ------------------------------------------------------------
  const autoInFlight = useRef(new Set());

  // `force` is set by the explicit "Save as list" button on By Pokémon —
  // unlike the automatic 3-tick trigger, a deliberate click should work even
  // if the suggestion was previously dismissed, and should say so instead of
  // silently no-oping when the list already exists.
  const handleAutoListCandidate = async (dex, { force = false } = {}) => {
    if (!force && autoDismissed.has(dex)) return;
    if (autoInFlight.current.has(dex)) return;
    if (lists.some((l) => l.id === autoListId(dex))) {
      if (force) setToast("Already saved as a list");
      return;
    }
    autoInFlight.current.add(dex);
    try {
      const all = await fetchAllCardsByPokedexNumber(dex);
      if (all.length === 0) {
        if (force) setToast("No known cards for this Pokémon yet");
        return;
      }
      const list = buildCardList(dex, all);
      setLists((prev) => {
        // The real guard against a double create: two awaits can both pass the
        // check above, but only one can win inside the updater.
        if (prev.some((l) => l.id === list.id)) return prev;
        return [...prev, list];
      });
      // Announced unconditionally: React runs the updater during render, so a
      // flag set inside it can't be read here. The checks above plus the stable
      // auto-<dex> id already make a duplicate toast a non-event.
      setToast(`⭐ Started a list for ${list.name} — ${all.length} cards to find`);
    } catch {
      // Couldn't read the bundled card data; skip silently rather than
      // interrupting someone who is just ticking cards.
    } finally {
      autoInFlight.current.delete(dex);
    }
  };

  // --- Backup ----------------------------------------------------------------
  const applyImport = (backup) => {
    // An older backup can still carry per-list checked/cardChoices — fold
    // those into the global stores the same way the one-time migration does,
    // so restoring an old file doesn't lose collected state.
    const migrated = migrateListEntityState(backup.lists, new Set(backup.checkedEntities), backup.entityCardChoices ?? {});
    setCheckedCards(new Set(backup.checkedCards));
    setCheckedEntities(migrated.checkedEntities);
    setEntityCardChoices(migrated.entityCardChoices);
    setLists(migrated.lists);
    setAutoDismissed(new Set(backup.autoListDismissed));
    setActiveListId(null);
    setCreating(false);
    setToast("✅ Backup restored");
  };

  return (
    <div className="pc-root">
      <div className="pc-header">
        <h1 className="pc-title">
          <span className="pc-title-ball" aria-hidden="true" />
          My Card Collection
        </h1>
        <button className="pc-icon-btn" aria-label="Settings" onClick={() => setSettings(true)}>
          <Settings size={18} />
        </button>
      </div>
      <p className="pc-tagline">Track it, catch it, complete it!</p>

      <div className="pc-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`pc-tab ${!settings && tab === t.key ? "active" : ""}`}
            style={!settings && tab === t.key ? { background: t.color, "--tab-color": t.color } : { "--tab-color": t.color }}
            onClick={() => goToTab(t.key)}
          >
            <span className="pc-tab-icon" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {settings ? (
        <SettingsPanel
          data={{ checkedCards, checkedEntities, entityCardChoices, lists, autoListDismissed: autoDismissed }}
          onImport={applyImport}
          onRequestConfirm={setConfirm}
          onBack={goBack}
        />
      ) : (
        <>
          {tab === "home" && (
            <HomeTab
              lists={lists}
              checkedCards={checkedCards}
              checkedEntities={checkedEntities}
              onOpenList={openList}
              onNewList={startNewList}
              onDeleteList={requestDeleteList}
              onGoTo={goToTab}
              onOpenStat={setStatModal}
            />
          )}
          {tab === "pokemon" && (
            <PokemonTab
              checkedCards={checkedCards}
              onToggleCard={toggleCard}
              onOpenInfo={setModal}
              onAutoListCandidate={handleAutoListCandidate}
            />
          )}
          {tab === "set" && <SetTab checkedCards={checkedCards} onToggleCard={toggleCard} onOpenInfo={setModal} />}
          {tab === "dex" && (
            <DexTab
              checkedEntities={checkedEntities}
              entityCardChoices={entityCardChoices}
              onToggleEntity={requestToggleEntity}
              onOpenInfo={setModal}
            />
          )}
          {tab === "lists" && (
            <ListsTab
              lists={lists}
              setLists={setLists}
              onOpenInfo={setModal}
              activeListId={activeListId}
              setActiveListId={setActiveListId}
              creating={creating}
              setCreating={setCreating}
              onDeleteList={requestDeleteList}
              checkedCards={checkedCards}
              onToggleCard={toggleCard}
              checkedEntities={checkedEntities}
              entityCardChoices={entityCardChoices}
              onToggleEntity={requestToggleEntity}
              onBack={goBack}
            />
          )}
        </>
      )}

      <InfoModal data={modalData} onClose={closeModal} />
      <ConfirmDialog data={confirm} onConfirm={confirmAndClose} onCancel={goBack} />
      <StatModal type={statModal} checkedCards={checkedCards} checkedEntities={checkedEntities} onClose={() => setStatModal(null)} />
      {toast && <div className="pc-toast" role="status">{toast}</div>}
      <BackToTop />
    </div>
  );
}
