import { useMemo, useState } from "react";

const emptyProtocol = {
  title: "",
  goal: "",
  materials: [],
  equipment: [],
  safety: "",
  steps: []
};

export function ProtocolLibrary({ protocols, selectedId, onSelect, onSave, onNew }) {
  const selected = useMemo(
    () => protocols.find((protocol) => protocol.id === selectedId) ?? emptyProtocol,
    [protocols, selectedId]
  );
  const [draft, setDraft] = useState(selected);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      ...draft,
      id: draft.id || crypto.randomUUID(),
      materials: normalizeList(draft.materials),
      equipment: normalizeList(draft.equipment),
      steps: normalizeSteps(draft.steps)
    });
  }

  function startNew() {
    onNew();
    setDraft(emptyProtocol);
  }

  return (
    <section className="view active">
      <div className="section-heading">
        <div>
          <p className="eyebrow">конструювання</p>
          <h2>Шаблони методик</h2>
        </div>
        <button className="primary-button" type="button" onClick={startNew}>
          Новий
        </button>
      </div>

      <div className="protocol-list">
        {protocols.length === 0 ? (
          <div className="empty">Створіть першу методику для лабораторної роботи.</div>
        ) : (
          protocols.map((protocol) => (
            <article
              className={`protocol-item ${protocol.id === selectedId ? "active" : ""}`}
              key={protocol.id}
            >
              <button type="button" onClick={() => onSelect(protocol.id)}>
                <h3>{protocol.title}</h3>
                <p>{protocol.goal}</p>
              </button>
            </article>
          ))
        )}
      </div>

      <form className="editor" onSubmit={handleSubmit}>
        <label>
          Назва методики
          <input
            value={draft.title}
            type="text"
            autoComplete="off"
            required
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>
        <label>
          Мета
          <textarea
            value={draft.goal}
            rows="2"
            required
            onChange={(event) => updateField("goal", event.target.value)}
          />
        </label>
        <label>
          Реагенти та матеріали
          <textarea
            value={listToText(draft.materials)}
            rows="3"
            onChange={(event) => updateField("materials", event.target.value)}
          />
        </label>
        <label>
          Обладнання
          <textarea
            value={listToText(draft.equipment)}
            rows="2"
            onChange={(event) => updateField("equipment", event.target.value)}
          />
        </label>
        <label>
          Кроки виконання
          <textarea
            value={stepsToText(draft.steps)}
            rows="8"
            placeholder="Один крок на рядок"
            onChange={(event) => updateField("steps", event.target.value)}
          />
        </label>
        <label>
          Застереження
          <textarea
            value={draft.safety}
            rows="2"
            onChange={(event) => updateField("safety", event.target.value)}
          />
        </label>
        <button className="primary-button full" type="submit">
          Зберегти методику
        </button>
      </form>
    </section>
  );
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : value;
}

function stepsToText(value) {
  if (!Array.isArray(value)) return value;
  return value.map((step) => step.instruction || step.title).join("\n");
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSteps(value) {
  if (Array.isArray(value)) return value;
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((instruction, index) => ({
      id: crypto.randomUUID(),
      title: `Крок ${index + 1}`,
      instruction,
      timerMinutes: 0,
      requiredRecord: ""
    }));
}
