export function speak(text) {
  if (!window.speechSynthesis || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "uk-UA";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
