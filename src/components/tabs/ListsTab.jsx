import { useState } from "react";
import { ArrowLeft, Check, Plus, Search, Trash2 } from "lucide-react";
import { usePokedexEntities } from "../../hooks/usePokedexEntities";
import { usePokemonCategories } from "../../hooks/usePokemonCategories";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import EntityTile from "../EntityTile";

export default function ListsTab({ lists, setLists, onOpenInfo }) {
  const [activeListId, setActiveListId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListEntities, setNewListEntities] = useState(new Map());
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");

  const { entities: pickEntities, status: pickStatus, loadMore, hasMore } = usePokedexEntities();
  const { categories, status: categoriesStatus } = usePokemonCategories();
  const [activeCategories, setActiveCategories] = useState(new Set());

  const activeList = lists.find((l) => l.id === activeListId);

  const entityKey = (e) => e.id ?? String(e.dex);

  const toggleListItem = (listId, key) => {
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const has = l.checked.includes(key);
      return { ...l, checked: has ? l.checked.filter((k) => k !== key) : [...l.checked, key] };
    }));
  };

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
  };

  const createList = () => {
    if (!newListName.trim() || newListEntities.size === 0) return;
    const id = `l${Date.now()}`;
    setLists((prev) => [...prev, { id, name: newListName.trim(), entities: [...newListEntities.values()], checked: [] }]);
    setNewListName("");
    setNewListEntities(new Map());
    setActiveCategories(new Set());
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
        <p className="pc-modal-hint">Or pick individual Pokémon:</p>
        <div className="pc-pick-grid">
          {pickEntities.map((e) => {
            const key = entityKey(e);
            const on = newListEntities.has(key);
            return (
              <div
                key={key}
                className={`pc-pick-item ${on ? "on" : ""}`}
                onClick={() => setNewListEntities((prev) => {
                  const n = new Map(prev);
                  if (n.has(key)) n.delete(key);
                  else n.set(key, e);
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
    const has = activeList.checked.includes(entityKey(e));
    if (view === "collected") return has;
    if (view === "missing") return !has;
    return true;
  });
  const done = activeList.checked.length;

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
            key={entityKey(e)}
            entity={e}
            index={i}
            checked={activeList.checked.includes(entityKey(e))}
            onToggle={(entity) => toggleListItem(activeList.id, entityKey(entity))}
            onOpenInfo={onOpenInfo}
          />
        ))}
      </div>
    </>
  );
}
