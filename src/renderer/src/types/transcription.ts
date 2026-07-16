import type { ASRSegment, ASRSpeakerTurn } from "@/schema/asr";

export type SpeakerColor = "primary" | "secondary" | "warning" | "success";
export type SpeakerId = string;
export type TranscriptionSource = "validation" | "transcription" | "asr";

export interface Speaker {
  id: SpeakerId;
  label: string; // "Locutor 1" | "Juez" | "Dra. Silva"
  initials: string; // 2 chars derived from label
  color: SpeakerColor;
}

export interface Turn {
  id: string; // uuid
  speakerId: SpeakerId;
  speakerNo?: number;
  text: string;
  startMs: number; // visible as MM:SS below 1h, H+:MM:SS from 1h
  endMs: number;
  segments?: ASRSegment[];
}

export interface Transcription {
  id: string;
  title: string; // "Audiencia 10/04/2025"
  audioFileName: string;
  audioDurationMs: number;
  audioObjectUrl: string; // URL.createObjectURL(file)
  speakers: Speaker[];
  turns: Turn[];
  source: TranscriptionSource;
  rawDocument?: ASRSegment[];
  rawSpeakerTurns?: ASRSpeakerTurn[];
  rawTranscription?: ASRSegment[] | null;
  rawValidation?: ASRSegment[] | null;
  createdAt: string;
}

export interface SuggestedSpeaker {
  id: string;
  label: string;
  initials: string;
  color: SpeakerColor;
}
