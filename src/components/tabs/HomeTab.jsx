import { Plus, Sparkles } from "lucide-react";
import ListCard from "../ListCard";
import { listProgress } from "../../utils";

const JUMP_TILES = [
  { key: "pokemon", icon: "⚡", title: "By Pokémon", blurb: "Every printing of your favourite" },
  { key: "set", icon: "📦", title: "By Set", blurb: "Complete a set, card by card" },
  { key: "dex", icon: "📕", title: "Pokédex", blurb: "Tick off all 1025 Pokémon" },
];

export default function HomeTab({ lists, checkedCards, checkedEntities, onOpenList, onNewList, onDeleteList, onGoTo }) {
  const listTotal = lists.reduce((sum, l) => sum + listProgress(l, checkedCards).total, 0);
  const listDone = lists.reduce((sum, l) => sum + listProgress(l, checkedCards).done, 0);

  const stats = [
    { value: checkedCards.size, label: checkedCards.size === 1 ? "card collected" : "cards collected", tone: "red" },
    { value: checkedEntities.size, label: checkedEntities.size === 1 ? "Pokémon caught" : "Pokémon caught", tone: "blue" },
    { value: `${listDone}/${listTotal}`, label: lists.length === 1 ? "on 1 list" : `across ${lists.length} lists`, tone: "green" },
  ];

  return (
    <div className="pc-home">
      <section className="pc-hero">
        <div className="pc-hero-copy">
          <h2 className="pc-hero-title">Gotta track 'em all</h2>
          <p className="pc-hero-sub">Your lists, your sets, your Pokédex — all in one place.</p>
        </div>
        <div className="pc-stat-row">
          {stats.map((s) => (
            <div className={`pc-stat pc-stat-${s.tone}`} key={s.label}>
              <span className="pc-stat-value">{s.value}</span>
              <span className="pc-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <h3 className="pc-section-title">⭐ Your lists</h3>
      <div className="pc-lists-grid">
        {lists.map((l) => (
          <ListCard key={l.id} list={l} checkedCards={checkedCards} onOpen={onOpenList} onDelete={onDeleteList} />
        ))}
        <div className="pc-new-list-card" onClick={onNewList}>
          <Plus size={22} />
          New list
        </div>
      </div>

      <h3 className="pc-section-title">🚀 Jump in</h3>
      <div className="pc-jump-grid">
        {JUMP_TILES.map((t) => (
          <button key={t.key} className={`pc-jump-tile pc-jump-${t.key}`} onClick={() => onGoTo(t.key)}>
            <span className="pc-jump-icon" aria-hidden="true">{t.icon}</span>
            <span className="pc-jump-title">{t.title}</span>
            <span className="pc-jump-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <button className="pc-spotlight" onClick={() => onGoTo("set")}>
        <Sparkles size={18} />
        <span>
          <strong>New: 30th Celebration</strong> — 191 anniversary cards just landed. Take a look →
        </span>
      </button>
    </div>
  );
}
