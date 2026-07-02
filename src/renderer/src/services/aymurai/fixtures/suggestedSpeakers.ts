import type { SuggestedSpeaker } from "@/types/transcription";

export const SUGGESTED_SPEAKERS: SuggestedSpeaker[] = [
  { id: "sg1", label: "Juez/a", initials: "JU", color: "primary" },
  { id: "sg2", label: "Fiscal", initials: "FI", color: "secondary" },
  { id: "sg3", label: "Defensor/a", initials: "DE", color: "warning" },
  { id: "sg4", label: "Querella", initials: "QU", color: "success" },
  { id: "sg5", label: "Denunciante", initials: "DN", color: "primary" },
  { id: "sg6", label: "Acusado/a", initials: "AC", color: "secondary" },
  { id: "sg7", label: "Testigo/a", initials: "TE", color: "warning" },
  {
    id: "sg8",
    label: "Niño/a - Adolescente",
    initials: "NA",
    color: "success",
  },
];
