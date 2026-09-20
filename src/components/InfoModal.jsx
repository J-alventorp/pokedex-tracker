import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchCardsByPokedexNumber } from "../api/pokemonTcg";
import { rarityBadge } from "../utils";

export default function InfoModal({ data, onClose }) {
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!data || data.card || !data.entity) {
      setRelated([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    fetchCardsByPokedexNumber(data.entity.dex)
      .then((cards) => {
        if (!cancelled) {
          setRelated(cards);
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!data) return null;
  const { entity, card, selectedCardId, onSelectCard } = data;

  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pc-modal-close" onClick={onClose}><X size={18} /></button>

        {card ? (
          <>
            <img className="pc-modal-img" src={card.images?.large || card.images?.small} alt={card.name} />
            <h3 className="pc-modal-name">{card.name}</h3>
            <div className="pc-modal-body">
              <div className="pc-modal-row"><span>Set</span><strong>{card.set?.name}</strong></div>
              <div className="pc-modal-row">
                <span>Card #</span>
                <strong>{card.number}{card.set?.printedTotal ? ` / ${card.set.printedTotal}` : ""}</strong>
              </div>
              <div className="pc-modal-row"><span>Rarity</span><strong>{rarityBadge(card.rarity)} {card.rarity || "Unknown"}</strong></div>
              <div className="pc-modal-row"><span>Release year</span><strong>{card.set?.releaseDate?.slice(0, 4) || "—"}</strong></div>
            </div>
          </>
        ) : (
          <>
            <div className="pc-modal-head">
              <div className="pc-modal-icon">
                <img src={entity.sprite} alt={entity.name} width={72} height={72} />
              </div>
              <div>
                <div className="pc-modal-dex">#{String(entity.dex).padStart(3, "0")}</div>
                <h3 className="pc-modal-name">{entity.name}</h3>
              </div>
            </div>
            <div className="pc-modal-body">
              <p className="pc-modal-hint">
                {onSelectCard ? `Tap the one you found of ${entity.name}:` : `Known printings of ${entity.name}:`}
              </p>
              {status === "loading" && <p className="pc-modal-hint">Loading…</p>}
              {status === "error" && <p className="pc-modal-hint">Couldn't load printings.</p>}
              {status === "done" && related.length === 0 && <p className="pc-modal-hint">No cards logged yet for this one.</p>}
              {related.map((c) => {
                const selected = onSelectCard && c.id === selectedCardId;
                return (
                  <div
                    className={`pc-modal-row ${onSelectCard ? "selectable" : ""} ${selected ? "selected" : ""}`}
                    key={c.id}
                    onClick={onSelectCard ? () => onSelectCard(selected ? null : c.id) : undefined}
                  >
                    <span className="pc-modal-row-info">
                      <img className="pc-modal-row-thumb" src={c.images?.small} alt={c.name} loading="lazy" decoding="async" />
                      #{c.number} · {c.set?.name} · {c.set?.releaseDate?.slice(0, 4)}
                    </span>
                    <strong>
                      {selected && "✓ "}{rarityBadge(c.rarity)} {c.variant || c.rarity || "Unknown"}
                    </strong>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
