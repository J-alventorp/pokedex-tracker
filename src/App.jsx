import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { makeEntity } from "./api/pokeApi";
import { fetchAllCardsByPokedexNumber } from "./api/pokemonTcg";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { adoptedSnapshot, useAppHistory } from "./hooks/useAppHistory";
import { autoListId, buildCardList } from "./autoList";
import InfoModal from "./components/InfoModal";
import ConfirmDialog from "./components/ConfirmDialog";
import SettingsPanel from "./components/SettingsPanel";
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
      checked: [],
      cardChoices: {},
    },
  ];
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

  const toggleCard = (id) => setCheckedCards((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const toggleEntity = (dex) => setCheckedEntities((prev) => {
    const n = new Set(prev);
    if (n.has(dex)) {
      n.delete(dex);
      // Unticking a Pokémon means "not collected" — a stale card choice
      // would otherwise silently keep pointing at a printing you unset.
      setEntityCardChoices((choices) => {
        if (!(dex in choices)) return choices;
        const { [dex]: _drop, ...rest } = choices;
        return rest;
      });
    } else {
      n.add(dex);
    }
    return n;
  });

  const setEntityCard = (dex, cardId) => {
    setEntityCardChoices((prev) => {
      if (cardId == null) {
        if (!(dex in prev)) return prev;
        const { [dex]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dex]: cardId };
    });
    if (cardId != null) {
      setCheckedEntities((prev) => (prev.has(dex) ? prev : new Set(prev).add(dex)));
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

  // --- Toast -----------------------------------------------------------------
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // --- Navigation ------------------------------------------------------------
  const goToTab = (key) => {
    setSettings(false);
    setTab(key);
  };

  const openList = (id) => {
    setActiveListId(id);
    setCreating(false);
    setSettings(false);
    setTab("lists");
  };

  const startNewList = () => {
    setActiveListId(null);
    setCreating(true);
    setSettings(false);
    setTab("lists");
  };

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

  const handleAutoListCandidate = async (dex) => {
    if (autoDismissed.has(dex)) return;
    if (autoInFlight.current.has(dex)) return;
    if (lists.some((l) => l.id === autoListId(dex))) return;
    autoInFlight.current.add(dex);
    try {
      const all = await fetchAllCardsByPokedexNumber(dex);
      if (all.length === 0) return;
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

  const setListItemCard = (listId, key, cardId) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const cardChoices = { ...(l.cardChoices || {}) };
      if (cardId == null) delete cardChoices[key];
      else cardChoices[key] = cardId;
      const checked = cardId != null && !l.checked.includes(key) ? [...l.checked, key] : l.checked;
      return { ...l, cardChoices, checked };
    }));
  };

  // --- Backup ----------------------------------------------------------------
  const applyImport = (backup) => {
    setCheckedCards(new Set(backup.checkedCards));
    setCheckedEntities(new Set(backup.checkedEntities));
    setEntityCardChoices(backup.entityCardChoices ?? {});
    setLists(backup.lists);
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
              onToggleEntity={(entity) => toggleEntity(entity.dex)}
              onSelectEntityCard={setEntityCard}
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
              onSetListItemCard={setListItemCard}
              onBack={goBack}
            />
          )}
        </>
      )}

      <InfoModal data={modal} onClose={goBack} />
      <ConfirmDialog data={confirm} onConfirm={confirmAndClose} onCancel={goBack} />
      {toast && <div className="pc-toast" role="status">{toast}</div>}
    </div>
  );
}
