const starterProtocols = [
  {
    id: "dna-extraction",
    title: "Екстракція ДНК з клітинної культури",
    goal: "Отримати очищену ДНК для подальшої ПЛР або секвенування.",
    materials: "Буфер лізису, протеїназа K, етанол 96%, колонки, мікроцентрифуга, стерильні наконечники.",
    safety: "Працювати у рукавичках. Утилізувати біологічні відходи згідно з правилами лабораторії.",
    steps: [
      "Підписати пробірки та перевірити відповідність зразків.",
      "Додати буфер лізису до клітинного осаду.",
      "Додати протеїназу K та інкубувати згідно з протоколом.",
      "Додати етанол, перемішати та перенести суміш на колонку.",
      "Промити колонку та елюювати ДНК у чисту пробірку.",
      "Записати концентрацію, чистоту та умови зберігання."
    ]
  },
  {
    id: "buffer-prep",
    title: "Приготування 1 л фосфатного буфера",
    goal: "Підготувати буфер з контрольованим pH для щоденної роботи.",
    materials: "NaCl, KCl, Na2HPO4, KH2PO4, дистильована вода, pH-метр, мірний циліндр.",
    safety: "Калібрувати pH-метр перед вимірюванням. Не торкатися електрода руками.",
    steps: [
      "Підготувати чистий посуд та перевірити калібрування ваг.",
      "Зважити солі відповідно до рецептури.",
      "Розчинити компоненти у 800 мл дистильованої води.",
      "Виміряти pH та скоригувати до потрібного значення.",
      "Довести об'єм до 1 л і перемішати.",
      "Підписати пляшку датою, складом і відповідальним дослідником."
    ]
  }
];

const state = {
  protocols: load("labhelper.protocols", starterProtocols),
  notes: load("labhelper.notes", []),
  selectedId: null,
  activeRun: null,
  recognition: null,
  listening: false
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  views: {
    library: document.querySelector("#libraryView"),
    run: document.querySelector("#runView"),
    notes: document.querySelector("#notesView")
  },
  protocolList: document.querySelector("#protocolList"),
  notesList: document.querySelector("#notesList"),
  form: document.querySelector("#protocolForm"),
  title: document.querySelector("#protocolTitle"),
  goal: document.querySelector("#protocolGoal"),
  materials: document.querySelector("#protocolMaterials"),
  steps: document.querySelector("#protocolSteps"),
  safety: document.querySelector("#protocolSafety"),
  newProtocol: document.querySelector("#newProtocol"),
  startRun: document.querySelector("#startRun"),
  runTitle: document.querySelector("#runTitle"),
  currentStep: document.querySelector("#currentStep"),
  runHint: document.querySelector("#runHint"),
  progressRing: document.querySelector(".progress-ring"),
  progressValue: document.querySelector("#progressValue"),
  prevStep: document.querySelector("#prevStep"),
  nextStep: document.querySelector("#nextStep"),
  resultText: document.querySelector("#resultText"),
  saveObservation: document.querySelector("#saveObservation"),
  exportNotes: document.querySelector("#exportNotes"),
  voiceToggle: document.querySelector("#voiceToggle"),
  voiceDot: document.querySelector("#voiceDot"),
  voiceStatus: document.querySelector("#voiceStatus"),
  savedStatus: document.querySelector("#savedStatus")
};

state.selectedId = state.protocols[0]?.id ?? null;

renderAll();
bindEvents();
setupVoice();

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  els.newProtocol.addEventListener("click", () => {
    state.selectedId = null;
    els.form.reset();
    els.title.focus();
    renderProtocols();
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const protocol = {
      id: state.selectedId || crypto.randomUUID(),
      title: els.title.value.trim(),
      goal: els.goal.value.trim(),
      materials: els.materials.value.trim(),
      safety: els.safety.value.trim(),
      steps: els.steps.value
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean)
    };

    const index = state.protocols.findIndex((item) => item.id === protocol.id);
    if (index >= 0) {
      state.protocols[index] = protocol;
    } else {
      state.protocols.unshift(protocol);
    }

    state.selectedId = protocol.id;
    persist();
    renderAll();
  });

  els.startRun.addEventListener("click", startRun);
  els.prevStep.addEventListener("click", () => moveStep(-1));
  els.nextStep.addEventListener("click", () => moveStep(1));
  els.saveObservation.addEventListener("click", saveObservation);
  els.exportNotes.addEventListener("click", exportNotes);
  els.voiceToggle.addEventListener("click", toggleVoice);
}

function renderAll() {
  renderProtocols();
  renderEditor();
  renderRun();
  renderNotes();
}

function renderProtocols() {
  els.protocolList.innerHTML = "";
  if (!state.protocols.length) {
    els.protocolList.innerHTML = '<div class="empty">Створіть першу методику для лабораторної роботи.</div>';
    return;
  }

  state.protocols.forEach((protocol) => {
    const item = document.createElement("article");
    item.className = `protocol-item ${protocol.id === state.selectedId ? "active" : ""}`;
    item.innerHTML = `
      <button type="button">
        <h3>${escapeHtml(protocol.title)}</h3>
        <p>${escapeHtml(protocol.goal)}</p>
      </button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.selectedId = protocol.id;
      renderAll();
    });
    els.protocolList.append(item);
  });
}

function renderEditor() {
  const protocol = getSelectedProtocol();
  els.title.value = protocol?.title ?? "";
  els.goal.value = protocol?.goal ?? "";
  els.materials.value = protocol?.materials ?? "";
  els.safety.value = protocol?.safety ?? "";
  els.steps.value = protocol?.steps?.join("\n") ?? "";
}

function renderRun() {
  const protocol = getSelectedProtocol();
  els.runTitle.textContent = state.activeRun?.title ?? protocol?.title ?? "Оберіть методику";

  if (!state.activeRun) {
    els.currentStep.textContent = "Немає активного експерименту";
    els.runHint.textContent = protocol
      ? "Натисніть запуск, щоб перейти до покрокового виконання."
      : "Створіть або оберіть методику перед запуском.";
    updateProgress(0);
    return;
  }

  const step = state.activeRun.steps[state.activeRun.index] ?? "Методика не має кроків.";
  els.currentStep.textContent = step;
  els.runHint.textContent = `Крок ${state.activeRun.index + 1} з ${Math.max(state.activeRun.steps.length, 1)}. Застереження: ${
    state.activeRun.safety || "немає окремих застережень"
  }.`;
  updateProgress(((state.activeRun.index + 1) / Math.max(state.activeRun.steps.length, 1)) * 100);
}

function renderNotes() {
  els.notesList.innerHTML = "";
  if (!state.notes.length) {
    els.notesList.innerHTML = '<div class="empty">Записи експериментів зʼявляться тут.</div>';
    return;
  }

  state.notes.forEach((note) => {
    const item = document.createElement("article");
    item.className = "note-item";
    item.innerHTML = `
      <h3>${escapeHtml(note.protocolTitle)}</h3>
      <p>${escapeHtml(note.text)}</p>
      <p>${new Date(note.createdAt).toLocaleString("uk-UA")}</p>
    `;
    els.notesList.append(item);
  });
}

function startRun() {
  const protocol = getSelectedProtocol();
  if (!protocol) return;
  state.activeRun = {
    ...protocol,
    index: 0,
    startedAt: new Date().toISOString()
  };
  switchView("run");
  renderRun();
  speak(`Починаємо: ${protocol.title}. Перший крок: ${protocol.steps[0] ?? "кроки не задані"}`);
}

function moveStep(direction) {
  if (!state.activeRun) return;
  const lastIndex = Math.max(state.activeRun.steps.length - 1, 0);
  state.activeRun.index = Math.min(Math.max(state.activeRun.index + direction, 0), lastIndex);
  renderRun();
  speak(els.currentStep.textContent);
}

function saveObservation() {
  const text = els.resultText.value.trim();
  if (!text) return;

  state.notes.unshift({
    id: crypto.randomUUID(),
    protocolTitle: state.activeRun?.title ?? getSelectedProtocol()?.title ?? "Без методики",
    step: state.activeRun?.index ?? null,
    text,
    createdAt: new Date().toISOString()
  });
  els.resultText.value = "";
  persist();
  renderNotes();
  setSavedStatus("Запис додано");
}

function exportNotes() {
  const payload = JSON.stringify(state.notes, null, 2);
  navigator.clipboard?.writeText(payload);
  setSavedStatus("Експорт скопійовано");
}

function setupVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.voiceStatus.textContent = "Голос недоступний у цьому браузері";
    els.voiceToggle.disabled = true;
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.lang = "uk-UA";
  state.recognition.continuous = true;
  state.recognition.interimResults = false;

  state.recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();
    handleVoiceCommand(transcript);
  });

  state.recognition.addEventListener("end", () => {
    if (state.listening) state.recognition.start();
  });
}

function toggleVoice() {
  if (!state.recognition) return;
  state.listening = !state.listening;
  if (state.listening) {
    state.recognition.start();
    els.voiceStatus.textContent = "Слухаю команди та нотатки";
    els.voiceDot.classList.add("listening");
  } else {
    state.recognition.stop();
    els.voiceStatus.textContent = "Голосовий помічник готовий";
    els.voiceDot.classList.remove("listening");
  }
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
    els.resultText.value = transcript.replace(/^(запиши|нотатка)[:\s-]*/i, "");
    saveObservation();
    return;
  }

  els.resultText.value = `${els.resultText.value} ${transcript}`.trim();
  els.voiceStatus.textContent = "Диктування додано в поле результату";
}

function switchView(view) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("active", name === view);
  });
}

function updateProgress(value) {
  const rounded = Math.round(value);
  els.progressRing.style.setProperty("--progress", `${rounded}%`);
  els.progressValue.textContent = `${rounded}%`;
}

function getSelectedProtocol() {
  return state.protocols.find((protocol) => protocol.id === state.selectedId);
}

function persist() {
  localStorage.setItem("labhelper.protocols", JSON.stringify(state.protocols));
  localStorage.setItem("labhelper.notes", JSON.stringify(state.notes));
  setSavedStatus("Збережено локально");
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function setSavedStatus(text) {
  els.savedStatus.textContent = text;
  window.setTimeout(() => {
    els.savedStatus.textContent = "Збережено локально";
  }, 1800);
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "uk-UA";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
