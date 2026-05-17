const tabs = [
  ["library", "Методики"],
  ["run", "В роботі"],
  ["notes", "Записи"]
];

export function Tabs({ activeView, onChange }) {
  return (
    <nav className="tabs" aria-label="Розділи">
      {tabs.map(([id, label]) => (
        <button
          className={`tab ${activeView === id ? "active" : ""}`}
          key={id}
          type="button"
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
