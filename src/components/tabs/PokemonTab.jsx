import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { fetchCardsByName } from "../../api/pokemonTcg";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import CardTile from "../CardTile";
import MissingRow from "../MissingRow";

export default function PokemonTab({ checkedCards, onToggleCard, onOpenInfo }) {
  const [query, setQuery] = useState("Pikachu");
  const [view, setView] = useState("all");
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

  const done = cards.filter((c) => checkedCards.has(c.id)).length;
  const missing = cards.filter((c) => !checkedCards.has(c.id));
  const visible = cards.filter((c) => {
    if (view === "collected") return checkedCards.has(c.id);
    if (view === "missing") return !checkedCards.has(c.id);
    return true;
  });

  return (
    <>
      <div className="pc-controls">
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search a Pokémon name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ViewToggle view={view} setView={setView} />
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
                <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={onToggleCard} onOpenInfo={onOpenInfo} />
              ))}
            </div>
          )}
          {view !== "missing" && cards.length > 0 && (
            <>
              <h2 className="pc-section-title">Still missing</h2>
              {missing.length === 0 ? (
                <p className="pc-missing-empty">You've got them all — nothing left to hunt!</p>
              ) : missing.map((c) => (
                <MissingRow key={c.id} label={`${c.set?.name} · ${c.rarity || "Unknown"}`} sub="Details" onClick={() => onOpenInfo({ card: c })} />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
