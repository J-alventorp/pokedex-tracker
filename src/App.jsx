import { useState } from "react";
import { spriteUrl } from "./api/pokeApi";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import InfoModal from "./components/InfoModal";
import PokemonTab from "./components/tabs/PokemonTab";
import SetTab from "./components/tabs/SetTab";
import DexTab from "./components/tabs/DexTab";
import ListsTab from "./components/tabs/ListsTab";

const TABS = [
  { key: "pokemon", label: "By Pokémon", color: "#E3350D" },
  { key: "set", label: "By Set", color: "#3B4CCA" },
  { key: "dex", label: "Pokédex", color: "#E8A400" },
  { key: "lists", label: "My Lists", color: "#3FA34D" },
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
      entities: SEED_LIST_DEX.map((e) => ({ ...e, sprite: spriteUrl(e.dex) })),
      checked: [],
    },
  ];
}

export default function App() {
  const [tab, setTab] = useState("pokemon");
  const [checkedCards, setCheckedCards] = useLocalStorageState("pc_checkedCards", () => new Set());
  const [checkedEntities, setCheckedEntities] = useLocalStorageState("pc_checkedEntities", () => new Set());
  const [lists, setLists] = useLocalStorageState("pc_lists", defaultLists);
  const [modal, setModal] = useState(null);

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

  return (
    <div className="pc-root">
      <div className="pc-header">
        <h1 className="pc-title">🎴 My Card Collection</h1>
      </div>
      <p className="pc-tagline">Track it, catch it, complete it!</p>

      <div className="pc-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`pc-tab ${tab === t.key ? "active" : ""}`}
            style={tab === t.key ? { background: t.color } : {}}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pokemon" && <PokemonTab checkedCards={checkedCards} onToggleCard={toggleCard} onOpenInfo={setModal} />}
      {tab === "set" && <SetTab checkedCards={checkedCards} onToggleCard={toggleCard} onOpenInfo={setModal} />}
      {tab === "dex" && <DexTab checkedEntities={checkedEntities} onToggleEntity={toggleEntity} onOpenInfo={setModal} />}
      {tab === "lists" && <ListsTab lists={lists} setLists={setLists} onOpenInfo={setModal} />}

      <InfoModal data={modal} onClose={() => setModal(null)} />
    </div>
  );
}
