import { useRef, useState } from "react";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { backupFilename, buildBackup, downloadJson, parseBackup } from "../backup";

export default function SettingsPanel({ data, onImport, onRequestConfirm, onBack }) {
  const fileRef = useRef(null);
  const [error, setError] = useState("");

  const { checkedCards, checkedEntities, lists } = data;

  const exportData = () => {
    setError("");
    downloadJson(buildBackup(data), backupFilename());
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    setError("");
    try {
      if (!file) return;
      const parsed = parseBackup(await file.text());
      onRequestConfirm({
        title: "Restore this backup?",
        message: `This replaces everything you have now with the backup: ${parsed.checkedCards.length} cards, ${parsed.checkedEntities.length} Pokémon and ${parsed.lists.length} lists.`,
        confirmLabel: "Restore",
        tone: "danger",
        onConfirm: () => onImport(parsed),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      // Reset so picking the same file again still fires a change event.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="pc-settings">
      <button className="pc-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <h2 className="pc-section-title">⚙️ Settings</h2>

      <section className="pc-settings-section">
        <h3 className="pc-settings-heading">Your data</h3>
        <div className="pc-settings-row"><span>Cards collected</span><strong>{checkedCards.size}</strong></div>
        <div className="pc-settings-row"><span>Pokémon caught</span><strong>{checkedEntities.size}</strong></div>
        <div className="pc-settings-row"><span>Lists</span><strong>{lists.length}</strong></div>
      </section>

      <section className="pc-settings-section">
        <h3 className="pc-settings-heading">Backup</h3>
        <p className="pc-modal-hint">
          Everything lives in this browser only. Download a backup to keep it safe or move it to another phone.
        </p>
        <div className="pc-settings-actions">
          <button type="button" className="pc-btn-primary" onClick={exportData}>
            <Download size={15} /> Download my data
          </button>
          <button type="button" className="pc-btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Restore from backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={pickFile}
          style={{ display: "none" }}
        />
        {error && <p className="pc-form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
