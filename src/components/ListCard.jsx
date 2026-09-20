import { Trash2 } from "lucide-react";
import ProgressBar from "./ProgressBar";

export default function ListCard({ list, onOpen, onDelete }) {
  const done = list.checked.length;
  const total = list.entities.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const preview = list.entities.slice(0, 4);

  return (
    <div className="pc-list-card" onClick={() => onOpen(list.id)}>
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
        {preview.map((e, i) => (
          <img
            key={e.id ?? e.dex ?? i}
            src={e.spriteSmall || e.sprite}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
      <div className="pc-list-name">{list.name}</div>
      <div className="pc-list-count">{total} Pokémon · {pct}% done</div>
      <ProgressBar done={done} total={total} />
    </div>
  );
}
