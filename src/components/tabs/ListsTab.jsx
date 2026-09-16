import { useState } from "react";
import { ArrowLeft, Check, Plus, Search, Trash2 } from "lucide-react";
import { usePokedexEntities } from "../../hooks/usePokedexEntities";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import EntityTile from "../EntityTile";
import MissingRow from "../MissingRow";

export default function ListsTab({ lists, setLists, onOpenInfo }) {
  const [activeListId, setActiveListId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListEntities, setNewListEntities] = useState(new Map());
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");

  const { entities: pickEntities, status: pickStatus, loadMore, hasMore } = usePokedexEntities();

  const activeList = lists.find((l) => l.id === activeListId);

  const toggleListItem = (listId, dex) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const has = l.checked.includes(dex);
      return { ...l, checked: has ? l.checked.filter((d) => d !== dex) : [...l.checked, dex] };
    }));
  };

  const createList = () => {
    if (!newListName.trim() || newListEntities.size === 0) return;
    const id = `l${Date.now()}`;
    setLists((prev) => [...prev, { id, name: newListName.trim(), entities: [...newListEntities.values()], checked: [] }]);
    setNewListName("");
    setNewListEntities(new Map());
    setCreating(false);
    setActiveListId(id);
  };

  const deleteList = (id) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(null);
  };

  if (!activeList && !creating) {
    return (
      <div className="pc-lists-grid">
        {lists.map((l) => {
          const done = l.checked.length;
          const total = l.entities.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div className="pc-list-card" key={l.id} onClick={() => setActiveListId(l.id)}>
              <button className="pc-list-del" onClick={(e) => { e.stopPropagation(); deleteList(l.id); }}><Trash2 size={15} /></button>
              <div className="pc-list-name">{l.name}</div>
              <div className="pc-list-count">{total} Pokémon · {pct}% done</div>
              <ProgressBar done={done} total={total} />
            </div>
          );
        })}
        <div className="pc-new-list-card" onClick={() => setCreating(true)}>
          <Plus size={22} />
          New list
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="pc-create-panel">
        <button className="pc-back-btn" onClick={() => setCreating(false)}><ArrowLeft size={16} /> Back</button>
        <input type="text" placeholder="Name your list, e.g. Kanto Starters" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
        <p className="pc-modal-hint">Pick which Pokémon belong in this list:</p>
        <div className="pc-pick-grid">
          {pickEntities.map((e) => {
            const on = newListEntities.has(e.dex);
            return (
              <div
                key={e.dex}
                className={`pc-pick-item ${on ? "on" : ""}`}
                onClick={() => setNewListEntities((prev) => {
                  const n = new Map(prev);
                  if (n.has(e.dex)) n.delete(e.dex);
                  else n.set(e.dex, e);
                  return n;
                })}
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
        <div>
          <button className="pc-btn-primary" onClick={createList}>Save list</button>
          <button className="pc-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const filtered = activeList.entities.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
  const visible = filtered.filter((e) => {
    if (view === "collected") return activeList.checked.includes(e.dex);
    if (view === "missing") return !activeList.checked.includes(e.dex);
    return true;
  });
  const done = activeList.checked.length;
  const missing = activeList.entities.filter((e) => !activeList.checked.includes(e.dex));

  return (
    <>
      <button className="pc-back-btn" onClick={() => setActiveListId(null)}><ArrowLeft size={16} /> All lists</button>
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
        {visible.map((e, i) => (
          <EntityTile
            key={e.dex}
            entity={e}
            index={i}
            checked={activeList.checked.includes(e.dex)}
            onToggle={(dex) => toggleListItem(activeList.id, dex)}
            onOpenInfo={onOpenInfo}
          />
        ))}
      </div>
      {view !== "missing" && (
        <>
          <h2 className="pc-section-title">Still missing</h2>
          {missing.length === 0 ? (
            <p className="pc-missing-empty">List complete — start another one!</p>
          ) : missing.map((e) => (
            <MissingRow key={e.dex} label={e.name} sub="Details" onClick={() => onOpenInfo({ entity: e })} />
          ))}
        </>
      )}
    </>
  );
}
