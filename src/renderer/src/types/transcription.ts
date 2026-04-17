export type SpeakerColor = "primary" | "secondary" | "warning" | "success";
export type SpeakerId = string;

export interface Speaker {
  id: SpeakerId;
  label: string; // "Locutor 1" | "Juez" | "Dra. Silva"
  initials: string; // 2 chars derived from label
  color: SpeakerColor;
}

export interface Turn {
  id: string; // uuid
  speakerId: SpeakerId;
  text: string;
  startMs: number; // visible in UI as "mm:ss"
  endMs: number;
}

export interface Transcription {
  id: string;
  title: string; // "Audiencia 10/04/2025"
  audioFileName: string;
  audioDurationMs: number;
  audioObjectUrl: string; // URL.createObjectURL(file)
  speakers: Speaker[];
  turns: Turn[];
  createdAt: string;
}

export interface SuggestedSpeaker {
  id: string;
  label: string;
  initials: string;
  color: SpeakerColor;
}
