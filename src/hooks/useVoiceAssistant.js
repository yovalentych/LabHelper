import { useEffect, useRef, useState } from "react";
import { getSpeechRecognition } from "../lib/voice";

export function useVoiceAssistant(onCommand) {
  const recognitionRef = useRef(null);
  const onCommandRef = useRef(onCommand);
  const [isSupported] = useState(() => Boolean(getSpeechRecognition()));
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState(() =>
    getSpeechRecognition() ? "Голосовий помічник готовий" : "Голос недоступний у цьому браузері"
  );

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "uk-UA";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.addEventListener("result", (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      onCommandRef.current(transcript);
    });

    recognition.addEventListener("end", () => {
      if (recognitionRef.current?.shouldRestart) recognition.start();
    });

    recognitionRef.current = recognition;

    return () => {
      recognition.shouldRestart = false;
      recognition.stop();
    };
  }, []);

  function toggle() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.shouldRestart = false;
      recognition.stop();
      setIsListening(false);
      setStatus("Голосовий помічник готовий");
      return;
    }

    recognition.shouldRestart = true;
    recognition.start();
    setIsListening(true);
    setStatus("Слухаю команди та нотатки");
  }

  return { isSupported, isListening, status, toggle };
}
