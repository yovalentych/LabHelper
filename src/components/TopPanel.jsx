export function TopPanel({ voice }) {
  return (
    <>
      <section className="top-panel">
        <div>
          <p className="eyebrow">мобільний лабораторний журнал</p>
          <h1>LabHelper</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Увімкнути голосовий режим"
          disabled={!voice.isSupported}
          onClick={voice.toggle}
        >
          <span className="mic-icon" />
        </button>
      </section>

      <section className="status-strip" aria-live="polite">
        <div>
          <span className={`status-dot ${voice.isListening ? "listening" : ""}`} />
          <span>{voice.status}</span>
        </div>
        <span>Збережено локально</span>
      </section>
    </>
  );
}
