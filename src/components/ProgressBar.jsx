import { getPepText, getProgressColor } from "../utils";

export default function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="pc-progress-wrap">
      <div className="pc-progress-track">
        <div
          className="pc-progress-fill"
          style={{ width: `${pct}%`, "--pct-color": getProgressColor(pct) }}
        >
          <span className="pc-progress-ball" aria-hidden="true" />
        </div>
      </div>
      <div className="pc-progress-meta">
        <span className="pc-progress-count">{done}/{total} · {pct}%</span>
        <span className="pc-progress-pep">{getPepText(pct)}</span>
      </div>
    </div>
  );
}
