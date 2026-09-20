import { Trash2 } from "lucide-react";
import ProgressBar from "./ProgressBar";
import { listProgress, listUnitLabel } from "../utils";

export default function ListCard({ list, checkedCards, onOpen, onDelete }) {
  const { done, total } = listProgress(list, checkedCards);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isCards = (list.kind ?? "entities") === "cards";
  // Card lists carry their own thumbnail urls so this tile never has to fetch.
  const preview = isCards
    ? (list.previewImages ?? []).slice(0, 4)
    : (list.entities ?? []).slice(0, 4).map((e) => e.spriteSmall || e.sprite);

  return (
    <div className="pc-list-card" data-kind={list.kind ?? "entities"} onClick={() => onOpen(list.id)}>
      {list.auto && <span className="pc-list-badge">auto</span>}
      {onDelete && (
        <button
          className="pc-list-del"
          aria-label={`Delete ${list.name}`}
          onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
        >
          <Trash2 size={15} />
        </button>
      )}
      <div className="pc-list-sprites" aria-hidden="true">
        {preview.map((src, i) => (
          <img key={src ?? i} src={src} alt="" loading="lazy" decoding="async" />
        ))}
      </div>
      <div className="pc-list-name">{list.name}</div>
      <div className="pc-list-count">{total} {listUnitLabel(list)} · {pct}% done</div>
      <ProgressBar done={done} total={total} />
    </div>
  );
}
