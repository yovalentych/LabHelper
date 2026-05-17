export function ExperimentRun({
  selectedProtocol,
  activeRun,
  resultText,
  onResultChange,
  onStart,
  onMoveStep,
  onSaveObservation,
  onToggleStepDone
}) {
  const currentStep = activeRun?.steps[activeRun.index];
  const progress = activeRun
    ? Math.round(((activeRun.index + 1) / Math.max(activeRun.steps.length, 1)) * 100)
    : 0;

  return (
    <section className="view active">
      <div className="section-heading">
        <div>
          <p className="eyebrow">поточний експеримент</p>
          <h2>{activeRun?.title ?? selectedProtocol?.title ?? "Оберіть методику"}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onStart}>
          Запустити
        </button>
      </div>

      <div className="run-card">
        <div className="progress-ring" style={{ "--progress": `${progress}%` }} aria-hidden="true">
          <span>{progress}%</span>
        </div>
        <div>
          <p className="eyebrow">активний крок</p>
          <h3>{currentStep?.title ?? "Немає активного експерименту"}</h3>
          <p>
            {currentStep?.instruction ??
              "Після запуску помічник проведе вас по кроках і збере нотатки."}
          </p>
        </div>
      </div>

      {currentStep && (
        <div className="step-meta">
          <div>
            <span>Таймер</span>
            <strong>{currentStep.timerMinutes ? `${currentStep.timerMinutes} хв` : "без таймера"}</strong>
          </div>
          <div>
            <span>Обов'язковий запис</span>
            <strong>{currentStep.requiredRecord || "вільна нотатка"}</strong>
          </div>
        </div>
      )}

      <div className="step-controls">
        <button className="secondary-button" type="button" onClick={() => onMoveStep(-1)}>
          Назад
        </button>
        <button className="secondary-button" type="button" onClick={onToggleStepDone}>
          Виконано
        </button>
        <button className="primary-button" type="button" onClick={() => onMoveStep(1)}>
          Далі
        </button>
      </div>

      <label className="result-input">
        Диктуйте або введіть результат
        <textarea
          value={resultText}
          rows="4"
          placeholder="Наприклад: пробірка A змінила колір через 3 хвилини"
          onChange={(event) => onResultChange(event.target.value)}
        />
      </label>
      <button className="primary-button full" type="button" onClick={onSaveObservation}>
        Додати запис
      </button>
    </section>
  );
}
