import { Check, Info } from "lucide-react";
import { isHoloRarity, rarityBadge, rarityTier } from "../utils";

export default function CardTile({ card, checked, onToggle, onOpenInfo, index }) {
  const rotate = index % 2 === 0 ? "-1deg" : "1.2deg";
  const holo = isHoloRarity(card.rarity);
  return (
    <div
      className={`pc-ctile ${checked ? "checked" : ""} ${holo ? "holo" : ""}`}
      data-tier={rarityTier(card.rarity)}
      style={{ transform: `rotate(${rotate})` }}
      onClick={() => onToggle(card.id)}
    >
      {checked && <span className="pc-checked-badge pc-checked-badge-br"><Check size={13} /></span>}
      <button className="pc-info-btn" aria-label={`About ${card.name}`} onClick={(e) => { e.stopPropagation(); onOpenInfo({ card }); }}>
        <Info size={13} />
      </button>
      <span className="pc-rarity-badge">{rarityBadge(card.rarity)}</span>
      <div className="pc-ctile-icon">
        <img className="pc-ctile-img" src={card.images?.small} alt={card.name} loading="lazy" decoding="async" />
      </div>
      <div className="pc-ctile-name">{card.name}</div>
      {/* The card number keeps near-identical prints (30th Celebration ships 30
          different Pikachu) tellable apart at a glance. */}
      <div className="pc-ctile-meta">#{card.number} · {card.set?.name}</div>
      <div className="pc-ctile-rarity">{card.rarity || "Unknown"}</div>
    </div>
  );
}
