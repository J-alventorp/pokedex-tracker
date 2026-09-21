import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { usePokedexEntities } from "../../hooks/usePokedexEntities";
import { useCardCountsByDex } from "../../hooks/useCardCountsByDex";
import { toCardIdArray } from "../../utils";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import EntityTile from "../EntityTile";

export default function DexTab({ checkedEntities, entityCardChoices, onToggleEntity, onOpenInfo }) {
  const { entities, status, loadMore, hasMore } = usePokedexEntities();
  const cardCounts = useCardCountsByDex();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [highlightDex, setHighlightDex] = useState(null);
  const tileRefs = useRef(new Map());

  const visible = entities.filter((e) => {
    if (view === "collected") return checkedEntities.has(e.dex);
    if (view === "missing") return !checkedEntities.has(e.dex);
    return true;
  });
  const done = entities.filter((e) => checkedEntities.has(e.dex)).length;

  // Searching doesn't hide the rest of the grid — it scrolls to and briefly
  // highlights the match so you can keep browsing from there.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setHighlightDex(null);
      return;
    }
    const match = visible.find((e) => e.name.toLowerCase().includes(q));
    if (!match) {
      setHighlightDex(null);
      return;
    }
    setHighlightDex(match.dex);
    tileRefs.current.get(match.dex)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightDex(null), 1500);
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
        {visible.map((e, i) => (
          <EntityTile
            key={e.dex}
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
            onOpenInfo={(data) => onOpenInfo({ ...data, context: { type: "dex" } })}
          />
        ))}
      </div>

      {status === "loading" && <p className="pc-loading">Loading Pokédex…</p>}
      {status === "error" && <p className="pc-error">Couldn't load the Pokédex.</p>}
      {hasMore && status !== "loading" && (
        <button className="pc-load-more" onClick={loadMore}>Load more Pokémon</button>
      )}
    </>
  );
}
