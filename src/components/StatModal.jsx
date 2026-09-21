import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { fetchCardsByIds } from "../api/pokemonTcg";
import { usePokedexEntities } from "../hooks/usePokedexEntities";
import { useMegaEntities } from "../hooks/usePokemonCategories";
import { entityKey } from "../utils";

// Backs the two clickable Home stats ("cards collected" / "Pokémon caught")
// with a browsable read-only list, rather than leaving them as static numbers.
export default function StatModal({ type, checkedCards, checkedEntities, onClose }) {
  const [cards, setCards] = useState([]);
  const [cardsStatus, setCardsStatus] = useState("loading");
  const { entities: baseEntities, status: dexStatus } = usePokedexEntities();
  const { entities: megaEntities, status: megaStatus } = useMegaEntities();

  useEffect(() => {
    if (type !== "cards") return;
    let cancelled = false;
    setCardsStatus("loading");
    fetchCardsByIds([...checkedCards])
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
    // checkedCards is a Set — its identity already changes whenever it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, checkedCards]);

  const caughtPokemon = useMemo(() => {
    if (type !== "pokemon") return [];
    return [...baseEntities, ...megaEntities].filter((e) => checkedEntities.has(entityKey(e)));
  }, [type, baseEntities, megaEntities, checkedEntities]);

  if (!type) return null;

  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pc-modal-close" onClick={onClose}><X size={18} /></button>
        <div className="pc-modal-scroll">
          <h3 className="pc-modal-name">
            {type === "cards"
              ? `${checkedCards.size} ${checkedCards.size === 1 ? "card" : "cards"} collected`
              : `${checkedEntities.size} Pokémon caught`}
          </h3>
          <div className="pc-modal-body">
            {type === "cards" && (
              <>
                {cardsStatus === "loading" && <p className="pc-modal-hint">Loading…</p>}
                {cardsStatus === "error" && <p className="pc-modal-hint">Couldn't load your collected cards.</p>}
                {cardsStatus === "done" && cards.length === 0 && <p className="pc-modal-hint">No cards collected yet.</p>}
                {cards.map((c) => (
                  <div className="pc-modal-row" key={c.id}>
                    <span className="pc-modal-row-info">
                      <img className="pc-modal-row-thumb" src={c.images?.small} alt={c.name} loading="lazy" decoding="async" />
                      {c.name} · #{c.number} · {c.set?.name}
                    </span>
                  </div>
                ))}
              </>
            )}
            {type === "pokemon" && (
              <>
                {(dexStatus === "loading" || megaStatus === "loading") && caughtPokemon.length === 0 && (
                  <p className="pc-modal-hint">Loading…</p>
                )}
                {caughtPokemon.length === 0 && dexStatus !== "loading" && (
                  <p className="pc-modal-hint">No Pokémon caught yet.</p>
                )}
                {caughtPokemon.map((e) => (
                  <div className="pc-modal-row" key={entityKey(e)}>
                    <span className="pc-modal-row-info">
                      <img className="pc-modal-row-thumb" src={e.spriteSmall || e.sprite} alt={e.name} loading="lazy" decoding="async" />
                      #{String(e.dex).padStart(3, "0")} · {e.name}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
