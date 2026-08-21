import { SPEAKER_COLORS } from "@/types/transcription";
import { z } from "zod";

export const SpeakerSchema = z.object({
  id: z.string(),
  label: z.string(),
  initials: z.string().max(3),
  color: z.enum(SPEAKER_COLORS),
});

export const TurnSchema = z.object({
  id: z.string().uuid(),
  speakerId: z.string(),
  text: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
});

export const TranscriptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  audioFileName: z.string(),
  audioDurationMs: z.number().nonnegative(),
  audioObjectUrl: z.string(),
  speakers: z.array(SpeakerSchema),
  turns: z.array(TurnSchema),
  createdAt: z.string(),
});

export type Transcription = z.infer<typeof TranscriptionSchema>;
export type Turn = z.infer<typeof TurnSchema>;
export type Speaker = z.infer<typeof SpeakerSchema>;
