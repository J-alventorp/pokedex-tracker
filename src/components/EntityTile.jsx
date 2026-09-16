import { Check } from "lucide-react";

const SHAPES = ["blob", "hex", "sticker"];

export default function EntityTile({ entity, checked, onToggle, onOpenInfo, index }) {
  const shape = SHAPES[index % SHAPES.length];
  const rotate = index % 2 === 0 ? "-1.2deg" : "1deg";
  return (
    <div
      className={`pc-etile pc-shape-${shape} ${checked ? "checked" : ""}`}
      style={{ transform: `rotate(${rotate})` }}
      onClick={() => onOpenInfo({ entity })}
    >
      <button className="pc-check" onClick={(e) => { e.stopPropagation(); onToggle(entity.dex); }}>
        {checked && <Check size={14} />}
      </button>
      <div className="pc-etile-icon">
        <img className="pc-etile-img" src={entity.sprite} alt={entity.name} loading="lazy" />
      </div>
      <div className="pc-etile-dex">#{String(entity.dex).padStart(3, "0")}</div>
      <div className="pc-etile-name">{entity.name}</div>
    </div>
  );
}
