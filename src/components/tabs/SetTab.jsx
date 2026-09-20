import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { fetchCardsBySet, fetchSets } from "../../api/pokemonTcg";
import { rarityRank } from "../../utils";
import ProgressBar from "../ProgressBar";
import ViewToggle from "../ViewToggle";
import CardTile from "../CardTile";

export default function SetTab({ checkedCards, onToggleCard, onOpenInfo }) {
  const [sets, setSets] = useState([]);
  const [setsStatus, setSetsStatus] = useState("loading");
  const [selectedSetId, setSelectedSetId] = useState("");
  const [cards, setCards] = useState([]);
  const [cardsStatus, setCardsStatus] = useState("idle");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("rarity");

  useEffect(() => {
    fetchSets()
      .then((data) => {
        setSets(data);
        setSetsStatus("done");
        if (data.length) setSelectedSetId(data[data.length - 1].id);
      })
      .catch(() => setSetsStatus("error"));
  }, []);

  useEffect(() => {
    if (!selectedSetId) return;
    let cancelled = false;
    setCardsStatus("loading");
    fetchCardsBySet(selectedSetId)
      .then((data) => {
        if (!cancelled) {
          setCards(data);
          setCardsStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setCardsStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSetId]);

  const filtered = cards.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const visible = filtered
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
  const done = cards.filter((c) => checkedCards.has(c.id)).length;

  return (
    <>
      <div className="pc-controls">
        <div className="pc-select-wrap">
          <select className="pc-select" value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)} disabled={setsStatus !== "done"}>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.series})</option>)}
          </select>
          <ChevronDown className="pc-select-icon" size={15} />
        </div>
        <div className="pc-search">
          <Search size={15} color="#7A7264" />
          <input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="pc-select-wrap">
          <select className="pc-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rarity">Sort: Rarity</option>
            <option value="name">Sort: Name</option>
            <option value="year">Sort: Year</option>
          </select>
          <ChevronDown className="pc-select-icon" size={15} />
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      {setsStatus === "error" && <p className="pc-error">Couldn't load card sets.</p>}
      {cardsStatus === "loading" && <p className="pc-loading">Loading set…</p>}
      {cardsStatus === "error" && <p className="pc-error">Couldn't load this set's cards.</p>}

      {cardsStatus === "done" && (
        <>
          <ProgressBar done={done} total={cards.length} />
          <div className="pc-grid">
            {visible.map((c, i) => <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={onToggleCard} onOpenInfo={onOpenInfo} />)}
          </div>
        </>
      )}
    </>
  );
}
