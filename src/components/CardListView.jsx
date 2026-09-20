import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import { fetchCardsByIds } from "../api/pokemonTcg";
import { rarityRank } from "../utils";
import ProgressBar from "./ProgressBar";
import ViewToggle from "./ViewToggle";
import CardTile from "./CardTile";

// An auto-created list of one Pokémon's cards. Checked state comes straight
// from the global checkedCards set, so ticking here and in "By Pokémon" are
// the same action.
export default function CardListView({ list, checkedCards, onToggleCard, onOpenInfo, onBack }) {
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("year");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchCardsByIds(list.cardIds ?? [])
      .then((data) => {
        if (!cancelled) {
          setCards(data);
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, [list.cardIds]);

  const done = cards.filter((c) => checkedCards.has(c.id)).length;
  const visible = cards
    .filter((c) => {
      if (query && !`${c.name} ${c.set?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (view === "collected") return checkedCards.has(c.id);
      if (view === "missing") return !checkedCards.has(c.id);
      return true;
    })
    .sort((a, b) => {
      if (sort === "rarity") return rarityRank(b.rarity) - rarityRank(a.rarity);
      if (sort === "name") return a.name.localeCompare(b.name);
      return (b.set?.releaseDate || "").localeCompare(a.set?.releaseDate || "");
    });

  return (
    <>
      <button className="pc-back-btn" onClick={onBack}><ArrowLeft size={16} /> All lists</button>
      <h2 className="pc-section-title">{list.name}</h2>
      <div className="pc-controls">
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search card or set…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="pc-select-wrap">
          <select className="pc-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="year">Sort: Year</option>
            <option value="name">Sort: Name</option>
            <option value="rarity">Sort: Rarity</option>
          </select>
          <ChevronDown className="pc-select-icon" size={15} />
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      {status === "loading" && <p className="pc-loading">Loading {list.name}'s cards…</p>}
      {status === "error" && <p className="pc-error">Couldn't load the cards on this list.</p>}

      {status === "done" && (
        <>
          <ProgressBar done={done} total={cards.length} />
          {visible.length === 0 ? (
            <p className="pc-missing-empty">No cards match that.</p>
          ) : (
            <div className="pc-grid">
              {visible.map((c, i) => (
                <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={onToggleCard} onOpenInfo={onOpenInfo} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
