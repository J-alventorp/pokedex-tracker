import { forwardRef } from "react";
import { Info } from "lucide-react";

const EntityTile = forwardRef(function EntityTile(
  { entity, checked, collected, total, onToggle, onOpenInfo, index, highlighted },
  ref,
) {
  const rotate = index % 2 === 0 ? "-1.2deg" : "1deg";
  return (
    <div
      ref={ref}
      className={`pc-etile pc-shape-sticker ${checked ? "checked" : ""} ${highlighted ? "pc-etile-highlight" : ""}`}
      style={{ transform: `rotate(${rotate})` }}
      onClick={() => onToggle(entity)}
    >
      {typeof total === "number" && (
        <span className={`pc-count-badge ${collected > 0 ? "has" : ""}`}>{collected}/{total}</span>
      )}
      <button className="pc-info-btn" aria-label={`About ${entity.name}`} onClick={(e) => { e.stopPropagation(); onOpenInfo({ entity }); }}>
        <Info size={13} />
      </button>
      <div className="pc-etile-icon">
        <img
          className="pc-etile-img"
          src={entity.spriteSmall || entity.sprite}
          alt={entity.name}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="pc-etile-dex">#{String(entity.dex).padStart(3, "0")}</div>
      <div className="pc-etile-name">{entity.name}</div>
    </div>
  );
});

export default EntityTile;
