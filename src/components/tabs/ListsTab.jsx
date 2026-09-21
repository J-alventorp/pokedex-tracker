import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { usePokedexEntities } from "../../hooks/usePokedexEntities";
import { usePokemonCategories } from "../../hooks/usePokemonCategories";
import { useCardCountsByDex } from "../../hooks/useCardCountsByDex";
import { entityKey, toCardIdArray } from "../../utils";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import EntityTile from "../EntityTile";
import ListCard from "../ListCard";
import CardListView from "../CardListView";

export default function ListsTab({
  lists,
  setLists,
  onOpenInfo,
  activeListId,
  setActiveListId,
  creating,
  setCreating,
  onDeleteList,
  checkedCards,
  onToggleCard,
  checkedEntities,
  entityCardChoices,
  onToggleEntity,
  onBack,
}) {
  const [newListName, setNewListName] = useState("");
  const [newListEntities, setNewListEntities] = useState(new Map());
  const [saveError, setSaveError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [highlightDex, setHighlightDex] = useState(null);
  const tileRefs = useRef(new Map());

  const { entities: pickEntities, status: pickStatus, loadMore, hasMore } = usePokedexEntities();
  const { categories, status: categoriesStatus } = usePokemonCategories();
  const [activeCategories, setActiveCategories] = useState(new Set());
  const cardCounts = useCardCountsByDex();

  const activeList = lists.find((l) => l.id === activeListId);
  const visibleEntities = (activeList?.entities ?? []).filter((e) => {
    const has = checkedEntities.has(e.dex);
    if (view === "collected") return has;
    if (view === "missing") return !has;
    return true;
  });

  // Searching doesn't hide the rest of the list — it scrolls to and briefly
  // highlights the match so you can keep browsing from there (same as the
  // Pokédex tab's search, and consistent since both read the same collected
  // state now). Runs unconditionally (even while the create panel or the
  // lists grid is showing) to keep this a top-level hook; it's a no-op
  // whenever there's no active entity list.
  useEffect(() => {
    if (!activeList || activeList.kind === "cards") return;
    const q = query.trim().toLowerCase();
    if (!q) {
      setHighlightDex(null);
      return;
    }
    const match = visibleEntities.find((e) => e.name.toLowerCase().includes(q));
    if (!match) {
      setHighlightDex(null);
      return;
    }
    setHighlightDex(match.dex);
    tileRefs.current.get(match.dex)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightDex(null), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeList?.id]);

  const toggleCategory = (name) => {
    const already = activeCategories.has(name);
    setActiveCategories((prev) => {
      const n = new Set(prev);
      if (already) n.delete(name);
      else n.add(name);
      return n;
    });
    setNewListEntities((prev) => {
      const n = new Map(prev);
      const bucket = categories[name] || [];
      if (already) {
        for (const e of bucket) n.delete(entityKey(e));
      } else {
        for (const e of bucket) n.set(entityKey(e), e);
      }
      return n;
    });
    setSaveError("");
  };

  const resetDraft = useCallback(() => {
    setNewListName("");
    setNewListEntities(new Map());
    setActiveCategories(new Set());
    setSaveError("");
  }, []);

  // The hardware back button closes the panel without going through
  // cancelCreate, so clear the draft whenever the panel leaves the screen.
  useEffect(() => {
    if (!creating) resetDraft();
  }, [creating, resetDraft]);

  const pickedCount = newListEntities.size;
  // Saving used to bail out silently when either of these was missing, which
  // made the button look broken. Now the reason is always spelled out.
  const blockedReason = !newListName.trim()
    ? "Give your list a name first."
    : pickedCount === 0
      ? "Pick at least one Pokémon to put on the list."
      : "";

  const createList = () => {
    if (blockedReason) {
      setSaveError(blockedReason);
      return;
    }
    const id = `l${Date.now()}`;
    setLists((prev) => [...prev, { id, name: newListName.trim(), entities: [...newListEntities.values()] }]);
    resetDraft();
    setCreating(false);
    setActiveListId(id);
  };

  const cancelCreate = () => onBack();

  if (creating) {
    return (
      <div className="pc-create-panel">
        <button className="pc-back-btn" onClick={cancelCreate}><ArrowLeft size={16} /> Back</button>
        <input
          type="text"
          placeholder="Name your list, e.g. Kanto Starters"
          value={newListName}
          onChange={(e) => { setNewListName(e.target.value); setSaveError(""); }}
        />
        <p className="pc-modal-hint">Grab a whole set at once, then mix in more below:</p>
        <div className="pc-category-row">
          {Object.keys(categories).map((name) => (
            <button
              key={name}
              type="button"
              className={`pc-category-chip ${activeCategories.has(name) ? "on" : ""}`}
              onClick={() => toggleCategory(name)}
              disabled={categoriesStatus !== "done"}
            >
              {activeCategories.has(name) ? <Check size={13} /> : <Plus size={13} />} {name}
            </button>
          ))}
        </div>
        {categoriesStatus === "loading" && <p className="pc-loading">Loading categories…</p>}
        {categoriesStatus === "error" && <p className="pc-error">Couldn't load the bulk categories — pick Pokémon individually below.</p>}
        <p className="pc-modal-hint">Or pick individual Pokémon:</p>
        <div className="pc-pick-grid">
          {pickEntities.map((e) => {
            const key = entityKey(e);
            const on = newListEntities.has(key);
            return (
              <div
                key={key}
                className={`pc-pick-item ${on ? "on" : ""}`}
                onClick={() => {
                  setSaveError("");
                  setNewListEntities((prev) => {
                    const n = new Map(prev);
                    if (n.has(key)) n.delete(key);
                    else n.set(key, e);
                    return n;
                  });
                }}
              >
                {on ? <Check size={14} /> : <Plus size={14} />} {e.name}
              </div>
            );
          })}
        </div>
        {pickStatus === "loading" && <p className="pc-loading">Loading Pokémon…</p>}
        {pickStatus === "error" && <p className="pc-error">Couldn't load the Pokédex.</p>}
        {hasMore && pickStatus !== "loading" && (
          <button type="button" className="pc-load-more" onClick={loadMore}>Load more Pokémon</button>
        )}
        <div className="pc-create-actions">
          <button
            type="button"
            className={`pc-btn-primary ${blockedReason ? "is-blocked" : ""}`}
            aria-disabled={blockedReason ? "true" : "false"}
            onClick={createList}
          >
            Save list{pickedCount > 0 ? ` (${pickedCount})` : ""}
          </button>
          <button type="button" className="pc-btn-ghost" onClick={cancelCreate}>Cancel</button>
          <span className="pc-picked-count">{pickedCount} Pokémon selected</span>
        </div>
        {saveError && <p className="pc-form-error" role="alert">{saveError}</p>}
      </div>
    );
  }

  if (activeList?.kind === "cards") {
    return (
      <CardListView
        list={activeList}
        checkedCards={checkedCards}
        onToggleCard={onToggleCard}
        onOpenInfo={onOpenInfo}
        onBack={onBack}
      />
    );
  }

  if (!activeList) {
    return (
      <div className="pc-lists-grid">
        {lists.map((l) => (
          <ListCard key={l.id} list={l} checkedCards={checkedCards} checkedEntities={checkedEntities} onOpen={setActiveListId} onDelete={onDeleteList} />
        ))}
        <div className="pc-new-list-card" onClick={() => setCreating(true)}>
          <Plus size={22} />
          New list
        </div>
      </div>
    );
  }

  const done = activeList.entities.filter((e) => checkedEntities.has(e.dex)).length;

  return (
    <>
      <button className="pc-back-btn" onClick={onBack}><ArrowLeft size={16} /> All lists</button>
      <h2 className="pc-section-title">{activeList.name}</h2>
      <div className="pc-controls">
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>
      <ProgressBar done={done} total={activeList.entities.length} />
      <div className="pc-grid">
        {visibleEntities.map((e, i) => (
          <EntityTile
            key={entityKey(e)}
            ref={(node) => {
              if (node) tileRefs.current.set(e.dex, node);
              else tileRefs.current.delete(e.dex);
            }}
            entity={e}
            index={i}
            checked={checkedEntities.has(e.dex)}
            collected={toCardIdArray(entityCardChoices[e.dex]).length}
            total={cardCounts.get(e.dex)}
            highlighted={highlightDex === e.dex}
            onToggle={onToggleEntity}
            onOpenInfo={(data) => onOpenInfo({ ...data, context: { type: "list", listId: activeList.id } })}
          />
        ))}
      </div>
    </>
  );
}
