import { useMemo, useState } from "react";
import { ExperimentRun } from "./components/ExperimentRun.jsx";
import { NotesView } from "./components/NotesView.jsx";
import { ProtocolLibrary } from "./components/ProtocolLibrary.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { TopPanel } from "./components/TopPanel.jsx";
import { starterProtocols } from "./data/starterProtocols.js";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant.js";
import { loadFromStorage, saveToStorage } from "./lib/storage.js";
import { speak } from "./lib/voice.js";

const protocolKey = "labhelper.protocols.v2";
const notesKey = "labhelper.notes.v2";

export function App() {
  const [protocols, setProtocols] = useStoredState(protocolKey, starterProtocols);
  const [notes, setNotes] = useStoredState(notesKey, []);
  const [activeView, setActiveView] = useState("library");
  const [selectedId, setSelectedId] = useState(protocols[0]?.id ?? null);
  const [activeRun, setActiveRun] = useState(null);
  const [resultText, setResultText] = useState("");

  const selectedProtocol = useMemo(
    () => protocols.find((protocol) => protocol.id === selectedId) ?? null,
    [protocols, selectedId]
  );

  const voice = useVoiceAssistant(handleVoiceCommand);

  function saveProtocol(protocol) {
    setProtocols((current) => {
      const exists = current.some((item) => item.id === protocol.id);
      return exists
        ? current.map((item) => (item.id === protocol.id ? protocol : item))
        : [protocol, ...current];
    });
    setSelectedId(protocol.id);
  }

  function startRun() {
    if (!selectedProtocol) return;
    const run = {
      ...selectedProtocol,
      index: 0,
      completedStepIds: [],
      startedAt: new Date().toISOString()
    };
    setActiveRun(run);
    setActiveView("run");
    speak(`Починаємо: ${run.title}. Перший крок: ${run.steps[0]?.instruction ?? "кроки не задані"}`);
  }

  function moveStep(direction) {
    setActiveRun((current) => {
      if (!current) return current;
      const lastIndex = Math.max(current.steps.length - 1, 0);
      const nextIndex = Math.min(Math.max(current.index + direction, 0), lastIndex);
      const nextRun = { ...current, index: nextIndex };
      speak(nextRun.steps[nextIndex]?.instruction);
      return nextRun;
    });
  }

  function toggleStepDone() {
    setActiveRun((current) => {
      if (!current) return current;
      const stepId = current.steps[current.index]?.id;
      if (!stepId) return current;
      const completed = new Set(current.completedStepIds);
      if (completed.has(stepId)) completed.delete(stepId);
      else completed.add(stepId);
      return { ...current, completedStepIds: Array.from(completed) };
    });
  }

  function saveObservation(text = resultText) {
    const cleanText = text.trim();
    if (!cleanText) return;

    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        protocolTitle: activeRun?.title ?? selectedProtocol?.title ?? "Без методики",
        stepId: activeRun?.steps[activeRun.index]?.id ?? null,
        stepTitle: activeRun?.steps[activeRun.index]?.title ?? null,
        text: cleanText,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    setResultText("");
  }

  function exportNotes() {
    const payload = JSON.stringify(notes, null, 2);
    navigator.clipboard?.writeText(payload);
  }

  function handleVoiceCommand(transcript) {
    const phrase = transcript.toLowerCase();

    if (phrase.includes("наступний") || phrase.includes("далі")) {
      moveStep(1);
      return;
    }
    if (phrase.includes("назад") || phrase.includes("попередній")) {
      moveStep(-1);
      return;
    }
    if (phrase.includes("запусти") || phrase.includes("почати")) {
      startRun();
      return;
    }
    if (phrase.includes("запиши") || phrase.includes("нотатка")) {
      saveObservation(transcript.replace(/^(запиши|нотатка)[:\s-]*/i, ""));
      return;
    }

    setResultText((current) => `${current} ${transcript}`.trim());
  }

  return (
    <main className="app-shell">
      <TopPanel voice={voice} />
      <Tabs activeView={activeView} onChange={setActiveView} />

      {activeView === "library" && (
        <ProtocolLibrary
          key={selectedId ?? "new-protocol"}
          protocols={protocols}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSave={saveProtocol}
          onNew={() => setSelectedId(null)}
        />
      )}

      {activeView === "run" && (
        <ExperimentRun
          selectedProtocol={selectedProtocol}
          activeRun={activeRun}
          resultText={resultText}
          onResultChange={setResultText}
          onStart={startRun}
          onMoveStep={moveStep}
          onSaveObservation={() => saveObservation()}
          onToggleStepDone={toggleStepDone}
        />
      )}

      {activeView === "notes" && <NotesView notes={notes} onExport={exportNotes} />}
    </main>
  );
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => loadFromStorage(key, fallback));

  function setStoredValue(nextValue) {
    setValue((current) => {
      const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;
      saveToStorage(key, resolved);
      return resolved;
    });
  }

  return [value, setStoredValue];
}
