export default function ViewToggle({ view, setView }) {
  return (
    <div className="pc-toggle">
      {["all", "collected", "missing"].map((v) => (
        <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
          {v === "all" ? "All" : v === "collected" ? "Collected" : "Missing"}
        </button>
      ))}
    </div>
  );
}
