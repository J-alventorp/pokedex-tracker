import { useEffect } from "react";

// Generic "are you sure?" popup. `data` is null when closed, otherwise
// { title, message, confirmLabel, tone, onConfirm }.
export default function ConfirmDialog({ data, onConfirm, onCancel }) {
  useEffect(() => {
    if (!data) return;
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onCancel]);

  if (!data) return null;
  const { title, message, confirmLabel = "OK", tone } = data;

  return (
    <div className="pc-modal-overlay" onClick={onCancel}>
      <div
        className="pc-modal pc-confirm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="pc-confirm-title">{title}</h3>
        <p className="pc-confirm-msg">{message}</p>
        <div className="pc-confirm-actions">
          <button
            type="button"
            className={tone === "danger" ? "pc-btn-danger" : "pc-btn-primary"}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
          <button type="button" className="pc-btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
