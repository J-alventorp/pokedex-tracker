import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { usePokedexEntities } from "../../hooks/usePokedexEntities";
import { useMegaEntities } from "../../hooks/usePokemonCategories";
import { useCardCountsByDex } from "../../hooks/useCardCountsByDex";
import { entityKey, toCardIdArray } from "../../utils";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import EntityTile from "../EntityTile";

export default function DexTab({ checkedEntities, entityCardChoices, onToggleEntity, onOpenInfo }) {
  const { entities: baseEntities, status, loadMore, hasMore } = usePokedexEntities();
  const { entities: megaEntities } = useMegaEntities();
  const cardCounts = useCardCountsByDex();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [highlightKey, setHighlightKey] = useState(null);
  const tileRefs = useRef(new Map());

  // Mega forms have no dex of their own — they're spliced in right after
  // their base species so the two read as related but independently
  // collectible entries, instead of only existing in the list-creation
  // bulk-add categories.
  const entities = useMemo(() => {
    if (megaEntities.length === 0) return baseEntities;
    const byDex = new Map();
    for (const m of megaEntities) {
      if (!byDex.has(m.dex)) byDex.set(m.dex, []);
      byDex.get(m.dex).push(m);
    }
    const out = [];
    for (const e of baseEntities) {
      out.push(e);
      out.push(...(byDex.get(e.dex) ?? []));
    }
    return out;
  }, [baseEntities, megaEntities]);

  const visible = entities.filter((e) => {
    const has = checkedEntities.has(entityKey(e));
    if (view === "collected") return has;
    if (view === "missing") return !has;
    return true;
  });
  const done = entities.filter((e) => checkedEntities.has(entityKey(e))).length;

  // Searching doesn't hide the rest of the grid — it scrolls to and briefly
  // highlights the match so you can keep browsing from there.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setHighlightKey(null);
      return;
    }
    const match = visible.find((e) => e.name.toLowerCase().includes(q));
    if (!match) {
      setHighlightKey(null);
      return;
    }
    const key = entityKey(match);
    setHighlightKey(key);
    tileRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightKey(null), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <>
      <div className="pc-controls">
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      <ProgressBar done={done} total={entities.length} />
      <div className="pc-grid">
        {visible.map((e, i) => {
          const key = entityKey(e);
          return (
            <EntityTile
              key={key}
              ref={(node) => {
                if (node) tileRefs.current.set(key, node);
                else tileRefs.current.delete(key);
              }}
              entity={e}
              index={i}
              checked={checkedEntities.has(key)}
              collected={toCardIdArray(entityCardChoices[key]).length}
              total={cardCounts.get(e.dex)}
              highlighted={highlightKey === key}
              onToggle={onToggleEntity}
              onOpenInfo={(data) => onOpenInfo({ ...data, context: { type: "dex" } })}
            />
          );
        })}
      </div>

      {status === "loading" && <p className="pc-loading">Loading Pokédex…</p>}
      {status === "error" && <p className="pc-error">Couldn't load the Pokédex.</p>}
      {hasMore && status !== "loading" && (
        <button className="pc-load-more" onClick={loadMore}>Load more Pokémon</button>
      )}
    </>
  );
}
