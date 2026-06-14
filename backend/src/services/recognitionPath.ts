/**
 * Recognition path selection (Task 11.3).
 *
 * Property 29 (Requirements 13.8, 13.9): the client speech recognizer is used
 * (no backend call) when available; the Audio_Clip is sent to the server
 * Audio_Intent_Processor (`/api/audio-intent`) exactly when the recognizer is
 * unavailable.
 */
export type RecognitionPath = 'client-recognizer' | 'audio-intent-processor';

export function selectRecognitionPath(recognizerAvailable: boolean): RecognitionPath {
  return recognizerAvailable ? 'client-recognizer' : 'audio-intent-processor';
}
