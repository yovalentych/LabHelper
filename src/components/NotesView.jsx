export function NotesView({ notes, onExport }) {
  return (
    <section className="view active">
      <div className="section-heading">
        <div>
          <p className="eyebrow">хронологія</p>
          <h2>Лабораторні записи</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onExport}>
          Експорт
        </button>
      </div>
      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty">Записи експериментів зʼявляться тут.</div>
        ) : (
          notes.map((note) => (
            <article className="note-item" key={note.id}>
              <h3>{note.protocolTitle}</h3>
              <p>{note.text}</p>
              <p>{new Date(note.createdAt).toLocaleString("uk-UA")}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
