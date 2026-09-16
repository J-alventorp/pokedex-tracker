import { Info } from "lucide-react";

export default function MissingRow({ label, sub, onClick }) {
  return (
    <button className="pc-missing-row" onClick={onClick}>
      <span className="pc-missing-label">{label}</span>
      <span className="pc-missing-sub"><Info size={13} /> {sub}</span>
    </button>
  );
}
