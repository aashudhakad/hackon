'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

const MAX_DURATION_MS = 60_000;
const MAX_BYTES = 10 * 1024 * 1024;
const CHAR_CAP = 200;

interface MicButtonProps {
  onRecognized: (text: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

/** Normalizes recognized text the way the backend does (trim + cap to 200). */
function prepare(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, CHAR_CAP);
}

// Minimal typing for the Web Speech API (not in TS DOM lib by default).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognizer(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  return ctor ? new ctor() : null;
}

type Status = 'idle' | 'recording' | 'processing';

/**
 * Mic_Button + Voice_Capture (Requirement 13).
 * Uses the browser Client_Speech_Recognizer when available (no backend call);
 * otherwise records via MediaRecorder and posts the clip to /api/audio-intent.
 */
export function MicButton({ onRecognized, onError, disabled }: MicButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);

  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
  };

  const handleResult = (text: string) => {
    const prepared = prepare(text);
    setStatus('idle');
    if (prepared === null) {
      onError('No speech was recognized. Please record again or type your intent.');
      return;
    }
    onRecognized(prepared);
  };

  const startTimers = (onAutoStop: () => void) => {
    startedAtRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    autoStopRef.current = setTimeout(onAutoStop, MAX_DURATION_MS);
  };

  // --- Client recognizer path (Requirement 13.8) ---
  const startClientRecognition = (recognizer: SpeechRecognitionLike) => {
    recognizerRef.current = recognizer;
    recognizer.lang = 'en-US';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      clearTimers();
      handleResult(transcript);
    };
    recognizer.onerror = (e) => {
      clearTimers();
      setStatus('idle');
      onError(
        e.error === 'no-speech'
          ? 'No speech was recognized. Please record again or type your intent.'
          : 'Audio could not be transcribed. Please record again or type your intent.',
      );
    };
    recognizer.onend = () => {
      if (status === 'recording') setStatus('processing');
    };

    setStatus('recording');
    startTimers(() => recognizer.stop());
    recognizer.start();
  };

  // --- Server fallback path (Requirement 13.9) ---
  const startMediaRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const durationMs = Date.now() - startedAtRef.current;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

      if (durationMs <= 1000) {
        setStatus('idle');
        onError('No audio was captured. Please record again.');
        return;
      }
      if (blob.size > MAX_BYTES) {
        setStatus('idle');
        onError('The recording exceeded the maximum allowed size. Please record again.');
        return;
      }

      setStatus('processing');
      try {
        const { recognizedText } = await api.audioIntent(blob, durationMs);
        handleResult(recognizedText);
      } catch (err) {
        setStatus('idle');
        onError(err instanceof Error ? err.message : 'Audio could not be processed.');
      }
    };

    setStatus('recording');
    startTimers(() => stopRecording());
    recorder.start();
  };

  const startRecording = async () => {
    try {
      const recognizer = getRecognizer();
      if (recognizer) {
        startClientRecognition(recognizer);
      } else {
        await startMediaRecording();
      }
    } catch {
      setStatus('idle');
      onError('Microphone access is required for voice input.');
    }
  };

  const stopRecording = () => {
    clearTimers();
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleClick = () => {
    if (status === 'recording') stopRecording();
    else if (status === 'idle') void startRecording();
  };

  const isBusy = status !== 'idle';

  return (
    <button
      type="button"
      disabled={disabled || status === 'processing'}
      onClick={handleClick}
      title="Speak your intent"
      aria-label={status === 'recording' ? 'Stop recording' : 'Start voice input'}
      className={`flex items-center gap-1 rounded-xl p-3 transition disabled:opacity-40 ${
        status === 'recording'
          ? 'bg-red-50 text-red-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {status === 'processing' ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent)]" />
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
        </svg>
      )}
      {status === 'recording' && <span className="text-xs font-medium tabular-nums">{elapsed}s</span>}
      {isBusy && <span className="sr-only">recording or processing</span>}
    </button>
  );
}
