import { Check, Info } from "lucide-react";

export default function EntityTile({ entity, checked, onToggle, onOpenInfo, index }) {
  const rotate = index % 2 === 0 ? "-1.2deg" : "1deg";
  return (
    <div
      className={`pc-etile pc-shape-sticker ${checked ? "checked" : ""}`}
      style={{ transform: `rotate(${rotate})` }}
      onClick={() => onToggle(entity)}
    >
      {checked && <span className="pc-checked-badge"><Check size={13} /></span>}
      <button className="pc-info-btn" onClick={(e) => { e.stopPropagation(); onOpenInfo({ entity }); }}>
        <Info size={13} />
      </button>
      <div className="pc-etile-icon">
        <img className="pc-etile-img" src={entity.sprite} alt={entity.name} loading="lazy" />
      </div>
      <div className="pc-etile-dex">#{String(entity.dex).padStart(3, "0")}</div>
      <div className="pc-etile-name">{entity.name}</div>
    </div>
  );
}
