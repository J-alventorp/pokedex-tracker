import { useState } from "react";
import { makeEntity } from "./api/pokeApi";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import InfoModal from "./components/InfoModal";
import HomeTab from "./components/tabs/HomeTab";
import PokemonTab from "./components/tabs/PokemonTab";
import SetTab from "./components/tabs/SetTab";
import DexTab from "./components/tabs/DexTab";
import ListsTab from "./components/tabs/ListsTab";

const TABS = [
  { key: "home", label: "Home", icon: "🏠", color: "#E3350D" },
  { key: "pokemon", label: "By Pokémon", icon: "⚡", color: "#F0721C" },
  { key: "set", label: "By Set", icon: "📦", color: "#3B4CCA" },
  { key: "dex", label: "Pokédex", icon: "📕", color: "#C48500" },
  { key: "lists", label: "My Lists", icon: "⭐", color: "#2E8B45" },
];

const SEED_LIST_DEX = [
  { dex: 1, name: "Bulbasaur" },
  { dex: 4, name: "Charmander" },
  { dex: 7, name: "Squirtle" },
  { dex: 25, name: "Pikachu" },
  { dex: 150, name: "Mewtwo" },
  { dex: 151, name: "Mew" },
];

function defaultLists() {
  return [
    {
      id: "l1",
      name: "Kanto Legends",
      entities: SEED_LIST_DEX.map((e) => makeEntity(e.dex, e.name)),
      checked: [],
    },
  ];
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [checkedCards, setCheckedCards] = useLocalStorageState("pc_checkedCards", () => new Set());
  const [checkedEntities, setCheckedEntities] = useLocalStorageState("pc_checkedEntities", () => new Set());
  const [lists, setLists] = useLocalStorageState("pc_lists", defaultLists);
  const [modal, setModal] = useState(null);

  // Lifted out of ListsTab so the home page can jump straight into a list.
  const [activeListId, setActiveListId] = useState(null);
  const [creating, setCreating] = useState(false);

  const toggleCard = (id) => setCheckedCards((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const toggleEntity = (dex) => setCheckedEntities((prev) => {
    const n = new Set(prev);
    if (n.has(dex)) n.delete(dex);
    else n.add(dex);
    return n;
  });

  const openList = (id) => {
    setActiveListId(id);
    setCreating(false);
    setTab("lists");
  };

  const startNewList = () => {
    setActiveListId(null);
    setCreating(true);
    setTab("lists");
  };

  const deleteList = (id) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(null);
  };

  return (
    <div className="pc-root">
      <div className="pc-header">
        <h1 className="pc-title">
          <span className="pc-title-ball" aria-hidden="true" />
          My Card Collection
        </h1>
      </div>
      <p className="pc-tagline">Track it, catch it, complete it!</p>

      <div className="pc-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`pc-tab ${tab === t.key ? "active" : ""}`}
            style={tab === t.key ? { background: t.color, "--tab-color": t.color } : { "--tab-color": t.color }}
            onClick={() => setTab(t.key)}
          >
            <span className="pc-tab-icon" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "home" && (
        <HomeTab
          lists={lists}
          checkedCards={checkedCards}
          checkedEntities={checkedEntities}
          onOpenList={openList}
          onNewList={startNewList}
          onDeleteList={deleteList}
          onGoTo={setTab}
        />
      )}
      {tab === "pokemon" && <PokemonTab checkedCards={checkedCards} onToggleCard={toggleCard} onOpenInfo={setModal} />}
      {tab === "set" && <SetTab checkedCards={checkedCards} onToggleCard={toggleCard} onOpenInfo={setModal} />}
      {tab === "dex" && <DexTab checkedEntities={checkedEntities} onToggleEntity={(entity) => toggleEntity(entity.dex)} onOpenInfo={setModal} />}
      {tab === "lists" && (
        <ListsTab
          lists={lists}
          setLists={setLists}
          onOpenInfo={setModal}
          activeListId={activeListId}
          setActiveListId={setActiveListId}
          creating={creating}
          setCreating={setCreating}
          onDeleteList={deleteList}
        />
      )}

      <InfoModal data={modal} onClose={() => setModal(null)} />
    </div>
  );
}
