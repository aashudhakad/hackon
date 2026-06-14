import { Request, Response } from 'express';
import { InvalidAudioError } from '../errors';
import { checkAudioAcceptance } from '../services/audioAcceptance';
import { audioIntentProcessor } from '../services/audioIntentProcessor';
import { prepareRecognizedText } from '../services/recognizedText';
import { NoSpeechError } from '../errors';
import { AudioClip } from '../types/domain';

/**
 * POST /api/audio-intent — server-side fallback voice path (Req 13.9, 13.10).
 *
 * Validates the clip's size/duration bounds (Property 28), runs the
 * Audio_Intent_Processor under its 30s budget (Req 13.17), then normalizes the
 * Recognized_Intent_Text for the editable Intent_Bar (Property 30): trimmed and
 * capped to 200 chars, gating empty results to the "no speech" path (Req 13.15).
 */
export async function processAudioIntent(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new InvalidAudioError('No audio clip was provided.', 'NO_AUDIO');
  }

  // durationMs is supplied by the client (browsers cannot infer it server-side).
  const durationMs = Number((req.body as { durationMs?: number }).durationMs ?? 0);

  const acceptance = checkAudioAcceptance(durationMs, file.size);
  if (!acceptance.accepted) {
    throw new InvalidAudioError(
      acceptance.message ?? 'The audio clip could not be accepted.',
      acceptance.reason === 'oversize' ? 'AUDIO_OVERSIZE' : 'NO_AUDIO',
    );
  }

  const clip: AudioClip = {
    mimeType: file.mimetype,
    durationMs,
    sizeBytes: file.size,
    data: file.buffer,
  };

  const recognized = await audioIntentProcessor.recognize(clip);

  // Normalize for the Intent_Bar; empty result triggers the no-speech path.
  const prepared = prepareRecognizedText(recognized);
  if (prepared === null) {
    throw new NoSpeechError();
  }

  res.json({
    recognizedText: prepared,
    source: 'audio-intent-processor',
  });
}
