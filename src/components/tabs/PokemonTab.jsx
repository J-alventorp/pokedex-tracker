import { useEffect, useState } from "react";
import { BookmarkPlus, ChevronDown, Search } from "lucide-react";
import { fetchCardsByName } from "../../api/pokemonTcg";
import { rarityRank } from "../../utils";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import CardTile from "../CardTile";
import { AUTO_LIST_THRESHOLD, countTickedForDex } from "../../autoList";

export default function PokemonTab({ checkedCards, onToggleCard, onOpenInfo, onAutoListCandidate }) {
  const [query, setQuery] = useState("Pikachu");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("name");
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setCards([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const timer = setTimeout(() => {
      fetchCardsByName(term)
        .then((data) => {
          if (!cancelled) {
            setCards(data);
            setStatus("done");
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Ticking a third card of one Pokémon starts a list for it. This lives in
  // the handler rather than an effect on purpose: an effect would spawn lists
  // just from searching a name you had already ticked cards for.
  const handleToggle = (id) => {
    const card = cards.find((c) => c.id === id);
    const wasChecked = checkedCards.has(id);
    onToggleCard(id);
    if (!card || wasChecked) return;
    for (const dex of card.nationalPokedexNumbers ?? []) {
      if (countTickedForDex(cards, checkedCards, dex) + 1 >= AUTO_LIST_THRESHOLD) onAutoListCandidate?.(dex);
    }
  };

  // Only the first pokedex number on each card — a tag-team/GX card like
  // "Pikachu & Zekrom-GX" lists both, and Zekrom is not what "save as list"
  // for a Pikachu search should create. The searched name can still span more
  // than one dex (e.g. "Pikachu" and "Pikachu V" if both matched), so it's a
  // set, not a single value.
  const searchedDexes = [...new Set(cards.map((c) => c.nationalPokedexNumbers?.[0]).filter(Boolean))];

  const handleSaveAsList = () => {
    for (const dex of searchedDexes) onAutoListCandidate?.(dex, { force: true });
  };

  const done = cards.filter((c) => checkedCards.has(c.id)).length;
  const visible = cards
    .filter((c) => {
      if (view === "collected") return checkedCards.has(c.id);
      if (view === "missing") return !checkedCards.has(c.id);
      return true;
    })
    .sort((a, b) => {
      if (sort === "rarity") return rarityRank(b.rarity) - rarityRank(a.rarity);
      if (sort === "year") return (b.set?.releaseDate || "").localeCompare(a.set?.releaseDate || "");
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <div className="pc-controls">
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search a Pokémon name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="pc-select-wrap">
          <select className="pc-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="rarity">Sort: Rarity</option>
            <option value="year">Sort: Year</option>
          </select>
          <ChevronDown className="pc-select-icon" size={15} />
        </div>
        <ViewToggle view={view} setView={setView} />
        <button
          type="button"
          className="pc-save-list-btn"
          onClick={handleSaveAsList}
          disabled={searchedDexes.length === 0}
        >
          <BookmarkPlus size={15} /> Save as list
        </button>
      </div>

      {status === "loading" && <p className="pc-loading">Searching the Pokémon TCG…</p>}
      {status === "error" && <p className="pc-error">Couldn't reach the Pokémon TCG API. Try again in a moment.</p>}
      {status === "idle" && <p className="pc-missing-empty">Type a Pokémon name to find its cards.</p>}

      {status === "done" && (
        <>
          <ProgressBar done={done} total={cards.length} />
          {cards.length === 0 ? (
            <p className="pc-missing-empty">No cards found for "{query}".</p>
          ) : (
            <div className="pc-grid">
              {visible.map((c, i) => (
                <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={handleToggle} onOpenInfo={onOpenInfo} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
