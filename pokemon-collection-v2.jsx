import React, { useState, useMemo } from "react";
import { Check, Search, ChevronDown, Info, X, Plus, ArrowLeft, Star, Trash2 } from "lucide-react";

/* ---------------------------- DATA ---------------------------- */

const ENTITIES = [
  { key: "001", dex: 1, name: "Bulbasaur", color: "#6FCB6E", earStyle: "round", tailStyle: "none", extra: "spikes", wings: false },
  { key: "004", dex: 4, name: "Charmander", color: "#FF9A4D", earStyle: "pointy", tailStyle: "flame", extra: "none", wings: false },
  { key: "007", dex: 7, name: "Squirtle", color: "#5EC8E8", earStyle: "round", tailStyle: "curl", extra: "shell", wings: false },
  { key: "025", dex: 25, name: "Pikachu", color: "#FFD93D", earStyle: "pointy", tailStyle: "zigzag", extra: "none", wings: false },
  { key: "094", dex: 94, name: "Gengar", color: "#9B7FD4", earStyle: "pointy", tailStyle: "spike", extra: "none", wings: false },
  { key: "130", dex: 130, name: "Gyarados", color: "#4C6FE0", earStyle: "fin", tailStyle: "wave", extra: "none", wings: false },
  { key: "133", dex: 133, name: "Eevee", color: "#C9A66B", earStyle: "round", tailStyle: "fluffy", extra: "none", wings: false },
  { key: "143", dex: 143, name: "Snorlax", color: "#8FA6C7", earStyle: "none", tailStyle: "none", extra: "belly", wings: false },
  { key: "149", dex: 149, name: "Dragonite", color: "#F4A9A0", earStyle: "long", tailStyle: "wave", extra: "none", wings: true },
  { key: "150", dex: 150, name: "Mewtwo", color: "#B79CD8", earStyle: "long", tailStyle: "curl", extra: "aura", wings: false },
];

const MEGAS = [
  { key: "006-mega", dex: 6, name: "Mega Charizard", color: "#FF5A3C", earStyle: "pointy", tailStyle: "flame", extra: "none", wings: true, isMega: true },
  { key: "130-mega", dex: 130, name: "Mega Gyarados", color: "#2B2B40", earStyle: "fin", tailStyle: "wave", extra: "none", wings: false, isMega: true },
  { key: "150-mega", dex: 150, name: "Mega Mewtwo", color: "#6B4FA0", earStyle: "long", tailStyle: "curl", extra: "aura", wings: false, isMega: true },
];

const ALL_ENTITIES = [...ENTITIES, ...MEGAS];
const byKey = (key) => ALL_ENTITIES.find((e) => e.key === key);

const SETS = ["Forest Guard", "Volcano Rim", "Tide Zone", "Starfall"];
const SET_INFO = {
  "Forest Guard": { year: 2022 },
  "Volcano Rim": { year: 2023 },
  "Tide Zone": { year: 2023 },
  Starfall: { year: 2024 },
};

const RARITY_BY_VARIANT = {
  Normal: "Common",
  "Reverse Holo": "Uncommon",
  Holo: "Rare",
  "Full Art": "Ultra Rare",
};

const RAW_CARDS = [
  ["001", "Forest Guard", "Normal"],
  ["001", "Forest Guard", "Reverse Holo"],
  ["001", "Starfall", "Holo"],
  ["004", "Volcano Rim", "Normal"],
  ["004", "Volcano Rim", "Reverse Holo"],
  ["004", "Starfall", "Holo"],
  ["007", "Tide Zone", "Normal"],
  ["007", "Tide Zone", "Reverse Holo"],
  ["025", "Forest Guard", "Normal"],
  ["025", "Volcano Rim", "Normal"],
  ["025", "Tide Zone", "Normal"],
  ["025", "Starfall", "Holo"],
  ["025", "Starfall", "Full Art"],
  ["133", "Forest Guard", "Normal"],
  ["133", "Forest Guard", "Reverse Holo"],
  ["133", "Volcano Rim", "Normal"],
  ["133", "Tide Zone", "Normal"],
  ["133", "Starfall", "Full Art"],
  ["094", "Forest Guard", "Reverse Holo"],
  ["094", "Starfall", "Holo"],
  ["143", "Forest Guard", "Normal"],
  ["143", "Forest Guard", "Holo"],
  ["149", "Volcano Rim", "Holo"],
  ["149", "Starfall", "Full Art"],
  ["130", "Tide Zone", "Holo"],
  ["130", "Starfall", "Holo"],
  ["150", "Starfall", "Full Art"],
  ["150", "Starfall", "Holo"],
  ["006-mega", "Volcano Rim", "Holo"],
  ["006-mega", "Starfall", "Full Art"],
  ["130-mega", "Tide Zone", "Holo"],
  ["150-mega", "Starfall", "Full Art"],
];

const CARDS = RAW_CARDS.map(([key, set, variant]) => ({
  id: `${key}-${set}-${variant}`.replace(/\s+/g, "_"),
  key,
  set,
  variant,
  rarity: RARITY_BY_VARIANT[variant],
  year: SET_INFO[set].year,
}));

const TABS = [
  { key: "pokemon", label: "By Pokémon", color: "#E3350D" },
  { key: "set", label: "By Set", color: "#3B4CCA" },
  { key: "dex", label: "Pokédex", color: "#E8A400" },
  { key: "lists", label: "My Lists", color: "#3FA34D" },
];

const RARITY_BADGE = { Common: "●", Uncommon: "◆", Rare: "★", "Ultra Rare": "✦" };
const SHAPES = ["blob", "hex", "sticker"];

function getProgressColor(pct) {
  const hue = Math.min(pct, 100) * 1.2;
  return `hsl(${hue}, 78%, 46%)`;
}
function getPepText(pct) {
  if (pct >= 100) return "Collection complete! 🎉";
  if (pct >= 75) return "Almost legendary!";
  if (pct >= 50) return "Halfway there!";
  if (pct >= 25) return "Nice start!";
  return "Let's catch 'em all!";
}

/* ------------------------- CREATURE ICON ------------------------- */

function Creature({ entity, size = 64 }) {
  const { color, earStyle, tailStyle, extra, wings } = entity;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {extra === "aura" && (
        <circle cx="50" cy="55" r="44" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="3" strokeDasharray="6 5" />
      )}
      {wings && (
        <>
          <path d="M22 50 Q2 40 8 62 Q20 66 30 56 Z" fill={color} opacity="0.85" />
          <path d="M78 50 Q98 40 92 62 Q80 66 70 56 Z" fill={color} opacity="0.85" />
        </>
      )}
      {tailStyle === "flame" && <path d="M76 66 Q94 58 88 78 Q80 92 72 78 Q70 70 76 66 Z" fill={color} />}
      {tailStyle === "curl" && <path d="M76 68 Q94 66 92 82 Q88 92 78 84" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />}
      {tailStyle === "zigzag" && <polyline points="78,64 92,70 80,76 94,84" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />}
      {tailStyle === "wave" && <path d="M78 66 Q88 60 92 68 Q96 76 90 80 Q98 84 94 92" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />}
      {tailStyle === "fluffy" && (
        <>
          <circle cx="82" cy="70" r="7" fill={color} />
          <circle cx="92" cy="76" r="6" fill={color} />
          <circle cx="88" cy="86" r="5" fill={color} />
        </>
      )}
      {tailStyle === "spike" && <polygon points="76,66 96,72 78,80" fill={color} />}

      <ellipse cx="50" cy={extra === "belly" ? 60 : 58} rx={extra === "belly" ? 36 : 28} ry={extra === "belly" ? 30 : 25} fill={color} stroke="#00000020" strokeWidth="2" />

      {extra === "shell" && <path d="M28 46 Q50 26 72 46 Q50 40 28 46 Z" fill="#00000022" />}
      {extra === "spikes" && (
        <>
          <polygon points="36,36 42,24 46,36" fill={color} />
          <polygon points="48,32 54,20 58,32" fill={color} />
          <polygon points="58,36 64,24 68,36" fill={color} />
        </>
      )}

      {earStyle === "round" && (
        <>
          <circle cx="32" cy="30" r="10" fill={color} />
          <circle cx="68" cy="30" r="10" fill={color} />
        </>
      )}
      {earStyle === "pointy" && (
        <>
          <polygon points="24,34 32,10 42,32" fill={color} />
          <polygon points="76,34 68,10 58,32" fill={color} />
        </>
      )}
      {earStyle === "fin" && <polygon points="50,6 36,34 64,34" fill={color} />}
      {earStyle === "long" && (
        <>
          <ellipse cx="35" cy="16" rx="7" ry="20" fill={color} transform="rotate(-12 35 16)" />
          <ellipse cx="65" cy="16" rx="7" ry="20" fill={color} transform="rotate(12 65 16)" />
        </>
      )}

      <circle cx="40" cy="55" r="6.5" fill="#fff" />
      <circle cx="60" cy="55" r="6.5" fill="#fff" />
      <circle cx="41.5" cy="56" r="3" fill="#222" />
      <circle cx="61.5" cy="56" r="3" fill="#222" />
      <path d="M44 68 Q50 73 56 68" fill="none" stroke="#00000055" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ UI BITS ------------------------------ */

function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="pc-progress-wrap">
      <div className="pc-progress-track">
        <div className="pc-progress-fill" style={{ width: `${pct}%`, background: getProgressColor(pct) }}>
          <span className="pc-progress-ball">●</span>
        </div>
      </div>
      <div className="pc-progress-meta">
        <span className="pc-progress-count">{done}/{total} · {pct}%</span>
        <span className="pc-progress-pep">{getPepText(pct)}</span>
      </div>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  return (
    <div className="pc-toggle">
      {["all", "collected", "missing"].map((v) => (
        <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
          {v === "all" ? "All" : v === "collected" ? "Collected" : "Missing"}
        </button>
      ))}
    </div>
  );
}

function InfoModal({ data, onClose }) {
  if (!data) return null;
  const { entity, card } = data;
  const relatedCards = CARDS.filter((c) => c.key === entity.key);
  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pc-modal-close" onClick={onClose}><X size={18} /></button>
        <div className="pc-modal-head">
          <div className="pc-modal-icon" style={{ background: entity.color + "33" }}>
            <Creature entity={entity} size={72} />
          </div>
          <div>
            <div className="pc-modal-dex">#{entity.dex.toString().padStart(3, "0")}{entity.isMega ? " · Mega" : ""}</div>
            <h3 className="pc-modal-name">{entity.name}</h3>
          </div>
        </div>

        {card ? (
          <div className="pc-modal-body">
            <div className="pc-modal-row"><span>Set</span><strong>{card.set}</strong></div>
            <div className="pc-modal-row"><span>Variant</span><strong>{card.variant}</strong></div>
            <div className="pc-modal-row"><span>Rarity</span><strong>{RARITY_BADGE[card.rarity]} {card.rarity}</strong></div>
            <div className="pc-modal-row"><span>Release year</span><strong>{card.year}</strong></div>
          </div>
        ) : (
          <div className="pc-modal-body">
            <p className="pc-modal-hint">All known printings of {entity.name}:</p>
            {relatedCards.length === 0 && <p className="pc-modal-hint">No cards logged yet for this one.</p>}
            {relatedCards.map((c) => (
              <div className="pc-modal-row" key={c.id}>
                <span>{c.set} · {c.year}</span>
                <strong>{RARITY_BADGE[c.rarity]} {c.variant}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntityTile({ entity, checked, onToggle, onOpenInfo, index }) {
  const shape = SHAPES[index % SHAPES.length];
  const rotate = index % 2 === 0 ? "-1.2deg" : "1deg";
  return (
    <div className={`pc-etile pc-shape-${shape} ${checked ? "checked" : ""}`} style={{ transform: `rotate(${rotate})` }} onClick={() => onOpenInfo({ entity })}>
      <button className="pc-check" onClick={(e) => { e.stopPropagation(); onToggle(entity.key); }}>
        {checked && <Check size={14} />}
      </button>
      <div className="pc-etile-icon" style={{ background: entity.color + "2A" }}>
        <Creature entity={entity} size={54} />
      </div>
      <div className="pc-etile-dex">#{entity.dex.toString().padStart(3, "0")}</div>
      <div className="pc-etile-name">{entity.name}</div>
    </div>
  );
}

function CardTile({ card, checked, onToggle, onOpenInfo, index }) {
  const entity = byKey(card.key);
  const rotate = index % 2 === 0 ? "-1deg" : "1.2deg";
  const holo = card.variant === "Holo" || card.variant === "Full Art";
  return (
    <div className={`pc-ctile ${checked ? "checked" : ""} ${holo ? "holo" : ""}`} style={{ transform: `rotate(${rotate})`, background: `linear-gradient(160deg, ${entity.color}55, ${entity.color}15)` }} onClick={() => onOpenInfo({ entity, card })}>
      <button className="pc-check" onClick={(e) => { e.stopPropagation(); onToggle(card.id); }}>
        {checked && <Check size={14} />}
      </button>
      <span className="pc-rarity-badge">{RARITY_BADGE[card.rarity]}</span>
      <div className="pc-ctile-icon">
        <Creature entity={entity} size={60} />
      </div>
      <div className="pc-ctile-name">{entity.name}</div>
      <div className="pc-ctile-meta">{card.set} · {card.variant}</div>
    </div>
  );
}

function MissingRow({ label, sub, onClick }) {
  return (
    <button className="pc-missing-row" onClick={onClick}>
      <span className="pc-missing-label">{label}</span>
      <span className="pc-missing-sub"><Info size={13} /> {sub}</span>
    </button>
  );
}

/* -------------------------------- APP -------------------------------- */

export default function App() {
  const [tab, setTab] = useState("pokemon");
  const [view, setView] = useState("all");
  const [selectedKey, setSelectedKey] = useState("025");
  const [selectedSet, setSelectedSet] = useState("Forest Guard");
  const [query, setQuery] = useState("");
  const [checkedCards, setCheckedCards] = useState(new Set());
  const [checkedEntities, setCheckedEntities] = useState(new Set());
  const [modal, setModal] = useState(null);

  const [lists, setLists] = useState([
    { id: "l1", name: "Dex + Mega Squad", keys: ENTITIES.slice(0, 6).map((e) => e.key).concat(MEGAS.map((m) => m.key)), checked: [] },
  ]);
  const [activeListId, setActiveListId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListKeys, setNewListKeys] = useState(new Set());

  const toggleCard = (id) => setCheckedCards((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleEntity = (key) => setCheckedEntities((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleListItem = (listId, key) => setLists((prev) => prev.map((l) => {
    if (l.id !== listId) return l;
    const has = l.checked.includes(key);
    return { ...l, checked: has ? l.checked.filter((k) => k !== key) : [...l.checked, key] };
  }));

  const activeList = lists.find((l) => l.id === activeListId);

  const pokemonCards = useMemo(() => CARDS.filter((c) => c.key === selectedKey), [selectedKey]);
  const setCards = useMemo(() => CARDS.filter((c) => c.set === selectedSet), [selectedSet]);

  const applyFilters = (items, isChecked, getName) => items.filter((item) => {
    if (!getName(item).toLowerCase().includes(query.toLowerCase())) return false;
    if (view === "collected") return isChecked(item);
    if (view === "missing") return !isChecked(item);
    return true;
  });

  const selectedEntity = byKey(selectedKey);

  const createList = () => {
    if (!newListName.trim() || newListKeys.size === 0) return;
    const id = `l${Date.now()}`;
    setLists((prev) => [...prev, { id, name: newListName.trim(), keys: [...newListKeys], checked: [] }]);
    setNewListName("");
    setNewListKeys(new Set());
    setCreating(false);
    setActiveListId(id);
  };

  const deleteList = (id) => { setLists((prev) => prev.filter((l) => l.id !== id)); if (activeListId === id) setActiveListId(null); };

  return (
    <div className="pc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .pc-root {
          --red: #E3350D; --red-dark: #B22B0A; --yellow: #FFCB05; --blue: #3B4CCA;
          --green: #3FA34D; --cream: #FFF8ED; --ink: #2B2B2B; --sub: #7A7264;
          --line: #F0DCB8;
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          min-height: 640px;
          padding: 24px 28px 40px;
          border: 1px solid #eee;
          position: relative;
        }
        .pc-header { display:flex; align-items:baseline; gap:10px; margin-bottom:4px; }
        .pc-title { font-family:'Baloo 2', sans-serif; font-size:26px; font-weight:800; color: var(--red); margin:0; }
        .pc-tagline { color: var(--sub); font-size:13.5px; margin:0 0 18px 0; }

        .pc-tabs { display:flex; gap:8px; margin-bottom:22px; flex-wrap:wrap; }
        .pc-tab {
          font-family:'Baloo 2', sans-serif; font-weight:700; font-size:14px;
          padding:9px 18px; border-radius:999px; border:2px solid transparent;
          cursor:pointer; background:#fff; color: var(--ink); opacity:0.65;
        }
        .pc-tab.active { opacity:1; color:#fff; border-color: transparent; }

        .pc-controls { display:flex; gap:10px; align-items:center; margin-bottom:18px; flex-wrap:wrap; }
        .pc-select-wrap { position:relative; }
        .pc-select {
          appearance:none; font-family:'Inter'; font-weight:600; font-size:14px;
          background:#fff; border:2px solid var(--line); border-radius:12px;
          padding:9px 34px 9px 14px; cursor:pointer; color: var(--ink);
        }
        .pc-select-icon { position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--red); }
        .pc-search { display:flex; align-items:center; gap:6px; background:#fff; border:2px solid var(--line); border-radius:12px; padding:8px 14px; flex:1; min-width:160px; }
        .pc-search input { border:none; outline:none; background:transparent; font-family:'Inter'; font-size:14px; width:100%; }
        .pc-toggle { display:flex; border-radius:999px; overflow:hidden; border:2px solid var(--line); }
        .pc-toggle button { border:none; background:#fff; padding:8px 16px; font-family:'Inter'; font-weight:600; font-size:13px; cursor:pointer; color:var(--ink); }
        .pc-toggle button.active { background: var(--red); color:#fff; }

        .pc-progress-wrap { margin-bottom:26px; }
        .pc-progress-track { height:20px; background:#fff; border:2px solid var(--line); border-radius:999px; overflow:hidden; position:relative; }
        .pc-progress-fill { height:100%; border-radius:999px; transition: width 0.4s ease; display:flex; align-items:center; justify-content:flex-end; position:relative; }
        .pc-progress-ball { color:#fff; font-size:10px; margin-right:6px; filter:drop-shadow(0 0 2px rgba(0,0,0,.3)); }
        .pc-progress-meta { display:flex; justify-content:space-between; margin-top:6px; font-family:'Inter'; }
        .pc-progress-count { font-weight:700; font-size:13.5px; }
        .pc-progress-pep { font-weight:600; font-size:13px; color: var(--red); }

        .pc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px,1fr)); gap:20px 16px; margin-bottom:30px; }

        .pc-etile {
          position:relative; background:#fff; border:2px solid var(--line); padding:16px 10px 12px;
          text-align:center; cursor:pointer; transition: transform 0.12s ease;
        }
        .pc-etile:hover { transform: scale(1.04) !important; }
        .pc-shape-blob { border-radius: 42% 58% 55% 45% / 50% 42% 58% 50%; }
        .pc-shape-hex { clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%); border-radius:8px; padding-top:22px; }
        .pc-shape-sticker { border-radius: 22px; clip-path: polygon(0 0, 88% 0, 100% 18%, 100% 100%, 0 100%); }
        .pc-etile.checked { background: #EAF7EC; border-color: var(--green); }
        .pc-etile-icon { display:flex; justify-content:center; margin-bottom:6px; }
        .pc-etile-dex { font-size:11px; color:var(--sub); font-weight:600; }
        .pc-etile-name { font-family:'Baloo 2', sans-serif; font-size:14.5px; font-weight:700; }

        .pc-ctile {
          position:relative; border:2px solid var(--line); border-radius:16px; padding:14px 10px 10px;
          text-align:center; cursor:pointer; aspect-ratio: 3/4.2; display:flex; flex-direction:column; justify-content:flex-end;
        }
        .pc-ctile:hover { transform: scale(1.04); }
        .pc-ctile.checked { border-color: var(--green); box-shadow: 0 0 0 3px #3FA34D22; }
        .pc-ctile.holo::before {
          content:""; position:absolute; inset:0; border-radius:14px;
          background: linear-gradient(120deg, transparent 30%, #ffffffaa 45%, transparent 60%);
          pointer-events:none;
        }
        .pc-ctile-icon { display:flex; justify-content:center; margin-bottom:8px; }
        .pc-ctile-name { font-family:'Baloo 2', sans-serif; font-weight:700; font-size:14px; }
        .pc-ctile-meta { font-size:11px; color: var(--sub); margin-top:2px; }
        .pc-rarity-badge { position:absolute; top:8px; left:10px; font-size:13px; color: var(--yellow); text-shadow: 0 0 2px #0003; }

        .pc-check {
          position:absolute; top:8px; right:8px; width:24px; height:24px; border-radius:50%;
          border:2px solid var(--green); background:#fff; display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:#fff;
        }
        .pc-etile.checked .pc-check, .pc-ctile.checked .pc-check { background: var(--green); }

        .pc-section-title { font-family:'Baloo 2', sans-serif; font-size:18px; font-weight:700; margin: 0 0 10px 0; }
        .pc-missing-empty { color: var(--sub); font-style:italic; font-size:14px; }
        .pc-missing-row {
          width:100%; display:flex; justify-content:space-between; align-items:center;
          background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px 14px;
          margin-bottom:8px; cursor:pointer; font-family:'Inter'; text-align:left;
        }
        .pc-missing-label { font-weight:600; }
        .pc-missing-sub { display:flex; align-items:center; gap:5px; font-size:12px; color: var(--blue); font-weight:600; }

        .pc-modal-overlay { position:fixed; inset:0; background:rgba(20,15,5,0.45); display:flex; align-items:center; justify-content:center; z-index:50; }
        .pc-modal { background:#fff; border-radius:20px; padding:24px; width:320px; max-width:90%; position:relative; }
        .pc-modal-close { position:absolute; top:12px; right:12px; border:none; background:#F3EEE1; border-radius:50%; width:28px; height:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .pc-modal-head { display:flex; gap:14px; align-items:center; margin-bottom:16px; }
        .pc-modal-icon { border-radius:16px; padding:8px; }
        .pc-modal-dex { font-size:11px; color:var(--sub); font-weight:700; }
        .pc-modal-name { font-family:'Baloo 2', sans-serif; margin:2px 0 0; font-size:19px; }
        .pc-modal-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #F0EAD8; font-size:13.5px; }
        .pc-modal-hint { font-size:13px; color:var(--sub); margin: 4px 0 8px; }

        .pc-lists-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:16px; }
        .pc-list-card { background:#fff; border:2px solid var(--line); border-radius:16px; padding:16px; cursor:pointer; position:relative; }
        .pc-list-card:hover { border-color: var(--green); }
        .pc-list-name { font-family:'Baloo 2', sans-serif; font-weight:700; font-size:15.5px; margin-bottom:6px; }
        .pc-list-count { font-size:12px; color:var(--sub); margin-bottom:10px; }
        .pc-list-del { position:absolute; top:10px; right:10px; border:none; background:transparent; color:#C99; cursor:pointer; }
        .pc-new-list-card {
          border:2px dashed var(--line); border-radius:16px; display:flex; align-items:center; justify-content:center;
          flex-direction:column; gap:6px; cursor:pointer; color: var(--sub); font-weight:600; min-height:110px;
        }
        .pc-new-list-card:hover { border-color: var(--green); color: var(--green); }
        .pc-back-btn { display:flex; align-items:center; gap:6px; background:none; border:none; font-weight:700; color:var(--red); cursor:pointer; margin-bottom:14px; font-family:'Inter'; }

        .pc-create-panel { background:#fff; border:2px solid var(--line); border-radius:16px; padding:20px; }
        .pc-create-panel input[type=text] {
          width:100%; padding:10px 12px; border-radius:10px; border:2px solid var(--line); font-family:'Inter'; font-size:14px; margin-bottom:14px; outline:none;
        }
        .pc-pick-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(120px,1fr)); gap:8px; max-height:220px; overflow-y:auto; margin-bottom:16px; }
        .pc-pick-item { display:flex; align-items:center; gap:8px; border:2px solid var(--line); border-radius:10px; padding:6px 8px; cursor:pointer; font-size:13px; font-weight:600; }
        .pc-pick-item.on { border-color: var(--green); background:#EAF7EC; }
        .pc-btn-primary { background: var(--red); color:#fff; border:none; border-radius:999px; padding:10px 20px; font-weight:700; font-family:'Baloo 2'; cursor:pointer; }
        .pc-btn-ghost { background:none; border:none; color:var(--sub); font-weight:600; cursor:pointer; margin-left:10px; }
      `}</style>

      <div className="pc-header">
        <h1 className="pc-title">🎴 My Card Collection</h1>
      </div>
      <p className="pc-tagline">Track it, catch it, complete it!</p>

      <div className="pc-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`pc-tab ${tab === t.key ? "active" : ""}`} style={tab === t.key ? { background: t.color } : {}} onClick={() => { setTab(t.key); setActiveListId(null); setView("all"); setQuery(""); }}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "pokemon" || tab === "set" || tab === "dex") && (
        <>
          <div className="pc-controls">
            {tab === "pokemon" && (
              <div className="pc-select-wrap">
                <select className="pc-select" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                  {ALL_ENTITIES.map((e) => <option key={e.key} value={e.key}>#{e.dex.toString().padStart(3,"0")} {e.name}</option>)}
                </select>
                <ChevronDown className="pc-select-icon" size={15} />
              </div>
            )}
            {tab === "set" && (
              <div className="pc-select-wrap">
                <select className="pc-select" value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
                  {SETS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pc-select-icon" size={15} />
              </div>
            )}
            <div className="pc-search">
              <Search size={15} color="#7A7264" />
              <input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <ViewToggle view={view} setView={setView} />
          </div>

          {tab === "pokemon" && (() => {
            const items = applyFilters(pokemonCards, (c) => checkedCards.has(c.id), (c) => selectedEntity.name);
            const done = pokemonCards.filter((c) => checkedCards.has(c.id)).length;
            return (
              <>
                <ProgressBar done={done} total={pokemonCards.length} />
                <div className="pc-grid">
                  {items.map((c, i) => <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={toggleCard} onOpenInfo={setModal} />)}
                </div>
                {view !== "missing" && (
                  <>
                    <h2 className="pc-section-title">Still missing</h2>
                    {pokemonCards.filter((c) => !checkedCards.has(c.id)).length === 0 ? (
                      <p className="pc-missing-empty">You've got them all — nothing left to hunt!</p>
                    ) : pokemonCards.filter((c) => !checkedCards.has(c.id)).map((c) => (
                      <MissingRow key={c.id} label={`${c.variant} · ${c.set}`} sub="Details" onClick={() => setModal({ entity: selectedEntity, card: c })} />
                    ))}
                  </>
                )}
              </>
            );
          })()}

          {tab === "set" && (() => {
            const items = applyFilters(setCards, (c) => checkedCards.has(c.id), (c) => byKey(c.key).name);
            const done = setCards.filter((c) => checkedCards.has(c.id)).length;
            return (
              <>
                <ProgressBar done={done} total={setCards.length} />
                <div className="pc-grid">
                  {items.map((c, i) => <CardTile key={c.id} card={c} index={i} checked={checkedCards.has(c.id)} onToggle={toggleCard} onOpenInfo={setModal} />)}
                </div>
                {view !== "missing" && (
                  <>
                    <h2 className="pc-section-title">Still missing</h2>
                    {setCards.filter((c) => !checkedCards.has(c.id)).length === 0 ? (
                      <p className="pc-missing-empty">Set complete — nice work!</p>
                    ) : setCards.filter((c) => !checkedCards.has(c.id)).map((c) => (
                      <MissingRow key={c.id} label={`${byKey(c.key).name} · ${c.variant}`} sub="Details" onClick={() => setModal({ entity: byKey(c.key), card: c })} />
                    ))}
                  </>
                )}
              </>
            );
          })()}

          {tab === "dex" && (() => {
            const items = applyFilters(ENTITIES, (e) => checkedEntities.has(e.key), (e) => e.name);
            const done = ENTITIES.filter((e) => checkedEntities.has(e.key)).length;
            return (
              <>
                <ProgressBar done={done} total={ENTITIES.length} />
                <div className="pc-grid">
                  {items.map((e, i) => <EntityTile key={e.key} entity={e} index={i} checked={checkedEntities.has(e.key)} onToggle={toggleEntity} onOpenInfo={setModal} />)}
                </div>
                {view !== "missing" && (
                  <>
                    <h2 className="pc-section-title">Still missing</h2>
                    {ENTITIES.filter((e) => !checkedEntities.has(e.key)).length === 0 ? (
                      <p className="pc-missing-empty">Full Pokédex — legendary effort!</p>
                    ) : ENTITIES.filter((e) => !checkedEntities.has(e.key)).map((e) => {
                      const foundIn = [...new Set(CARDS.filter((c) => c.key === e.key).map((c) => c.set))];
                      return <MissingRow key={e.key} label={e.name} sub={`Found in ${foundIn.length} set${foundIn.length===1?"":"s"}`} onClick={() => setModal({ entity: e })} />;
                    })}
                  </>
                )}
              </>
            );
          })()}
        </>
      )}

      {tab === "lists" && !activeList && !creating && (
        <div className="pc-lists-grid">
          {lists.map((l) => {
            const done = l.checked.length;
            const total = l.keys.length;
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
      )}

      {tab === "lists" && creating && (
        <div className="pc-create-panel">
          <button className="pc-back-btn" onClick={() => setCreating(false)}><ArrowLeft size={16} /> Back</button>
          <input type="text" placeholder="Name your list, e.g. Dex + Mega Squad" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
          <p className="pc-modal-hint">Pick which Pokémon belong in this list:</p>
          <div className="pc-pick-grid">
            {ALL_ENTITIES.map((e) => {
              const on = newListKeys.has(e.key);
              return (
                <div key={e.key} className={`pc-pick-item ${on ? "on" : ""}`} onClick={() => setNewListKeys((prev) => { const n = new Set(prev); n.has(e.key) ? n.delete(e.key) : n.add(e.key); return n; })}>
                  {on ? <Check size={14} /> : <Plus size={14} />} {e.name}
                </div>
              );
            })}
          </div>
          <button className="pc-btn-primary" onClick={createList}>Save list</button>
          <button className="pc-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      )}

      {tab === "lists" && activeList && (() => {
        const items = applyFilters(activeList.keys.map(byKey), (e) => activeList.checked.includes(e.key), (e) => e.name);
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
            <ProgressBar done={done} total={activeList.keys.length} />
            <div className="pc-grid">
              {items.map((e, i) => <EntityTile key={e.key} entity={e} index={i} checked={activeList.checked.includes(e.key)} onToggle={(k) => toggleListItem(activeList.id, k)} onOpenInfo={setModal} />)}
            </div>
            {view !== "missing" && (
              <>
                <h2 className="pc-section-title">Still missing</h2>
                {activeList.keys.filter((k) => !activeList.checked.includes(k)).length === 0 ? (
                  <p className="pc-missing-empty">List complete — start another one!</p>
                ) : activeList.keys.filter((k) => !activeList.checked.includes(k)).map((k) => {
                  const e = byKey(k);
                  return <MissingRow key={k} label={e.name} sub="Details" onClick={() => setModal({ entity: e })} />;
                })}
              </>
            )}
          </>
        );
      })()}

      <InfoModal data={modal} onClose={() => setModal(null)} />
    </div>
  );
}
