import { Check, Info } from "lucide-react";
import { isHoloRarity, rarityBadge } from "../utils";

export default function CardTile({ card, checked, onToggle, onOpenInfo, index }) {
  const rotate = index % 2 === 0 ? "-1deg" : "1.2deg";
  const holo = isHoloRarity(card.rarity);
  return (
    <div
      className={`pc-ctile ${checked ? "checked" : ""} ${holo ? "holo" : ""}`}
      style={{ transform: `rotate(${rotate})` }}
      onClick={() => onToggle(card.id)}
    >
      {checked && <span className="pc-checked-badge pc-checked-badge-br"><Check size={13} /></span>}
      <button className="pc-info-btn" onClick={(e) => { e.stopPropagation(); onOpenInfo({ card }); }}>
        <Info size={13} />
      </button>
      <span className="pc-rarity-badge">{rarityBadge(card.rarity)}</span>
      <div className="pc-ctile-icon">
        <img className="pc-ctile-img" src={card.images?.small} alt={card.name} loading="lazy" />
      </div>
      <div className="pc-ctile-name">{card.name}</div>
      <div className="pc-ctile-meta">{card.set?.name} · {card.rarity || "Unknown"}</div>
    </div>
  );
}
